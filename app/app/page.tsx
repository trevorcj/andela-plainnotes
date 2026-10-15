'use client';

import React, { useState, useEffect } from 'react';
import { ChatGptShell } from '@/components/chatgpt-shell';
import { ChatGptSimplifier } from '@/components/chatgpt-simplifier';
import { SavedNotesView } from '@/components/saved-notes-view';
import { SimplifiedNote } from '@/lib/types/plainnotes';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { CURATED_AFRICAN_NOTES } from '@/lib/curated-notes';

const SAVED_STORAGE_KEY = 'plainnotes_saved_vault_v2';
const RECENTS_STORAGE_KEY = 'plainnotes_recents_history_v2';

export default function PlainNotesWorkspace() {
  const [activeNote, setActiveNote] = useState<SimplifiedNote | null>(null);
  const [savedNotes, setSavedNotes] = useState<SimplifiedNote[]>([]);
  const [recentNotes, setRecentNotes] = useState<SimplifiedNote[]>([]);
  const [isViewingSaved, setIsViewingSaved] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const syncFromUrl = async () => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const isSavedView = urlParams.get('view') === 'saved';

      if (isSavedView) {
        const hasLocalUser = typeof window !== 'undefined' && Boolean(localStorage.getItem('plainnotes_active_user'));
        const supabase = createClient();
        let hasSession = false;
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) hasSession = true;
        }
        if (!hasLocalUser && !hasSession) {
          toast.info('Please log in or sign up to view your saved notes');
          setLoginModalOpen(true);
          return;
        }
        setIsViewingSaved(true);
        setActiveNote(null);
        return;
      }

      const noteId = urlParams.get('note');
      if (!noteId) {
        setActiveNote(null);
        setIsViewingSaved(false);
        return;
      }

      // 1. Check local recents first
      try {
        const storedRecents = localStorage.getItem(RECENTS_STORAGE_KEY);
        const recentsList = storedRecents ? JSON.parse(storedRecents) : [];
        const matchRecent = recentsList.find((n: SimplifiedNote) => n.id === noteId);
        if (matchRecent) {
          setActiveNote(matchRecent);
          setIsViewingSaved(false);
          return;
        }

        // 2. Check local saved vault
        const storedSaved = localStorage.getItem(SAVED_STORAGE_KEY);
        const savedList = storedSaved ? JSON.parse(storedSaved) : [];
        const matchSaved = savedList.find((n: SimplifiedNote) => n.id === noteId);
        if (matchSaved) {
          setActiveNote(matchSaved);
          setIsViewingSaved(false);
          return;
        }
      } catch {}

      // 3. Check curated African study notes
      const curated = CURATED_AFRICAN_NOTES.find(n => n.id === noteId);
      if (curated) {
        setActiveNote(curated);
        setIsViewingSaved(false);
        return;
      }

      // 4. Check Supabase shared notes (accessible to anyone with the link)
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('plain_notes')
          .select('*')
          .eq('id', noteId)
          .maybeSingle();

        if (data && !error) {
          const storedTurns = (data.quiz as any)?.storedTurns;
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
            userId: data.user_id,
            turns: Array.isArray(storedTurns) && storedTurns.length > 0 ? storedTurns : undefined
          };
          setActiveNote(fetchedNote);
          setIsViewingSaved(false);
          return;
        }
      }
    };

    syncFromUrl();

    const handlePopState = () => {
      syncFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  const updateUrlForNote = (noteId: string | null) => {
    if (typeof window === 'undefined') return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('view');
    if (noteId) {
      currentUrl.searchParams.set('note', noteId);
    } else {
      currentUrl.searchParams.delete('note');
    }
    window.history.pushState({ noteId }, '', currentUrl.toString());
  };

  const handleActiveNoteChange = (note: SimplifiedNote | null) => {
    setActiveNote(note);
    setIsViewingSaved(false);
    updateUrlForNote(note?.id || null);
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
    const hasLocalUser = typeof window !== 'undefined' && Boolean(localStorage.getItem('plainnotes_active_user'));
    if (!hasLocalUser) {
      toast.info('Please log in or sign up to save notes to your vault');
      setLoginModalOpen(true);
      return;
    }
    setSavedNotes(prev => {
      const isAlreadySaved = prev.some(n => n.id === note.id);
      let updated: SimplifiedNote[];
      if (isAlreadySaved) {
        updated = prev.filter(n => n.id !== note.id);
        toast.info('Removed from saved vault');
      } else {
        updated = [note, ...prev];
        toast.success('Saved to vault');
      }
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
      handleActiveNoteChange(null);
    }
  };

  return (
    <ChatGptShell
      onNewNote={() => {
        setIsViewingSaved(false);
        handleActiveNoteChange(null);
      }}
      onSelectSaved={() => {
        setIsViewingSaved(true);
        setActiveNote(null);
        if (typeof window !== 'undefined') {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('view', 'saved');
          currentUrl.searchParams.delete('note');
          window.history.pushState({ view: 'saved' }, '', currentUrl.toString());
        }
      }}
      onSelectRecentNote={(note) => {
        setIsViewingSaved(false);
        handleActiveNoteChange(note);
      }}
      savedNotes={savedNotes}
      recentNotes={recentNotes}
      isViewingSaved={isViewingSaved}
      onClearRecents={handleClearRecents}
      onDeleteRecentNote={handleDeleteRecentNote}
      forceLoginModalOpen={loginModalOpen}
    >
      {isViewingSaved ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '36px 32px 80px', maxWidth: 840, margin: '0 auto', width: '100%' }}>
          <SavedNotesView
            savedNotes={savedNotes}
            onDeleteNote={handleDeleteNote}
            onOpenNote={(note) => {
              setIsViewingSaved(false);
              handleActiveNoteChange(note);
            }}
            onGoToStudio={() => {
              setIsViewingSaved(false);
              handleActiveNoteChange(null);
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
