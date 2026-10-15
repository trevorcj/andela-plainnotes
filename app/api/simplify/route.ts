import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { simplifyAcademicText } from '@/lib/ai-simplifier';
import { LanguageCode } from '@/lib/types/plainnotes';
import { createServerClient } from '@supabase/ssr';
import { supabaseConfig } from '@/lib/env';

const requestSchema = z.object({
  text: z.string().default(''),
  language: z.enum(['pidgin', 'yoruba', 'hausa', 'igbo', 'english', 'french', 'swahili']).default('pidgin'),
  subject: z.string().optional(),
  level: z.enum(['secondary', 'tertiary', 'vocational']).default('secondary'),
  imageBase64: z.string().optional(),
  pdfBase64: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
}).refine(data => data.text.trim().length >= 3 || Boolean(data.imageBase64) || Boolean(data.pdfBase64), {
  message: 'Please provide academic text, attach a document/PDF, or upload an image.'
});

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    const { text, language, subject, level, imageBase64, pdfBase64, history } = parsed.data;

    let processedText = text;

    if (pdfBase64) {
      try {
        const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const pdfParseModule = await import('pdf-parse');
        let extractedPdfText = '';

        const parsePromise = (async () => {
          if ((pdfParseModule as any).PDFParse) {
            const parser = new (pdfParseModule as any).PDFParse({ data: pdfBuffer });
            const result = await parser.getText();
            if (typeof parser.destroy === 'function') {
              try { await parser.destroy(); } catch {}
            }
            return result?.text?.trim() || '';
          } else if (typeof (pdfParseModule as any).default === 'function') {
            const result = await (pdfParseModule as any).default(pdfBuffer);
            return result?.text?.trim() || '';
          } else if (typeof pdfParseModule === 'function') {
            const result = await (pdfParseModule as any)(pdfBuffer);
            return result?.text?.trim() || '';
          }
          return '';
        })();

        // 7 second timeout for PDF parsing so function does not hang
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('PDF parsing timed out')), 7000)
        );

        extractedPdfText = await Promise.race([parsePromise, timeoutPromise]).catch(err => {
          console.warn('PDF parse timeout or error:', err);
          return '';
        });

        if (extractedPdfText) {
          processedText = text.trim()
            ? `User Prompt: ${text.trim()}\n\nContent from attached document:\n"""\n${extractedPdfText.slice(0, 12000)}\n"""`
            : `Please simplify and break down key concepts from this attached document:\n"""\n${extractedPdfText.slice(0, 12000)}\n"""`;
        } else if (!text.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: 'Could not extract readable text from this PDF. It may be a scanned document or password-protected. Please paste the text or attach a photo.'
            },
            { status: 400 }
          );
        }
      } catch (pdfErr) {
        console.error('PDF extraction error:', pdfErr);
        if (!text.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: 'Could not parse this PDF. Please paste the text directly.'
            },
            { status: 400 }
          );
        }
      }
    }

    const note = await simplifyAcademicText({
      text: processedText,
      language: language as LanguageCode,
      subject,
      level,
      imageBase64,
      history
    });

    try {
      const config = supabaseConfig();
      if (config) {
        const supabase = createServerClient(config.url, config.key, {
          cookies: {
            getAll: () => req.cookies.getAll(),
            setAll: () => {}
          }
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          note.userId = user.id;
          await supabase.from('plain_notes').insert({
            id: note.id,
            user_id: user.id,
            title: note.title,
            subject: note.subject,
            language: note.language,
            original_text: note.originalText,
            simplified_text: note.simplifiedText,
            local_analogy: note.localAnalogy,
            exam_essentials: note.examEssentials,
            quiz: note.quiz,
            whatsapp_text: note.whatsappText,
            is_curated: false
          });
        }
      }
    } catch {
      // Non-blocking persistence
    }

    return NextResponse.json({
      success: true,
      note
    });
  } catch (error: any) {
    console.error('Error in /api/simplify:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to simplify academic text'
      },
      { status: 500 }
    );
  }
}
