import { requireUser } from '@/lib/auth';
import { Action, Empty } from '@/components/workflow';
import { Calendar, ExternalLink, ShieldCheck } from 'lucide-react';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ kind?: string; q?: string }>;
}) {
  const p = await searchParams;
  const { client } = await requireUser();

  let query = client
    .from('opportunities')
    .select('*,sources(name,url,status,verified_at)')
    .eq('published', true)
    .or('deadline.is.null,deadline.gt.' + new Date().toISOString())
    .order('deadline', { nullsFirst: false });

  if (['scholarship', 'internship', 'job', 'competition'].includes(p.kind || '')) {
    query = query.eq('kind', p.kind!);
  }
  if (p.q) {
    query = query.ilike('title', '%' + p.q.replace(/[%_]/g, '').slice(0, 100) + '%');
  }

  const { data, error } = await query;
  if (error) throw new Error('Unable to load opportunities');

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Explore Opportunities
        </h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Discover verified Nigerian scholarships, student internships, hackathons, and graduate programs.
        </p>
      </div>

      <form className="filter-form" method="get" style={{ marginBottom: 24 }}>
        <input
          name="q"
          placeholder="Search opportunities by title or organization…"
          defaultValue={p.q}
          maxLength={100}
        />
        <select name="kind" defaultValue={p.kind || ''}>
          <option value="">All Opportunity Types</option>
          <option value="scholarship">Scholarship</option>
          <option value="internship">Internship</option>
          <option value="job">Entry-level Job</option>
          <option value="competition">Competition / Hackathon</option>
        </select>
        <button className="btn">Filter</button>
      </form>

      {!data?.length ? (
        <Empty>No matching opportunities currently open. Check back soon for new application rounds.</Empty>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20
          }}
        >
          {data.map(o => (
            <article
              key={o.id}
              className="panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 20
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span className="tag green" style={{ textTransform: 'capitalize' }}>
                    {o.kind}
                  </span>
                  {o.deadline && (
                    <span style={{ fontSize: 11, color: '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      Due {new Date(o.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, margin: '8px 0 4px' }}>{o.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 12 }}>
                  {o.provider}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--foreground)', marginBottom: 16 }}>
                  {o.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                    style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Provider Portal <ExternalLink size={13} />
                  </a>
                  {o.sources && (
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <ShieldCheck size={13} color="#10b981" /> Verified Source
                    </span>
                  )}
                </div>

                <Action op="task">
                  <input type="hidden" name="title" value={('Apply: ' + o.title).slice(0, 200)} />
                  <input type="hidden" name="notes" value={o.url} />
                  <input type="hidden" name="due_at" value={o.deadline?.slice(0, 10) || ''} />
                  <button className="btn outline sm" style={{ width: '100%' }}>
                    + Add to My Plan Roadmap
                  </button>
                </Action>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
