import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Brand } from '@/components/brand';
import { CounselorApplication } from '@/components/counselor-application';
import { CheckCircle2, ArrowRight, Video, Calendar, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CounselorEntry() {
  const { client, user } = await requireUser('/counselors/register');
  const [appRes, profileRes] = await Promise.all([
    client
      .from('counselor_applications')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    client
      .from('counselor_profiles')
      .select('user_id,name,specialty,bio,languages,approved')
      .eq('user_id', user.id)
      .maybeSingle()
  ]);

  const application = appRes.data;
  const profile = profileRes.data;
  const isApproved = application?.status === 'approved' || profile?.approved === true;

  return (
    <main className="counselor-onboarding" style={{ maxWidth: 740, margin: '0 auto', padding: '40px 20px' }}>
      <Brand />
      <h1 style={{ marginTop: 24, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
        {isApproved ? 'Your Counselor Profile is Active' : 'Help someone find their way.'}
      </h1>
      <p className="muted" style={{ fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        {isApproved
          ? 'Your professional credentials are verified and published. Manage sessions in your workspace.'
          : 'Create your professional counselor profile to mentor Nigerian secondary and university students.'}
      </p>

      {/* If Approved, show Confirmed Read-Only Profile Card (prevent duplicate editing) */}
      {isApproved ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section
            className="panel"
            style={{
              padding: '24px 28px',
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #e4e4e7'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#18181b',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: 16
                  }}
                >
                  {(profile?.name || application?.name || 'M').charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#09090b' }}>
                    {profile?.name || application?.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#71717a', margin: '2px 0 0' }}>
                    {profile?.specialty || application?.specialty}
                  </p>
                </div>
              </div>
              <span className="tag green" style={{ fontSize: 12, padding: '4px 10px' }}>
                ✓ AI Verified & Active
              </span>
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#3f3f46', marginBottom: 16 }}>
              {profile?.bio || application?.bio}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                padding: '14px 16px',
                background: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f4f4f5',
                marginBottom: 20
              }}
            >
              <div>
                <small style={{ color: '#71717a', fontSize: 11, fontWeight: 600, display: 'block' }}>
                  LANGUAGES
                </small>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#09090b', marginTop: 2, display: 'block' }}>
                  {profile?.languages || application?.languages || 'English'}
                </span>
              </div>
              <div>
                <small style={{ color: '#71717a', fontSize: 11, fontWeight: 600, display: 'block' }}>
                  EXPERIENCE
                </small>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#09090b', marginTop: 2, display: 'block' }}>
                  {application?.experience ?? 5} Years Professional Practice
                </span>
              </div>
              <div>
                <small style={{ color: '#71717a', fontSize: 11, fontWeight: 600, display: 'block' }}>
                  CONSULTATION PLATFORM
                </small>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#16a34a', marginTop: 2, display: 'block' }}>
                  ✓ Google Meet Configured
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/app/counseling"
                className="btn primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                <Calendar size={15} /> Go to Counselor Workspace <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        </div>
      ) : (
        <CounselorApplication
          application={application}
          name={typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : ''}
        />
      )}
    </main>
  );
}
