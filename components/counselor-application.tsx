'use client';

import { useState, useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { saveApplication } from '@/app/counselors/register/actions';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

type Application = {
  name: string;
  specialty: string;
  experience: number;
  qualifications: string;
  professional_url: string | null;
  languages: string;
  bio: string;
  status: string;
};

type DaySchedule = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

const initialDays: DaySchedule[] = [
  { day: 'Sunday', enabled: true, startTime: '12:00 PM', endTime: '03:00 PM' },
  { day: 'Monday', enabled: true, startTime: '12:00 PM', endTime: '03:00 PM' },
  { day: 'Tuesday', enabled: true, startTime: '12:00 PM', endTime: '03:00 PM' },
  { day: 'Wednesday', enabled: true, startTime: '12:00 PM', endTime: '03:00 PM' },
  { day: 'Thursday', enabled: true, startTime: '12:00 PM', endTime: '03:00 PM' },
  { day: 'Friday', enabled: false, startTime: '09:00 AM', endTime: '12:00 PM' },
  { day: 'Saturday', enabled: false, startTime: '10:00 AM', endTime: '02:00 PM' }
];

export function CounselorApplication({
  application: a,
  name
}: {
  application: Application | null;
  name: string;
}) {
  const [step, setStep] = useState<number>(1);
  const [days, setDays] = useState<DaySchedule[]>(initialDays);

  const [formValues, setFormValues] = useState({
    name: a?.name || name || '',
    specialty: a?.specialty || 'Education & Course Counseling',
    experience: a?.experience ?? 5,
    languages: a?.languages || 'English, Yoruba, Igbo, Hausa',
    qualifications: a?.qualifications || 'B.Ed. Guidance & Counseling, TRCN Certified',
    professional_url: a?.professional_url || '',
    bio:
      a?.bio ||
      'Experienced academic advisor helping Nigerian students navigate course combinations, JAMB departmental benchmarks, and strategic university choices.'
  });

  const [state, action, pending] = useActionState(saveApplication, {});

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.message) {
      toast.success(state.message);
    }
  }, [state?.error, state?.message]);

  const toggleDay = (idx: number) => {
    setDays(prev =>
      prev.map((d, i) => (i === idx ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const copyToAll = (sourceIdx: number) => {
    const src = days[sourceIdx];
    setDays(prev =>
      prev.map(d =>
        d.enabled ? { ...d, startTime: src.startTime, endTime: src.endTime } : d
      )
    );
    toast.success(`Copied ${src.startTime} - ${src.endTime} to all active days.`);
  };

  const handleNextFromStep1 = () => {
    if (!formValues.name.trim() || formValues.name.trim().length < 2) {
      toast.error('Please enter your full professional name.');
      return;
    }
    if (!formValues.qualifications.trim() || formValues.qualifications.trim().length < 5) {
      toast.error('Please list your academic qualifications or degrees.');
      return;
    }
    if (!formValues.bio.trim() || formValues.bio.trim().length < 20) {
      toast.error('Please provide a brief bio explaining how you will mentor students (at least 20 characters).');
      return;
    }
    setStep(2);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* 3-Step Stepper (Zero Fake Apps) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 28
        }}
      >
        {[
          { num: 1, title: 'Profile' },
          { num: 2, title: 'Weekly Availability' },
          { num: 3, title: 'Confirmation' }
        ].map(s => (
          <div
            key={s.num}
            onClick={() => {
              if (s.num === 1 || (s.num > 1 && formValues.name.trim())) {
                setStep(s.num);
              }
            }}
            style={{
              cursor: 'pointer',
              padding: '12px 14px',
              borderRadius: 6,
              background: step === s.num ? '#09090b' : step > s.num ? '#f4f4f5' : '#ffffff',
              border: `1px solid ${step === s.num ? '#09090b' : '#e4e4e7'}`,
              color: step === s.num ? '#ffffff' : step > s.num ? '#09090b' : '#71717a',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, display: 'block', opacity: 0.8 }}>
              STEP {s.num}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</span>
          </div>
        ))}
      </div>

      <form className="panel" action={action} style={{ padding: 32, borderRadius: 12 }}>
        {/* Hidden inputs to guarantee all fields are sent in the payload regardless of active step */}
        <input type="hidden" name="name" value={formValues.name} />
        <input type="hidden" name="specialty" value={formValues.specialty} />
        <input type="hidden" name="experience" value={formValues.experience} />
        <input type="hidden" name="languages" value={formValues.languages} />
        <input type="hidden" name="qualifications" value={formValues.qualifications} />
        <input type="hidden" name="professional_url" value={formValues.professional_url} />
        <input type="hidden" name="bio" value={formValues.bio} />
        <input
          type="hidden"
          name="schedule_json"
          value={JSON.stringify(
            days
              .filter(d => d.enabled)
              .map(d => ({ day: d.day, startTime: d.startTime, endTime: d.endTime }))
          )}
        />

        {/* ================= STEP 1: Professional Profile ================= */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Professional Profile & Credentials
            </h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Enter your background so Nigerian students and parents know your area of expertise.
            </p>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="c-name">Full name</label>
              <input
                id="c-name"
                value={formValues.name}
                onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Dr. Ngozi Adeleke"
              />
            </div>

            <div className="field">
              <label htmlFor="c-specialty">Specialty Focus</label>
              <select
                id="c-specialty"
                value={formValues.specialty}
                onChange={e => setFormValues(prev => ({ ...prev, specialty: e.target.value }))}
              >
                {[
                  'Education & Course Counseling',
                  'University Admissions',
                  'Student Success',
                  'Career Guidance'
                ].map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="c-experience">Years of professional experience</label>
              <input
                id="c-experience"
                type="number"
                min={0}
                max={60}
                value={formValues.experience}
                onChange={e => setFormValues(prev => ({ ...prev, experience: Number(e.target.value) }))}
              />
            </div>

            <div className="field">
              <label htmlFor="c-languages">Spoken languages</label>
              <input
                id="c-languages"
                value={formValues.languages}
                onChange={e => setFormValues(prev => ({ ...prev, languages: e.target.value }))}
                maxLength={200}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="c-qualifications">Degrees, certifications & institutions attended</label>
            <textarea
              id="c-qualifications"
              value={formValues.qualifications}
              onChange={e => setFormValues(prev => ({ ...prev, qualifications: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="field">
            <label htmlFor="c-link">LinkedIn or professional profile URL (optional)</label>
            <input
              id="c-link"
              type="url"
              value={formValues.professional_url}
              onChange={e => setFormValues(prev => ({ ...prev, professional_url: e.target.value }))}
              placeholder="https://linkedin.com/in/your-profile"
            />
          </div>

          <div className="field">
            <label htmlFor="c-bio">How will you mentor students?</label>
            <textarea
              id="c-bio"
              rows={4}
              value={formValues.bio}
              onChange={e => setFormValues(prev => ({ ...prev, bio: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              type="button"
              className="btn"
              onClick={handleNextFromStep1}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next: Set Availability <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ================= STEP 2: Set Availability Grid ================= */}
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Set Weekly Availability
            </h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Choose your regular counseling hours. You can always adjust this later in your workspace.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {days.map((item, idx) => (
              <div
                key={item.day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #e4e4e7',
                  background: item.enabled ? '#ffffff' : '#fafafa',
                  transition: 'background 0.15s ease'
                }}
              >
                {/* Switch & Day Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 12,
                      background: item.enabled ? '#09090b' : '#e4e4e7',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: item.enabled ? 20 : 2,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#ffffff',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />
                  </button>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: item.enabled ? '#09090b' : '#a1a1aa'
                    }}
                  >
                    {item.day}
                  </span>
                </div>

                {/* Time Selectors or Inactive */}
                {item.enabled ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                      value={item.startTime}
                      onChange={e => {
                        const val = e.target.value;
                        setDays(prev =>
                          prev.map((d, i) => (i === idx ? { ...d, startTime: val } : d))
                        );
                      }}
                      style={{ fontSize: 13, padding: '6px 36px 6px 12px', width: 'auto' }}
                    >
                      {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'].map(
                        t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>
                    <span style={{ color: '#71717a', fontSize: 13 }}>-</span>
                    <select
                      value={item.endTime}
                      onChange={e => {
                        const val = e.target.value;
                        setDays(prev =>
                          prev.map((d, i) => (i === idx ? { ...d, endTime: val } : d))
                        );
                      }}
                      style={{ fontSize: 13, padding: '6px 36px 6px 12px', width: 'auto' }}
                    >
                      {['11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map(
                        t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={() => copyToAll(idx)}
                      title="Copy hours to all active days"
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #e4e4e7',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: '#71717a'
                      }}
                    >
                      <Copy size={13} />
                      Copy to all
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: '#a1a1aa', fontStyle: 'italic' }}>
                    Unavailable
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              type="button"
              className="btn outline"
              onClick={() => setStep(1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setStep(3)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next: Review & Activate <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ================= STEP 3: Confirmation & Activate ================= */}
        <div style={{ display: step === 3 ? 'block' : 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Confirmation & Activation
            </h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Pathwise AI evaluates your credentials and activates your profile and Google Meet workspace instantly.
            </p>
          </div>

          {/* Profile Summary Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 8,
              background: '#fafafa',
              border: '1px solid #e4e4e7',
              marginBottom: 20
            }}
          >
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#09090b', margin: '0 0 10px 0' }}>
              Application Summary:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#3f3f46' }}>
              <div>
                <strong>Name:</strong> {formValues.name} ({formValues.specialty})
              </div>
              <div>
                <strong>Experience & Background:</strong> {formValues.experience} years · {formValues.qualifications}
              </div>
              <div>
                <strong>Weekly Availability:</strong>{' '}
                {days.filter(d => d.enabled).length > 0
                  ? days
                      .filter(d => d.enabled)
                      .map(d => `${d.day} (${d.startTime} - ${d.endTime})`)
                      .join(', ')
                  : 'No weekly recurring hours selected.'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 500, marginTop: 4 }}>
                <CheckCircle2 size={15} /> Real Google Meet & Calendar rooms configured automatically upon submission.
              </div>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              gap: 10,
              fontSize: 13,
              marginBottom: 24,
              alignItems: 'flex-start',
              cursor: 'pointer'
            }}
          >
            <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
            <span style={{ color: '#27272a', lineHeight: 1.5 }}>
              I certify that all credentials and experience provided are accurate and factual under Nigerian educational practice standards. I agree to mentor students ethically and professionally.
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn outline"
              onClick={() => setStep(2)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn outline" name="status" value="draft" disabled={pending}>
                Save Draft
              </button>
              <button className="btn" name="status" value="submitted" disabled={pending}>
                {pending ? 'Activating with Pathwise AI…' : 'Submit & Activate Profile'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
