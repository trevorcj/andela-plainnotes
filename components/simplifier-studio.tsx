'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Share2,
  Download,
  BookmarkPlus,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  SimplifiedNote
} from '@/lib/types/plainnotes';
import { generateOfflineHtml } from '@/lib/export-offline';

const PRESET_EXAMPLES = [
  {
    label: 'Photosynthesis (WAEC Bio)',
    subject: 'Biology',
    level: 'secondary' as const,
    language: 'pidgin' as LanguageCode,
    text: 'Photosynthesis is the biochemical process by which photoautotrophic organisms convert light irradiance into chemical energy through the photolysis of H2O and fixation of CO2 inside the thylakoid membrane and stroma of chloroplasts, yielding D-glucose and molecular O2.'
  },
  {
    label: 'Newton\'s Law (JAMB Physics)',
    subject: 'Physics',
    level: 'secondary' as const,
    language: 'pidgin' as LanguageCode,
    text: 'Lex III: Actioni contrariam semper et aequalem esse reactionem; sive corporum duorum actiones in se mutuo semper esse aequales et in partes contrarias dirigi. Forces always occur in matched interaction pairs acting on two distinct masses.'
  },
  {
    label: 'Inflation & Naira (Economics)',
    subject: 'Economics',
    level: 'secondary' as const,
    language: 'yoruba' as LanguageCode,
    text: 'Inflation represents a sustained macroeconomic aggregate increase in the general consumer price index across trailing periods, primarily induced by demand-pull liquidity surges or cost-push supply chain shocks.'
  },
  {
    label: 'Database Indexing (Tech / CS)',
    subject: 'Computer Science',
    level: 'tertiary' as const,
    language: 'igbo' as LanguageCode,
    text: 'A database index is a redundant auxiliary data structure (frequently utilizing balanced search trees or hash tables) created to optimize query retrieval latency at the expense of computational overhead on mutation write transactions.'
  }
];

interface SimplifierStudioProps {
  onSaveNote: (note: SimplifiedNote) => void;
  savedNotes: SimplifiedNote[];
}

