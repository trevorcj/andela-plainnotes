export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { catalogList, savedIds, type SearchParams, type Career } from '@/lib/catalog';
import { PageHead, Filters, CareerCard, Pagination, EmptyResults } from '@/components/catalog';
import { db } from '@/lib/supabase/server';
import { Sparkles, ArrowRight, Briefcase } from 'lucide-react';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const client = await db();

  const {
    data: { user }
  } = await client.auth.getUser();

  // Load general catalog items, saved IDs, and student profile simultaneously
  const [[{ items, count, page }, saved], profileRes] = await Promise.all([
    Promise.all([catalogList('careers', params), savedIds()]),
    user
      ? client
          .from('academic_profiles')
          .select('target_course_id, interests, courses(id, name, field)')
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  // If student has a target course, load directly tailored career pathways
  let tailoredCareers: Career[] = [];
  const targetCourse = profileRes.data?.courses as unknown as { id: string; name: string; field: string } | null;

  if (targetCourse?.id) {
    const { data: linked } = await client
      .from('course_careers')
      .select('careers(*)')
      .eq('course_id', targetCourse.id);

    if (linked?.length) {
      tailoredCareers = linked
        .map(l => l.careers as unknown as Career)
        .filter(Boolean);
    }
  }

  return (
    <>
      <PageHead
        title="Explore Career Paths"
        copy="Discover high-growth career trajectories, required technical competencies, and Nigerian industry demand."
      />

      {/* AI Tailored Careers Section (If student has a target course and no query filter) */}
      {!params.q && targetCourse && tailoredCareers.length > 0 && (
        <section
          style={{
            marginBottom: 36,
            padding: '24px 28px',
            borderRadius: 8,
            border: '1px solid #18181b',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} style={{ color: '#09090b' }} />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                  AI Tailored Pathways for Your {targetCourse.name} Degree
                </h2>
                <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  Selected based on your chosen course in {targetCourse.field} and career interests.
                </p>
              </div>
            </div>
            <Link
              href={`/app/courses/${targetCourse.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="text-link"
              style={{ fontSize: 13 }}
            >
              View Course Details →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              marginTop: 18
            }}
          >
            {tailoredCareers.map(car => (
              <article
                key={car.id}
                style={{
                  padding: '18px 20px',
                  borderRadius: 6,
                  border: '1px solid #e4e4e7',
                  background: '#fafafa',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: '#18181b',
                        color: '#ffffff',
                        textTransform: 'uppercase'
                      }}
                    >
                      Top Match
                    </span>
                    <span style={{ fontSize: 12, color: '#71717a' }}>{car.field}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#09090b', margin: '6px 0' }}>
                    {car.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#52525b', lineHeight: 1.6, marginBottom: 14 }}>
                    {car.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #e4e4e7' }}>
                  <Link
                    href={`/app/careers/${car.slug}`}
                    className="btn outline sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Explore Role <ArrowRight size={14} />
                  </Link>
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                    High Demand in NG
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>
          {targetCourse && !params.q ? 'All Professional Career Fields' : 'Search & Filter Careers'}
        </h2>
        <Filters kind="careers" params={params} />
      </div>

      {!items.length ? (
        <EmptyResults />
      ) : (
        <div className="course-grid">
          {(items as Career[]).map(c => (
            <CareerCard career={c} saved={saved.has(c.id)} key={c.id} />
          ))}
        </div>
      )}

      <Pagination kind="careers" params={params} count={count} page={page} />
    </>
  );
}
