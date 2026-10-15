'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Mic, MicOff, AlertCircle } from 'lucide-react';

type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function AIChat({ conversation }: { conversation: string }) {
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const router = useRouter();

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const SpeechClass = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SpeechClass) {
      const rec = new SpeechClass();
      rec.lang = 'en-NG';
      rec.interimResults = false;
      rec.onresult = e => {
        const text = Array.from(e.results)
          .map(v => v[0].transcript)
          .join(' ');
        setContent(c => (c + ' ' + text).trim().slice(0, 4000));
      };
      rec.onerror = () => {
        setIsRecording(false);
      };
      rec.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = rec;
    }
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || pending) return;
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation,
          requestId: crypto.randomUUID(),
          content: content.trim()
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to get reply');
      setContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate answer. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSend} style={{ marginTop: 16 }}>
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 6,
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 12
          }}
        >
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '8px 12px'
        }}
      >
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Ask anything about Nigerian courses, universities, cutoff strategies, or exam preparation…"
          rows={2}
          required
          maxLength={4000}
          disabled={pending}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: 14,
            background: 'transparent',
            padding: '6px 0',
            fontFamily: 'inherit',
            minHeight: 48
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />

        <button
          type="button"
          onClick={toggleMic}
          aria-label={isRecording ? 'Stop recording' : 'Record voice prompt'}
          style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: isRecording ? '#fee2e2' : 'var(--secondary)',
            color: isRecording ? '#ef4444' : 'var(--muted-foreground)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}
        >
          {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        <button
          type="submit"
          disabled={pending || !content.trim()}
          className="btn sm"
          style={{
            width: 34,
            height: 34,
            padding: 0,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}
        >
          <Send size={15} />
        </button>
      </div>
      <p className="muted" style={{ fontSize: 11, marginTop: 6, textAlign: 'center' }}>
        Pathwise AI Tutor is grounded in official Nigerian curriculum guidelines. Press Enter to send.
      </p>
    </form>
  );
}
