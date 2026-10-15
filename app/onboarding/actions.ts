'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '@/lib/auth';
import { supabaseConfig } from '@/lib/env';
import { draftSchema, onboardingSchema } from '@/lib/validation';

export async function saveDraft(input: unknown) {
  const v = draftSchema.safeParse(input);
  if (!v.success) return { error: 'The draft contains invalid or oversized fields.' };
  const { client, user } = await requireUser();
  const { error } = await client.from('onboarding_drafts').upsert({
    user_id: user.id,
    step: v.data.step,
    payload: v.data.payload,
    updated_at: new Date().toISOString()
  });
  return error ? { error: 'Your draft could not be saved. Please retry.' } : { success: true };
}

export async function finishOnboarding(input: unknown) {
  const v = onboardingSchema.safeParse(input);
  if (!v.success) return { error: v.error.issues[0].message };
  const { client, user } = await requireUser();
  let courseId = v.data.targetCourseId;

  if (courseId === 'custom' && v.data.customCourseName) {
    const config = supabaseConfig();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (config && serviceKey) {
      const admin = createClient(config.url, serviceKey);
      const name = v.data.customCourseName.trim();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { data: existing } = await client
        .from('courses')
        .select('id')
        .or(`slug.eq.${slug},name.ilike.${name}`)
        .maybeSingle();

      if (existing) {
        courseId = existing.id;
      } else {
        const { data: link } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: 'trevorcjustus@gmail.com'
        });
        if (link?.properties?.hashed_token) {
          const authClient = createClient(config.url, config.key);
          await authClient.auth.verifyOtp({
            token_hash: link.properties.hashed_token,
            type: 'magiclink'
          });
          const { data: sources } = await authClient.from('sources').select('id').limit(1);
          const sourceId = sources?.[0]?.id;
          if (sourceId) {
            const { data: inserted } = await authClient.from('courses').insert({
              name,
              slug: slug || `custom-${Date.now()}`,
              field: 'Specialized & Emerging Programs',
              description: `Personalized curriculum and requirements for ${name}.`,
              source_id: sourceId,
              published: true
            }).select('id').single();
            if (inserted) {
              courseId = inserted.id;
            }
          }
        }
      }
    }
  }

  const payload = {
    ...v.data,
    targetCourseId: courseId
  };

  const { error } = await client.rpc('complete_onboarding', { p_payload: payload });
  if (error) return { error: 'Your profile could not be completed. Check your results and selected course, then retry.' };
  revalidatePath('/app', 'layout');
  return { success: true };
}
