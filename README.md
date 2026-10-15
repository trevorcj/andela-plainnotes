# PlainNotes

PlainNotes is an AI-powered academic simplifier designed for African students. It breaks down complex textbooks, lecture slides, academic documents, and exam topics into crystal-clear explanations using authentic African dialects, relatable real-world analogies, and interactive quizzes.

---

## Features

- **Multi-Dialect & Language Support**: Learn in authentic Nigerian Pidgin, Yoruba, Hausa, Igbo, Kenyan Swahili, French, or plain English.
- **African Real-World Analogies**: Relatable examples (Danfo buses, mobile money transfers, market bargaining, solar mini-grids) that make difficult concepts stick.
- **Document & PDF Uploads**: Attach PDF textbooks or lecture notes—the AI extracts and simplifies key concepts directly from the document.
- **Voice Dictation**: Ask questions or dictate academic concepts hands-free with real-time speech recognition.
- **Audio Narration**: Listen to simplified summaries spoken aloud.
- **Interactive Understanding Checks**: Retains 10-question Socratic quizzes and exam essential checklists with persistent memory across sessions.
- **Clean PDF Export**: Download a focused, printable PDF containing only the question asked and the AI's simplified explanation.
- **Magic-Link Authentication**: Fast, passwordless email login powered by Supabase.
- **Persistent Study History**: Save notes to your personal vault and revisit past conversations across devices.

---

## Environment Variables

Create a `.env.local` file in the root directory (or add these variables in your deployment dashboard):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
```

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project HTTPS URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon public key |
| `NEXT_PUBLIC_SITE_URL` | App origin URL (`http://localhost:3000` locally, or your production URL on Vercel) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key for note simplification |
| `OPENAI_MODEL` | AI model version (defaults to `gpt-4.1-mini`) |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run database setup

Run the cleanup and schema setup script located at `supabase/migrations/cleanup_legacy_tables.sql` in your Supabase SQL Editor.

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Any request to the root path automatically redirects to the dashboard at `/app`.

### 4. Run tests and typecheck

```bash
npm run typecheck
npm test
```
