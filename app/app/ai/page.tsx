import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Action, Notice, Empty, Submit } from '@/components/workflow';
import { AIChat } from '@/components/ai-chat';
import { Bot, User, MessageSquarePlus, Sparkles } from 'lucide-react';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ conversation?: string; error?: string; message?: string }>;
}) {
  const p = await searchParams;
  const { client } = await requireUser();
  const { data: conversations, error } = await client
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load conversations');

  const selected = conversations?.find(c => c.id === p.conversation) || conversations?.[0];
  const messages = selected
    ? await client
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', selected.id)
        .order('created_at')
    : null;
  if (messages?.error) throw new Error('Unable to load messages');

  const enabled = Boolean(process.env.OPENAI_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Pathwise AI Tutor
        </h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Interactive educational tutor for Nigerian university requirements, subject combinations, and career paths.
        </p>
      </div>

      <Notice params={p} />
      {!enabled && (
        <Empty>The AI provider is not connected yet. No simulated answers will be generated.</Empty>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Sidebar / Conversation history */}
        <div className="panel" style={{ padding: 16 }}>
          <details style={{ marginBottom: 16 }}>
            <summary
              style={{
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <MessageSquarePlus size={15} /> New conversation
            </summary>
            <div style={{ marginTop: 12 }}>
              <Action op="conversation">
                <input
                  name="title"
                  placeholder="e.g. JAMB Medicine Preparation"
                  maxLength={150}
                  required
                />
                <label
                  style={{
                    fontSize: 12,
                    display: 'flex',
                    gap: 6,
                    alignItems: 'flex-start',
                    margin: '8px 0 10px'
                  }}
                >
                  <input
                    name="context"
                    type="checkbox"
                    defaultChecked
                    style={{ width: 'auto', marginTop: 2, accentColor: '#09090b' }}
                  />
                  <span>Include my academic context & WAEC grades</span>
                </label>
                <Submit>Start chat</Submit>
              </Action>
            </div>
          </details>

          <h3
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--muted-foreground)',
              marginBottom: 8
            }}
          >
            Previous Conversations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!conversations?.length ? (
              <p className="muted" style={{ fontSize: 12 }}>
                No chats yet.
              </p>
            ) : (
              conversations.map(c => {
                const isSelected = selected?.id === c.id;
                return (
                  <Link
                    key={c.id}
                    href={'/app/ai?conversation=' + c.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: 13,
                      background: isSelected ? 'var(--secondary)' : 'transparent',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--foreground)' : 'var(--muted-foreground)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {c.title}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Box */}
        <div
          className="panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 520,
            justifyContent: 'space-between',
            padding: 20
          }}
        >
          {selected ? (
            <>
              <div>
                <div
                  style={{
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 12,
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <h2 style={{ fontSize: 15, fontWeight: 600 }}>{selected.title}</h2>
                  <span className="tag">
                    {selected.use_academic_context
                      ? 'Personalized with your context'
                      : 'General tutoring'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    maxHeight: 460,
                    overflowY: 'auto',
                    paddingRight: 6
                  }}
                >
                  {!messages?.data?.length ? (
                    <div className="empty-state">
                      <Sparkles size={24} style={{ margin: '0 auto 10px', color: 'var(--muted-foreground)' }} />
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>Start your consultation</h3>
                      <p className="muted" style={{ fontSize: 13, maxWidth: 360, margin: '4px auto 0' }}>
                        Ask about UTME subject combinations, admission competitiveness, or post-UTME cutoff guidelines.
                      </p>
                    </div>
                  ) : (
                    messages.data.map(m => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                          padding: 14,
                          borderRadius: 6,
                          background: m.role === 'user' ? 'var(--secondary)' : '#ffffff',
                          border: m.role === 'user' ? 'none' : '1px solid var(--border)'
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: m.role === 'user' ? '#09090b' : '#10b981',
                            color: '#ffffff',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0
                          }}
                        >
                          {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--muted-foreground)',
                              marginBottom: 4
                            }}
                          >
                            {m.role === 'user' ? 'You' : 'Pathwise AI'}
                          </p>
                          <div
                            style={{
                              fontSize: 14,
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              color: 'var(--foreground)'
                            }}
                          >
                            {m.content}
                          </div>
                          {m.citations?.length > 0 && (
                            <div
                              style={{
                                marginTop: 10,
                                paddingTop: 8,
                                borderTop: '1px solid var(--border)'
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: 'var(--muted-foreground)',
                                  marginBottom: 4
                                }}
                              >
                                Verified sources:
                              </p>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {m.citations.map(
                                  (c: { id: string; url: string; title: string }) => (
                                    <a
                                      key={c.id}
                                      href={c.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="tag"
                                    >
                                      ↗ {c.title}
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {enabled && <AIChat conversation={selected.id} />}
            </>
          ) : (
            <div className="empty-state">
              <p className="muted">Create a conversation on the left to start chatting with Pathwise.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
