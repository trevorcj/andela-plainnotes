import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { RemoveSavedButton } from '@/components/save-button';
import { Bookmark, ArrowRight } from 'lucide-react';

export default async function Saved() {
  const { client, user } = await requireUser();
  const { data, error } = await client
    .from('saved_items')
    .select('id,courses(name,slug),universities(name,slug),careers(name,slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Your saved items could not be loaded');

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Saved Shortlist
        </h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Target courses, top Nigerian universities, and prospective career paths you have pinned.
        </p>
      </div>

      {!data?.length ? (
        <div className="panel empty-state">
          <Bookmark size={28} style={{ margin: '0 auto 12px', color: 'var(--muted-foreground)' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Your shortlist is currently empty</h2>
          <p className="muted" style={{ maxWidth: 400, margin: '6px auto 16px', fontSize: 13 }}>
            Pin courses, universities, or careers as you explore to track admission criteria and requirements.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link className="btn" href="/app/courses">
              Explore Courses
            </Link>
            <Link className="btn outline" href="/app/universities">
              Browse Universities
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}
        >
          {data.map(row => {
            type Item = { name: string; slug: string };
            const kind = row.courses
              ? 'courses'
              : row.universities
              ? 'universities'
              : row.careers
              ? 'careers'
              : null;
            const item = (row.courses || row.universities || row.careers) as unknown as Item | null;

            return (
              <article
                key={row.id}
                className="panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 18
                }}
              >
                <div>
                  <span className="tag" style={{ textTransform: 'capitalize', marginBottom: 8, display: 'inline-block' }}>
                    {kind === 'courses' ? 'Program' : kind === 'universities' ? 'Institution' : 'Career'}
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 6px' }}>
                    {item?.name || 'This option is no longer published'}
                  </h3>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  {kind && item ? (
                    <Link className="btn outline sm" href={`/app/${kind}/${item.slug}`}>
                      View details <ArrowRight size={13} />
                    </Link>
                  ) : <div />}
                  <RemoveSavedButton id={row.id} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
