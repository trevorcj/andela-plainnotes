import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/supabase/server';
import { supabaseConfig } from '@/lib/env';
import { z } from 'zod';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const config = supabaseConfig();
  if (!config || !process.env.OPENAI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'AI services have not been configured by the project owner.' },
      { status: 503 }
    );
  }

  const client = await db();
  const {
    data: { user }
  } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

  let input: { conversation: string; requestId: string; content: string };
  try {
    input = z
      .object({
        conversation: z.string().uuid(),
        requestId: z.string().uuid(),
        content: z.string().trim().min(1).max(4000)
      })
      .parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  const { data: conversation } = await client
    .from('conversations')
    .select('*')
    .eq('id', input.conversation)
    .eq('user_id', user.id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { error: claimError } = await client.rpc('claim_ai_request', {
    p_id: input.requestId,
    p_conversation: input.conversation,
    p_content: input.content
  });

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 429 });
  }

  const service = createClient(config.url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const [history, sources, profileRes, academicRes, examRecordsRes] = await Promise.all([
      client
        .from('chat_messages')
        .select('role,content')
        .eq('conversation_id', input.conversation)
        .order('created_at', { ascending: false })
        .limit(20),
      client
        .from('sources')
        .select('id,name,url,review_note')
        .eq('published', true)
        .eq('status', 'verified')
        .gte('verified_at', new Date(Date.now() - 180 * 86400000).toISOString())
        .limit(20),
      client
        .from('profiles')
        .select('full_name,stage,location')
        .eq('user_id', user.id)
        .maybeSingle(),
      client
        .from('academic_profiles')
        .select('school_year,school_name,interests,utme_score,target_course_id,courses(name,field)')
        .eq('user_id', user.id)
        .maybeSingle(),
      client
        .from('exam_records')
        .select('exam_type,exam_year,sitting,exam_grades(subject,grade)')
        .eq('user_id', user.id)
    ]);

    if (history.error) console.warn('History load warning:', history.error.message);
    if (sources.error) console.warn('Sources load warning:', sources.error.message);

    const refs = sources.data || [];
    const chatHistory = (history.data || []).reverse().map(m => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.content
    }));

    const targetCourse = academicRes.data?.courses as unknown as { name?: string; field?: string } | null;
    const academicContext = {
      student_name: profileRes.data?.full_name || 'Student',
      stage: profileRes.data?.stage || 'secondary',
      school_year: academicRes.data?.school_year || '',
      school_name: academicRes.data?.school_name || '',
      target_course: targetCourse?.name ? `${targetCourse.name} (${targetCourse.field})` : null,
      interests: academicRes.data?.interests || [],
      jamb_utme_score: academicRes.data?.utme_score ?? null,
      olevel_exams: (examRecordsRes.data || []).map(r => ({
        exam_type: r.exam_type,
        year: r.exam_year,
        grades: (r.exam_grades || []).map((g: any) => `${g.subject}: ${g.grade}`)
      }))
    };

    const systemPrompt = `You are Pathwise AI, an intelligent, empathetic educational advisor and tutor for Nigerian secondary and university students.
Provide clear, actionable, and encouraging guidance grounded in Nigerian educational realities (JAMB/UTME, WAEC/NECO, Post-UTME, direct entry, CGPA, Nigerian university systems, and high-demand careers).
Explain concepts thoroughly, provide concrete study tips, and suggest next steps.
Never invent official admission decisions or unverified cut-off marks; refer students to the Eligibility Checker (/app/eligibility) for admissions benchmarking and Counseling (/app/counseling) for mentor booking.

You have access to the student's complete academic record on Pathwise:
- Student Name: ${academicContext.student_name}
- Stage & Year: ${academicContext.stage} (${academicContext.school_year}) at ${academicContext.school_name || 'Secondary School'}
- Target Degree: ${academicContext.target_course || 'Not selected'}
- Interests: ${academicContext.interests.join(', ') || 'General'}
- JAMB UTME Score: ${academicContext.jamb_utme_score !== null ? `${academicContext.jamb_utme_score} / 400` : 'Not recorded yet'}
- O'Level Examination Records (WAEC/NECO):
${academicContext.olevel_exams.length ? academicContext.olevel_exams.map(e => `  * ${e.exam_type} (${e.year}): ${e.grades.join(', ')}`).join('\n') : '  * No O-Level grades uploaded yet'}

CRITICAL INSTRUCTION: You ALREADY KNOW the student's name, target course, JAMB score, and WAEC/NECO grades shown above. NEVER ask the student for information that is already provided in this context. Reference their specific scores and subjects directly when evaluating their chances or giving advice.

You must reply with a valid JSON object matching:
{
  "answer": "Your detailed, formatted response here (supports markdown with bullet points and bold headers)",
  "source_ids": ["uuid-of-referenced-source-if-applicable"]
}
Sources: ${JSON.stringify(refs)}
Student Academic Context: ${JSON.stringify(academicContext)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 1800
      }),
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI Error:', response.status, errText);
      throw new Error(`AI service responded with status ${response.status}`);
    }

    const raw = await response.json();
    let rawContent = (raw.choices?.[0]?.message?.content || '').trim();

    if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    let parsedAnswer = '';
    let parsedSourceIds: string[] = [];

    try {
      const parsed = JSON.parse(rawContent);
      parsedAnswer = parsed.answer || parsed.response || parsed.content || rawContent;
      if (Array.isArray(parsed.source_ids)) {
        parsedSourceIds = parsed.source_ids.filter((id: unknown) => typeof id === 'string');
      } else if (Array.isArray(parsed.sources)) {
        parsedSourceIds = parsed.sources.filter((id: unknown) => typeof id === 'string');
      }
    } catch {
      parsedAnswer = rawContent;
    }

    if (!parsedAnswer || typeof parsedAnswer !== 'string') {
      parsedAnswer = 'I have analyzed your question. Here is actionable guidance based on your academic path.';
    }

    const citations = refs
      .filter(s => parsedSourceIds.includes(s.id))
      .map(s => ({ id: s.id, title: s.name, url: s.url }));

    const { error: insertError } = await service.from('chat_messages').insert({
      conversation_id: input.conversation,
      user_id: user.id,
      role: 'assistant',
      content: parsedAnswer,
      citations,
      request_id: input.requestId
    });

    if (insertError) {
      console.error('Insert chat error:', insertError.message);
      throw new Error(insertError.message);
    }

    await service
      .from('ai_requests')
      .update({ status: 'complete' })
      .eq('id', input.requestId);

    return NextResponse.json(
      { answer: parsedAnswer, citations },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AI error';
    console.error('AI Route Failure:', message);
    await service
      .from('ai_requests')
      .update({ status: 'failed' })
      .eq('id', input.requestId);

    return NextResponse.json(
      { error: `The AI tutor could not complete the response: ${message}. Please try again.` },
      { status: 502 }
    );
  }
}
