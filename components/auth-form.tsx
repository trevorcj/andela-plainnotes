'use client';
import { useState, useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { signIn, signUp, requestReset, updatePassword } from '@/app/auth/actions';
import { Brand } from './brand';
import { supabaseConfig } from '@/lib/env';

const modes = {
  signin: {
    title: 'Welcome back',
    copy: 'Sign in to access and sync your PlainNotes study vault.',
    action: signIn,
    button: 'Sign in'
  },
  signup: {
    title: 'Create an account',
    copy: 'Get started with PlainNotes to simplify academic jargon and save notes.',
    action: signUp,
    button: 'Create account'
  },
  reset: {
    title: 'Reset your password',
    copy: 'We will send a secure recovery link to your email.',
    action: requestReset,
    button: 'Send reset link'
  },
  update: {
    title: 'Choose a new password',
    copy: 'Enter a strong password you have not used before.',
    action: updatePassword,
    button: 'Update password'
  }
};

export function AuthForm({
  mode,
  configured,
  notice,
  next = '/app'
}: {
  mode: keyof typeof modes;
  configured: boolean;
  notice?: string;
  next?: string;
}) {
  const m = modes[mode];
  const [state, action, pending] = useActionState(m.action, {});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const cfg = supabaseConfig();
    if (!cfg) return;
    const client = createBrowserClient(cfg.url, cfg.key);
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsRedirecting(true);
        window.location.replace(next || '/app');
      }
    }).catch(() => {});
  }, [configured, next]);

  useEffect(() => {
    if (notice) toast.info(notice);
  }, [notice]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.message) toast.success(state.message);
  }, [state.error, state.message]);

  if (isRedirecting) {
    return (
      <main className="onboarding" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 className="animate-spin text-zinc-500" size={24} />
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Redirecting to workspace…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="onboarding">
      <Brand />
      <h1>{m.title}</h1>
      <p className="muted">{m.copy}</p>

      {!configured && (
        <div className="source-note" style={{ marginTop: 16 }}>
          Backend services are not configured. Complete environment setup first.
        </div>
      )}

      <form action={action} className="panel" style={{ marginTop: 24 }}>
        <input type="hidden" name="next" value={next} />

        {mode === 'signup' && (
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              placeholder="e.g. Amara Okafor"
            />
          </div>
        )}

        {mode !== 'update' && (
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
        )}

        {mode !== 'reset' && (
          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'signin' ? 1 : 12}
                maxLength={128}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 10,
                  padding: 4,
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode !== 'signin' && <small>Must be at least 12 characters.</small>}
          </div>
        )}

        {mode === 'update' && (
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 10,
                  padding: 4,
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        <button
          className="btn"
          style={{ width: '100%', marginTop: 16 }}
          disabled={!configured || pending}
        >
          {pending ? 'Processing…' : m.button}
        </button>
      </form>

      <div className="auth-links">
        {mode === 'signin' ? (
          <>
            <Link href="/auth/forgot-password">Forgot password?</Link>
            <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`}>
              Create an account
            </Link>
          </>
        ) : (
          <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`}>
            Back to sign in
          </Link>
        )}
      </div>
    </main>
  );
}
