import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalogItem, savedIds, type Course, type Career, type University } from '@/lib/catalog';
import { db } from '@/lib/supabase/server';
import { PageHead } from '@/components/catalog';
import { SourcePanel } from '@/components/source-panel';
import { SaveButton } from '@/components/save-button';
import { getCourseAcademicDetails } from '@/lib/ai-course';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Building2,
  Briefcase,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Compass
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = (await catalogItem('courses', slug)) as Course | null;
  if (!c) notFound();

  const client = await db();
  const {
    data: { user }
  } = await client.auth.getUser();

  const [{ data: links }, { data: rules }, { data: profile }, saved] = await Promise.all([
    client.from('course_careers').select('careers(*)').eq('course_id', c.id),
    client
      .from('admission_rules')
      .select('*, universities(*)')
      .eq('course_id', c.id)
      .eq('published', true),
    user
      ? client.from('academic_profiles').select('utme_score, school_year').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    savedIds()
  ]);

  let careersList: Career[] = (links || [])
    .map(link => link.careers as unknown as Career)
    .filter(Boolean);

  if (careersList.length === 0) {
    const { data: fieldCareers } = await client
      .from('careers')
      .select('*')
      .eq('field', c.field)
      .limit(3);
    if (fieldCareers?.length) {
      careersList = fieldCareers as unknown as Career[];
    }
  }

  const academic = getCourseAcademicDetails(c);
  const userScore = profile?.utme_score ?? null;

  // Extract universities from admission rules
  const universitiesOffering = (rules || [])
    .map(r => {
      const u = r.universities as unknown as University;
      return u ? { ...u, min_utme: r.min_utme, required_subjects: r.required_subjects } : null;
    })
    .filter(Boolean) as (University & { min_utme: number | null; required_subjects: string[] })[];

  // Deduplicate universities
  const uniqueUniversities = Array.from(
    new Map(universitiesOffering.map(u => [u.id, u])).values()
  );

  return (
    <>
      <Link className="back-link" href="/app/courses">
        ← Back to all courses
      </Link>

      <PageHead
        title={c.name}
        copy={`${academic.degreeAwarded} · ${academic.duration}`}
      >
        <SaveButton kind="courses" id={c.id} saved={saved.has(c.id)} />
      </PageHead>

      <div className="course-detail-layout">
        {/* Main Left Column */}
        <div className="detail-main">
          {/* Hero Banner / Course Image if present */}
          {c.image_url && (
            <div
              style={{
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #e4e4e7',
                maxHeight: 280
              }}
            >
              <img
                src={c.image_url}
                alt={c.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* 1. Academic Scope & Overview */}
          <section className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Compass size={20} style={{ color: '#09090b' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Degree Overview & Scope</h2>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#27272a' }}>{c.description}</p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginTop: 22,
                padding: '16px 20px',
                borderRadius: 6,
                background: '#fafafa',
                border: '1px solid #e4e4e7'
              }}
            >
              <div>
                <small style={{ color: '#71717a', fontSize: 12, fontWeight: 500, display: 'block' }}>
                  FACULTY / COLLEGE
                </small>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#09090b', marginTop: 3, display: 'block' }}>
                  {academic.faculty}
                </span>
              </div>
              <div>
                <small style={{ color: '#71717a', fontSize: 12, fontWeight: 500, display: 'block' }}>
                  STANDARD DURATION
                </small>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#09090b', marginTop: 3, display: 'block' }}>
                  {academic.duration}
                </span>
              </div>
              <div>
                <small style={{ color: '#71717a', fontSize: 12, fontWeight: 500, display: 'block' }}>
                  DEGREE CONFERRED
                </small>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#09090b', marginTop: 3, display: 'block' }}>
                  {academic.degreeAwarded.split(' ')[0]}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#09090b' }}>
                Key Employment Industries in Nigeria & Globally:
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {academic.industries.map(ind => (
                  <span
                    key={ind}
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: '#f4f4f5',
                      color: '#18181b',
                      border: '1px solid #e4e4e7'
                    }}
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* 2. Official Admission Requirements (JAMB, WAEC & DE) */}
          <section className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Award size={20} style={{ color: '#09090b' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Official Nigerian Admission Benchmarks</h2>
            </div>
            <p style={{ fontSize: 13, color: '#52525b', marginBottom: 20 }}>
              Based on official Joint Admissions and Matriculation Board (JAMB IBASS) regulations and National Universities Commission (NUC) standards.
            </p>

            {/* JAMB UTME Subject Combination */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#09090b' }}>
                  JAMB UTME Subject Combination (4 Subjects Required):
                </h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {academic.jambSubjects.map(subj => (
                  <span
                    key={subj}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#ffffff',
                      color: '#09090b',
                      border: '1px solid #18181b'
                    }}
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>

            {/* O'Level (WAEC / NECO / NABTEB) Requirements */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#09090b' }}>
                  Minimum O'Level (WAEC / NECO / NABTEB) Criteria:
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 13, color: '#3f3f46', lineHeight: 1.8 }}>
                {academic.olevelRequirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
              <small style={{ color: '#71717a', fontSize: 12, marginTop: 4, display: 'block' }}>
                * At not more than two (2) examination sittings.
              </small>
            </div>

            {/* Direct Entry (DE) */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 6,
                background: '#fafafa',
                border: '1px solid #e4e4e7',
                marginBottom: 20
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#09090b', marginBottom: 4 }}>
                Direct Entry (200 Level) Pathways:
              </h4>
              <p style={{ fontSize: 13, color: '#3f3f46', lineHeight: 1.6 }}>
                {academic.directEntryRequirements}
              </p>
            </div>

            {/* Typical Score Cutoff Targets */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#09090b', marginBottom: 10 }}>
                Typical Competitive UTME Cut-off Marks in Nigeria:
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12
                }}
              >
                <div style={{ padding: '12px 14px', borderRadius: 6, border: '1px solid #e4e4e7', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, color: '#71717a', display: 'block' }}>Federal Universities</span>
                  <strong style={{ fontSize: 16, color: '#09090b' }}>240 – 280+</strong>
                  <span style={{ fontSize: 11, color: '#71717a', display: 'block', marginTop: 2 }}>High competition merit quota</span>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 6, border: '1px solid #e4e4e7', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, color: '#71717a', display: 'block' }}>State Universities</span>
                  <strong style={{ fontSize: 16, color: '#09090b' }}>200 – 230+</strong>
                  <span style={{ fontSize: 11, color: '#71717a', display: 'block', marginTop: 2 }}>Catchment & state benchmarks</span>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 6, border: '1px solid #e4e4e7', background: '#ffffff' }}>
                  <span style={{ fontSize: 12, color: '#71717a', display: 'block' }}>Private Universities</span>
                  <strong style={{ fontSize: 16, color: '#09090b' }}>180 – 210+</strong>
                  <span style={{ fontSize: 11, color: '#71717a', display: 'block', marginTop: 2 }}>Institutional screening criteria</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 5-Year Curriculum Roadmap */}
          <section className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Layers size={20} style={{ color: '#09090b' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Curriculum & Academic Roadmap (100L – 500L)</h2>
            </div>
            <p style={{ fontSize: 13, color: '#52525b', marginBottom: 20 }}>
              Undergraduate progression standard aligned with NUC Benchmark Minimum Academic Standards (BMAS).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {academic.curriculumRoadmap.map((year, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 6,
                    border: '1px solid #e4e4e7',
                    background: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#09090b' }}>{year.level}</h3>
                    <span style={{ fontSize: 12, color: '#71717a' }}>Year {idx + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#52525b', marginBottom: 10 }}>{year.focus}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {year.keyModules.map(mod => (
                      <span
                        key={mod}
                        style={{
                          fontSize: 12,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: '#f4f4f5',
                          color: '#27272a',
                          border: '1px solid #e4e4e7'
                        }}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Accredited Nigerian Universities Offering this Course */}
          <section className="panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={20} style={{ color: '#09090b' }} />
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Accredited Nigerian Universities</h2>
              </div>
              <Link className="text-link" href="/app/universities">
                View all universities →
              </Link>
            </div>

            {uniqueUniversities.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {uniqueUniversities.map(uni => (
                  <div
                    key={uni.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 6,
                      border: '1px solid #e4e4e7',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#09090b' }}>
                        {uni.name} ({uni.short_name})
                      </h3>
                      <p style={{ fontSize: 13, color: '#71717a', margin: '2px 0 0' }}>
                        {uni.state} State · {uni.institution_type} University
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      {uni.min_utme && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: '#f4f4f5',
                            color: '#09090b',
                            border: '1px solid #e4e4e7'
                          }}
                        >
                          Cut-off: {uni.min_utme}
                        </span>
                      )}
                      <Link
                        href={`/app/universities/${uni.slug}`}
                        className="btn outline sm"
                        style={{ textDecoration: 'none' }}
                      >
                        Profile <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#71717a' }}>
                Universities with active admission rules are being verified for this cycle. Check general university directory.
              </p>
            )}
          </section>

          {/* 5. Related Career Paths & Salary Outlook */}
          <section className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Briefcase size={20} style={{ color: '#09090b' }} />
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>High-Demand Career Pathways</h2>
            </div>

            {/* Salary Projections Callout */}
            <div
              style={{
                marginBottom: 20,
                padding: '14px 16px',
                borderRadius: 6,
                border: '1px solid #e4e4e7',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <TrendingUp size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 12, color: '#71717a', display: 'block' }}>
                  ESTIMATED NIGERIAN SALARY PROJECTION
                </span>
                <strong style={{ fontSize: 14, color: '#09090b' }}>
                  {academic.salaryRangeNigeria}
                </strong>
              </div>
            </div>

            {careersList.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {careersList.map(career => {
                  return (
                    <article
                      key={career.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 6,
                        border: '1px solid #e4e4e7',
                        background: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#09090b', margin: 0 }}>
                          {career.name}
                        </h3>
                        <Link
                          href={`/app/careers/${career.slug}`}
                          className="text-link"
                          style={{ fontSize: 13 }}
                        >
                          Explore pathway →
                        </Link>
                      </div>
                      <p style={{ fontSize: 13, color: '#52525b', lineHeight: 1.6, marginBottom: 12 }}>
                        {career.description}
                      </p>
                      {career.skills?.length ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {career.skills.map(s => (
                            <span
                              key={s}
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: '#f4f4f5',
                                color: '#3f3f46',
                                border: '1px solid #e4e4e7'
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#71717a' }}>
                Pathwise AI is analyzing market demand and direct employment sectors for {c.name} graduates in Nigeria.
              </p>
            )}
          </section>
        </div>

        {/* Right Sticky Sidebar */}
        <div className="detail-aside">
          {/* AI Match & Score Readiness Card */}
          <section className="panel" style={{ border: '1px solid #18181b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={18} style={{ color: '#09090b' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Your Academic Match</h3>
            </div>

            {userScore !== null ? (
              <div>
                <p style={{ fontSize: 13, color: '#52525b', marginBottom: 14 }}>
                  Your recorded UTME score is <strong style={{ color: '#09090b' }}>{userScore} / 400</strong>.
                </p>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: userScore >= 240 ? '#f0fdf4' : userScore >= 200 ? '#fefce8' : '#fafafa',
                    border: `1px solid ${userScore >= 240 ? '#bbf7d0' : userScore >= 200 ? '#fef08a' : '#e4e4e7'}`,
                    marginBottom: 16
                  }}
                >
                  <p style={{ fontSize: 12, color: '#18181b', margin: 0 }}>
                    {userScore >= 240
                      ? '✓ Strong competitive standing for top Federal & State universities offering this course.'
                      : userScore >= 200
                      ? '⚡ Viable for several State & accredited Private universities. Check specific cut-offs.'
                      : 'ℹ Consider targeting private universities or exploring foundation / direct entry options.'}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#52525b', marginBottom: 16 }}>
                Record your JAMB UTME score to see your competitive standing and matched universities.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                href="/app/eligibility"
                className="btn primary sm"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                Check Admission Eligibility
              </Link>
              <Link
                href={`/app/ai`}
                className="btn outline sm"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                Ask Pathwise AI about {c.name}
              </Link>
            </div>
          </section>

          {/* Next Steps / Plan Roadmap */}
          <section className="panel">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Next Steps</h3>
            <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, marginBottom: 16 }}>
              Add this course to your study plan roadmap or compare accredited universities side by side.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                href={`/app/universities/compare`}
                className="btn outline sm"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                Compare Universities
              </Link>
              <Link
                href="/app/plan"
                className="btn light sm"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                Go to My Study Plan
              </Link>
            </div>
          </section>

          {/* Official Source Review */}
          <SourcePanel source={c.sources} />
        </div>
      </div>
    </>
  );
}
