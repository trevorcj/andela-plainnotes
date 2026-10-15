'use client';

import React, { useState, useEffect } from 'react';
import {
  PenSquare,
  BookmarkCheck,
  Search,
  PanelLeftClose,
  PanelLeft,
  X,
  LogOut,
  Trash2,
  Share2,
  Mail,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { SimplifiedNote } from '@/lib/types/plainnotes';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface ChatGptShellProps {
  onNewNote: () => void;
  onSelectSaved: () => void;
  onSelectRecentNote: (note: SimplifiedNote) => void;
  savedNotes: SimplifiedNote[];
  recentNotes: SimplifiedNote[];
  isViewingSaved: boolean;
  onClearRecents?: () => void;
  onDeleteRecentNote?: (id: string) => void;
  forceLoginModalOpen?: boolean;
  onCloseLoginModal?: () => void;
  children: React.ReactNode;
}

interface UserProfile {
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export function ChatGptShell({
  onNewNote,
  onSelectSaved,
  onSelectRecentNote,
  savedNotes,
  recentNotes,
  isViewingSaved,
  onClearRecents,
  onDeleteRecentNote,
  forceLoginModalOpen = false,
  onCloseLoginModal,
  children
}: ChatGptShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<SimplifiedNote | null>(null);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    isLoggedIn: false
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (forceLoginModalOpen) {
      setShowLoginModal(true);
    }
  }, [forceLoginModalOpen]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Learner';
        setUserProfile({
          name: fullName,
          email: user.email || user.phone || '',
          isLoggedIn: true
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split('@')[0] ||
          'Learner';
        setUserProfile({
          name: fullName,
          email: session.user.email || session.user.phone || '',
          isLoggedIn: true
        });
      } else {
        setUserProfile({
          name: '',
          email: '',
          isLoggedIn: false
        });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'US').toUpperCase();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      toast.success('Signed out');
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Account deleted successfully');
        window.location.reload();
      } else {
        toast.error(data.error || 'Could not delete account');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast.error('Authentication service not configured');
      return;
    }

    const canonicalEmail = authEmail.trim().toLowerCase();
    if (!canonicalEmail || !canonicalEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: canonicalEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined
        }
      });
      if (error) {
        if (error.message.toLowerCase().includes('database error')) {
          toast.error('Database trigger error in Supabase. Run the SQL cleanup script to remove old user triggers.');
        } else {
          toast.error(error.message);
        }
      } else {
        setEmailSent(true);
      }
    } catch {
      toast.error('Sign in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const displayedRecents = searchQuery.trim()
    ? recentNotes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.simplifiedText.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentNotes;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#ffffff', color: '#09090b', position: 'relative' }}>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 55
          }}
        />
      )}

      <aside
        style={{
          width: 260,
          minWidth: 260,
          height: '100%',
          background: '#f9f9f9',
          borderRight: '1px solid #e4e4e7',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 60,
          transform: sidebarOpen ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(0)',
          marginLeft: !isMobile && !sidebarOpen ? -260 : 0,
          transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), margin-left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 14px' }}>
            <Link
              href="/app"
              onClick={() => {
                if (isMobile) setSidebarOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                color: '#09090b',
                background: 'transparent',
                border: 'none',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span>PlainNotes</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                onClick={() => setIsSearching(!isSearching)}
                style={{
                  padding: 7,
                  borderRadius: 6,
                  color: isSearching ? '#09090b' : '#71717a',
                  background: isSearching ? '#e4e4e7' : 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Search notes"
              >
                <Search size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: 7,
                  borderRadius: 6,
                  color: '#71717a',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                title="Close sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          </div>

          {isSearching && (
            <div style={{ padding: '0 4px 10px' }}>
              <input
                type="text"
                placeholder="Search your notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #e4e4e7',
                  background: '#ffffff',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onNewNote();
              if (isMobile) setSidebarOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              background: !isViewingSaved ? '#ebebeb' : 'transparent',
              color: '#09090b',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              marginBottom: 6,
              transition: 'background 0.15s ease'
            }}
          >
            <PenSquare size={16} />
            <span>New note</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectSaved();
              if (isMobile) setSidebarOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              background: isViewingSaved ? '#ebebeb' : 'transparent',
              color: '#09090b',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              marginBottom: 16,
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookmarkCheck size={16} />
              <span>My Saved Notes</span>
            </div>
            {savedNotes.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 9999,
                  background: '#e4e4e7',
                  color: '#18181b'
                }}
              >
                {savedNotes.length}
              </span>
            )}
          </button>

          {userProfile.isLoggedIn ? (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px 6px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#71717a'
                }}
              >
                <span>Recents</span>
                {displayedRecents.length > 0 && onClearRecents && (
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    style={{ fontSize: 10.5, color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer' }}
                    title="Clear recent history"
                  >
                    Clear
                  </button>
                )}
              </div>

              {displayedRecents.length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 13, color: '#a1a1aa' }}>
                  No recent notes yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {displayedRecents.map(note => (
                    <div
                      key={note.id}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 6,
                        background: hoveredNoteId === note.id ? '#ebebeb' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={() => setHoveredNoteId(note.id)}
                      onMouseLeave={() => setHoveredNoteId(null)}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRecentNote(note);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          fontSize: 13.5,
                          color: '#27272a',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          borderRadius: 6,
                          paddingRight: hoveredNoteId === note.id ? 58 : 12
                        }}
                        title={note.title}
                      >
                        {note.title}
                      </button>

                      {hoveredNoteId === note.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          {userProfile.isLoggedIn && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const shareUrl = `${window.location.origin}/app?note=${note.id}`;
                                navigator.clipboard.writeText(shareUrl);
                                toast.success('Shareable link copied to clipboard!');
                              }}
                              style={{
                                padding: 4,
                                border: 'none',
                                background: 'transparent',
                                color: '#71717a',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: 4
                              }}
                              title="Share note link"
                            >
                              <Share2 size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteToDelete(note);
                            }}
                            style={{
                              padding: 4,
                              border: 'none',
                              background: 'transparent',
                              color: '#71717a',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: 4
                            }}
                            title="Delete conversation"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            {userProfile.isLoggedIn ? (
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 8px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#ebebeb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#09090b',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {getInitials(userProfile.name)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#09090b',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {userProfile.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#71717a',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {userProfile.email}
                  </span>
                </div>
              </button>
            ) : (
              <div style={{ padding: '16px 8px 8px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#09090b', marginBottom: 4 }}>
                  Log in to save notes
                </div>
                <div style={{ fontSize: 12.5, color: '#71717a', lineHeight: 1.5, marginBottom: 14 }}>
                  Log in to save your simplified notes, access your study history across devices, and share notes.
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  style={{
                    width: '100%',
                    padding: '9px 16px',
                    borderRadius: 9999,
                    border: '1px solid #e4e4e7',
                    background: '#ffffff',
                    color: '#09090b',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f4f4f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                >
                  Log in
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {(!sidebarOpen || isMobile) && (
          <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 40 }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              style={{
                padding: '8px',
                borderRadius: 8,
                border: '1px solid #e4e4e7',
                background: '#ffffff',
                color: '#09090b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              title="Open sidebar"
            >
              <PanelLeft size={17} />
            </button>
          </div>
        )}

        {children}
      </div>

      {showClearModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 110,
            padding: 16
          }}
          onClick={() => setShowClearModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 600, color: '#09090b', marginBottom: 8 }}>
              Clear all conversations?
            </div>
            <div style={{ fontSize: 13.5, color: '#71717a', lineHeight: 1.5, marginBottom: 20 }}>
              This will delete all recent conversations and plain notes from this device. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e4e4e7',
                  background: '#ffffff',
                  color: '#09090b',
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearRecents?.();
                  setShowClearModal(false);
                  toast.success('All conversations cleared');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {noteToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 110,
            padding: 16
          }}
          onClick={() => setNoteToDelete(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 600, color: '#09090b', marginBottom: 8 }}>
              Delete conversation?
            </div>
            <div style={{ fontSize: 13.5, color: '#71717a', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to delete &ldquo;{noteToDelete.title}&rdquo;?
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e4e4e7',
                  background: '#ffffff',
                  color: '#09090b',
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRecentNote?.(noteToDelete.id);
                  setNoteToDelete(null);
                  toast.success('Conversation deleted');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: 16
          }}
          onClick={() => {
            setShowLoginModal(false);
            onCloseLoginModal?.();
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 390,
              background: '#ffffff',
              borderRadius: 24,
              padding: '36px 28px 30px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowLoginModal(false);
                onCloseLoginModal?.();
              }}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={18} />
            </button>

            {emailSent ? (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em', margin: 0, marginBottom: 8 }}>
                  Check your inbox
                </h2>
                <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 20px', lineHeight: 1.5 }}>
                  We sent a sign-in link to <strong>{authEmail}</strong>. Click the link in your email to sign in to PlainNotes.
                </p>

                <div
                  style={{
                    padding: 16,
                    background: '#f4f4f5',
                    borderRadius: 16,
                    fontSize: 13.5,
                    color: '#3f3f46',
                    marginBottom: 16
                  }}
                >
                  <Mail size={24} style={{ margin: '0 auto 8px', color: '#09090b' }} />
                  <div>Click the link in your email to sign in</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false);
                    setAuthEmail('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#09090b',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#09090b', letterSpacing: '-0.02em', margin: 0, marginBottom: 8 }}>
                    Log in or sign up
                  </h2>
                  <p style={{ fontSize: 13.5, color: '#52525b', margin: 0, lineHeight: 1.45, padding: '0 10px' }}>
                    You&apos;ll get smarter responses and can upload files, images, and more.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const supabase = createClient();
                      if (supabase) {
                        supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined }
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 9999,
                      border: '1px solid #e4e4e7',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#09090b',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const supabase = createClient();
                      if (supabase) {
                        supabase.auth.signInWithOAuth({
                          provider: 'apple',
                          options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined }
                        });
                      }
                    }}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 9999,
                      border: '1px solid #e4e4e7',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#09090b',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 170 170" fill="#000000">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.03-7.61-7.74-11.73-14.14-5.39-8.33-9.68-17.72-12.87-28.18-3.19-10.45-4.79-20.73-4.79-29.83 0-13.32 3.3-24.6 9.9-33.84 6.6-9.24 14.99-13.97 25.17-14.19 4.35 0 9.29 1.13 14.81 3.39 5.53 2.26 9.4 3.44 11.62 3.55 2.01 0 5.99-1.24 11.94-3.72 5.95-2.48 10.83-3.61 14.65-3.39 12.87.65 22.86 5.48 29.96 14.51-11.35 6.85-16.92 16.32-16.71 28.4.22 9.57 3.86 17.51 10.92 23.82 7.07 6.31 15.22 9.89 24.47 10.74-2.18 6.53-4.89 13.1-8.13 19.7zm-29.35-104.28c0-7.39 2.66-14.35 7.99-20.87 5.33-6.53 11.85-10.65 19.57-12.38.33 1.2.49 2.28.49 3.26 0 7.39-2.77 14.57-8.32 21.53-5.55 6.96-12.18 10.87-19.89 11.74-.11-1.09-.16-2.18-.16-3.28z"/>
                    </svg>
                    <span>Continue with Apple</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 16px' }}>
                  <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#71717a', letterSpacing: '0.04em' }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: '#e4e4e7' }} />
                </div>

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 9999,
                      border: '1px solid #e4e4e7',
                      padding: '0 20px',
                      fontSize: 14.5,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 9999,
                      background: '#09090b',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 14.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: authLoading ? 0.7 : 1,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {authLoading && <Loader2 size={16} className="animate-spin" />}
                    <span>Continue</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {showAccountModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: 16
          }}
          onClick={() => setShowAccountModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              background: '#ffffff',
              borderRadius: 20,
              padding: 24,
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAccountModal(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#09090b',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 16,
                  fontWeight: 700
                }}
              >
                {getInitials(userProfile.name)}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#09090b' }}>
                  {userProfile.name}
                </div>
                <div style={{ fontSize: 13, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userProfile.email}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: '#09090b',
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f4f4f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  opacity: isDeleting ? 0.5 : 1
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Deleting account...' : 'Delete account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
