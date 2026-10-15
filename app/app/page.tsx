'use client';

import React, { useState, useEffect } from 'react';
import { ChatGptShell } from '@/components/chatgpt-shell';
import { ChatGptSimplifier } from '@/components/chatgpt-simplifier';
import { SavedNotesView } from '@/components/saved-notes-view';
import { SimplifiedNote } from '@/lib/types/plainnotes';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const SAVED_STORAGE_KEY = 'plainnotes_saved_vault_v2';
const RECENTS_STORAGE_KEY = 'plainnotes_recents_history_v2';

export default function PlainNotesWorkspace() {
  const [activeNote, setActiveNote] = useState<SimplifiedNote | null>(null);
  const [savedNotes, setSavedNotes] = useState<SimplifiedNote[]>([]);
  const [recentNotes, setRecentNotes] = useState<SimplifiedNote[]>([]);
  const [isViewingSaved, setIsViewingSaved] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('note');
    if (!noteId) return;

    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        toast.info('Please log in or sign up to view this shared note');
        setLoginModalOpen(true);
        return;
      }

      const storedSaved = localStorage.getItem(SAVED_STORAGE_KEY);
      const localList = storedSaved ? JSON.parse(storedSaved) : [];
      const match = localList.find((n: SimplifiedNote) => n.id === noteId);

      if (match) {
        setActiveNote(match);
        setIsViewingSaved(false);
        return;
      }

      const { data, error } = await supabase
        .from('plain_notes')
        .select('*')
        .eq('id', noteId)
        .maybeSingle();

      if (data && !error) {
        const fetchedNote: SimplifiedNote = {
          id: data.id,
          title: data.title,
          subject: data.subject,
          language: data.language,
          level: data.level || 'secondary',
          originalText: data.original_text,
          simplifiedText: data.simplified_text,
          localAnalogy: data.local_analogy,
          examEssentials: data.exam_essentials || [],
          quiz: data.quiz || { question: '', options: [], answerIndex: 0, explanation: '' },
          whatsappText: data.whatsapp_text || '',
          isCurated: data.is_curated,
          createdAt: data.created_at,
          userId: data.user_id
        };
        setActiveNote(fetchedNote);
        setIsViewingSaved(false);
      }
    });
  }, []);

  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem(SAVED_STORAGE_KEY);
      if (storedSaved) {
        const parsed = JSON.parse(storedSaved);
        if (Array.isArray(parsed)) setSavedNotes(parsed);
      }

      const storedRecents = localStorage.getItem(RECENTS_STORAGE_KEY);
      if (storedRecents) {
        const parsed = JSON.parse(storedRecents);
        if (Array.isArray(parsed)) {
          setRecentNotes(parsed);
        }
      }
    } catch (e) {
      console.warn('Local vault read error:', e);
    }
  }, []);

  const handleActiveNoteChange = (note: SimplifiedNote | null) => {
    setActiveNote(note);
    setIsViewingSaved(false);
    if (note) {
      setRecentNotes(prev => {
        const filtered = prev.filter(n => n.id !== note.id && n.title !== note.title);
        const updated = [note, ...filtered].slice(0, 30);
        try {
          localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.warn('Could not store recents:', err);
        }
        return updated;
      });
    }
  };

  const handleSaveNote = (note: SimplifiedNote) => {
    setSavedNotes(prev => {
      if (prev.some(n => n.id === note.id)) return prev;
      const updated = [note, ...prev];
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not write to local vault:', err);
      }
      return updated;
    });
  };

  const handleDeleteNote = (id: string) => {
    setSavedNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not update local vault:', err);
      }
      return updated;
    });
  };

  const handleClearRecents = () => {
    setRecentNotes([]);
    try {
      localStorage.removeItem(RECENTS_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear recents:', err);
    }
  };

  const handleDeleteRecentNote = (id: string) => {
    setRecentNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not update recents:', err);
      }
      return updated;
    });
    if (activeNote?.id === id) {
      setActiveNote(null);
    }
  };

  return (
    <ChatGptShell
      onNewNote={() => {
        setActiveNote(null);
        setIsViewingSaved(false);
      }}
      onSelectSaved={() => {
        setIsViewingSaved(true);
        setActiveNote(null);
      }}
      onSelectRecentNote={(note) => {
        setActiveNote(note);
        setIsViewingSaved(false);
      }}
      savedNotes={savedNotes}
      recentNotes={recentNotes}
      isViewingSaved={isViewingSaved}
      onClearRecents={handleClearRecents}
      onDeleteRecentNote={handleDeleteRecentNote}
      forceLoginModalOpen={loginModalOpen}
      onCloseLoginModal={() => setLoginModalOpen(false)}
    >
      {isViewingSaved ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '36px 32px 80px', maxWidth: 840, margin: '0 auto', width: '100%' }}>
          <SavedNotesView
            savedNotes={savedNotes}
            onDeleteNote={handleDeleteNote}
            onGoToStudio={() => {
              setIsViewingSaved(false);
              setActiveNote(null);
            }}
          />
        </div>
      ) : (
        <ChatGptSimplifier
          onSaveNote={handleSaveNote}
          savedNotes={savedNotes}
          activeNote={activeNote}
          onActiveNoteChange={handleActiveNoteChange}
          recentNotes={recentNotes}
          onRequestLoginModal={() => setLoginModalOpen(true)}
        />
      )}
    </ChatGptShell>
  );
}
