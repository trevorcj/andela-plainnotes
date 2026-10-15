import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey || !publishableKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey);
const userClient = createClient(supabaseUrl, publishableKey);

async function main() {
  console.log('Authenticating as admin user...');
  const linkRes = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'trevorcjustus@gmail.com'
  });

  const token_hash = linkRes.data?.properties?.hashed_token;
  const verifyRes = await userClient.auth.verifyOtp({ token_hash, type: 'magiclink' });
  if (verifyRes.error) {
    console.error('Auth verification failed:', verifyRes.error);
    process.exit(1);
  }
  console.log('Successfully authenticated as admin.');

  const { data: sources } = await userClient.from('sources').select('id').limit(1);
  const source_id = sources[0].id;

  const universitiesToSeed = [
    {
      name: 'Ahmadu Bello University',
      short_name: 'ABU',
      slug: 'ahmadu-bello-university',
      state: 'Kaduna',
      institution_type: 'Federal',
      website: 'https://abu.edu.ng',
      description: 'Major federal research university located in Zaria, Kaduna State, founded in 1962.',
      source_id,
      published: true
    },
    {
      name: 'University of Benin',
      short_name: 'UNIBEN',
      slug: 'university-of-benin',
      state: 'Edo',
      institution_type: 'Federal',
      website: 'https://uniben.edu.ng',
      description: 'Leading federal research university located in Benin City, Edo State, founded in 1970.',
      source_id,
      published: true
    },
    {
      name: 'University of Ilorin',
      short_name: 'UNILORIN',
      slug: 'university-of-ilorin',
      state: 'Kwara',
      institution_type: 'Federal',
      website: 'https://unilorin.edu.ng',
      description: 'Renowned federal university situated in Ilorin, Kwara State, known for academic stability.',
      source_id,
      published: true
    },
    {
      name: 'Federal University of Technology, Akure',
      short_name: 'FUTA',
      slug: 'federal-university-of-technology-akure',
      state: 'Ondo',
      institution_type: 'Federal',
      website: 'https://futa.edu.ng',
      description: 'Top-tier federal university of technology specializing in engineering and applied sciences in Akure.',
      source_id,
      published: true
    },
    {
      name: 'Federal University of Technology, Minna',
      short_name: 'FUTMINNA',
      slug: 'federal-university-of-technology-minna',
      state: 'Niger',
      institution_type: 'Federal',
      website: 'https://futminna.edu.ng',
      description: 'Federal university of technology located in Minna, Niger State, focusing on scientific engineering.',
      source_id,
      published: true
    },
    {
      name: 'Federal University of Technology, Owerri',
      short_name: 'FUTO',
      slug: 'federal-university-of-technology-owerri',
      state: 'Imo',
      institution_type: 'Federal',
      website: 'https://futo.edu.ng',
      description: 'Premier federal technology university located in Owerri, Imo State, established in 1980.',
      source_id,
      published: true
    },
    {
      name: 'Lagos State University',
      short_name: 'LASU',
      slug: 'lagos-state-university',
      state: 'Lagos',
      institution_type: 'State',
      website: 'https://lasu.edu.ng',
      description: 'High-ranking state university located in Ojo, Lagos State, with multi-campus professional faculties.',
      source_id,
      published: true
    },
    {
      name: 'University of Port Harcourt',
      short_name: 'UNIPORT',
      slug: 'university-of-port-harcourt',
      state: 'Rivers',
      institution_type: 'Federal',
      website: 'https://uniport.edu.ng',
      description: 'Prominent federal university located in Choba, Port Harcourt, Rivers State.',
      source_id,
      published: true
    },
    {
      name: 'Bayero University Kano',
      short_name: 'BUK',
      slug: 'bayero-university-kano',
      state: 'Kano',
      institution_type: 'Federal',
      website: 'https://buk.edu.ng',
      description: 'Major federal institution located in Kano State, renowned for medicine, engineering and humanities.',
      source_id,
      published: true
    },
    {
      name: 'Babcock University',
      short_name: 'BABCOCK',
      slug: 'babcock-university',
      state: 'Ogun',
      institution_type: 'Private',
      website: 'https://babcock.edu.ng',
      description: 'Private Christian co-educational university located in Ilishan-Remo, Ogun State.',
      source_id,
      published: true
    },
    {
      name: 'Afe Babalola University',
      short_name: 'ABUAD',
      slug: 'afe-babalola-university',
      state: 'Ekiti',
      institution_type: 'Private',
      website: 'https://abuad.edu.ng',
      description: 'Leading private university in Ado-Ekiti, Ekiti State, known for law, medicine and modern engineering.',
      source_id,
      published: true
    },
    {
      name: 'Landmark University',
      short_name: 'LMU',
      slug: 'landmark-university',
      state: 'Kwara',
      institution_type: 'Private',
      website: 'https://lmu.edu.ng',
      description: 'Pioneering private university located in Omu-Aran, Kwara State, focused on tech and agrarian science.',
      source_id,
      published: true
    },
    {
      name: 'University of Jos',
      short_name: 'UNIJOS',
      slug: 'university-of-jos',
      state: 'Plateau',
      institution_type: 'Federal',
      website: 'https://unijos.edu.ng',
      description: 'Federal university located in Jos, Plateau State, established in 1975.',
      source_id,
      published: true
    },
    {
      name: 'Delta State University',
      short_name: 'DELSU',
      slug: 'delta-state-university',
      state: 'Delta',
      institution_type: 'State',
      website: 'https://delsu.edu.ng',
      description: 'State university with main campus in Abraka, Delta State, offering extensive undergraduate degrees.',
      source_id,
      published: true
    }
  ];

  console.log('Seeding universities...');
  for (const uni of universitiesToSeed) {
    const { error } = await userClient.from('universities').upsert(uni, { onConflict: 'slug' });
    if (error) console.error(`Error inserting ${uni.short_name}:`, error.message);
    else console.log(`✓ Seeded ${uni.short_name}`);
  }

  // Fetch all universities and courses
  const { data: allUnis } = await userClient.from('universities').select('id, short_name, name');
  const { data: allCourses } = await userClient.from('courses').select('id, name, slug');

  console.log(`Loaded ${allUnis.length} universities and ${allCourses.length} courses.`);

  const uniMap = new Map(allUnis.map(u => [u.short_name, u.id]));
  const courseMap = new Map(allCourses.map(c => [c.name, c.id]));

  // Build Admission Rules for key courses
  const ruleTemplates = [
    // Computer Science
    {
      course: 'Computer Science',
      subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
      utme: ['English', 'Mathematics', 'Physics', 'Chemistry'],
      universities: [
        { uni: 'UNILAG', cutoff: 240 },
        { uni: 'UI', cutoff: 220 },
        { uni: 'OAU', cutoff: 230 },
        { uni: 'UNN', cutoff: 220 },
        { uni: 'ABU', cutoff: 210 },
        { uni: 'FUTA', cutoff: 225 },
        { uni: 'UNILORIN', cutoff: 220 },
        { uni: 'LASU', cutoff: 210 },
        { uni: 'CU', cutoff: 200 },
        { uni: 'FUTO', cutoff: 215 },
        { uni: 'BUK', cutoff: 200 },
        { uni: 'ABUAD', cutoff: 190 }
      ]
    },
    // Software Engineering
    {
      course: 'Software Engineering',
      subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Economics'],
      utme: ['English', 'Mathematics', 'Physics', 'Chemistry'],
      universities: [
        { uni: 'FUTA', cutoff: 230 },
        { uni: 'UNILAG', cutoff: 245 },
        { uni: 'CU', cutoff: 210 },
        { uni: 'BABCOCK', cutoff: 190 },
        { uni: 'ABUAD', cutoff: 200 },
        { uni: 'LASU', cutoff: 215 }
      ]
    },
    // Medicine & Surgery
    {
      course: 'Medicine & Surgery',
      subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
      utme: ['English', 'Biology', 'Chemistry', 'Physics'],
      universities: [
        { uni: 'UNILAG', cutoff: 250 },
        { uni: 'UI', cutoff: 260 },
        { uni: 'OAU', cutoff: 250 },
        { uni: 'UNN', cutoff: 250 },
        { uni: 'ABU', cutoff: 240 },
        { uni: 'UNIBEN', cutoff: 250 },
        { uni: 'UNILORIN', cutoff: 245 },
        { uni: 'LASU', cutoff: 240 },
        { uni: 'UNIPORT', cutoff: 240 },
        { uni: 'UNIJOS', cutoff: 235 },
        { uni: 'ABUAD', cutoff: 230 },
        { uni: 'BABCOCK', cutoff: 220 }
      ]
    },
    // Law (LL.B)
    {
      course: 'Law (LL.B)',
      subjects: ['English Language', 'Literature in English', 'Government', 'CRS', 'Mathematics'],
      utme: ['English', 'Literature in English', 'Government', 'CRS'],
      universities: [
        { uni: 'UNILAG', cutoff: 250 },
        { uni: 'UI', cutoff: 255 },
        { uni: 'OAU', cutoff: 245 },
        { uni: 'UNN', cutoff: 245 },
        { uni: 'UNIBEN', cutoff: 240 },
        { uni: 'LASU', cutoff: 235 },
        { uni: 'ABUAD', cutoff: 220 },
        { uni: 'BABCOCK', cutoff: 210 }
      ]
    },
    // Nursing Science
    {
      course: 'Nursing Science',
      subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
      utme: ['English', 'Biology', 'Chemistry', 'Physics'],
      universities: [
        { uni: 'UNILAG', cutoff: 235 },
        { uni: 'UI', cutoff: 240 },
        { uni: 'UNN', cutoff: 230 },
        { uni: 'OAU', cutoff: 230 },
        { uni: 'UNIBEN', cutoff: 235 },
        { uni: 'LASU', cutoff: 225 },
        { uni: 'ABUAD', cutoff: 210 },
        { uni: 'BABCOCK', cutoff: 200 }
      ]
    },
    // Accounting
    {
      course: 'Accounting',
      subjects: ['English Language', 'Mathematics', 'Economics', 'Financial Accounting', 'Commerce'],
      utme: ['English', 'Mathematics', 'Economics', 'Commerce'],
      universities: [
        { uni: 'UNILAG', cutoff: 225 },
        { uni: 'UI', cutoff: 220 },
        { uni: 'OAU', cutoff: 220 },
        { uni: 'UNN', cutoff: 215 },
        { uni: 'UNILORIN', cutoff: 210 },
        { uni: 'CU', cutoff: 200 },
        { uni: 'LASU', cutoff: 205 },
        { uni: 'BABCOCK', cutoff: 185 }
      ]
    },
    // Electrical Engineering
    {
      course: 'Electrical & Electronics Engineering',
      subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Technical Drawing'],
      utme: ['English', 'Mathematics', 'Physics', 'Chemistry'],
      universities: [
        { uni: 'UNILAG', cutoff: 235 },
        { uni: 'FUTA', cutoff: 220 },
        { uni: 'UNN', cutoff: 220 },
        { uni: 'ABU', cutoff: 215 },
        { uni: 'FUTO', cutoff: 215 },
        { uni: 'CU', cutoff: 200 }
      ]
    },
    // Pharmacy
    {
      course: 'Pharmacy',
      subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
      utme: ['English', 'Biology', 'Chemistry', 'Physics'],
      universities: [
        { uni: 'UNILAG', cutoff: 240 },
        { uni: 'UI', cutoff: 245 },
        { uni: 'OAU', cutoff: 240 },
        { uni: 'UNN', cutoff: 235 },
        { uni: 'UNIBEN', cutoff: 240 },
        { uni: 'UNIJOS', cutoff: 230 }
      ]
    },
    // Mass Communication
    {
      course: 'Mass Communication',
      subjects: ['English Language', 'Literature in English', 'Government', 'Economics', 'CRS'],
      utme: ['English', 'Literature in English', 'Government', 'CRS'],
      universities: [
        { uni: 'UNILAG', cutoff: 230 },
        { uni: 'UNN', cutoff: 220 },
        { uni: 'UNILORIN', cutoff: 215 },
        { uni: 'CU', cutoff: 195 },
        { uni: 'LASU', cutoff: 210 }
      ]
    },
    // Economics
    {
      course: 'Economics',
      subjects: ['English Language', 'Mathematics', 'Economics', 'Government', 'Commerce'],
      utme: ['English', 'Economics', 'Mathematics', 'Government'],
      universities: [
        { uni: 'UNILAG', cutoff: 225 },
        { uni: 'UI', cutoff: 230 },
        { uni: 'OAU', cutoff: 220 },
        { uni: 'UNN', cutoff: 215 },
        { uni: 'UNILORIN', cutoff: 210 },
        { uni: 'CU', cutoff: 195 }
      ]
    },
    // Cybersecurity
    {
      course: 'Cybersecurity',
      subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Computer Studies'],
      utme: ['English', 'Mathematics', 'Physics', 'Chemistry'],
      universities: [
        { uni: 'FUTA', cutoff: 225 },
        { uni: 'FUTMINNA', cutoff: 210 },
        { uni: 'FUTO', cutoff: 210 },
        { uni: 'CU', cutoff: 200 },
        { uni: 'ABUAD', cutoff: 190 }
      ]
    }
  ];

  console.log('Seeding admission rules across universities and courses...');
  let rulesAdded = 0;
  for (const template of ruleTemplates) {
    const courseId = courseMap.get(template.course);
    if (!courseId) {
      console.warn(`Course not found: ${template.course}`);
      continue;
    }

    for (const uniEntry of template.universities) {
      const uniId = uniMap.get(uniEntry.uni);
      if (!uniId) {
        console.warn(`University not found: ${uniEntry.uni}`);
        continue;
      }

      const rule = {
        course_id: courseId,
        university_id: uniId,
        admission_cycle: '2024/2025',
        source_id,
        required_subjects: template.subjects,
        min_utme: uniEntry.cutoff,
        max_sittings: 2,
        valid_until: '2026-12-31',
        published: true,
        minimum_credit_grade: 'C6',
        allow_mixed_exams: true,
        utme_subjects: template.utme
      };

      const { error } = await userClient.from('admission_rules').upsert(rule, {
        onConflict: 'course_id,university_id,admission_cycle'
      });

      if (error) {
        console.error(`Error adding rule for ${template.course} at ${uniEntry.uni}:`, error.message);
      } else {
        rulesAdded++;

        // Also seed university_courses
        try {
          await userClient.from('university_courses').upsert({
            university_id: uniId,
            course_id: courseId,
            source_id,
            admission_cycle: '2024/2025',
            notes: `Accredited program under JAMB brochure standard. Minimum UTME ${uniEntry.cutoff}.`,
            published: true
          }, { onConflict: 'university_id,course_id,admission_cycle' });
        } catch {}
      }
    }
  }

  console.log(`\n🎉 Successfully seeded ${rulesAdded} admission rules and linked university courses!`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
