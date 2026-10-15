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

  const universities = [
    // Federal
    { name: 'Nnamdi Azikiwe University', short_name: 'UNIZIK', state: 'Anambra', institution_type: 'Federal', website: 'https://unizik.edu.ng', description: 'Premier federal research university located in Awka, Anambra State.', slug: 'nnamdi-azikiwe-university', source_id, published: true },
    { name: 'University of Calabar', short_name: 'UNICAL', state: 'Cross River', institution_type: 'Federal', website: 'https://unical.edu.ng', description: 'Prominent federal tertiary institution in Calabar, Cross River State.', slug: 'university-of-calabar', source_id, published: true },
    { name: 'University of Uyo', short_name: 'UNIUYO', state: 'Akwa Ibom', institution_type: 'Federal', website: 'https://uniuyo.edu.ng', description: 'Federal university located in Uyo, Akwa Ibom State, known for petroleum and natural sciences.', slug: 'university-of-uyo', source_id, published: true },
    { name: 'Federal University of Agriculture, Abeokuta', short_name: 'FUNAAB', state: 'Ogun', institution_type: 'Federal', website: 'https://funaab.edu.ng', description: 'Specialized agricultural and biotechnology federal university in Abeokuta, Ogun State.', slug: 'funaab', source_id, published: true },
    { name: 'Federal University of Petroleum Resources, Effurun', short_name: 'FUPRE', state: 'Delta', institution_type: 'Federal', website: 'https://fupre.edu.ng', description: 'Specialized federal energy, oil, and gas engineering university in Effurun, Delta State.', slug: 'fupre', source_id, published: true },
    { name: 'Federal University, Oye-Ekiti', short_name: 'FUOYE', state: 'Ekiti', institution_type: 'Federal', website: 'https://fuoye.edu.ng', description: 'Rapidly expanding federal university located in Oye-Ekiti, Ekiti State.', slug: 'fuoye', source_id, published: true },
    { name: 'Federal University, Lokoja', short_name: 'FULOKOJA', state: 'Kogi', institution_type: 'Federal', website: 'https://fulokoja.edu.ng', description: 'Federal tertiary research institution located in the confluence state capital, Lokoja.', slug: 'fulokoja', source_id, published: true },
    { name: 'Air Force Institute of Technology', short_name: 'AFIT', state: 'Kaduna', institution_type: 'Federal', website: 'https://afit.edu.ng', description: 'Specialized Nigerian Air Force military and civilian aeronautical engineering institute in Kaduna.', slug: 'afit-kaduna', source_id, published: true },
    { name: 'University of Abuja', short_name: 'UNIABUJA', state: 'Abuja (FCT)', institution_type: 'Federal', website: 'https://uniabuja.edu.ng', description: 'Federal capital territory research university situated in Gwagwalada, Abuja.', slug: 'university-of-abuja', source_id, published: true },
    { name: 'Usmanu Danfodiyo University', short_name: 'UDUSOK', state: 'Sokoto', institution_type: 'Federal', website: 'https://udusok.edu.ng', description: 'Historic federal research university in Sokoto, founded in 1975.', slug: 'usmanu-danfodiyo-university', source_id, published: true },
    { name: 'University of Maiduguri', short_name: 'UNIMAID', state: 'Borno', institution_type: 'Federal', website: 'https://unimaid.edu.ng', description: 'Major federal university serving the northeastern geopolitical zone in Maiduguri, Borno.', slug: 'university-of-maiduguri', source_id, published: true },
    { name: 'Federal University of Technology, Owerri', short_name: 'FUTO', state: 'Imo', institution_type: 'Federal', website: 'https://futo.edu.ng', description: 'Premier federal technology and engineering university located in Owerri, Imo State.', slug: 'futo-owerri', source_id, published: true },
    { name: 'Modibbo Adama University', short_name: 'MAU', state: 'Adamawa', institution_type: 'Federal', website: 'https://mau.edu.ng', description: 'Federal technology research university located in Yola, Adamawa State.', slug: 'modibbo-adama-university', source_id, published: true },

    // State Universities
    { name: 'Rivers State University', short_name: 'RSU', state: 'Rivers', institution_type: 'State', website: 'https://rsu.edu.ng', description: 'Leading state research institution located in Nkpolu-Oroworukwo, Port Harcourt.', slug: 'rivers-state-university', source_id, published: true },
    { name: 'Kwara State University', short_name: 'KWASU', state: 'Kwara', institution_type: 'State', website: 'https://kwasu.edu.ng', description: 'State university renowned for aviation and aeronautical engineering programs in Malete.', slug: 'kwasu', source_id, published: true },
    { name: 'Olabisi Onabanjo University', short_name: 'OOU', state: 'Ogun', institution_type: 'State', website: 'https://oouagoiwoye.edu.ng', description: 'First state university established in Ogun State, situated in Ago-Iwoye.', slug: 'oou', source_id, published: true },
    { name: 'Ekiti State University', short_name: 'EKSU', state: 'Ekiti', institution_type: 'State', website: 'https://eksu.edu.ng', description: 'Premier state university located in Ado-Ekiti, established in 1982.', slug: 'eksu', source_id, published: true },
    { name: 'Kaduna State University', short_name: 'KASU', state: 'Kaduna', institution_type: 'State', website: 'https://kasu.edu.ng', description: 'State-owned research institution with main campuses in Kaduna city and Kafanchan.', slug: 'kasu', source_id, published: true },
    { name: 'Enugu State University of Science and Technology', short_name: 'ESUT', state: 'Enugu', institution_type: 'State', website: 'https://esut.edu.ng', description: 'Pioneering technology state university in southeastern Nigeria located in Agbani.', slug: 'esut', source_id, published: true },
    { name: 'Ambrose Alli University', short_name: 'AAU', state: 'Edo', institution_type: 'State', website: 'https://aauekpoma.edu.ng', description: 'Notable state university established by Professor Ambrose Alli in Ekpoma, Edo State.', slug: 'aau-ekpoma', source_id, published: true },
    { name: 'Osun State University', short_name: 'UNIOSUN', state: 'Osun', institution_type: 'State', website: 'https://uniosun.edu.ng', description: 'Collegiate state university spanning Osogbo, Ikire, Okuku, Ejigbo, Ifetedo, and Ipetu-Ijesha.', slug: 'uniosun', source_id, published: true },
    { name: 'Adekunle Ajasin University', short_name: 'AAUA', state: 'Ondo', institution_type: 'State', website: 'https://aaua.edu.ng', description: 'Ranked among top state universities in Nigeria, situated in Akungba-Akoko.', slug: 'aaua', source_id, published: true },
    { name: 'Benue State University', short_name: 'BSUM', state: 'Benue', institution_type: 'State', website: 'https://bsum.edu.ng', description: 'State-owned institution in Makurdi offering comprehensive sciences and humanities.', slug: 'bsum', source_id, published: true },

    // Private Universities
    { name: 'Bowen University', short_name: 'BOWEN', state: 'Osun', institution_type: 'Private', website: 'https://bowen.edu.ng', description: 'First Baptist university in Africa located in Iwo, Osun State.', slug: 'bowen-university', source_id, published: true },
    { name: 'Bells University of Technology', short_name: 'BELLSTECH', state: 'Ogun', institution_type: 'Private', website: 'https://bellsuniversity.edu.ng', description: 'First private university of technology in Nigeria, located in Ota, Ogun State.', slug: 'bellstech', source_id, published: true },
    { name: 'Pan-Atlantic University', short_name: 'PAU', state: 'Lagos', institution_type: 'Private', website: 'https://pau.edu.ng', description: 'Elite private university known for Lagos Business School and media communications.', slug: 'pau-lagos', source_id, published: true },
    { name: 'Redeemer’s University', short_name: 'RUN', state: 'Osun', institution_type: 'Private', website: 'https://run.edu.ng', description: 'Renowned for world-class genomics research (ACEGID) and clinical sciences in Ede.', slug: 'run-ede', source_id, published: true },
    { name: 'American University of Nigeria', short_name: 'AUN', state: 'Adamawa', institution_type: 'Private', website: 'https://aun.edu.ng', description: 'Development university modeled on American higher education standards in Yola.', slug: 'aun-yola', source_id, published: true },
    { name: 'Veritas University', short_name: 'VERITAS', state: 'Abuja (FCT)', institution_type: 'Private', website: 'https://veritas.edu.ng', description: 'Catholic University of Nigeria situated in Bwari, Abuja.', slug: 'veritas-abuja', source_id, published: true },
    { name: 'Al-Hikmah University', short_name: 'AL-HIKMAH', state: 'Kwara', institution_type: 'Private', website: 'https://alhikmahuniversity.edu.ng', description: 'Islamic-faith tertiary research institution located in Ilorin, Kwara State.', slug: 'al-hikmah', source_id, published: true },
    { name: 'Madonna University', short_name: 'MADONNA', state: 'Anambra', institution_type: 'Private', website: 'https://madonnauniversity.edu.ng', description: 'First Catholic university in Nigeria with campuses in Okija, Elele, and Ihiala.', slug: 'madonna-university', source_id, published: true },
    { name: 'Bingham University', short_name: 'BINGHAM', state: 'Nasarawa', institution_type: 'Private', website: 'https://binghamuni.edu.ng', description: 'ECWA private university situated along Abuja-Keffi expressway, Karu.', slug: 'bingham-university', source_id, published: true },
    { name: 'Nile University of Nigeria', short_name: 'NILE', state: 'Abuja (FCT)', institution_type: 'Private', website: 'https://nile.edu.ng', description: 'Member of the Honoris United Universities network, located in Jabi, Abuja.', slug: 'nile-university', source_id, published: true }
  ];

  let added = 0;
  for (const u of universities) {
    const { data: existing } = await userClient.from('universities').select('id').eq('slug', u.slug).maybeSingle();
    if (!existing) {
      const { error } = await userClient.from('universities').insert(u);
      if (error) console.error(`Error inserting ${u.name}:`, error.message);
      else {
        added++;
        console.log(`Added: ${u.name} (${u.short_name})`);
      }
    }
  }

  console.log(`Seeding complete. Added ${added} new Nigerian universities.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
