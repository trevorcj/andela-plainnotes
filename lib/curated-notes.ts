import { SimplifiedNote } from './types/plainnotes';

export const CURATED_AFRICAN_NOTES: SimplifiedNote[] = [
  {
    id: 'curated-001',
    title: 'Photosynthesis & Solar Sugar Conversion',
    subject: 'Biology',
    level: 'secondary',
    language: 'pidgin',
    originalText: 'Photosynthesis is the biochemical process by which photoautotrophic organisms convert light irradiance into chemical energy through the photolysis of H2O and fixation of CO2 inside the thylakoid membrane and stroma of chloroplasts, yielding D-glucose and molecular O2.',
    simplifiedText: 'Photosynthesis simply mean say green leaves dey cook food for plant using sunlight as gas cooker. The plant suck water from soil through root, catch carbon dioxide from air through small mouth for leaf (stomata), then use sunlight energy turn everything to sweet glucose and blow oxygen give us to breathe. Without this process, hunger and lack of oxygen go wipe life for earth.',
    localAnalogy: 'Look am like Mama Put cook: Sun na the gas fire, water from ground na the water inside pot, carbon dioxide na raw yam, while the green chlorophyll na Mama Put hands wey mix everything together to deliver hot Jollof (glucose).',
    examEssentials: [
      'Chemical equation must balance: 6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂.',
      'Chlorophyll inside chloroplasts captures the light energy (WAEC marking keyword: thylakoid).',
      'Light reaction splits water (photolysis); dark reaction (Calvin cycle) fixes carbon dioxide into sugar.'
    ],
    quiz: {
      question: 'Which gas is released into the atmosphere as a byproduct during the light reaction?',
      options: [
        'Oxygen (O₂)',
        'Carbon Dioxide (CO₂)',
        'Nitrogen (N₂)',
        'Methane (CH₄)'
      ],
      answerIndex: 0,
      explanation: 'Oxygen is released when sunlight splits water molecules (photolysis) inside the chloroplast!'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: PHOTOSYNTHESIS (WAEC/JAMB)*\n*Subject:* Biology | *Dialect:* Naija Pidgin 🇳🇬\n\n*In Plain Words:*\nPhotosynthesis na how green leaves dey cook food for plant. Leaves suck water from ground, catch carbon dioxide from breeze, use sunlight energy churn out glucose (food) + clean oxygen.\n\n*📌 Everyday Analogy:*\nMama Put restaurant: Sunlight na gas fire, water na pot water, CO₂ na raw yam, chlorophyll na cook hand to make delicious jollof!\n\n*🎯 3 Exam Essentials:*\n1. Equation: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.\n2. Chlorophyll captures light inside chloroplast.\n3. Light stage splits water; dark stage builds sugar.\n\n*🚀 Shared from PlainNotes — Plain African Learning*`,
    isCurated: true,
    createdAt: '2026-10-15T08:00:00Z'
  },
  {
    id: 'curated-002',
    title: 'Newton\'s Third Law: Action & Reaction',
    subject: 'Physics',
    level: 'secondary',
    language: 'pidgin',
    originalText: 'Lex III: Actioni contrariam semper et aequalem esse reactionem; sive corporum duorum actiones in se mutuo semper esse aequales et in partes contrarias dirigi. Forces always occur in matched interaction pairs acting on two distinct masses.',
    simplifiedText: 'Newton Third Law talk say: if you push anything, that thing go push you back with the exact same power, but for opposite direction. Action and reaction na 50-50 partner. You no fit push wall without the wall pushing your hand back with equal strength.',
    localAnalogy: 'When you dey jump commot from inside canoe go river bank: your leg push the canoe go back, then the canoe push you forward land for dry ground. If the canoe no push you back, you go fall enter water immediately.',
    examEssentials: [
      'Action and reaction forces are strictly EQUAL in magnitude and OPPOSITE in direction.',
      'They NEVER cancel each other out because they act on TWO DIFFERENT bodies.',
      'Always draw two distinct arrows pointing in opposite directions in your free-body diagram.'
    ],
    quiz: {
      question: 'Why don\'t action and reaction forces cancel each other to produce zero net force?',
      options: [
        'Because they act on two different objects simultaneously',
        'Because one force is always slightly larger than the other',
        'Because friction absorbs the secondary force',
        'Because they occur at different moments in time'
      ],
      answerIndex: 0,
      explanation: 'Action and reaction act on separate bodies (canoe and person, or foot and ground), so they cannot cancel each other!'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: NEWTON\'S THIRD LAW*\n*Subject:* Physics | *Dialect:* Naija Pidgin 🇳🇬\n\n*In Plain Words:*\nFor every action, equal and opposite reaction dey. If you slap wall, wall slap your palm back with equal power.\n\n*📌 Everyday Analogy:*\nJumping out of a wooden canoe: Your leg pushes canoe backwards, canoe pushes you forwards onto the shore.\n\n*🎯 Exam Essentials:*\n1. Equal magnitude, opposite direction.\n2. Acts on two DIFFERENT bodies.\n3. They NEVER cancel each other.\n\n*🚀 Shared from PlainNotes*`,
    isCurated: true,
    createdAt: '2026-10-15T08:05:00Z'
  },
  {
    id: 'curated-003',
    title: 'Ina-ina ati Idinku Agbara Owo (Inflation)',
    subject: 'Economics',
    level: 'secondary',
    language: 'yoruba',
    originalText: 'Inflation represents a sustained macroeconomic aggregate increase in the general consumer price index across trailing periods, primarily induced by demand-pull liquidity surges or cost-push supply chain shocks.',
    simplifiedText: 'Inflation (Ina-ina owo) tumọ si pe iye owo awọn nkan ti a n ra n pọ si lojoojumọ, nigbati agbara owo ti a ni n dinku. Kii ṣe pe owo dẹkun lati jẹ owo, ṣugbọn ẹgbẹ̀rún kan (₦1,000) ti o le ra akara mẹrin ni ọdun to kọja, ko le ra ju akara kan lọ loni.',
    localAnalogy: 'Ronu nipa ọja Bodija tabi Oja Oba: nigbati ọkọ ti n gbe tòròsì ati ata ko ba ri epo bẹntiroolu rà, idiyele gbigbe ọja ga soke ni ilọpo mẹta. Iya elepo ati alabara gbọdọ san owo ti o pọ ju lati ra nkan kekere.',
    examEssentials: [
      'Awọn oriṣi meji pataki: Demand-Pull (Ibeere pọ ju ipese) ati Cost-Push (Owo iṣelọpọ goke).',
      'Agbara rira (Purchasing Power) owo n dinku nigbati iye owo ba n goke.',
      'Ile-ifowopamọ aringbungbun (CBN) n lo Interest Rate lati dari inflation.'
    ],
    quiz: {
      question: 'Kini ohun pataki to n ṣẹlẹ si agbara rira (purchasing power) nigbati inflation ba goke?',
      options: [
        'Agbara rira n dinku (o n ra awọn ohun ti o kere)',
        'Agbara rira n pọ si',
        'Ko si iyipada kankan',
        'Owo n di goolu lẹsẹkẹsẹ'
      ],
      answerIndex: 0,
      explanation: 'Nigbati inflation ba goke, iye owo kanna ko le ra iye ounjẹ tabi eru ti o le ra tẹlẹ mọ!'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: INFLATION (ÈDÈ YORÙBÁ)*\n*Subject:* Economics | *Èdè:* Yorùbá 🇳🇬\n\n*Àkópọ̀:* \nInflation tumọ si pe iye owo nkan n goke, nigbati agbara owo ti o wa ni ọwọ rẹ n dinku.\n\n*📌 Àpẹẹrẹ Ọja:* \nỌkọ epo to gbowolori n mu ki ẹru ata ati epo pupa ga soke ni ọja Bodija.\n\n*🎯 Koko 3 Fun Idanwo:*\n1. Demand-Pull vs Cost-Push.\n2. Purchasing power owo n dinku.\n3. CBN n fi monetary policy dari rẹ.\n\n*🚀 PlainNotes — Eko ti o rọrun*`,
    isCurated: true,
    createdAt: '2026-10-15T08:10:00Z'
  },
  {
    id: 'curated-004',
    title: 'Hanyar Zuba Ruwa da Tattara Wutar Lantarki (Ohm\'s Law)',
    subject: 'Physics',
    level: 'secondary',
    language: 'hausa',
    originalText: 'Ohm\'s Law asserts that the current (I) propagating through an ideal conductor between two designated terminals is directly proportional to the potential difference (V) across the terminal bounds, provided invariant ambient thermal conditions.',
    simplifiedText: 'Dokar Ohm tana nuna dangantakar dake tsakanin karfin tura wuta (Voltage), gudu ko yawan wutar dake wucewa (Current), da kuma abinda ke tare hanyar wutar (Resistance). Idan karfin tura wuta ya karu, yawan wutar dake wucewa ma zai karu matukar yanayin zafin dakin bai canza ba.',
    localAnalogy: 'Kamar famfon ruwa ne: Karfin ruwa dake tura bututu shine Voltage, yawan ruwan dake fita daga bakin famfo shine Current, yayin da takunkumi ko toshewar bututun ke zama Resistance. Idan ka murde famfo da karfi, ruwa zai fita da gudu.',
    examEssentials: [
      'Daidaito na lissafi: V = I × R (Voltage = Current × Resistance).',
      'Wajibi ne a kiyaye yanayin zafin wayar (Temperature must remain constant).',
      'Ma\'aunin wutar lantarki: V (Volts), I (Amperes), R (Ohms Ω).'
    ],
    quiz: {
      question: 'Bisa dokar Ohm (V = I × R), idan Voltage ya karu yayin da Resistance bai canza ba, me zai faru da Current?',
      options: [
        'Current zai karu (yawan wutar zai karu)',
        'Current zai ragu',
        'Current zai tsaya cak a sifili',
        'Babu wani canji da zai faru'
      ],
      answerIndex: 0,
      explanation: 'Saboda Voltage da Current suna da dangantaka ta kai-tsaye (directly proportional), karuwar karfi na nufin karuwar gudun wuta!'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: OHM\'S LAW (HAUSA)*\n*Subject:* Physics | *Harshe:* Hausa 🇳🇬\n\n*Takaitaccen Bayani:*\nDokar Ohm (V = I × R) tana nuna cewa karfin tura wuta yana tafiya daidai da gudun wutar dake wucewa.\n\n*📌 Misali a Rayuwa:*\nFamfon ruwa: Karfin famfo (V), gudun ruwa (I), toshewar kofa (R).\n\n*🎯 Muhimman Abubuwa 3:*\n1. Dokar aiki: V = I × R.\n2. Yanayin zafi bai kamata ya canza ba.\n3. Ma\'aunin: Volts, Amperes, da Ohms.\n\n*🚀 Daga PlainNotes*`,
    isCurated: true,
    createdAt: '2026-10-15T08:15:00Z'
  },
  {
    id: 'curated-005',
    title: 'Database Indexing & Ngwa ngwa ịchọ Ozi (CS)',
    subject: 'Computer Science',
    level: 'tertiary',
    language: 'igbo',
    originalText: 'A database index is a redundant auxiliary data structure (frequently utilizing balanced search trees or hash tables) created to optimize query retrieval latency at the expense of computational overhead on mutation write transactions.',
    simplifiedText: 'Database Index bu usoro eji hazie ozi n\'ime kọmputa ka o wee di mfe ichota ozi obula n\'ime otu sekond. Kama kọmputa ga na-aguta nde ozi iri site na mbido ruo na ngwucha (full table scan), index na-eduga ya ozugbo n\'ebe ozi ahu no.',
    localAnalogy: 'Chee ya dika ahia Alaba International: oburu na i na-acho otu waya pụrụ iche wee na-aga site na ulo ahia nke mbu ruo na puku ise, ike ga-agwụ gị. Mana oburu na i nwere onye ndu maobu akwukwo ndekọ na-eduga gị n\'ahịrị B ọnụ ụlọ 42, i ga-achọta ya n\'otu nkeji.',
    examEssentials: [
      'Index na-eme ka SELECT (ịchọta ozi) dị ọsọ nke ukwuu (O(log n) time complexity).',
      'Ọ na-ebelata ọsọ nke INSERT/UPDATE n\'ihi na a ga-edekwa ndepụta index ọhụrụ.',
      'A na-ejikarị B-Tree ma ọ bụ Hash Index eme ya.'
    ],
    quiz: {
      question: 'Kedu ihe bu uru kachasị mma nke inwe Database Index?',
      options: [
        'Ọ na-eme ka ịchọta ozi (queries) dị ọsọ nke ukwuu',
        'Ọ na-eme ka kọmputa ghara iji batrị rụọ ọrụ',
        'Ọ na-ewepụ kpamkpam mkpa ebe nchekwa',
        'Ọ na-agbanwe data niile ka ọ bụrụ foto'
      ],
      answerIndex: 0,
      explanation: 'Database index na-enyere kọmputa aka ịchọta ozi ozugbo n\'enweghị ịgụgharị data niile sitere na mbido!'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: DATABASE INDEXING (IGBO)*\n*Subject:* Tech / CS | *Asụsụ:* Igbo 🇳🇬\n\n*Nkenke:* \nIndex bu ụzọ eji agụ ozi n\'ime kọmputa ọsọ ọsọ n\'enweghị igbu oge.\n\n*📌 Ihe Nlereanya:*\nAhịa Alaba: Ịga ozugbo n\'ụlọ ahịa nwere nọmba karịa ịgagharị n\'ụlọ ahịa puku ise n\'otu n\'otu.\n\n*🎯 Ihe 3 dị Mkpa:*\n1. Na-eme ka SELECT queries gbaa ọsọ (O(log n)).\n2. Na-eji ohere (space) na oge idegharị (write overhead).\n3. B-Trees na Hash tables bu usoro ya.\n\n*🚀 PlainNotes*`,
    isCurated: true,
    createdAt: '2026-10-15T08:20:00Z'
  },
  {
    id: 'curated-006',
    title: 'Object-Oriented Programming (OOP) Classes & Objects',
    subject: 'Computer Science',
    level: 'tertiary',
    language: 'english',
    originalText: 'Object-oriented programming paradigm utilizes modular abstraction encapsulating state variables alongside bounded operational methods within instantiated runtime reference types instantiated from class archetypes.',
    simplifiedText: 'Object-Oriented Programming (OOP) is simply a way to organize computer code by grouping real-world things together. A "Class" is a master architectural blueprint or mold. An "Object" is the actual concrete thing you produce from that blueprint.',
    localAnalogy: 'Think of an architectural plan for an estate: the blueprint drawn on paper is the Class. It specifies 3 bedrooms, 2 bathrooms, and a kitchen. The actual physical houses built on Victoria Island or in Abuja from that exact drawing are the Objects.',
    examEssentials: [
      'The 4 pillars of OOP are: Encapsulation, Abstraction, Inheritance, and Polymorphism.',
      'A Class is the blueprint (no memory allocated); an Object is an instantiated instance in memory.',
      'Constructors initialize the specific properties of a new object when created.'
    ],
    quiz: {
      question: 'Which of the following represents the relationship between a Class and an Object?',
      options: [
        'A Class is the architectural blueprint, and an Object is the physical building built from it',
        'An Object is the code template and a Class is the runtime memory',
        'They are completely identical and interchangeable terms in computer science',
        'A Class only exists inside SQL databases'
      ],
      answerIndex: 0,
      explanation: 'A Class defines the blueprint (properties and methods), while an Object is an instantiated instance of that blueprint.'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: OOP BLUEPRINTS*\n*Subject:* Computer Science | *Level:* Tertiary 🌍\n\n*In Plain Words:*\nOOP models software like real-world items. A Class is the blueprint; an Object is the real thing created from that blueprint.\n\n*📌 Everyday Analogy:*\nArchitect blueprint (Class) vs actual houses built in the estate (Objects).\n\n*🎯 The 4 Pillars for Exams:*\n1. Encapsulation (data hiding)\n2. Abstraction (hiding complexity)\n3. Inheritance (reusing blueprints)\n4. Polymorphism (many forms)\n\n*🚀 Shared from PlainNotes*`,
    isCurated: true,
    createdAt: '2026-10-15T08:25:00Z'
  },
  {
    id: 'curated-007',
    title: 'Sheria ya Mahitaji na Ugavi (Supply & Demand)',
    subject: 'Economics',
    level: 'secondary',
    language: 'swahili',
    originalText: 'The law of supply and demand postulates an economic equilibrium mechanism wherein consumer willingness to purchase at price points balances producer willingness to offer commodity inventory.',
    simplifiedText: 'Sheria ya Mahitaji (Demand) na Ugavi (Supply) inaeleza jinsi bei ya bidhaa inavyopangwa sokoni. Wakati watu wengi wanataka kununua kitu kimoja lakini kinapatikana kwa uchache, bei yake inapanda juu. Wakati bidhaa zikiwa zimejaa sokoni lakini hakuna wanunuzi, bei inashuka chini.',
    localAnalogy: 'Fikiria soko la Kariakoo au Gikomba wakati wa msimu wa maembe: mwanzoni mwa msimu maembe yakiwa machache, embe moja huuzwa ghali sana. Lakini msimu ukikolea na malori mengi ya maembe kuingia sokoni, wachuuzi hupunguza bei haraka ili yasioze.',
    examEssentials: [
      'Wakati bei inapanda, mahitaji (demand) hushuka; bei ikishuka, mahitaji hupanda.',
      'Equilibrium Price (Bei ya usawa) hutokea pale mahitaji na ugavi vinapolingana sawia.',
      'Mchoro wa grafu ya Demand unateremka kutoka kushoto kwenda kulia chini (negative slope).'
    ],
    quiz: {
      question: 'Ni nini hutokea kwa bei ya bidhaa sokoni wakati ugavi (supply) ni mdogo lakini mahitaji (demand) ni makubwa sana?',
      options: [
        'Bei ya bidhaa inapanda juu',
        'Bei ya bidhaa inashuka chini mara moja',
        'Hakuna mabadiliko yoyote ya bei',
        'Bidhaa zote hupotea kisheria'
      ],
      answerIndex: 0,
      explanation: 'Upungufu wa bidhaa pamoja na ongezeko la wanunuzi hupelekea ushindani unaopandisha bei!'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: MAHITAJI NA UGAVI (SWAHILI)*\n*Subject:* Uchumi | *Lugha:* Kiswahili 🇰🇪🇹🇿\n\n*Maelezo Rahisi:*\nWatu wengi wakitaka kitu kilicho kidogo, bei hupanda. Vitu vikiwa vingi bila wanunuzi, bei hushuka.\n\n*📌 Mfano wa Sokoni:*\nMsimu wa maembe sokoni Kariakoo: mwanzoni maembe ni machache na bei ni kubwa; yakijaa sokoni, bei inashuka.\n\n*🎯 Mambo 3 ya Mtihani:*\n1. Sheria ya mahitaji: Bei ikipanda, mahitaji hushuka.\n2. Bei ya usawa (Equilibrium).\n3. Mwelekeo wa grafu ya mahitaji.\n\n*🚀 PlainNotes*`,
    isCurated: true,
    createdAt: '2026-10-15T08:30:00Z'
  },
  {
    id: 'curated-008',
    title: 'La Réaction Acide-Base et l\'Échelle du pH',
    subject: 'Chemistry',
    level: 'secondary',
    language: 'french',
    originalText: 'Une réaction acido-basique selon la théorie de Brønsted-Lowry implique le transfert stoichiométrique d\'un proton hydronium H+ depuis une espèce acide donneuse vers une espèce basique réceptrice.',
    simplifiedText: 'Une réaction acide-base est un échange de petits éléments chimiques appelés protons (H+). L\'acide donne un proton, tandis que la base le reçoit. L\'échelle de pH mesure la force de cette acidité de 0 à 14 : en dessous de 7 c\'est acide (comme le citron), 7 est neutre (l\'eau pure), et au-dessus de 7 c\'est basique (comme le savon).',
    localAnalogy: 'Pensez au mélange dans la cuisine : lorsque vous mettez du jus de citron (très acide) sur du poisson ou que vous mélangez du bicarbonate avec du vinaigre, une effervescence immédiate se produit. C\'est la neutralisation en action.',
    examEssentials: [
      'Selon Brønsted : Acide = donneur de H+ ; Base = receveur de H+.',
      'pH = -log[H3O+] : un pH inférieur à 7 indique une solution acide, supérieur à 7 basique.',
      'La réaction de neutralisation standard donne de l\'eau et un sel : Acide + Base → Sel + Eau.'
    ],
    quiz: {
      question: 'Selon la définition de Brønsted-Lowry, quel est le rôle d\'un acide ?',
      options: [
        'Donner un proton (ion H+)',
        'Capter des électrons libres',
        'Augmenter la température uniquement',
        'Détruire les molécules d\'eau'
      ],
      answerIndex: 0,
      explanation: 'Selon Brønsted-Lowry, un acide est une espèce chimique capable de céder un ou plusieurs protons H+ !'
    },
    whatsappText: `*💡 PLAINNOTES CAPSULE: ACIDES ET BASES (FRANÇAIS)*\n*Matière:* Chimie | *Langue:* Français 🇨🇮🇸🇳\n\n*En Bref:*\nUn acide donne un proton H+, une base le reçoit. L\'échelle de pH (0 à 14) mesure cette acidité (7 = neutre).\n\n*📌 Analogie Concrète:*\nLe jus de citron sur du poisson ou l\'effervescence du bicarbonate de soude.\n\n*🎯 3 Points d\'Examen:*\n1. Acide = donneur H+; Base = capteur H+.\n2. Échelle de pH (pH = -log[H3O+]).\n3. Acide + Base → Sel + Eau (Neutralisation).\n\n*🚀 PlainNotes*`,
    isCurated: true,
    createdAt: '2026-10-15T08:35:00Z'
  }
];
