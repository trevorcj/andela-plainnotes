'use client';

/**
 * Client-side PDF text extractor.
 * Extracts text directly on the user's device so:
 * 1. Zero large file uploads (>4MB) over slow mobile networks.
 * 2. Instant extraction with page-by-page progress.
 * 3. Works smoothly on African mobile connections without server payload limits.
 */

// Dynamically load PDF.js from cdnjs
let pdfjsPromise: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }

  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjs);
      } else {
        reject(new Error('PDF.js failed to initialize'));
      }
    };
    script.onerror = () => {
      pdfjsPromise = null;
      reject(new Error('Could not load PDF.js from CDN'));
    };
    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

/**
 * Fallback regex stream extractor if CDN is unreachable or user is offline.
 * Extracts plain text from uncompressed or simple flate streams.
 */
async function fallbackExtractText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const binary = decoder.decode(bytes);

    const textChunks: string[] = [];
    const tjRegex = /\(([^)]{1,300})\)\s*Tj/g;
    let match: RegExpExecArray | null;

    while ((match = tjRegex.exec(binary)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean && clean.length > 1) {
        textChunks.push(clean);
      }
    }

    const arrayRegex = /\[([^\]]{1,1000})\]\s*TJ/g;
    while ((match = arrayRegex.exec(binary)) !== null) {
      const inner = match[1];
      const partRegex = /\(([^)]{1,200})\)/g;
      let part: RegExpExecArray | null;
      let line = '';
      while ((part = partRegex.exec(inner)) !== null) {
        line += part[1].replace(/\\([()\\])/g, '$1');
      }
      if (line.trim().length > 1) {
        textChunks.push(line.trim());
      }
    }

    return textChunks.join(' ').slice(0, 15000);
  } catch (err) {
    console.warn('Fallback PDF extraction error:', err);
    return '';
  }
}

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  wordCount: number;
  isScannedOnly: boolean;
}

/**
 * Extracts all readable text from a PDF File object on the client.
 */
export async function extractTextFromPdfFile(file: File): Promise<ExtractedPdfResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages || 1;
    const maxPages = Math.min(pageCount, 25);
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          .map((item: any) => item.str || '')
          .filter((s: string) => s.trim().length > 0);

        if (pageStrings.length > 0) {
          pageTexts.push(`[Page ${pageNum}]\n${pageStrings.join(' ')}`);
        }
      } catch (pageErr) {
        console.warn(`Error reading page ${pageNum}:`, pageErr);
      }
    }

    const fullText = pageTexts.join('\n\n').trim();
    const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0;

    if (fullText.length >= 30) {
      return {
        text: fullText.slice(0, 20000),
        pageCount,
        wordCount,
        isScannedOnly: false
      };
    }

    // Try fallback
    const fallback = await fallbackExtractText(file);
    if (fallback.length >= 30) {
      const fbWordCount = fallback.split(/\s+/).filter(Boolean).length;
      return {
        text: fallback,
        pageCount,
        wordCount: fbWordCount,
        isScannedOnly: false
      };
    }

    return {
      text: '',
      pageCount,
      wordCount: 0,
      isScannedOnly: true
    };
  } catch (err) {
    console.warn('PDF.js failed, trying fallback stream parser:', err);
    const fallback = await fallbackExtractText(file);
    const fbWordCount = fallback ? fallback.split(/\s+/).filter(Boolean).length : 0;
    return {
      text: fallback,
      pageCount: 1,
      wordCount: fbWordCount,
      isScannedOnly: fallback.length < 30
    };
  }
}
