'use client';

import React, { useState } from 'react';
import {
  BookmarkCheck,
  Trash2,
  Share2,
  Download,
  Volume2,
  VolumeX,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { SimplifiedNote, SUPPORTED_LANGUAGES } from '@/lib/types/plainnotes';
import { generateOfflineHtml } from '@/lib/export-offline';

interface SavedNotesViewProps {
  savedNotes: SimplifiedNote[];
  onDeleteNote: (id: string) => void;
  onGoToStudio?: () => void;
  onOpenNote?: (note: SimplifiedNote) => void;
}

export function SavedNotesView({
  savedNotes,
  onDeleteNote,
  onGoToStudio,
  onOpenNote
}: SavedNotesViewProps) {
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (note: SimplifiedNote) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.simplifiedText}\n\nAnalogy:\n${note.localAnalogy}`);
    setCopiedId(note.id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = (note: SimplifiedNote) => {
    navigator.clipboard.writeText(note.whatsappText);
    toast.success('Formatted note copied! Ready to paste into WhatsApp or SMS.');
  };

  const handleDownload = (note: SimplifiedNote) => {
    const htmlContent = generateOfflineHtml(note);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plainnotes-${note.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Offline capsule downloaded');
  };

  const handleToggleAudio = (note: SimplifiedNote) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Audio narration not supported in this browser.');
      return;
    }

    if (isSpeaking === note.id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const narrationText = `${note.title}. In plain words: ${note.simplifiedText}. Everyday analogy: ${note.localAnalogy}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95;

    if (note.language === 'french') utterance.lang = 'fr-FR';
    else if (note.language === 'swahili') utterance.lang = 'sw-KE';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(note.id);
    toast.info('Audio playing');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* Header with strict sentence casing as requested */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#09090b', margin: '0 0 6px' }}>
          My saved notes
        </h1>
        <p style={{ fontSize: 14.5, color: '#52525b', margin: 0 }}>
          Read, listen, or download them offline anytime.
        </p>
      </div>

      {savedNotes.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            borderRadius: 12,
            padding: '52px 24px',
            textAlign: 'center',
            color: '#71717a',
            fontSize: 14.5
          }}
        >
          <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}>
              <BookmarkCheck size={24} />
            </div>
            <div style={{ fontWeight: 600, color: '#18181b', fontSize: 16 }}>Your saved notes vault is empty</div>
            <p style={{ margin: 0, lineHeight: 1.5, color: '#71717a', fontSize: 14 }}>
              Notes you bookmark while simplifying will appear here for fast revision, audio listening, and offline access.
            </p>
            {onGoToStudio && (
              <button
                type="button"
                onClick={onGoToStudio}
                style={{
                  marginTop: 6,
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: '#18181b',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Start simplifying notes
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {savedNotes.map(note => {
            const langMeta = SUPPORTED_LANGUAGES.find(l => l.code === note.language);
            return (
              <div
                key={note.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e4e4e7',
                  borderRadius: 12,
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
              >
                {/* Note metadata row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#f4f4f5',
                        color: '#18181b',
                        border: '1px solid #e4e4e7'
                      }}
                    >
                      {note.subject}
                    </span>
                    <span style={{ fontSize: 12.5, color: '#71717a' }}>
                      {langMeta?.name}
                    </span>
                    <span style={{ fontSize: 12, color: '#a1a1aa' }}>
                      • {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions matching Screenshot 2 icons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#71717a' }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(note)}
                      style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: copiedId === note.id ? '#16a34a' : '#71717a' }}
                      title="Copy response"
                    >
                      {copiedId === note.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleAudio(note)}
                      style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: isSpeaking === note.id ? '#09090b' : '#71717a' }}
                      title="Listen"
                    >
                      {isSpeaking === note.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(note)}
                      style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}
                      title="Share"
                    >
                      <Share2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(note)}
                      style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}
                      title="Download as PDF"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteNote(note.id);
                        toast.success('Note removed from saved notes');
                      }}
                      style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3
                    onClick={() => onOpenNote?.(note)}
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      margin: '0 0 6px',
                      color: '#09090b',
                      letterSpacing: '-0.01em',
                      cursor: onOpenNote ? 'pointer' : 'default',
                      display: 'inline-block'
                    }}
                    title={onOpenNote ? 'Open this note in conversation' : undefined}
                  >
                    {note.title}
                  </h3>
                  <p style={{ fontSize: 14.5, color: '#27272a', lineHeight: 1.6, margin: 0 }}>
                    {note.simplifiedText}
                  </p>
                </div>

                {/* Analogy Box */}
                <div
                  style={{
                    background: '#fefce8',
                    border: '1px solid #fef08a',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontSize: 13.5,
                    color: '#713f12',
                    lineHeight: 1.5
                  }}
                >
                  <strong>Everyday African analogy:</strong> {note.localAnalogy}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
