import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Action, Id, Notice, Empty, Submit } from '@/components/workflow';
import { Bell, CheckCheck, Clock } from 'lucide-react';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { client } = await requireUser();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error('Unable to load notifications');

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Notifications
        </h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Application deadlines, roadmap reminders, and mentor session status updates.
        </p>
      </div>

      <Notice params={await searchParams} />

      {!data?.length ? (
        <div className="panel empty-state">
          <Bell size={28} style={{ margin: '0 auto 12px', color: 'var(--muted-foreground)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>All caught up!</h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            You have no unread notifications or upcoming deadline alerts at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map(n => (
            <article
              key={n.id}
              className="panel"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: n.read_at ? '#ffffff' : 'var(--secondary)'
              }}
            >
              <div style={{ flex: 1, paddingRight: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>{n.title}</h3>
                  {!n.read_at && <span className="tag green">New</span>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--foreground)', marginTop: 4 }}>{n.body}</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                  <Link href={n.target_path} className="text-link" style={{ fontSize: 12 }}>
                    Open related action →
                  </Link>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    {new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!n.read_at && (
                <Action op="read">
                  <Id id={n.id} />
                  <button className="btn outline sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CheckCheck size={14} /> Mark Read
                  </button>
                </Action>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
