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
          shouldCreateUser: true,
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
                  Sign up to save notes
                </div>
                <div style={{ fontSize: 12.5, color: '#71717a', lineHeight: 1.5, marginBottom: 14 }}>
                  Sign up to save your simplified notes, access your study history across devices, and share notes.
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
                  Sign up
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
                  We sent a sign-up link to <strong>{authEmail}</strong>. Click the link in your email to activate your PlainNotes account.
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
                  <div>Click the link in your email to complete sign up</div>
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
                    Sign up for PlainNotes
                  </h2>
                  <p style={{ fontSize: 13.5, color: '#52525b', margin: 0, lineHeight: 1.45, padding: '0 10px' }}>
                    Enter your email address. We will send you a sign-up link.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
