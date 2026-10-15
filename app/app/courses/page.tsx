export const dynamic = 'force-dynamic';

import { catalogList, savedIds, type SearchParams, type Course } from '@/lib/catalog';
import { PageHead, Filters, CourseCard, Pagination, EmptyResults } from '@/components/catalog';
import { discoverCourseWithAI } from '@/lib/ai-course';
import { Sparkles } from 'lucide-react';

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  let [{ items, count, page }, saved] = await Promise.all([
    catalogList('courses', params),
    savedIds()
  ]);

  let aiDiscovered = false;
  // If user searched for any course and got 0 results, dynamically synthesize/discover via AI!
  if (items.length === 0 && params.q && typeof params.q === 'string' && params.q.trim().length >= 2) {
    const discovered = await discoverCourseWithAI(params.q.trim());
    if (discovered) {
      aiDiscovered = true;
      const refreshed = await catalogList('courses', params);
      items = refreshed.items;
      count = refreshed.count;
    }
  }

  return (
    <>
      <PageHead
        title="Explore Courses"
        copy="Discover accredited Nigerian university programs, JAMB UTME subject combinations, and high-demand career pathways."
      />
      <Filters kind="courses" params={params} />

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
            <strong style={{ color: '#09090b' }}>AI Course Discovery:</strong> Pathwise AI analyzed official Nigerian NUC/JAMB accreditation standards to match your query{' '}
            <em>"{typeof params.q === 'string' ? params.q : ''}"</em>.
          </p>
        </div>
      )}

      {!items.length ? (
        <EmptyResults />
      ) : (
        <div className="course-grid">
          {(items as Course[]).map(c => (
            <CourseCard course={c} saved={saved.has(c.id)} key={c.id} />
          ))}
        </div>
      )}
      <Pagination kind="courses" params={params} count={count} page={page} />
    </>
  );
}
