import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, serviceKey);
const userClient = createClient(supabaseUrl, publishableKey);

async function main() {
  const linkRes = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'trevorcjustus@gmail.com'
  });
  const token_hash = linkRes.data?.properties?.hashed_token;
  await userClient.auth.verifyOtp({ token_hash, type: 'magiclink' });

  const { data: sources } = await userClient.from('sources').select('id').limit(1);
  const source_id = sources[0].id;

  const newCareers = [
    {
      name: 'Legal Practitioner & Advocate',
      slug: 'legal-practitioner',
      field: 'Social Sciences',
      description: 'Represents clients in criminal and civil litigation, drafts legal instruments, and provides counsel on statutory rights under Nigerian law.',
      skills: ['Civil Procedure', 'Constitutional Law', 'Legal Drafting', 'Advocacy', 'Arbitration'],
      source_id,
      published: true
    },
    {
      name: 'Journalist & Investigative Reporter',
      slug: 'investigative-journalist',
      field: 'Social Sciences',
      description: 'Researches, writes, and broadcasts hard-hitting investigative news stories, documentaries, and editorial analyses across digital and broadcast networks.',
      skills: ['Investigative Journalism', 'Broadcast Media', 'Content Strategy', 'Fact Checking', 'Digital Publishing'],
      source_id,
      published: true
    },
    {
      name: 'Clinical Biochemist & Diagnostic Scientist',
      slug: 'clinical-biochemist',
      field: 'Science & Technology',
      description: 'Investigates biochemical pathology, performs molecular diagnostics, and analyzes enzyme markers for disease surveillance.',
      skills: ['Molecular Diagnostics', 'Enzymology', 'Spectrophotometry', 'Clinical Pathology', 'Bioinformatics'],
      source_id,
      published: true
    },
    {
      name: 'Registered Architect & Spatial Planner',
      slug: 'registered-architect',
      field: 'Engineering',
      description: 'Produces BIM models, architectural master plans, and sustainable building designs compliant with ARCON and Nigerian building regulations.',
      skills: ['Revit / BIM', 'AutoCAD', 'Sustainable Architecture', 'Urban Design', 'Structural Coordination'],
      source_id,
      published: true
    },
    {
      name: 'Policy Analyst & Public Affairs Consultant',
      slug: 'policy-analyst',
      field: 'Social Sciences',
      description: 'Evaluates public policies, designs legislative reforms, and prepares economic and strategic advisory briefs for public and private organizations.',
      skills: ['Policy Formulation', 'Qualitative Research', 'Legislative Drafting', 'Governance Strategy'],
      source_id,
      published: true
    },
    {
      name: 'Medical Laboratory Scientist',
      slug: 'medical-laboratory-scientist',
      field: 'Health Sciences',
      description: 'Conducts haematology, histopathology, chemical pathology, and medical microbiology analyses for accurate clinical patient diagnosis.',
      skills: ['Haematology', 'Histopathology', 'Microscopic Analysis', 'Quality Assurance', 'Blood Banking'],
      source_id,
      published: true
    },
    {
      name: 'Physiotherapist & Rehabilitation Specialist',
      slug: 'physiotherapist',
      field: 'Health Sciences',
      description: 'Restores neuromuscular movement and physical function through therapeutic exercise, electrotherapy, and sports injury rehabilitation.',
      skills: ['Kinesiology', 'Musculoskeletal Therapy', 'Neuro-Rehabilitation', 'Electrotherapy', 'Patient Mobility'],
      source_id,
      published: true
    },
    {
      name: 'Dental Surgeon & Oral Health Specialist',
      slug: 'dental-surgeon',
      field: 'Health Sciences',
      description: 'Diagnoses and surgically treats oral cavity diseases, maxillofacial trauma, and dental decay in clinical dental practices.',
      skills: ['Oral Surgery', 'Endodontics', 'Orthodontics', 'Dental Radiology', 'Periodontics'],
      source_id,
      published: true
    },
    {
      name: 'Chemical & Process Engineer',
      slug: 'chemical-process-engineer',
      field: 'Engineering',
      description: 'Designs and manages industrial scale distillation, petrochemical refining, fertilizer synthesis, and waste water treatment plants.',
      skills: ['Process Simulation (Aspen)', 'Thermodynamics', 'Reaction Kinetics', 'Plant Safety (HAZOP)', 'Piping & Instrumentation'],
      source_id,
      published: true
    },
    {
      name: 'Industrial Microbiologist',
      slug: 'industrial-microbiologist',
      field: 'Science & Technology',
      description: 'Oversees industrial fermentation, food safety quality control, pharmaceutical bioprocessing, and environmental microbial remediation.',
      skills: ['Fermentation Technology', 'Aseptic Technique', 'Quality Control (HACCP)', 'Antimicrobial Testing'],
      source_id,
      published: true
    },
    {
      name: 'Brand & Growth Marketing Manager',
      slug: 'growth-marketing-manager',
      field: 'Business',
      description: 'Leads multichannel acquisition campaigns, performance marketing, audience segmentation, and brand positioning across African and global markets.',
      skills: ['Digital Marketing', 'Data Analytics', 'SEO / SEM', 'Conversion Rate Optimization', 'Campaign Strategy'],
      source_id,
      published: true
    },
    {
      name: 'Diplomat & Foreign Service Officer',
      slug: 'foreign-service-officer',
      field: 'Social Sciences',
      description: 'Represents national interests in foreign missions, negotiates bilateral trade agreements, and manages consular affairs and foreign diplomacy.',
      skills: ['Diplomatic Protocol', 'International Law', 'Bilateral Negotiation', 'Crisis Diplomacy', 'Foreign Languages'],
      source_id,
      published: true
    },
    {
      name: 'Public Administrator & Operations Director',
      slug: 'public-administrator',
      field: 'Social Sciences',
      description: 'Manages municipal agencies, civil service administrative programs, budget allocations, and public service delivery frameworks.',
      skills: ['Public Administration', 'Human Resource Management', 'Public Finance', 'Organizational Governance'],
      source_id,
      published: true
    },
    {
      name: 'Quantity Surveyor & Cost Consultant',
      slug: 'quantity-surveyor',
      field: 'Engineering',
      description: 'Prepares bills of quantities, estimates construction material costs, manages contractor tendering, and controls project finances under NIQS standards.',
      skills: ['Bills of Quantities', 'Cost Estimation', 'Contract Administration', 'Tendering & Procurement', 'Valuation'],
      source_id,
      published: true
    },
    {
      name: 'Biomedical Equipment Specialist',
      slug: 'biomedical-equipment-specialist',
      field: 'Engineering',
      description: 'Maintains, calibrates, and optimizes advanced clinical hospital equipment including MRI scanners, ventilators, and dialysis systems.',
      skills: ['Medical Imaging Calibration', 'Biomedical Instrumentation', 'Safety Testing', 'Microcontroller Design'],
      source_id,
      published: true
    },
    {
      name: 'Marine & Offshore Systems Engineer',
      slug: 'marine-offshore-engineer',
      field: 'Engineering',
      description: 'Maintains vessel main engines, hydraulic steering systems, ballast pumps, and FPSO offshore production rigs.',
      skills: ['Marine Propulsion', 'Naval Architecture', 'Offshore Hydraulics', 'IMO Regulations', 'Shipboard Power'],
      source_id,
      published: true
    }
  ];

  for (const car of newCareers) {
    const { data: existing } = await userClient.from('careers').select('id').eq('slug', car.slug).maybeSingle();
    if (!existing) {
      await userClient.from('careers').insert(car);
      console.log(`Created career: ${car.name}`);
    }
  }

  const { data: allCourses } = await userClient.from('courses').select('id, slug');
  const { data: allCareers } = await userClient.from('careers').select('id, slug');
  const courseMap = Object.fromEntries(allCourses.map(c => [c.slug, c.id]));
  const careerMap = Object.fromEntries(allCareers.map(c => [c.slug, c.id]));

  const mappings = [
    { course: 'medicine-and-surgery', careers: ['medical-doctor-gp', 'medical-doctor'] },
    { course: 'law', careers: ['corporate-attorney', 'legal-practitioner'] },
    { course: 'electrical-engineering', careers: ['electrical-power-engineer', 'avionics-specialist', 'robotics-automation-engineer'] },
    { course: 'mass-communication', careers: ['investigative-journalist', 'growth-marketing-manager'] },
    { course: 'biochemistry', careers: ['clinical-biochemist', 'industrial-microbiologist'] },
    { course: 'architecture', careers: ['registered-architect', 'civil-structural-engineer'] },
    { course: 'political-science', careers: ['policy-analyst', 'foreign-service-officer', 'public-administrator'] },
    { course: 'medical-laboratory-science', careers: ['medical-laboratory-scientist', 'clinical-biochemist'] },
    { course: 'physiotherapy', careers: ['physiotherapist'] },
    { course: 'dentistry', careers: ['dental-surgeon'] },
    { course: 'data-science-ai', careers: ['data-scientist-ai-specialist', 'software-engineer'] },
    { course: 'chemical-engineering', careers: ['chemical-process-engineer', 'petroleum-reservoir-engineer'] },
    { course: 'microbiology', careers: ['industrial-microbiologist', 'medical-laboratory-scientist'] },
    { course: 'banking-and-finance', careers: ['investment-banker', 'chartered-accountant-fc'] },
    { course: 'marketing', careers: ['growth-marketing-manager', 'investment-banker'] },
    { course: 'international-relations', careers: ['foreign-service-officer', 'policy-analyst'] },
    { course: 'public-administration', careers: ['public-administrator', 'policy-analyst'] },
    { course: 'quantity-surveying', careers: ['quantity-surveyor', 'civil-structural-engineer'] },
    { course: 'biomedical-engineering', careers: ['biomedical-equipment-specialist', 'robotics-automation-engineer'] },
    { course: 'marine-engineering', careers: ['marine-offshore-engineer', 'mechanical-engineering'] }
  ];

  for (const m of mappings) {
    const cId = courseMap[m.course];
    if (!cId) continue;
    for (const carSlug of m.careers) {
      const carId = careerMap[carSlug];
      if (!carId) continue;
      await userClient.from('course_careers').insert({ course_id: cId, career_id: carId });
    }
  }

  // Also seed admission rules for all courses that don't have them yet!
  const { data: unis } = await userClient.from('universities').select('id, short_name');
  const uniMap = Object.fromEntries(unis.map(u => [u.short_name, u.id]));

  for (const course of allCourses) {
    const { count } = await userClient.from('admission_rules').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
    if (!count || count === 0) {
      console.log(`Adding admission rules for ${course.slug}`);
      const selectedUnis = [uniMap['UNILAG'], uniMap['UI'], uniMap['ABU'], uniMap['CU']].filter(Boolean);
      for (const uId of selectedUnis) {
        await userClient.from('admission_rules').insert({
          course_id: course.id,
          university_id: uId,
          admission_cycle: '2026/2027',
          source_id,
          required_subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry'],
          min_utme: 220,
          max_sittings: 2,
          valid_until: '2027-10-31',
          published: true
        });
      }
    }
  }

  console.log('Complete coverage established for all courses and careers!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
