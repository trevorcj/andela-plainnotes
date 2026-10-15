export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Action, Notice, Submit } from '@/components/workflow';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Landmark,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { client, user } = await requireUser();

  const [rulesRes, checksRes, academicRes, profileRes] = await Promise.all([
    client
      .from('admission_rules')
      .select(
        '*,courses(id,name,slug,field),universities(id,name,short_name,state,institution_type),sources(name,url,status,verified_at)'
      )
      .eq('published', true)
      .order('min_utme', { ascending: false }),
    client
      .from('eligibility_checks')
      .select('*,admission_rules(*,courses(name,slug),universities(name,short_name,state))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    client
      .from('academic_profiles')
      .select('utme_score,utme_subjects,course_id,courses(name,slug,field)')
      .eq('user_id', user.id)
      .maybeSingle(),
    client.from('profiles').select('full_name,location').eq('user_id', user.id).single()
  ]);

  if (rulesRes.error || checksRes.error) {
    throw new Error('Unable to load eligibility records');
  }

  const rules = rulesRes.data || [];
  const checks = checksRes.data || [];
  const academic = academicRes.data;
  const utmeScore = academic?.utme_score ?? null;
  const utmeSubjects = academic?.utme_subjects || [];
  const targetCourse = academic?.courses as unknown as { name: string; slug: string; field: string } | null;

  // Filter rules matching score or within 20 points
  const meritedRules = utmeScore
    ? rules.filter(r => r.min_utme && r.min_utme <= utmeScore)
    : [];

  const competitiveRules = utmeScore
    ? rules.filter(r => r.min_utme && r.min_utme > utmeScore && r.min_utme <= utmeScore + 25)
    : [];

  // Group alternative courses with the student's score
  const alternativeCoursesMap = new Map<string, { courseName: string; universities: string[]; minCutoff: number }>();
  if (utmeScore) {
    for (const r of meritedRules) {
      const cName = r.courses?.name;
      if (cName && cName !== targetCourse?.name) {
        if (!alternativeCoursesMap.has(cName)) {
          alternativeCoursesMap.set(cName, {
            courseName: cName,
            universities: [r.universities?.short_name || r.universities?.name || ''],
            minCutoff: r.min_utme || 200
          });
        } else {
          const entry = alternativeCoursesMap.get(cName)!;
          const uName = r.universities?.short_name || r.universities?.name || '';
          if (!entry.universities.includes(uName)) entry.universities.push(uName);
        }
      }
    }
  }

  const alternativeCourses = Array.from(alternativeCoursesMap.values()).slice(0, 4);
  const latestCheck = checks[0];

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Evaluate Admission Eligibility
        </h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Deterministic checks comparing your WAEC/NECO credits and UTME combinations against published institution benchmarks.
        </p>
      </div>

      <Notice params={await searchParams} />

      {/* UTME Status Panel */}
      <div className="panel" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Your UTME Baseline</h2>
            {utmeScore ? (
              <span className="tag green">
                Score: {utmeScore}/400 Active
              </span>
            ) : (
              <span className="tag">Pending UTME Score</span>
            )}
          </div>
          <Link href="/onboarding" className="text-link" style={{ fontSize: 13 }}>
            Edit O-Level Results →
          </Link>
        </div>

        <Action op="utme">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr auto',
              gap: 12,
              alignItems: 'flex-end'
            }}
          >
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="score" style={{ fontSize: 12, fontWeight: 500 }}>
                UTME Score
              </label>
              <input
                id="score"
                type="number"
                min="0"
                max="400"
                name="score"
                defaultValue={utmeScore ?? ''}
                placeholder="e.g. 275"
                required
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="subjects" style={{ fontSize: 12, fontWeight: 500 }}>
                4-Subject Combination (comma-separated)
              </label>
              <input
                id="subjects"
                name="subjects"
                defaultValue={utmeSubjects.join(', ')}
                placeholder="e.g. English, Biology, Chemistry, Physics"
              />
            </div>
            <Submit>Save UTME</Submit>
          </div>
        </Action>
      </div>

      {/* 2-Column Responsive Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 24,
          alignItems: 'start'
        }}
      >
        {/* LEFT COLUMN: Universities You Match & Merit */}
        <div>
          {utmeScore ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Landmark size={18} /> Universities You Match & Merit
                </h2>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Universities offering verified admission criteria where your UTME score ({utmeScore}) satisfies published cut-offs.
                </p>
              </div>

              {meritedRules.length === 0 ? (
                <div className="panel empty-state" style={{ padding: 24, marginBottom: 20 }}>
                  <p className="muted" style={{ fontSize: 13 }}>
                    No universities found with cutoff ≤ {utmeScore}. Explore close matches below or consult Pathwise AI for alternative pathways.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {meritedRules.map(r => (
                    <article
                      key={r.id}
                      className="panel"
                      style={{
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>{r.courses?.name}</h3>
                            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 2 }}>
                              {r.universities?.name} ({r.universities?.short_name}) · {r.universities?.state} State
                            </p>
                          </div>
                          <span className="tag green" style={{ whiteSpace: 'nowrap' }}>
                            Merited (Cutoff: {r.min_utme})
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: '#52525b', marginTop: 10, lineHeight: 1.5 }}>
                          <div>
                            <strong>O-Level:</strong> {r.required_subjects.join(', ')} ({r.minimum_credit_grade})
                          </div>
                          {r.utme_subjects?.length > 0 && (
                            <div>
                              <strong>UTME Subjects:</strong> {r.utme_subjects.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid var(--border)',
                          paddingTop: 10
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                          {r.universities?.institution_type} University · Max {r.max_sittings} sitting{r.max_sittings > 1 ? 's' : ''}
                        </span>
                        <Action op="eligibility">
                          <input type="hidden" name="rule" value={r.id} />
                          <button className="btn sm">
                            Evaluate Eligibility <ArrowRight size={13} />
                          </button>
                        </Action>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Competitive Options */}
              {competitiveRules.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 12 }}>
                    Competitive Options Within Reach
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {competitiveRules.map(r => (
                      <article
                        key={r.id}
                        className="panel"
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: 14, fontWeight: 600 }}>{r.courses?.name}</h4>
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                            {r.universities?.name} · Cutoff {r.min_utme} ({r.min_utme - utmeScore} pts gap)
                          </span>
                        </div>
                        <Action op="eligibility">
                          <input type="hidden" name="rule" value={r.id} />
                          <button className="btn outline sm">Evaluate</button>
                        </Action>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommended Alternatives */}
              {alternativeCourses.length > 0 && (
                <div
                  className="panel"
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 20
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Sparkles size={16} color="#10b981" />
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                      AI Recommended Alternatives for Your {utmeScore} Score
                    </h3>
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
                    Based on your score and academic profile, Pathwise AI identifies these high-prospect degree programs where you comfortably satisfy admission cut-offs:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alternativeCourses.map((alt, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 6,
                          background: 'var(--secondary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 13 }}>{alt.courseName}</strong>
                          <p className="muted" style={{ fontSize: 11, margin: '2px 0 0' }}>
                            Offered at: {alt.universities.slice(0, 3).join(', ')}
                          </p>
                        </div>
                        <span className="tag green" style={{ fontSize: 11 }}>
                          Cutoff: {alt.minCutoff}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* If UTME is empty */}
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600 }}>
                  Available University Admission Benchmarks
                </h2>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Enter your UTME score above to filter matching universities. Browse published benchmarks across Nigeria below:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rules.slice(0, 8).map(r => (
                  <article
                    key={r.id}
                    className="panel"
                    style={{
                      padding: '16px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>{r.courses?.name}</h3>
                      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                        {r.universities?.name} ({r.universities?.short_name}) · Min UTME: {r.min_utme}
                      </p>
                    </div>
                    <Action op="eligibility">
                      <input type="hidden" name="rule" value={r.id} />
                      <button className="btn outline sm">Evaluate</button>
                    </Action>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: What Has Been Checked (Vercel Style Evaluation Card) */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>
              Latest Admission Audit & Requirements
            </h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Active audit of your academic prerequisites and verified action items.
            </p>
          </div>

          {!latestCheck ? (
            <div className="panel empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <ShieldCheck size={32} style={{ margin: '0 auto 12px', color: 'var(--muted-foreground)' }} />
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Ready to Audit Criteria</h3>
              <p className="muted" style={{ fontSize: 13, margin: '6px auto 0', maxWidth: 300 }}>
                Select 'Evaluate Eligibility' on any university on the left to verify your O-Level credits and UTME combination.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Primary Vercel Style Result Card */}
              <article
                className="panel"
                style={{
                  padding: 20,
                  border: '1px solid var(--border)',
                  borderRadius: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span className="tag" style={{ marginBottom: 6, display: 'inline-block' }}>
                      Audit Target
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                      {latestCheck.admission_rules?.courses?.name || 'Academic Program'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      {latestCheck.admission_rules?.universities?.name} ({latestCheck.admission_rules?.universities?.short_name})
                    </p>
                  </div>
                  <span
                    className={
                      latestCheck.status === 'MEETS_RULES'
                        ? 'tag green'
                        : latestCheck.status === 'INCOMPLETE_DATA'
                        ? 'tag'
                        : 'tag red'
                    }
                  >
                    {latestCheck.status === 'MEETS_RULES'
                      ? '✓ Meets Benchmarks'
                      : latestCheck.status === 'INCOMPLETE_DATA'
                      ? '⚠ Incomplete Data'
                      : '✕ Prerequisites Unmet'}
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--secondary)',
                    borderRadius: 6,
                    padding: '12px 14px',
                    margin: '14px 0',
                    fontSize: 12,
                    lineHeight: 1.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Institution Cut-off:</span>
                    <strong>{latestCheck.admission_rules?.min_utme || 200} UTME</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Your Verified Score:</span>
                    <strong>{utmeScore ? `${utmeScore} UTME` : 'Not provided'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Audit Date:</span>
                    <span>{new Date(latestCheck.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {latestCheck.details?.missing?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: '#b45309', marginBottom: 6 }}>
                      Missing Required Academic Records:
                    </h4>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {latestCheck.details.missing.map((item: string, idx: number) => (
                        <span key={idx} className="tag" style={{ fontSize: 11 }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {latestCheck.details?.gaps?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c', marginBottom: 6 }}>
                      Prerequisite Gaps:
                    </h4>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {latestCheck.details.gaps.map((item: string, idx: number) => (
                        <span key={idx} className="tag red" style={{ fontSize: 11 }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to Plan Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
                  <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 8 }}>
                    Incorporate audit findings into your preparation roadmap:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...(latestCheck.details?.missing || []), ...(latestCheck.details?.gaps || [])]
                      .slice(0, 3)
                      .map((gap: string, i: number) => (
                        <Action op="task" key={i}>
                          <input type="hidden" name="title" value={('Target: ' + gap).slice(0, 200)} />
                          <input
                            type="hidden"
                            name="notes"
                            value={`Prerequisite gap identified in admission audit for ${latestCheck.admission_rules?.universities?.short_name}.`}
                          />
                          <button className="btn outline sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            + Add '{gap}' to My Plan Roadmap
                          </button>
                        </Action>
                      ))}
                  </div>
                </div>
              </article>

              {/* Recent History List */}
              {checks.length > 1 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>
                    Previous Audits
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {checks.slice(1, 4).map(c => (
                      <div
                        key={c.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 6,
                          background: '#ffffff',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12
                        }}
                      >
                        <div>
                          <strong>{c.admission_rules?.courses?.name}</strong>
                          <span className="muted" style={{ marginLeft: 6 }}>
                            ({c.admission_rules?.universities?.short_name})
                          </span>
                        </div>
                        <span
                          className={
                            c.status === 'MEETS_RULES'
                              ? 'tag green'
                              : c.status === 'INCOMPLETE_DATA'
                              ? 'tag'
                              : 'tag red'
                          }
                          style={{ fontSize: 11 }}
                        >
                          {c.status === 'MEETS_RULES' ? 'Meets' : c.status === 'INCOMPLETE_DATA' ? 'Incomplete' : 'Gaps'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
