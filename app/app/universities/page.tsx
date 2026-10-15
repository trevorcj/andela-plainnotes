export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { catalogList, savedIds, type SearchParams, type University } from '@/lib/catalog';
import { PageHead, Filters, UniversityCard, Pagination, EmptyResults } from '@/components/catalog';
import { discoverUniversityWithAI } from '@/lib/ai-course';
import { Sparkles } from 'lucide-react';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  let [{ items, count, page }, saved] = await Promise.all([
    catalogList('universities', params),
    savedIds()
  ]);

  let aiDiscovered = false;
  // If user searched for any university and got 0 results, dynamically discover via AI!
  if (items.length === 0 && params.q && typeof params.q === 'string' && params.q.trim().length >= 2) {
    const discovered = await discoverUniversityWithAI(params.q.trim());
    if (discovered) {
      aiDiscovered = true;
      const refreshed = await catalogList('universities', params);
      items = refreshed.items;
      count = refreshed.count;
    }
  }

  return (
    <>
      <PageHead
        title="Explore Universities"
        copy="Discover accredited Federal, State, and Private universities across all geopolitical zones in Nigeria."
      >
        <Link className="btn outline" href="/app/universities/compare">
          Compare universities
        </Link>
      </PageHead>

      <Filters kind="universities" params={params} />

      {aiDiscovered && (
        <div
          style={{
            marginBottom: 24,
            padding: '14px 18px',
            borderRadius: 8,
            border: '1px solid #e4e4e7',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Sparkles size={18} style={{ color: '#09090b', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#3f3f46', margin: 0 }}>
            <strong style={{ color: '#09090b' }}>AI University Discovery:</strong> Pathwise AI identified official NUC accreditation records matching your search{' '}
            <em>"{typeof params.q === 'string' ? params.q : ''}"</em>.
          </p>
        </div>
      )}

      {!items.length ? (
        <EmptyResults />
      ) : (
        <div className="university-grid">
          {(items as University[]).map(u => (
            <UniversityCard university={u} saved={saved.has(u.id)} key={u.id} />
          ))}
        </div>
      )}

      <Pagination kind="universities" params={params} count={count} page={page} />
    </>
  );
}
