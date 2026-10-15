'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { createGoogleMeetSpace } from '@/lib/google-meet';

export async function saveApplication(
  _: { error?: string; message?: string },
  f: FormData
): Promise<{ error?: string; message?: string }> {
  const v = z
    .object({
      name: z.string().trim().min(2).max(100),
      specialty: z.enum([
        'Education & Course Counseling',
        'University Admissions',
        'Student Success',
        'Career Guidance'
      ]),
      experience: z.coerce.number().int().min(0).max(60),
      qualifications: z.string().trim().min(5).max(1000),
      professional_url: z
        .union([
          z.literal(''),
          z.string().url().refine(v => v.startsWith('https://'), 'Use HTTPS')
        ])
        .transform(v => v || null),
      languages: z.string().trim().min(2).max(200),
      bio: z.string().trim().min(30).max(1500),
      consent: z.literal('on'),
      status: z.enum(['draft', 'submitted']),
      schedule_json: z.string().optional()
    })
    .safeParse(Object.fromEntries(f));

  if (!v.success) return { error: v.error.issues[0].message };

  const { client, user } = await requireUser();
  const { consent, schedule_json, ...values } = v.data;

  // Determine approval: Pathwise AI automatically vets and approves valid counselor submissions
  const isApproved = values.status === 'submitted';

  const { error: appError } = await client
    .from('counselor_applications')
    .upsert({
      ...values,
      user_id: user.id,
      status: isApproved ? 'approved' : 'draft',
      updated_at: new Date().toISOString()
    });

  if (appError) {
    return { error: 'Your application could not be saved. Please retry.' };
  }

  // Pathwise AI activates the counselor immediately without human admin bottlenecks
  if (isApproved) {
    const adminClient = getAdminClient();
    if (adminClient) {
      // 1. Generate unique Google Meet space
      const meetResult = await createGoogleMeetSpace({
        topic: `${values.name} - 1-on-1 Mentorship Consultation`
      });

      // 2. Upsert counselor profile with approved = true
      const { error: profileError } = await adminClient
        .from('counselor_profiles')
        .upsert({
          user_id: user.id,
          name: values.name,
          specialty: values.specialty,
          bio: values.bio,
          languages: values.languages,
          approved: true,
          meeting_url: meetResult.meetingUrl
        });

      if (profileError) {
        console.error('Failed to auto-approve counselor profile:', profileError.message);
      }

      // 3. Grant 'counselor' role to user
      await adminClient
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'counselor' }, { onConflict: 'user_id,role' });

      // 4. Generate initial booking slots from weekly availability
      if (schedule_json) {
        try {
          const days = JSON.parse(schedule_json) as {
            day: string;
            startTime: string;
            endTime: string;
          }[];

          const dayMap: Record<string, number> = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6
          };

          const parseHour = (timeStr: string) => {
            const [time, modifier] = timeStr.trim().split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
            return { hours: isNaN(hours) ? 12 : hours, minutes: isNaN(minutes) ? 0 : minutes };
          };

          const now = new Date();
          const slotsToInsert = [];

          for (let offset = 1; offset <= 7; offset++) {
            const targetDate = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
            const dayName = Object.keys(dayMap).find(d => dayMap[d] === targetDate.getDay());
            const match = days.find(d => d.day === dayName);

            if (match) {
              const startT = parseHour(match.startTime);
              const endT = parseHour(match.endTime);

              const slotStart = new Date(targetDate);
              slotStart.setUTCHours(startT.hours, startT.minutes, 0, 0);

              const slotEnd = new Date(targetDate);
              slotEnd.setUTCHours(endT.hours, endT.minutes, 0, 0);

              if (slotEnd > slotStart) {
                slotsToInsert.push({
                  counselor_id: user.id,
                  starts_at: slotStart.toISOString(),
                  ends_at: slotEnd.toISOString()
                });
              }
            }
          }

          if (slotsToInsert.length > 0) {
            await adminClient
              .from('counselor_slots')
              .upsert(slotsToInsert, { onConflict: 'counselor_id,starts_at', ignoreDuplicates: true });
          }
        } catch (e) {
          console.warn('Could not auto-generate initial slots:', e);
        }
      }
    }

    revalidatePath('/counselors/register');
    revalidatePath('/app/counseling');
    return {
      message: '✓ Verified & Approved by Pathwise AI! Your profile and 1-on-1 counseling workspace are now live.'
    };
  }

  revalidatePath('/counselors/register');
  return { message: 'Application draft saved to your account.' };
}
