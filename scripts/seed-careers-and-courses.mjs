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

  // 1. Seed Aeronautical Engineering and other advanced courses if missing
  const extraCourses = [
    {
      name: 'Aeronautical Engineering',
      slug: 'aeronautical-engineering',
      field: 'Engineering',
      duration_years: 5,
      description: 'Specialized aerospace engineering degree covering aerodynamics, aircraft propulsion, avionics, flight dynamics, and structural mechanics for commercial and defense aviation.',
      source_id,
      published: true
    },
    {
      name: 'Mechatronics Engineering',
      slug: 'mechatronics-engineering',
      field: 'Engineering',
      duration_years: 5,
      description: 'Synergistic integration of precision mechanical engineering, electronics, computer control, and robotics for automated manufacturing and smart systems.',
      source_id,
      published: true
    },
    {
      name: 'Biomedical Engineering',
      slug: 'biomedical-engineering',
      field: 'Engineering',
      duration_years: 5,
      description: 'Application of engineering principles to medicine and biological sciences, designing life-saving medical devices, prosthetics, and diagnostic equipment.',
      source_id,
      published: true
    },
    {
      name: 'Marine Engineering',
      slug: 'marine-engineering',
      field: 'Engineering',
      duration_years: 5,
      description: 'Engineering design, operation, and maintenance of propulsion systems, offshore structures, marine vessels, and maritime power plants.',
      source_id,
      published: true
    }
  ];

  for (const c of extraCourses) {
    const { data: existing } = await userClient.from('courses').select('id').eq('slug', c.slug).maybeSingle();
    if (!existing) {
      const { error } = await userClient.from('courses').insert(c);
      if (error) console.error(`Error inserting course ${c.name}:`, error.message);
      else console.log(`Inserted course: ${c.name}`);
    } else {
      console.log(`Course exists: ${c.name}`);
    }
  }

  // 2. Seed comprehensive Careers
  const careersToSeed = [
    {
      name: 'Aeronautical Engineer',
      slug: 'aeronautical-engineer',
      field: 'Engineering',
      description: 'Designs, manufactures, tests, and optimizes fixed-wing aircraft, helicopters, propulsion systems, and flight instruments in civil and military aviation.',
      skills: ['Aerodynamics', 'Flight Mechanics', 'Propulsion Systems', 'CAD/CAM', 'Avionics', 'MATLAB/Simulink'],
      source_id,
      published: true
    },
    {
      name: 'Avionics & Flight Systems Specialist',
      slug: 'avionics-specialist',
      field: 'Engineering',
      description: 'Installs, inspects, and troubleshoots electronic navigation, radar, communications, and fly-by-wire flight management systems for aerospace craft.',
      skills: ['Radar Systems', 'Navigation Systems', 'Flight Software', 'Embedded Systems', 'Signal Processing'],
      source_id,
      published: true
    },
    {
      name: 'Aircraft Maintenance & Airworthiness Engineer',
      slug: 'aircraft-maintenance-engineer',
      field: 'Engineering',
      description: 'Ensures commercial and military fleets comply with Nigerian Civil Aviation Authority (NCAA) airworthiness directives through rigorous maintenance and diagnostics.',
      skills: ['NCAA Regulations', 'Gas Turbine Overhaul', 'Non-Destructive Testing', 'Structural Inspection'],
      source_id,
      published: true
    },
    {
      name: 'Software Engineer',
      slug: 'software-engineer',
      field: 'Science & Technology',
      description: 'Architects and builds robust, scalable applications, distributed backends, web platforms, and mobile apps for enterprise and fintech ecosystems.',
      skills: ['TypeScript', 'Python', 'System Architecture', 'PostgreSQL', 'Cloud Infrastructure', 'Algorithms'],
      source_id,
      published: true
    },
    {
      name: 'Cloud Solutions Architect',
      slug: 'cloud-solutions-architect',
      field: 'Science & Technology',
      description: 'Designs resilient cloud infrastructure across AWS, GCP, and Azure, optimizing performance, cost, and multi-region high availability.',
      skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD Pipelines', 'Cybersecurity', 'Microservices'],
      source_id,
      published: true
    },
    {
      name: 'Cybersecurity Analyst & Penetration Tester',
      slug: 'cybersecurity-analyst',
      field: 'Science & Technology',
      description: 'Defends digital assets and networks against adversarial intrusion, performing threat modelling, vulnerability assessments, and forensic investigations.',
      skills: ['Ethical Hacking', 'Network Security', 'SOC Operations', 'Cryptography', 'Incident Response'],
      source_id,
      published: true
    },
    {
      name: 'Data Scientist & AI Specialist',
      slug: 'data-scientist-ai-specialist',
      field: 'Science & Technology',
      description: 'Develops predictive machine learning models, statistical analyses, and generative AI pipelines that transform raw data into high-impact business decisions.',
      skills: ['Python', 'Machine Learning', 'TensorFlow/PyTorch', 'SQL', 'Data Modeling', 'Generative AI'],
      source_id,
      published: true
    },
    {
      name: 'Robotics & Automation Engineer',
      slug: 'robotics-automation-engineer',
      field: 'Engineering',
      description: 'Develops industrial automated manufacturing cells, autonomous robotic platforms, sensors, and PLC control loops.',
      skills: ['ROS', 'PLC Programming', 'Microcontrollers', 'Mechatronic Design', 'Motion Control'],
      source_id,
      published: true
    },
    {
      name: 'Medical Doctor & General Practitioner',
      slug: 'medical-doctor-gp',
      field: 'Health Sciences',
      description: 'Provides holistic clinical care, evaluates patient symptoms, prescribes treatments, and manages disease prevention in primary and tertiary hospitals.',
      skills: ['Clinical Diagnostics', 'Patient Management', 'Emergency Care', 'Pharmacotherapy', 'Medical Ethics'],
      source_id,
      published: true
    },
    {
      name: 'Registered Nursing Officer',
      slug: 'registered-nursing-officer',
      field: 'Health Sciences',
      description: 'Administers specialized nursing care, patient monitoring, critical care resuscitation, and post-operative recovery support.',
      skills: ['Patient Triage', 'Critical Care Nursing', 'Pharmacology', 'Wound Management', 'Patient Advocacy'],
      source_id,
      published: true
    },
    {
      name: 'Clinical & Hospital Pharmacist',
      slug: 'clinical-pharmacist',
      field: 'Health Sciences',
      description: 'Formulates and dispenses pharmaceutical remedies, monitors drug interactions, and conducts therapeutic drug monitoring.',
      skills: ['Pharmacology', 'Drug Dispensing', 'Toxicology', 'Formulation Chemistry', 'Patient Counseling'],
      source_id,
      published: true
    },
    {
      name: 'Civil & Structural Design Engineer',
      slug: 'civil-structural-engineer',
      field: 'Engineering',
      description: 'Plans, analyzes, and supervises construction of bridges, skyscrapers, transportation corridors, and stormwater infrastructure across Nigeria.',
      skills: ['AutoCAD/Civil 3D', 'Structural Mechanics', 'Soil Mechanics', 'Project Management', 'COREN Standards'],
      source_id,
      published: true
    },
    {
      name: 'Electrical Power Systems Engineer',
      slug: 'electrical-power-engineer',
      field: 'Engineering',
      description: 'Designs national power grid transmission substations, renewable energy arrays, and electrical distribution for industrial plants.',
      skills: ['Power Systems', 'Renewable Energy', 'Substation Design', 'Circuit Theory', 'Safety Standards'],
      source_id,
      published: true
    },
    {
      name: 'Petroleum Reservoir & Drilling Engineer',
      slug: 'petroleum-reservoir-engineer',
      field: 'Engineering',
      description: 'Models subsurface hydrocarbon reservoirs, designs drilling strings, and optimizes well production across offshore and onshore fields.',
      skills: ['Reservoir Simulation', 'Drilling Engineering', 'Well Logging', 'Fluid Mechanics', 'Offshore Safety'],
      source_id,
      published: true
    },
    {
      name: 'Corporate Attorney & Legal Counsel',
      slug: 'corporate-attorney',
      field: 'Social Sciences',
      description: 'Advises corporate boards on commercial transactions, mergers & acquisitions, regulatory compliance with CAC/SEC, and dispute arbitration.',
      skills: ['Commercial Law', 'Contract Negotiation', 'Litigation', 'Legal Research', 'Regulatory Compliance'],
      source_id,
      published: true
    },
    {
      name: 'Chartered Accountant & Financial Controller',
      slug: 'chartered-accountant-fc',
      field: 'Business',
      description: 'Directs statutory financial reporting, international tax structuring, IFRS accounting audits, and budgetary control for corporations.',
      skills: ['IFRS Standards', 'Financial Auditing', 'Tax Compliance', 'Cost Accounting', 'ERP Systems'],
      source_id,
      published: true
    },
    {
      name: 'Investment Banker & Portfolio Manager',
      slug: 'investment-banker',
      field: 'Business',
      description: 'Structures corporate capital raises, syndicates equity & debt financing, and conducts valuation models for institutional investment portfolios.',
      skills: ['Financial Modeling', 'DCF Valuation', 'Equity Research', 'M&A Advisory', 'Portfolio Management'],
      source_id,
      published: true
    }
  ];

  for (const car of careersToSeed) {
    const { data: existing } = await userClient.from('careers').select('id').eq('slug', car.slug).maybeSingle();
    if (!existing) {
      const { error } = await userClient.from('careers').insert(car);
      if (error) console.error(`Error inserting career ${car.name}:`, error.message);
      else console.log(`Inserted career: ${car.name}`);
    } else {
      console.log(`Career exists: ${car.name}`);
    }
  }

  // 3. Link courses to careers in course_careers
  const { data: allCourses } = await userClient.from('courses').select('id, slug, field');
  const { data: allCareers } = await userClient.from('careers').select('id, slug, field');

  const courseMap = Object.fromEntries(allCourses.map(c => [c.slug, c.id]));
  const careerMap = Object.fromEntries(allCareers.map(c => [c.slug, c.id]));

  const linksToCreate = [
    // Aeronautical Engineering
    { course: 'aeronautical-engineering', careers: ['aeronautical-engineer', 'avionics-specialist', 'aircraft-maintenance-engineer'] },
    // Software Engineering
    { course: 'software-engineering', careers: ['software-engineer', 'cloud-solutions-architect', 'cybersecurity-analyst', 'data-scientist-ai-specialist'] },
    // Computer Science
    { course: 'computer-science', careers: ['software-engineer', 'data-scientist-ai-specialist', 'cybersecurity-analyst'] },
    // Cybersecurity
    { course: 'cybersecurity', careers: ['cybersecurity-analyst', 'cloud-solutions-architect'] },
    // Data Science & AI
    { course: 'data-science-artificial-intelligence', careers: ['data-scientist-ai-specialist', 'software-engineer'] },
    // Information Technology
    { course: 'information-technology', careers: ['cloud-solutions-architect', 'cybersecurity-analyst', 'software-engineer'] },
    // Medicine & Surgery
    { course: 'medicine-surgery', careers: ['medical-doctor-gp', 'medical-doctor'] },
    // Nursing Science
    { course: 'nursing-science', careers: ['registered-nursing-officer'] },
    // Pharmacy
    { course: 'pharmacy', careers: ['clinical-pharmacist'] },
    // Civil Engineering
    { course: 'civil-engineering', careers: ['civil-structural-engineer'] },
    // Electrical & Electronics
    { course: 'electrical-electronics-engineering', careers: ['electrical-power-engineer', 'avionics-specialist', 'robotics-automation-engineer'] },
    // Mechanical Engineering
    { course: 'mechanical-engineering', careers: ['robotics-automation-engineer', 'aircraft-maintenance-engineer', 'civil-structural-engineer'] },
    // Mechatronics Engineering
    { course: 'mechatronics-engineering', careers: ['robotics-automation-engineer', 'avionics-specialist', 'software-engineer'] },
    // Petroleum Engineering
    { course: 'petroleum-engineering', careers: ['petroleum-reservoir-engineer'] },
    // Law
    { course: 'law-llb', careers: ['corporate-attorney'] },
    // Accounting
    { course: 'accounting', careers: ['chartered-accountant-fc', 'chartered-accountant', 'investment-banker'] },
    // Banking & Finance
    { course: 'banking-finance', careers: ['investment-banker', 'chartered-accountant-fc'] },
    // Economics
    { course: 'economics', careers: ['investment-banker', 'chartered-accountant-fc'] },
    // Business Administration
    { course: 'business-administration', careers: ['investment-banker', 'chartered-accountant-fc'] }
  ];

  let linkedCount = 0;
  for (const link of linksToCreate) {
    const courseId = courseMap[link.course];
    if (!courseId) continue;

    for (const carSlug of link.careers) {
      const careerId = careerMap[carSlug];
      if (!careerId) continue;

      const { error } = await userClient.from('course_careers').insert({
        course_id: courseId,
        career_id: careerId
      });
      if (!error) linkedCount++;
    }
  }
  console.log(`Successfully linked ${linkedCount} course-career connections.`);

  // 4. Seed admission rules for Aeronautical Engineering
  const aeroId = courseMap['aeronautical-engineering'];
  if (aeroId) {
    const { data: unis } = await userClient.from('universities').select('id, short_name');
    const uniMap = Object.fromEntries(unis.map(u => [u.short_name, u.id]));

    // AFIT Kaduna, KWASU, CU, ABU
    const aeroRules = [
      {
        course_id: aeroId,
        university_id: uniMap['ABU'], // Ahmadu Bello University
        admission_cycle: '2026/2027',
        source_id,
        required_subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry'],
        min_utme: 240,
        max_sittings: 1,
        valid_until: '2027-10-31',
        published: true
      },
      {
        course_id: aeroId,
        university_id: uniMap['CU'], // Covenant University
        admission_cycle: '2026/2027',
        source_id,
        required_subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry'],
        min_utme: 220,
        max_sittings: 2,
        valid_until: '2027-10-31',
        published: true
      },
      {
        course_id: aeroId,
        university_id: uniMap['FUTA'], // Federal Univ of Tech Akure
        admission_cycle: '2026/2027',
        source_id,
        required_subjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry'],
        min_utme: 250,
        max_sittings: 1,
        valid_until: '2027-10-31',
        published: true
      }
    ].filter(r => Boolean(r.university_id));

    for (const rule of aeroRules) {
      const { error } = await userClient.from('admission_rules').insert(rule);
      if (!error) console.log(`Created admission rule for Aeronautical Engineering at university.`);
    }
  }

  console.log('Seeding finished successfully.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