export function SimplifierStudio({ onSaveNote, savedNotes }: SimplifierStudioProps) {
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('pidgin');
  const [selectedLevel, setSelectedLevel] = useState<'secondary' | 'tertiary' | 'vocational'>('secondary');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeNote, setActiveNote] = useState<SimplifiedNote | null>(null);

  // Audio Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Interactive Quiz state
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Checked exam essentials
  const [checkedEssentials, setCheckedEssentials] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Cancel speech on unmount
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSelectPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    setInputText(preset.text);
    setSelectedLanguage(preset.language);
    setSelectedLevel(preset.level);
    setSubject(preset.subject);
  };

  const handleSimplify = async () => {
    if (!inputText.trim() || inputText.trim().length < 10) {
      toast.error('Please enter at least 10 characters of textbook or lecture text to simplify.');
      return;
    }

    setLoading(true);
    // Cancel any active speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const res = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          language: selectedLanguage,
          level: selectedLevel,
          subject: subject || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.note) {
        toast.error(data.error || 'Failed to simplify note. Please try again.');
        return;
      }

      setActiveNote(data.note);
      setSelectedQuizAnswer(null);
      setQuizSubmitted(false);
      setCheckedEssentials({});
      toast.success('Plain note generated with African analogy!');
    } catch {
      toast.error('Network glitch. Please check your connection or retry.');
    } finally {
      setLoading(false);
    }
  };

  // Zero-Bandwidth Web Speech API Narration
  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Audio narration is not supported on this device/browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!activeNote) return;

    window.speechSynthesis.cancel();
    const narrationText = `${activeNote.title}. In plain words: ${activeNote.simplifiedText}. Everyday analogy: ${activeNote.localAnalogy}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);

    // Map language code to speech synthesis voice language if possible
    if (selectedLanguage === 'french') utterance.lang = 'fr-FR';
    else if (selectedLanguage === 'swahili') utterance.lang = 'sw-KE';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    toast.info('Zero-bandwidth audio playing (uses your local device voice)');
  };

  const handleCopyWhatsApp = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.whatsappText);
    toast.success('Copied for WhatsApp! Paste directly into your study group.');
  };

  const handleDownloadOffline = () => {
    if (!activeNote) return;
    const htmlContent = generateOfflineHtml(activeNote);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plainnotes-${activeNote.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Offline capsule downloaded! Opens anywhere with 0 internet.');
  };

  const isNoteSaved = activeNote ? savedNotes.some(n => n.id === activeNote.id) : false;

  const handleSave = () => {
    if (!activeNote) return;
    onSaveNote(activeNote);
    toast.success('Saved to your private study notes library!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page Title & Mission */}
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
            African Academic Simplifier
          </span>
          <span style={{ fontSize: 13, color: '#71717a' }}>• 100% Free & Low Bandwidth</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: '#09090b', margin: '0 0 8px' }}>
          Turn dense academic jargon into crystal-clear plain words.
        </h1>
        <p style={{ fontSize: 15, color: '#52525b', lineHeight: 1.5, margin: 0, maxWidth: 720 }}>
          Paste confusing textbook passages, WAEC/JAMB past questions, or university lecture slides. Get plain explanations, relatable African analogies, and the 3 essentials examiners test for.
        </p>
      </div>

      {/* Preset Test Chips */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Quick Example Presets:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRESET_EXAMPLES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #e4e4e7',
                color: '#18181b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#09090b';
                e.currentTarget.style.background = '#f4f4f5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e4e4e7';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              ✦ {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >
        {/* Language Selection Row */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#09090b' }}>
              Choose Dialect & Explanation Language:
            </label>
            <span style={{ fontSize: 12, color: '#71717a' }}>
              Includes Nigerian Pidgin, Yoruba, Hausa & Igbo
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUPPORTED_LANGUAGES.map(lang => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 500,
                    background: isSelected ? '#09090b' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#52525b',
                    border: isSelected ? '1px solid #09090b' : '1px solid #e4e4e7',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Area */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#09090b' }}>
              Paste Dense Passage / Lecture Notes / Past Question:
            </label>
            {inputText.length > 0 && (
              <button
                onClick={() => setInputText('')}
                style={{ fontSize: 12, color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RotateCcw size={12} /> Clear text
              </button>
            )}
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste your difficult lecture slides, textbook definitions, or past questions here... e.g. Photosynthesis, Hooke's Law, Organic Reaction Mechanisms, Macroeconomics Inflation, OOP Inheritance..."
            rows={5}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid #e4e4e7',
              fontSize: 14.5,
              lineHeight: 1.6,
              color: '#09090b',
              background: '#fafafa',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#09090b';
              e.currentTarget.style.background = '#ffffff';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#e4e4e7';
              e.currentTarget.style.background = '#fafafa';
            }}
          />
        </div>

        {/* Options & Action Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingTop: 4 }}>
          {/* Level Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#71717a' }}>Level:</span>
            {(['secondary', 'tertiary', 'vocational'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  fontSize: 12,
                  fontWeight: selectedLevel === lvl ? 600 : 500,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: selectedLevel === lvl ? '#f4f4f5' : 'transparent',
                  color: selectedLevel === lvl ? '#09090b' : '#71717a',
                  border: selectedLevel === lvl ? '1px solid #d4d4d8' : '1px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {lvl === 'secondary' ? 'Secondary (WAEC/JAMB)' : lvl === 'tertiary' ? 'Tertiary (Poly/Uni)' : 'TVET / Vocational'}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSimplify}
            disabled={loading || inputText.trim().length < 5}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              background: '#09090b',
              color: '#ffffff',
              border: 'none',
              cursor: loading || inputText.trim().length < 5 ? 'not-allowed' : 'pointer',
              opacity: loading || inputText.trim().length < 5 ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" />
                <span>Simplifying Note...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Simplify Note</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          SIMPLIFIED RESULT VIEW
          ======================================================== */}
      {activeNote && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Note Action Toolbar */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 10,
              padding: '12px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: '#f4f4f5',
                  color: '#18181b',
                  border: '1px solid #e4e4e7'
                }}
              >
                {activeNote.subject}
              </span>
              <span style={{ fontSize: 13, color: '#71717a' }}>
                • {SUPPORTED_LANGUAGES.find(l => l.code === activeNote.language)?.name || activeNote.language}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Audio Listen Button */}
              <button
                onClick={handleToggleAudio}
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
                title="Zero-bandwidth audio narration using browser speech engine"
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen (0 KB Data)'}</span>
              </button>

              {/* WhatsApp Copy Button */}
              <button
                onClick={handleCopyWhatsApp}
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
                title="Copy formatted note for WhatsApp study groups"
              >
                <Share2 size={15} />
                <span>Copy for WhatsApp</span>
              </button>

              {/* Save to Vault Button */}
              <button
                onClick={handleSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  background: isNoteSaved ? '#f4f4f5' : '#ffffff',
                  color: isNoteSaved ? '#71717a' : '#18181b',
                  border: '1px solid #e4e4e7',
                  cursor: isNoteSaved ? 'default' : 'pointer'
                }}
              >
                {isNoteSaved ? <Check size={15} /> : <BookmarkPlus size={15} />}
                <span>{isNoteSaved ? 'Saved in Library' : 'Save Note'}</span>
              </button>

              {/* Offline HTML Capsule Download */}
              <button
                onClick={handleDownloadOffline}
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
                title="Download single-file standalone offline note"
              >
                <Download size={15} />
                <span>Offline Capsule</span>
              </button>
            </div>
          </div>

          {/* Card 1: Note Title & Plain Words */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: 6 }}>
                Topic Title
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#09090b', margin: 0 }}>
                {activeNote.title}
              </h2>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: 8 }}>
                In Plain Words (No Jargon)
              </div>
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: '#18181b', whiteSpace: 'pre-line' }}>
                {activeNote.simplifiedText}
              </p>
            </div>
          </div>

          {/* Card 2: Relatable African Analogy */}
          <div
            style={{
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#854d0e', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Lightbulb size={16} />
              <span>Everyday African Analogy</span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: '#713f12', margin: 0 }}>
              {activeNote.localAnalogy}
            </p>
          </div>

          {/* Card 3: The 3 Exam Essentials */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
                The 3 Exam Essentials (What Examiners Grade)
              </div>
              <span style={{ fontSize: 12, color: '#71717a' }}>
                Click items as you master them
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeNote.examEssentials.map((essential, idx) => {
                const isChecked = Boolean(checkedEssentials[idx]);
                return (
                  <div
                    key={idx}
                    onClick={() => setCheckedEssentials(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: isChecked ? '#f0fdf4' : '#fafafa',
                      border: isChecked ? '1px solid #bbf7d0' : '1px solid #e4e4e7',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: isChecked ? '#16a34a' : '#09090b',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {isChecked ? <Check size={14} /> : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: 14.5,
                        color: isChecked ? '#166534' : '#18181b',
                        lineHeight: 1.5,
                        textDecoration: isChecked ? 'line-through' : 'none'
                      }}
                    >
                      {essential}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Socratic Comprehension Check */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#09090b', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <HelpCircle size={16} />
              <span>1-Minute Socratic Check</span>
            </div>

            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#09090b', lineHeight: 1.4 }}>
              {activeNote.quiz.question}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeNote.quiz.options.map((option, idx) => {
                const isSelected = selectedQuizAnswer === idx;
                const isCorrect = idx === activeNote.quiz.answerIndex;

                let btnBg = '#ffffff';
                let btnBorder = '#e4e4e7';
                let btnColor = '#18181b';

                if (quizSubmitted) {
                  if (isCorrect) {
                    btnBg = '#f0fdf4';
                    btnBorder = '#86efac';
                    btnColor = '#166534';
                  } else if (isSelected && !isCorrect) {
                    btnBg = '#fef2f2';
                    btnBorder = '#fca5a5';
                    btnColor = '#991b1b';
                  }
                } else if (isSelected) {
                  btnBg = '#f4f4f5';
                  btnBorder = '#09090b';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!quizSubmitted) {
                        setSelectedQuizAnswer(idx);
                        setQuizSubmitted(true);
                        if (isCorrect) {
                          toast.success('Spot on! You nailed the concept.');
                        } else {
                          toast.error('Not quite! Check the explanation below.');
                        }
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: btnBg,
                      border: `1px solid ${btnBorder}`,
                      color: btnColor,
                      fontSize: 14,
                      textAlign: 'left',
                      cursor: quizSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '1px solid #d4d4d8',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                        background: isSelected ? '#09090b' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#71717a'
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{ flex: 1 }}>{option}</span>
                    {quizSubmitted && isCorrect && <CheckCircle2 size={16} color="#16a34a" />}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#f4f4f5',
                  border: '1px solid #e4e4e7',
                  fontSize: 13.5,
                  color: '#52525b',
                  lineHeight: 1.5
                }}
              >
                <strong>Pedagogical Insight:</strong> {activeNote.quiz.explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
