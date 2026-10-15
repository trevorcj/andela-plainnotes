import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Action, Id, Notice, Submit } from '@/components/workflow';
import { Search, Calendar, Video, Star, Sparkles, Users } from 'lucide-react';

const date = (v: string) =>
  new Date(v).toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC';

function getGoogleCalendarUrl(session: {
  topic: string;
  meeting_url: string;
  starts_at?: string;
  ends_at?: string;
}) {
  const start = session.starts_at ? new Date(session.starts_at) : new Date();
  const end = session.ends_at ? new Date(session.ends_at) : new Date(start.getTime() + 60 * 60 * 1000);
  const formatTime = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const text = encodeURIComponent('Pathwise 1-on-1 Mentorship Session');
  const details = encodeURIComponent(
    `Topic: ${session.topic}\n\nJoin Video Room: ${session.meeting_url}\nPlatform: Pathwise Nigeria`
  );
  const location = encodeURIComponent(session.meeting_url);
  const dates = `${formatTime(start)}/${formatTime(end)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { client, user } = await requireUser();
  const [profiles, slots, sessions, role, reviews] = await Promise.all([
    client
      .from('counselor_profiles')
      .select('user_id,name,specialty,bio,languages,approved')
      .eq('approved', true),
    client
      .from('counselor_slots')
      .select('*')
      .gt('starts_at', new Date().toISOString())
      .order('starts_at'),
    client
      .from('sessions')
      .select('*,counselor_slots(starts_at,ends_at)')
      .order('created_at', { ascending: false }),
    client.rpc('has_role', { wanted: 'counselor' }),
    client.from('session_reviews').select('session_id,counselor_id,rating,review')
  ]);

  if (profiles.error || slots.error || sessions.error || reviews.error)
    throw new Error('Unable to load counseling');

  const availableCounselors = profiles.data?.filter(p => p.user_id !== user.id) || [];

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Educational Mentors & Guidance
        </h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          Schedule 1-on-1 sessions with verified educational advisors and career mentors across Nigeria.
        </p>
      </div>

      <Notice params={await searchParams} />

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '8px 14px',
          marginBottom: 24
        }}
      >
        <Search size={16} color="var(--muted-foreground)" />
        <input
          placeholder="Search mentors by specialty, university background, or field…"
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: 14, background: 'transparent' }}
        />
      </div>

      {availableCounselors.length === 0 ? (
        <div className="panel empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Users size={36} style={{ margin: '0 auto 14px', color: '#71717a' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#09090b' }}>
            No verified mentors currently available for booking
          </h2>
          <p className="muted" style={{ maxWidth: 460, margin: '8px auto 20px', fontSize: 13, lineHeight: 1.6 }}>
            Accredited educational advisors open 1-on-1 session availability on rolling weekly schedules. In the meantime, you can explore curriculum benchmarks or consult the AI Advisor.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link
              href="/app/ai"
              className="btn primary sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Sparkles size={14} /> Ask Pathwise AI Advisor
            </Link>
            <Link
              href="/app/eligibility"
              className="btn outline sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              Check University Benchmarks
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}
        >
          {availableCounselors.map(p => {
            const counselorSlots = slots.data?.filter(s => s.counselor_id === p.user_id) || [];
            const counselorReviews = reviews.data?.filter(r => r.counselor_id === p.user_id) || [];
            const avgRating = counselorReviews.length
              ? (counselorReviews.reduce((sum, r) => sum + r.rating, 0) / counselorReviews.length).toFixed(1)
              : '5.0';

            return (
              <article
                key={p.user_id}
                className="panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 8
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--secondary)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 600,
                        fontSize: 16,
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</h2>
                        <span className="tag green">Verified</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                        {p.specialty}
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.6, color: '#3f3f46', marginBottom: 14 }}>
                    {p.bio}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 12,
                      color: 'var(--muted-foreground)',
                      marginBottom: 14
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={13} fill="#eab308" color="#eab308" /> {avgRating} (
                      {counselorReviews.length} reviews)
                    </span>
                    <span>·</span>
                    <span>{p.languages}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 6 }}>
                  {counselorSlots.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                      No available booking slots this week.
                    </p>
                  ) : (
                    <Action op="book">
                      <label style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                        Available session slots
                        <select name="slot" required defaultValue="" style={{ marginTop: 4 }}>
                          <option value="" disabled>
                            Select a session time
                          </option>
                          {counselorSlots.map(s => (
                            <option key={s.id} value={s.id}>
                              {date(s.starts_at)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <textarea
                        name="topic"
                        required
                        minLength={2}
                        maxLength={1500}
                        placeholder="What specific questions would you like to discuss in this session?"
                        style={{ minHeight: 70, marginBottom: 10 }}
                      />
                      <Submit>Book 1-on-1 Consultation</Submit>
                    </Action>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {role.data === true && (
        <section className="panel" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
            Mentor Availability Workspace
          </h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Publish time slots for students to book 1-on-1 consultations with you.
          </p>
          <Action op="slot">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>
                Starts at (UTC)
                <input name="start" placeholder="2026-11-02T10:00:00+01:00" required style={{ marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 12, fontWeight: 500 }}>
                Ends at (UTC)
                <input name="end" placeholder="2026-11-02T11:00:00+01:00" required style={{ marginTop: 4 }} />
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <Submit>Publish Availability Slot</Submit>
            </div>
          </Action>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Active Unbooked Slots
            </h3>
            {slots.data
              ?.filter(s => s.counselor_id === user.id)
              .map(s => (
                <Action op="slot-delete" key={s.id}>
                  <Id id={s.id} />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: 13 }}>
                      {date(s.starts_at)} – {date(s.ends_at)}
                    </span>
                    <button className="btn outline sm">Delete Slot</button>
                  </div>
                </Action>
              ))}
          </div>
        </section>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>
        Your Scheduled Sessions
      </h2>
      {!sessions.data?.length ? (
        <div className="panel empty-state">
          <p className="muted" style={{ fontSize: 13 }}>
            You haven’t scheduled any counseling sessions yet.
          </p>
        </div>
      ) : (
        sessions.data.map(s => (
          <article
            className="panel"
            key={s.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              marginBottom: 12
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Calendar size={15} />
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                  {date(s.counselor_slots?.starts_at)}
                </h3>
                <span className={s.status === 'confirmed' ? 'tag green' : 'tag'}>
                  {s.status.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 13, margin: '4px 0 0', color: 'var(--muted-foreground)' }}>
                {s.topic}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {s.status === 'confirmed' && (
                <>
                  <a
                    href={s.meeting_url || 'https://meet.google.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn sm"
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                  >
                    <Video size={14} /> Join Video Consultation
                  </a>
                  <a
                    href={getGoogleCalendarUrl({
                      topic: s.topic,
                      meeting_url: s.meeting_url,
                      starts_at: s.counselor_slots?.starts_at,
                      ends_at: s.counselor_slots?.ends_at
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn outline sm"
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                    title="Add to Google Calendar"
                  >
                    <Calendar size={14} /> Add to Calendar
                  </a>
                  <Action op="cancel">
                    <Id id={s.id} />
                    <Submit>Cancel</Submit>
                  </Action>
                </>
              )}
              {s.status === 'completed' &&
                s.student_id === user.id &&
                !reviews.data?.some(r => r.session_id === s.id) && (
                  <Action op="review">
                    <Id id={s.id} />
                    <select name="rating" defaultValue="5" style={{ width: 'auto' }}>
                      {[5, 4, 3, 2, 1].map(n => (
                        <option key={n} value={n}>
                          {n} Stars
                        </option>
                      ))}
                    </select>
                    <Submit>Leave Review</Submit>
                  </Action>
                )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
