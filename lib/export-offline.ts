import { SimplifiedNote } from './types/plainnotes';

export function generateOfflineHtml(note: SimplifiedNote): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title)} — PlainNotes</title>
  <style>
    * { box-sizing: border-box; box-shadow: none !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #fafafa;
      color: #09090b;
      margin: 0;
      padding: 32px 16px;
      line-height: 1.6;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      padding: 32px;
    }
    .header {
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 9999px;
      background: #f4f4f5;
      color: #18181b;
      border: 1px solid #e4e4e7;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }
    .meta {
      font-size: 13px;
      color: #71717a;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #71717a;
      margin-bottom: 10px;
    }
    .plain-text {
      font-size: 16px;
      line-height: 1.7;
      color: #18181b;
      white-space: pre-line;
    }
    .analogy-box {
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 8px;
      padding: 18px 20px;
      color: #713f12;
      font-size: 15px;
      line-height: 1.6;
    }
    .essentials-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .essentials-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 10px 14px;
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .badge-number {
      background: #09090b;
      color: #ffffff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .footer {
      border-top: 1px solid #e4e4e7;
      padding-top: 20px;
      font-size: 12px;
      color: #71717a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="tag">${escapeHtml(note.subject)} • ${escapeHtml(note.language.toUpperCase())} • OFFLINE CAPSULE</div>
      <h1>${escapeHtml(note.title)}</h1>
      <div class="meta">Exported from PlainNotes (Zero Bandwidth Capsule) • ${new Date(note.createdAt).toLocaleDateString()}</div>
    </div>

    <div class="section">
      <div class="section-title">In Plain Words</div>
      <div class="plain-text">${escapeHtml(note.simplifiedText)}</div>
    </div>

    <div class="section">
      <div class="section-title">Everyday African Analogy</div>
      <div class="analogy-box">
        <strong>💡 Real World Connection:</strong><br>
        ${escapeHtml(note.localAnalogy)}
      </div>
    </div>

    <div class="section">
      <div class="section-title">The 3 Exam Essentials</div>
      <ul class="essentials-list">
        ${note.examEssentials.map((item, idx) => `
          <li class="essentials-item">
            <span class="badge-number">${idx + 1}</span>
            <span>${escapeHtml(item)}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Comprehension Check</div>
      <div style="padding: 16px; border: 1px solid #e4e4e7; border-radius: 8px; background: #ffffff;">
        <p style="margin: 0 0 12px; font-weight: 600;">${escapeHtml(note.quiz.question)}</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          ${note.quiz.options.map((opt, i) => `
            <li style="margin-bottom: 6px; ${i === note.quiz.answerIndex ? 'font-weight: 700; color: #166534;' : ''}">
              ${escapeHtml(opt)} ${i === note.quiz.answerIndex ? '✓ (Correct)' : ''}
            </li>
          `).join('')}
        </ul>
        <p style="margin: 12px 0 0; font-size: 13px; color: #52525b; border-top: 1px solid #f4f4f5; padding-top: 8px;">
          <em>Why:</em> ${escapeHtml(note.quiz.explanation)}
        </p>
      </div>
    </div>

    <div class="footer">
      <span>PlainNotes — Academic Jargon Demystified for African Learners</span>
      <span>100% Offline Compatible</span>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
