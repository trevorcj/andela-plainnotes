'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Plus, X, Sparkles } from 'lucide-react';
import { Brand } from './brand';
import { saveDraft, finishOnboarding } from '@/app/onboarding/actions';
import { grades, schoolYears, onboardingSchema, type OnboardingInput } from '@/lib/validation';

type DraftInput = Omit<OnboardingInput, 'exams'> & {
  exams: {
    type: 'WAEC' | 'NECO';
    year: number;
    results: { subject: string; grade: string }[];
  }[];
};

const interests = [
  'Health & Wellbeing',
  'Technology & Software',
  'Natural Sciences',
  'Business & Finance',
  'Communication & Media',
  'Law & Policy',
  'Engineering & Built Environment',
  'Social Sciences'
];

export function OnboardingForm({
  courses,
  draft,
  profile
}: {
  courses: { id: string; name: string }[];
  draft: { step: number; payload: unknown } | null;
  profile: {
    full_name: string;
    stage: string | null;
    location: string;
    onboarding_completed_at: string | null;
  };
}) {
  const defaults: DraftInput = {
    fullName: profile.full_name,
    stage: (profile.stage as DraftInput['stage']) || 'secondary',
    location: profile.location,
    schoolYear: 'SS2',
    schoolName: '',
    interests: ['Technology & Software'],
    targetCourseId: courses[0]?.id || '',
    customCourseName: '',
    exams: []
  };

  const [data, setData] = useState<DraftInput>(() => ({
    ...defaults,
    ...((draft?.payload as Partial<DraftInput>) || {})
  }));

  const [step, setStep] = useState(draft?.step || 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function update(p: Partial<DraftInput>) {
    setData(d => ({ ...d, ...p }));
    setDirty(true);
    setSaved(false);
  }

  async function save(next = step) {
    setBusy(true);
    setError('');
    try {
      const result = await saveDraft({ step: next, payload: data });
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setDirty(false);
        setStep(next);
      }
    } catch {
      setError('Connection interrupted. Your draft is preserved; please retry.');
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setError('');
    const v = onboardingSchema.safeParse(data);
    if (!v.success) {
      setError(v.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const result = await finishOnboarding(v.data);
      if (result.error) setError(result.error);
      else {
        setDirty(false);
        router.push('/app');
        router.refresh();
      }
    } catch {
      setError('Connection interrupted. Please retry completion.');
    } finally {
      setBusy(false);
    }
  }

  function updateExam(i: number, p: Partial<DraftInput['exams'][number]>) {
    update({ exams: data.exams.map((v, j) => (i === j ? { ...v, ...p } : v)) });
  }

  return (
    <main className="counselor-onboarding">
      <Brand />
      <div style={{ marginTop: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Step {step} of 4
        </div>
        <h1 style={{ marginTop: 8 }}>
          {[
            'Personal Background',
            'Academic Records & O-Levels',
            'Target Course & Interests',
            'Review & AI Path Generation'
          ][step - 1]}
        </h1>
        <p className="muted" style={{ marginTop: 4 }}>
          {profile.onboarding_completed_at
            ? 'Update your profile and target degree preferences.'
            : 'Pathwise AI uses this context to verify university prerequisites and build your admission roadmap.'}
        </p>
        <div className="progress" style={{ margin: '18px 0 0' }}>
          <span style={{ width: `${step * 25}%` }} />
        </div>
      </div>

      <form
        className="panel"
        onSubmit={e => {
          e.preventDefault();
          if (step < 4) save(step + 1);
          else finish();
        }}
      >
        {step === 1 && (
          <>
            <div className="field">
              <label htmlFor="full-name">Full name</label>
              <input
                id="full-name"
                required
                minLength={2}
                maxLength={100}
                value={data.fullName}
                onChange={e => update({ fullName: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="student-stage">Educational stage</label>
              <select
                id="student-stage"
                value={data.stage}
                onChange={e => {
                  const stage = e.target.value as DraftInput['stage'];
                  update({ stage, schoolYear: schoolYears[stage][0] });
                }}
              >
                <option value="secondary">Senior Secondary Student</option>
                <option value="university">University Student / Transfer</option>
                <option value="guardian">Parent or Guardian</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="location">State / Location</label>
              <input
                id="location"
                value={data.location}
                maxLength={100}
                placeholder="e.g. Lagos, Nigeria"
                onChange={e => update({ location: e.target.value })}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="school-year">Current academic level</label>
                <select
                  id="school-year"
                  value={data.schoolYear}
                  onChange={e => update({ schoolYear: e.target.value })}
                >
                  {schoolYears[data.stage].map(v => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="school-name">School name (optional)</label>
                <input
                  id="school-name"
                  value={data.schoolName}
                  maxLength={200}
                  placeholder="e.g. King’s College Lagos"
                  onChange={e => update({ schoolName: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>WAEC / NECO Senior School Certificate</h3>
              <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                Add your exam grades. You can record up to two sittings, or skip if not yet taken.
              </p>
            </div>

            {data.exams.map((exam, i) => (
              <section key={i} className="exam-block">
                <div className="row" style={{ marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>Sitting {i + 1}</h4>
                  <button
                    type="button"
                    aria-label={`Remove sitting ${i + 1}`}
                    onClick={() => update({ exams: data.exams.filter((_, j) => i !== j) })}
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="form-grid" style={{ marginBottom: 14 }}>
                  <div className="field">
                    <label htmlFor={`exam-${i}`}>Examination body</label>
                    <select
                      id={`exam-${i}`}
                      value={exam.type}
                      onChange={e => updateExam(i, { type: e.target.value as 'WAEC' | 'NECO' })}
                    >
                      <option value="WAEC">WAEC (WASSCE)</option>
                      <option value="NECO">NECO (SSCE)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`year-${i}`}>Exam year</label>
                    <input
                      id={`year-${i}`}
                      type="number"
                      min={2000}
                      max={new Date().getFullYear()}
                      value={exam.year}
                      onChange={e => updateExam(i, { year: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {exam.results.map((r, j) => (
                    <div className="grade-row" key={j}>
                      <input
                        aria-label={`Sitting ${i + 1} subject ${j + 1}`}
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="Subject, e.g. Mathematics"
                        value={r.subject}
                        onChange={e =>
                          updateExam(i, {
                            results: exam.results.map((v, k) =>
                              j === k ? { ...v, subject: e.target.value } : v
                            )
                          })
                        }
                      />
                      <select
                        aria-label={`Sitting ${i + 1} grade ${j + 1}`}
                        required
                        value={r.grade}
                        onChange={e =>
                          updateExam(i, {
                            results: exam.results.map((v, k) =>
                              j === k ? { ...v, grade: e.target.value } : v
                            )
                          })
                        }
                      >
                        <option value="">Grade</option>
                        {grades.map(g => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label="Remove subject"
                        onClick={() =>
                          updateExam(i, { results: exam.results.filter((_, k) => j !== k) })
                        }
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {exam.results.length < 12 && (
                  <button
                    type="button"
                    className="btn light sm"
                    style={{ marginTop: 10 }}
                    onClick={() =>
                      updateExam(i, {
                        results: [...exam.results, { subject: '', grade: '' }]
                      })
                    }
                  >
                    <Plus size={14} /> Add subject
                  </button>
                )}
              </section>
            ))}

            {data.exams.length < 2 && (
              <button
                type="button"
                className="btn outline sm"
                style={{ marginTop: 8 }}
                onClick={() =>
                  update({
                    exams: [
                      ...data.exams,
                      {
                        type: 'WAEC',
                        year: new Date().getFullYear(),
                        results: [
                          { subject: 'English Language', grade: '' },
                          { subject: 'Mathematics', grade: '' }
                        ]
                      }
                    ]
                  })
                }
              >
                <Plus size={14} /> Add exam sitting
              </button>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Academic & Career Fields</h3>
              <p className="muted" style={{ fontSize: 13, marginTop: 2, marginBottom: 12 }}>
                Select one or more fields that align with your career goals.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {interests.map(v => {
                  const active = data.interests.includes(v);
                  return (
                    <button
                      type="button"
                      className={`chip ${active ? 'active' : ''}`}
                      key={v}
                      onClick={() =>
                        update({
                          interests: active
                            ? data.interests.filter(i => i !== v)
                            : [...data.interests, v]
                        })
                      }
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Degree Program of Choice</h3>
              <p className="muted" style={{ fontSize: 13, marginTop: 2, marginBottom: 12 }}>
                Choose a verified course or enter a custom discipline. Pathwise AI will map your prerequisites and admission benchmarks.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: 10,
                  marginTop: 8
                }}
              >
                {courses.map(c => {
                  const isSelected = data.targetCourseId === c.id;
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: isSelected ? '1px solid #09090b' : '1px solid #e4e4e7',
                        background: isSelected ? '#f4f4f5' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="target_course"
                        checked={isSelected}
                        onChange={() => update({ targetCourseId: c.id, customCourseName: '' })}
                        style={{ width: 'auto', accentColor: '#09090b' }}
                      />
                      <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500 }}>
                        {c.name}
                      </span>
                    </label>
                  );
                })}

                {/* Other / Custom Course Option */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: data.targetCourseId === 'custom' ? '1px solid #09090b' : '1px solid #e4e4e7',
                    background: data.targetCourseId === 'custom' ? '#f4f4f5' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="target_course"
                    checked={data.targetCourseId === 'custom'}
                    onChange={() => update({ targetCourseId: 'custom' })}
                    style={{ width: 'auto', accentColor: '#09090b' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: data.targetCourseId === 'custom' ? 600 : 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} /> Other / Custom Course
                  </span>
                </label>
              </div>

              {data.targetCourseId === 'custom' && (
                <div className="field" style={{ marginTop: 16 }}>
                  <label htmlFor="customCourseName">
                    Enter course name (AI will generate admission guidance)
                  </label>
                  <input
                    id="customCourseName"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Artificial Intelligence, Mechatronics, Cyber Security, Marine Biology…"
                    value={data.customCourseName || ''}
                    onChange={e => update({ customCourseName: e.target.value })}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              Review Academic Profile
            </h3>
            <div
              style={{
                display: 'grid',
                gap: 12,
                background: '#fafafa',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: 16,
                fontSize: 13
              }}
            >
              <div>
                <strong style={{ color: 'var(--muted-foreground)' }}>Full name:</strong>{' '}
                <span>{data.fullName}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--muted-foreground)' }}>Educational level:</strong>{' '}
                <span>
                  {data.stage} · {data.schoolYear} {data.schoolName ? `(${data.schoolName})` : ''}
                </span>
              </div>
              <div>
                <strong style={{ color: 'var(--muted-foreground)' }}>Target degree:</strong>{' '}
                <span style={{ fontWeight: 600 }}>
                  {data.targetCourseId === 'custom'
                    ? data.customCourseName || 'Custom Discipline'
                    : courses.find(c => c.id === data.targetCourseId)?.name || 'Degree Program'}
                </span>
              </div>
              <div>
                <strong style={{ color: 'var(--muted-foreground)' }}>O-Level sittings:</strong>{' '}
                <span>
                  {data.exams.length
                    ? `${data.exams.length} sitting(s) entered`
                    : 'None entered yet'}
                </span>
              </div>
              <div>
                <strong style={{ color: 'var(--muted-foreground)' }}>Interests:</strong>{' '}
                <span>{data.interests.join(', ')}</span>
              </div>
            </div>

            <p className="source-note" style={{ marginTop: 16 }}>
              Your profile enables AI to recommend tailored milestones, verify subject prerequisites, and evaluate target universities.
            </p>
          </>
        )}

        {error && (
          <p role="alert" className="form-error" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="success-note" style={{ marginTop: 16 }}>
            Progress saved to your account.
          </p>
        )}

        <div className="row" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {step > 1 ? (
            <button
              type="button"
              disabled={busy}
              className="btn light"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn outline"
              disabled={busy}
              onClick={() => save()}
            >
              Save draft
            </button>
            <button className="btn" disabled={busy}>
              {busy ? 'Processing…' : step === 4 ? 'Complete Profile' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
