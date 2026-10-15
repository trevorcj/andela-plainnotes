'use client';

import React from 'react';
import {
  Sparkles,
  BookOpen,
  Share2,
  BookmarkCheck,
  Feather,
  Menu,
  X,
  ShieldCheck,
  Zap
} from 'lucide-react';

export type PlainTab = 'simplifier' | 'library' | 'whatsapp' | 'saved';

interface PlainShellProps {
  currentTab: PlainTab;
  onTabChange: (tab: PlainTab) => void;
  savedNotesCount: number;
  children: React.ReactNode;
}

export function PlainShell({
  currentTab,
  onTabChange,
  savedNotesCount,
  children
}: PlainShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      id: 'simplifier' as PlainTab,
      label: 'Simplifier Studio',
      icon: Sparkles,
      badge: 'AI'
    },
    {
      id: 'library' as PlainTab,
      label: 'Curated African Library',
      icon: BookOpen,
      badge: '8 Packs'
    },
    {
      id: 'whatsapp' as PlainTab,
      label: 'WhatsApp Study Packs',
      icon: Share2,
      badge: '2G Ready'
    },
    {
      id: 'saved' as PlainTab,
      label: 'My Saved Notes',
      icon: BookmarkCheck,
      badge: savedNotesCount > 0 ? String(savedNotesCount) : undefined
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa', color: '#09090b' }}>
      {/* Mobile Top Header */}
      <div
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: '#ffffff',
          borderBottom: '1px solid #e4e4e7',
          padding: '0 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50
        }}
        className="mobile-header-bar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: '#09090b',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <Feather size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>PlainNotes</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: '1px solid #e4e4e7',
            background: '#ffffff'
          }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Expanded Lemon Squeezy Sidebar (260px) */}
      <aside
        style={{
          width: 260,
          position: 'fixed',
          inset: '0 auto 0 0',
          padding: '24px 16px',
          background: '#ffffff',
          borderRight: '1px solid #e4e4e7',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          overflowY: 'auto'
        }}
        className={`sidebar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 24px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#09090b',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <Feather size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              PlainNotes
            </div>
            <div style={{ fontSize: 11, color: '#71717a', fontWeight: 500 }}>
              African Academic Simplifier
            </div>
          </div>
        </div>

        {/* Navigation Group */}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#a1a1aa', padding: '0 8px 8px' }}>
          Workspace
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#09090b' : '#52525b',
                  background: isActive ? '#f4f4f5' : 'transparent',
                  border: isActive ? '1px solid #e4e4e7' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: isActive ? '#09090b' : '#f4f4f5',
                      color: isActive ? '#ffffff' : '#71717a'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* African Dialect Quick Indicator */}
        <div
          style={{
            marginTop: 28,
            padding: '14px',
            borderRadius: 8,
            background: '#fafafa',
            border: '1px solid #e4e4e7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#18181b', marginBottom: 6 }}>
            <Zap size={13} />
            <span>Multilingual African Core</span>
          </div>
          <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5, margin: 0 }}>
            Pidgin, Yoruba, Hausa, Igbo, French, Swahili & Simple English.
          </p>
        </div>

        {/* Sidebar Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            borderTop: '1px solid #e4e4e7',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <div style={{ fontSize: 12, color: '#52525b' }}>
              <strong>Zero-friction Vault</strong>
              <div style={{ fontSize: 10.5, color: '#a1a1aa' }}>Private • Offline-First</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Spacious Canvas (Airbnb Breathing Space) */}
      <main
        style={{
          marginLeft: 260,
          flex: 1,
          minWidth: 0,
          padding: '36px 48px 80px'
        }}
        className="plain-main-canvas"
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-header-bar {
            display: flex !important;
          }
          .sidebar-nav {
            transform: translateX(-100%);
            transition: transform 0.2s ease-in-out;
            top: 56px;
            height: calc(100vh - 56px);
          }
          .sidebar-nav.mobile-open {
            transform: translateX(0);
          }
          .plain-main-canvas {
            margin-left: 0 !important;
            padding: 76px 16px 40px !important;
          }
        }
      `}</style>
    </div>
  );
}
