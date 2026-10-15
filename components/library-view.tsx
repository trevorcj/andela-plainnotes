'use client';

import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Volume2,
  Share2,
  Download,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  X,
  VolumeX,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { CURATED_AFRICAN_NOTES } from '@/lib/curated-notes';
import { SimplifiedNote, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/types/plainnotes';
import { generateOfflineHtml } from '@/lib/export-offline';

interface LibraryViewProps {
  onSelectForStudio?: (note: SimplifiedNote) => void;
}

export function LibraryView({ onSelectForStudio }: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [previewNote, setPreviewNote] = useState<SimplifiedNote | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const subjects = ['all', ...Array.from(new Set(CURATED_AFRICAN_NOTES.map(n => n.subject)))];

  const filteredNotes = CURATED_AFRICAN_NOTES.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.simplifiedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLang === 'all' || note.language === selectedLang;
    const matchesSubject = selectedSubject === 'all' || note.subject === selectedSubject;
    return matchesSearch && matchesLang && matchesSubject;
  });

  const handleCopyWhatsApp = (note: SimplifiedNote) => {
    navigator.clipboard.writeText(note.whatsappText);
    toast.success('Copied for WhatsApp!');
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
    toast.success('Offline capsule downloaded!');
  };

  const handleToggleAudio = (note: SimplifiedNote) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Audio narration not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const narrationText = `${note.title}. In plain words: ${note.simplifiedText}. Everyday analogy: ${note.localAnalogy}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95;

    if (note.language === 'french') utterance.lang = 'fr-FR';
    else if (note.language === 'swahili') utterance.lang = 'sw-KE';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    toast.info('Zero-bandwidth audio playing');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
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
              background: '#09090b',
              color: '#ffffff'
            }}
          >
            Curated African Library
          </span>
          <span style={{ fontSize: 13, color: '#71717a' }}>• High-Yield Exam Curriculums</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#09090b', margin: '0 0 8px' }}>
          Explore pre-simplified African study capsules.
        </h1>
        <p style={{ fontSize: 15, color: '#52525b', lineHeight: 1.5, margin: 0 }}>
          High-yield academic topics across WAEC, JAMB, TVET and university courses translated into African idioms, street-smart analogies, and exam essentials.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
          <input
            type="text"
            placeholder="Search by topic, keyword, or concept (e.g. photosynthesis, Ohm's law, inflation, database)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: 8,
              border: '1px solid #e4e4e7',
              fontSize: 14,
              color: '#09090b',
              background: '#fafafa',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Dialect:</span>
          <button
            onClick={() => setSelectedLang('all')}
            style={{
              fontSize: 12.5,
              fontWeight: selectedLang === 'all' ? 600 : 500,
              padding: '4px 10px',
              borderRadius: 9999,
              background: selectedLang === 'all' ? '#09090b' : '#ffffff',
              color: selectedLang === 'all' ? '#ffffff' : '#52525b',
              border: selectedLang === 'all' ? '1px solid #09090b' : '1px solid #e4e4e7',
              cursor: 'pointer'
            }}
          >
            All Dialects
          </button>
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12.5,
                fontWeight: selectedLang === lang.code ? 600 : 500,
                padding: '4px 10px',
                borderRadius: 9999,
                background: selectedLang === lang.code ? '#09090b' : '#ffffff',
                color: selectedLang === lang.code ? '#ffffff' : '#52525b',
                border: selectedLang === lang.code ? '1px solid #09090b' : '1px solid #e4e4e7',
                cursor: 'pointer'
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
        {filteredNotes.map(note => {
          const langMeta = SUPPORTED_LANGUAGES.find(l => l.code === note.language);
          return (
            <div
              key={note.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e4e4e7',
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#09090b';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e4e4e7';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: '#f4f4f5',
                      color: '#18181b',
                      border: '1px solid #e4e4e7'
                    }}
                  >
                    {note.subject}
                  </span>
                  <span style={{ fontSize: 12, color: '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{langMeta?.flag}</span>
                    <span>{langMeta?.name}</span>
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 8px', color: '#09090b', lineHeight: 1.3 }}>
                  {note.title}
                </h3>

                <p style={{ fontSize: 13.5, color: '#52525b', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.simplifiedText}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f4f4f5', paddingTop: 12 }}>
                <button
                  onClick={() => setPreviewNote(note)}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#09090b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  Read Note <ArrowRight size={13} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => handleCopyWhatsApp(note)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#166534',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Copy for WhatsApp"
                  >
                    <Share2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDownload(note)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 6,
                      background: '#ffffff',
                      border: '1px solid #e4e4e7',
                      color: '#18181b',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                    title="Download offline HTML note"
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note Inspection Modal */}
      {previewNote && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: 16
          }}
          onClick={() => {
            if (isSpeaking) {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }
            setPreviewNote(null);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 14,
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (isSpeaking) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
                setPreviewNote(null);
              }}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                padding: 6,
                borderRadius: 6,
                border: '1px solid #e4e4e7',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: '#f4f4f5',
                  color: '#18181b',
                  border: '1px solid #e4e4e7'
                }}
              >
                {previewNote.subject}
              </span>
              <span style={{ fontSize: 13, color: '#71717a' }}>
                • {SUPPORTED_LANGUAGES.find(l => l.code === previewNote.language)?.name}
              </span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', color: '#09090b', letterSpacing: '-0.02em' }}>
              {previewNote.title}
            </h2>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleToggleAudio(previewNote)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  background: isSpeaking ? '#09090b' : '#ffffff',
                  color: isSpeaking ? '#ffffff' : '#18181b',
                  border: '1px solid #e4e4e7',
                  cursor: 'pointer'
                }}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen (0 KB Data)'}</span>
              </button>
              <button
                onClick={() => handleCopyWhatsApp(previewNote)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  cursor: 'pointer'
                }}
              >
                <Share2 size={14} />
                <span>Copy for WhatsApp</span>
              </button>
              <button
                onClick={() => handleDownload(previewNote)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  background: '#ffffff',
                  color: '#18181b',
                  border: '1px solid #e4e4e7',
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Download Offline</span>
              </button>
            </div>

            {/* Plain Words */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: 6 }}>
                In Plain Words
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#18181b', margin: 0 }}>
                {previewNote.simplifiedText}
              </p>
            </div>

            {/* Analogy */}
            <div
              style={{
                background: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: 8,
                padding: '16px 18px',
                color: '#713f12',
                marginBottom: 20,
                fontSize: 14.5,
                lineHeight: 1.6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                <Lightbulb size={15} />
                <span>Everyday African Analogy</span>
              </div>
              {previewNote.localAnalogy}
            </div>

            {/* 3 Exam Essentials */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: 10 }}>
                The 3 Exam Essentials
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previewNote.examEssentials.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '10px 14px',
                      borderRadius: 6,
                      background: '#fafafa',
                      border: '1px solid #e4e4e7',
                      fontSize: 13.5
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#09090b',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 10.5,
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: '#18181b', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
