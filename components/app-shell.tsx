'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  GraduationCap,
  Landmark,
  Briefcase,
  Bookmark,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Users,
  BookOpen,
  Sparkles,
  Compass,
  Bell,
  BookmarkCheck
} from 'lucide-react';
import { Brand } from './brand';
import { signOut } from '@/app/auth/actions';

const nav = [
  ['/app', 'Dashboard', Home],
  ['/app/courses', 'Explore Courses', GraduationCap],
  ['/app/universities', 'Universities', Landmark],
  ['/app/careers', 'Career Paths', Compass],
  ['/app/plan', 'My Plan', Bookmark],
  ['/app/eligibility', 'Check Eligibility', ShieldCheck],
  ['/app/counseling', 'Counseling', Users],
  ['/app/learning', 'Learning Hub', BookOpen],
  ['/app/ai', 'AI Tutor', Sparkles],
  ['/app/opportunities', 'Opportunities', Briefcase],
  ['/app/saved', 'Saved Items', BookmarkCheck],
  ['/app/notifications', 'Notifications', Bell]
] as const;

export function AppShell({
  children,
  name,
  admin
}: {
  children: React.ReactNode;
  name: string;
  admin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = nav.find(([p]) => (p === '/app' ? pathname === p : pathname.startsWith(p)));

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Brand />
        <div className="side-caption">Navigation</div>
        <nav className="nav" aria-label="Student navigation">
          {nav.map(([p, n, Icon]) => {
            const isActive = p === '/app' ? pathname === p : pathname.startsWith(p);
            return (
              <Link
                href={p}
                onClick={() => setOpen(false)}
                className={isActive ? 'active' : ''}
                key={p}
              >
                <Icon size={16} />
                {n}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <nav className="nav">
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className={pathname === '/app/settings' ? 'active' : ''}
            >
              <Settings size={16} />
              Settings
            </Link>
            <form action={signOut}>
              <button className="nav-button" type="submit">
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </aside>

      <button
        className="mobile-overlay"
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />

      <main className="main">
        <header className="topbar">
          <button
            className="btn outline sm"
            style={{ display: 'none' }}
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={16} />
          </button>
          <div className="breadcrumb">
            <span>Pathwise</span>
            <ChevronRight size={14} />
            <strong>{active?.[1] || 'Settings'}</strong>
          </div>
          <Link href="/app/settings" className="profile-button">
            <span className="letter-avatar">
              {name.slice(0, 1).toUpperCase() || 'P'}
            </span>
            <span>
              <strong>{name}</strong>
              <small>Student Account</small>
            </span>
          </Link>
        </header>

        <div className="content">
          {children}
          <footer
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--muted-foreground)'
            }}
          >
            <span>Pathwise AI — Career & Admissions Engine for Nigeria</span>
            <span>Autonomous Admissions Intelligence · 2026/2027 Session</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
