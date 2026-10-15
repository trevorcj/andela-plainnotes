'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  Smartphone,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { CURATED_AFRICAN_NOTES } from '@/lib/curated-notes';
import { SimplifiedNote } from '@/lib/types/plainnotes';

interface WhatsAppPackViewProps {
  userSavedNotes?: SimplifiedNote[];
}

export function WhatsAppPackView({ userSavedNotes = [] }: WhatsAppPackViewProps) {
  const allNotes = [...userSavedNotes, ...CURATED_AFRICAN_NOTES];
  const [selectedNoteId, setSelectedNoteId] = useState<string>(allNotes[0]?.id || '');
  const [customFooter, setCustomFooter] = useState('Study hard! Sent from PlainNotes Africa 🚀');
  const [copied, setCopied] = useState(false);

  const activeNote = allNotes.find(n => n.id === selectedNoteId) || allNotes[0];

  const fullWhatsAppText = activeNote
    ? `${activeNote.whatsappText}\n\n_${customFooter}_`
    : '';

  const handleCopy = () => {
    if (!fullWhatsAppText) return;
    navigator.clipboard.writeText(fullWhatsAppText);
    setCopied(true);
    toast.success('Copied for WhatsApp! You can now paste into any group chat.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!fullWhatsAppText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(fullWhatsAppText)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: 9999,
              background: '#16a34a',
              color: '#ffffff'
            }}
          >
            2G & 3G Low-Data Ready
          </span>
          <span style={{ fontSize: 13, color: '#71717a' }}>• Zero Login Barrier</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#09090b', margin: '0 0 8px' }}>
          WhatsApp Study Pack Exporter
        </h1>
        <p style={{ fontSize: 15, color: '#52525b', lineHeight: 1.5, margin: 0 }}>
          Export bite-sized study capsules formatted specifically for school WhatsApp & Telegram groups. Formatted with bold highlights, bullets, and emojis that render on any mobile device.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: 24 }} className="whatsapp-grid">
        {/* Left Column: Note Selector & Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pick Topic */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 600, color: '#09090b' }}>
              Select Topic to Package:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
              {allNotes.map(n => {
                const isSelected = n.id === selectedNoteId;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNoteId(n.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: isSelected ? '#f4f4f5' : '#ffffff',
                      border: isSelected ? '1px solid #09090b' : '1px solid #e4e4e7',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
                        {n.subject} • {n.language.toUpperCase()}
                      </span>
                      {n.isCurated && (
                        <span style={{ fontSize: 10, background: '#09090b', color: '#ffffff', padding: '1px 5px', borderRadius: 3 }}>
                          CURATED
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: isSelected ? 600 : 500, color: '#09090b' }}>
                      {n.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Footer Input */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 600, color: '#09090b' }}>
              Custom Group Sign-off Note:
            </label>
            <input
              type="text"
              value={customFooter}
              onChange={e => setCustomFooter(e.target.value)}
              placeholder="e.g. SS3 Science Class Group • Assignment due Friday"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e4e4e7',
                fontSize: 13.5,
                color: '#09090b',
                background: '#fafafa',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: 12, color: '#71717a' }}>
              Appended at the end of the WhatsApp post for your study group.
            </span>
          </div>
        </div>

        {/* Right Column: WhatsApp Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={16} color="#16a34a" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#09090b' }}>
                  WhatsApp Preview (Monospaced Formatter)
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 9999, fontWeight: 600 }}>
                ~0.4 KB data
              </span>
            </div>

            {/* WhatsApp Chat Bubble */}
            <div
              style={{
                background: '#dcf8c6',
                border: '1px solid #b2d8a0',
                borderRadius: 10,
                padding: '18px 20px',
                color: '#111827',
                fontSize: 13.5,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {fullWhatsAppText}
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 16px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: '#09090b',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
              </button>

              <button
                onClick={handleOpenWhatsApp}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '11px 18px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Send directly via WhatsApp web/app"
              >
                <Share2 size={16} />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .whatsapp-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
