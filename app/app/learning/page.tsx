import { requireUser } from '@/lib/auth';
import { Action, Id, Notice, Empty, Submit } from '@/components/workflow';
import { BookOpen, CheckCircle2, Circle, ExternalLink, HelpCircle, Trophy } from 'lucide-react';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { client } = await requireUser();
  const [resources, progress, questions, attempts] = await Promise.all([
    client
      .from('learning_resources')
      .select('*,sources(name,url,status,verified_at)')
      .eq('published', true),
    client.from('learning_progress').select('*'),
    client.from('practice_questions').select('*').eq('published', true),
    client
      .from('practice_attempts')
      .select('id,correct')
      .order('created_at', { ascending: false })
      .limit(100)
  ]);

  if (resources.error || progress.error || questions.error || attempts.error)
    throw new Error('Unable to load learning resources');

  const correctCount = attempts.data?.filter(a => a.correct).length || 0;
  const totalAttempts = attempts.data?.length || 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Learning & Practice Hub
        </h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Reviewed subject study guides and interactive practice questions for WAEC and UTME preparation.
        </p>
      </div>

      <Notice params={await searchParams} />

      {/* Progress Bar Card */}
      <div
        className="panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 6,
              background: 'var(--secondary)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <Trophy size={20} color="#09090b" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Your Practice Record</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              {correctCount} correct answers across {totalAttempts} attempts ({accuracy}% accuracy)
            </p>
          </div>
        </div>
        <span className="tag green">{accuracy >= 70 ? 'Strong Performance' : 'Building Mastery'}</span>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Reviewed Study Modules
      </h2>

      {!resources.data?.length ? (
        <Empty>No reviewed learning modules have been published yet.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {resources.data.map(r => {
            const isCompleted = progress.data?.some(
              p => p.resource_id === r.id && p.completed_at
            );
            const resourceQuestions = questions.data?.filter(q => q.resource_id === r.id) || [];

            return (
              <article key={r.id} className="panel" style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{r.title}</h3>
                      <span className={isCompleted ? 'tag green' : 'tag'}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                      {r.description}
                    </p>
                  </div>
                  <Action op="learn">
                    <Id id={r.id} />
                    <input type="hidden" name="done" value={isCompleted ? 'yes' : 'no'} />
                    <button className={isCompleted ? 'btn outline sm' : 'btn sm'}>
                      {isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                    </button>
                  </Action>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                    fontSize: 12,
                    color: 'var(--muted-foreground)',
                    margin: '12px 0 16px',
                    paddingBottom: 14,
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                    style={{ fontSize: 12 }}
                  >
                    Open resource curriculum <ExternalLink size={12} />
                  </a>
                  {r.sources?.name && (
                    <span>Source: {r.sources.name}</span>
                  )}
                </div>

                {resourceQuestions.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 12 }}>
                      Interactive Practice Check
                    </h4>
                    {resourceQuestions.map(q => (
                      <Action key={q.id} op="answer">
                        <Id id={q.id} />
                        <div
                          style={{
                            background: '#fafafa',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: 14,
                            marginBottom: 12
                          }}
                        >
                          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                            {q.question}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                            {(q.choices as string[]).map((c, i) => (
                              <label
                                key={i}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  fontSize: 13,
                                  cursor: 'pointer'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="choice"
                                  value={i}
                                  required
                                  style={{ width: 'auto', accentColor: '#09090b' }}
                                />
                                {c}
                              </label>
                            ))}
                          </div>
                          <Submit>Check answer</Submit>
                        </div>
                      </Action>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
