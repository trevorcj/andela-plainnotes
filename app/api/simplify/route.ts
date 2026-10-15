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
  pdfBase64: z.string().optional()
}).refine(data => data.text.trim().length >= 3 || Boolean(data.imageBase64) || Boolean(data.pdfBase64), {
  message: 'Please provide academic text, attach a document/PDF, or upload an image.'
});

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

    const { text, language, subject, level, imageBase64, pdfBase64 } = parsed.data;

    let processedText = text;

    if (pdfBase64) {
      try {
        const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, '');
        const pdfBuffer = Buffer.from(cleanBase64, 'base64');
        const pdfParseModule = await import('pdf-parse');
        let extractedPdfText = '';

        if ((pdfParseModule as any).PDFParse) {
          const parser = new (pdfParseModule as any).PDFParse({ data: pdfBuffer });
          const result = await parser.getText();
          extractedPdfText = result?.text?.trim() || '';
          if (typeof parser.destroy === 'function') {
            await parser.destroy();
          }
        } else if (typeof (pdfParseModule as any).default === 'function') {
          const result = await (pdfParseModule as any).default(pdfBuffer);
          extractedPdfText = result?.text?.trim() || '';
        } else if (typeof pdfParseModule === 'function') {
          const result = await (pdfParseModule as any)(pdfBuffer);
          extractedPdfText = result?.text?.trim() || '';
        }

        if (extractedPdfText) {
          processedText = text.trim()
            ? `User Prompt: ${text.trim()}\n\nContent from attached document:\n"""\n${extractedPdfText.slice(0, 12000)}\n"""`
            : `Please simplify and break down key concepts from this attached document:\n"""\n${extractedPdfText.slice(0, 12000)}\n"""`;
        }
      } catch (pdfErr) {
        console.error('PDF extraction error:', pdfErr);
      }
    }

    const note = await simplifyAcademicText({
      text: processedText,
      language: language as LanguageCode,
      subject,
      level,
      imageBase64
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
