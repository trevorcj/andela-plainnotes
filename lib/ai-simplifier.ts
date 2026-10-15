import { LanguageCode, SocraticQuiz, SimplifiedNote } from './types/plainnotes';

interface GenerateOptions {
  text: string;
  language: LanguageCode;
  subject?: string;
  level?: 'secondary' | 'tertiary' | 'vocational';
  imageBase64?: string;
}

interface AIResultPayload {
  title: string;
  subject: string;
  simplifiedText: string;
  localAnalogy: string;
  examEssentials: string[];
  quiz: SocraticQuiz;
  quizzes?: SocraticQuiz[];
  whatsappText: string;
}

const LANGUAGE_INSTRUCTIONS: Record<LanguageCode, string> = {
  pidgin: `Language: Nigerian Pidgin (Naija).
- CRITICAL: Write the ENTIRE 'simplifiedText', 'localAnalogy', and 'examEssentials' completely in authentic Nigerian Pidgin!
- Tone: Welcoming, warm, vibrant, and razor-sharp clarity. Use natural phrases like "Make we break am down well well", "No be high grammar", "The whole matter be say...", "Look am like this:".
- Analogies: Relatable West African daily life (OPay/transfer alert, Danfo bus conductor, Lagos traffic/Third Mainland Bridge, NEPA/generator switch, making Jollof rice, Mama Put queue, charging phone at barbing salon).`,

  yoruba: `Language: Yoruba (Èdè Yorùbá).
- CRITICAL: Write the ENTIRE 'simplifiedText', 'localAnalogy', and 'examEssentials' completely in authentic Èdè Yorùbá!
- Tone: Natural, respectful, clear, and culturally grounded.
- Analogies: South-West Nigerian life (Owambe organization, Agbe/farming cocoa & cassava, Oja market bargaining, Gbegiri & Amala preparation, talking drum signals).`,

  hausa: `Language: Hausa (Harshen Hausa).
- CRITICAL: Write the ENTIRE 'simplifiedText', 'localAnalogy', and 'examEssentials' completely in authentic Harshen Hausa!
- Tone: Direct, respectful, clear, and engaging.
- Analogies: Northern Nigerian & Sahel life (Kano Kurmi market trading, groundnut pyramids, water distribution, bicycle repair, nomadic grazing routes, Doya/Yam storage).`,

  igbo: `Language: Igbo (Asụsụ Igbo).
- CRITICAL: Write the ENTIRE 'simplifiedText', 'localAnalogy', and 'examEssentials' completely in authentic Asụsụ Igbo!
- Tone: Vivid, industrious, proverb-rich and crystal clear.
- Analogies: South-East Nigerian life (Alaba International / Onitsha market trading, Igba-boi business apprenticeship system, palm oil press, village square town hall meeting).`,

  english: `Language: Plain English (8th Grade Reading Level).
- Tone: Ultra-crisp, jargon-free, friendly, and empowering. No academic puffery or multi-syllable filler.
- Analogies: Clear African real-world setups (mobile money networks, urban transit, solar mini-grids, market stalls).`,

  french: `Language: French (Français Simple d'Afrique de l'Ouest/Centrale).
- CRITICAL: Write the ENTIRE explanation in simple, clear French!
- Tone: Clair, direct, vivant et sans tournures académiques lourdes.
- Analogies: Vie quotidienne en Afrique francophone (transfert Orange Money / Wave, transports Dakar Dem Dikk / Gbaka à Abidjan, commerce de quartier).`,

  swahili: `Language: Swahili (Kiswahili Rahisi cha Afrika Mashariki).
- CRITICAL: Write the ENTIRE explanation in Kiswahili!
- Tone: Wazi, fasaha, na rahisi kueleweka kwa mwanafunzi yeyote.
- Analogies: Maisha ya kila siku Afrika Mashariki (M-Pesa, safari za Matatu, soko la Kariakoo/Gikomba, kilimo cha mahindi).`
};

export async function simplifyAcademicText(options: GenerateOptions): Promise<SimplifiedNote> {
  const { text, language, subject, level = 'secondary', imageBase64 } = options;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

  if (!apiKey) {
    return generateFallbackNote(options);
  }

  const promptLanguage = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.pidgin;

  const systemPrompt = `You are PlainNotes — the premier African Academic Simplifier.
Your mission is to transform dense, intimidating textbooks, lecture slides, and past questions into crystal-clear learning capsules for African students.
You demystify academic jargon, eliminate cognitive overload, and provide memorable African analogies.

${promptLanguage}

IMPORTANT LANGUAGE RULE: You MUST write 'simplifiedText', 'localAnalogy', and 'examEssentials' strictly in the chosen language (${language.toUpperCase()}). Do not default to English unless English is explicitly selected.

Level of student: ${level.toUpperCase()} (Secondary = WAEC/JAMB/KCSE level; Tertiary = Poly/University level; Vocational = TVET/hands-on skill level).
Subject focus: ${subject || 'Detect from content'}.

You must return ONLY a strict JSON object with this exact shape:
{
  "title": "Short punchy topic title (under 8 words)",
  "subject": "Standard subject name e.g. Biology, Physics, Economics, Computer Science",
  "simplifiedText": "2 to 3 paragraphs breaking down the core concept in pure plain words without dense jargon in ${language.toUpperCase()}. Explain WHY it matters and HOW it works step-by-step.",
  "localAnalogy": "A brilliant, vivid African real-world analogy explaining this exact concept using daily life scenarios specific to the chosen language/region. Make it sticky and unforgettable.",
  "examEssentials": [
    "Crucial point 1 examiners look for in marking schemes",
    "Crucial point 2 common trap or formula logic",
    "Crucial point 3 key definition or rule"
  ],
  "quizzes": [
    {
      "question": "Question 1 testing true understanding of this concept",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Why this answer is correct and why other options are incorrect"
    }
    // EXACTLY 10 QUESTIONS in total covering different angles of the concept
  ],
  "quiz": {
    "question": "Primary question testing core understanding",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "explanation": "Why this answer is correct in 1-2 friendly sentences"
  },
  "whatsappText": "A clean, compact summary formatted for WhatsApp study groups with emojis (💡, 📌, 🎯, 🚀) and bullet points, under 180 words."
}

Rules:
- NEVER leave any field empty.
- Ensure 'quizzes' contains exactly 10 distinct, high-quality multiple choice questions.
- Keep the local analogy vivid and culturally authentic.
- Do NOT wrap response in markdown code fences; return raw JSON.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const userMessageContent: any = imageBase64
      ? [
          {
            type: 'text',
            text: text
              ? `Original Academic Text / prompt: """\n${text.slice(0, 3000)}\n"""\nPlease read the attached note/textbook image and simplify it.`
              : 'Please read the attached note/textbook image and simplify it into plain words, African analogy, 3 exam essentials, and quiz.'
          },
          {
            type: 'image_url',
            image_url: { url: imageBase64 }
          }
        ]
      : `Original Academic Text to simplify:\n"""\n${text.slice(0, 4000)}\n"""`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: userMessageContent
          }
        ],
        temperature: 0.65,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`OpenAI error status ${res.status}, using intelligent fallback`);
      return generateFallbackNote(options);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return generateFallbackNote(options);
    }

    const parsed: AIResultPayload = JSON.parse(rawContent);

    return {
      id: crypto.randomUUID(),
      title: parsed.title || 'Academic Concept Simplified',
      subject: parsed.subject || subject || 'General Science',
      level,
      language,
      originalText: text,
      simplifiedText: parsed.simplifiedText,
      localAnalogy: parsed.localAnalogy,
      examEssentials: Array.isArray(parsed.examEssentials) && parsed.examEssentials.length === 3
        ? parsed.examEssentials
        : [
            'Understand the fundamental definition and core governing formula.',
            'Watch out for units and boundary conditions frequently penalized by WAEC/examiners.',
            'Connect the input cause directly with the resulting output effect.'
          ],
      quiz: {
        question: parsed.quiz?.question || parsed.quizzes?.[0]?.question || 'What is the main takeaway of this concept?',
        options: parsed.quiz?.options?.length === 4
          ? parsed.quiz.options
          : parsed.quizzes?.[0]?.options || ['Primary mechanism', 'Secondary effect', 'Inverse relationship', 'None of the above'],
        answerIndex: typeof parsed.quiz?.answerIndex === 'number' ? parsed.quiz.answerIndex : (parsed.quizzes?.[0]?.answerIndex ?? 0),
        explanation: parsed.quiz?.explanation || parsed.quizzes?.[0]?.explanation || 'This captures the fundamental principle.'
      },
      quizzes: Array.isArray(parsed.quizzes) && parsed.quizzes.length >= 3
        ? parsed.quizzes
        : undefined,
      whatsappText: parsed.whatsappText || generateWhatsAppFallback(parsed.title, parsed.simplifiedText, parsed.localAnalogy),
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('AI Simplifier exception, falling back:', err);
    return generateFallbackNote(options);
  }
}

function generateWhatsAppFallback(title: string, simplified: string, analogy: string): string {
  return `*💡 PLAINNOTES STUDY CARD: ${title.toUpperCase()}*\n\n` +
    `*In Plain Words:*\n${simplified.slice(0, 280)}...\n\n` +
    `*📌 Local Analogy:*\n${analogy.slice(0, 200)}...\n\n` +
    `*🚀 Shared via PlainNotes — Academic Jargon Demystified*`;
}

export function generateFallbackNote(options: GenerateOptions): SimplifiedNote {
  const { text, language, subject = 'General Science', level = 'secondary' } = options;
  const isBio = /photosynthesis|cell|chlorophyll|plant|osmosis/i.test(text);
  const isPhys = /newton|force|motion|friction|gravity|circuit|current/i.test(text);
  const isEcon = /inflation|money|currency|interest|naira|price|demand/i.test(text);
  const isTech = /code|function|loop|database|algorithm|object|python/i.test(text);

  let title = 'Core Academic Concept';
  let simplifiedText = 'This concept explains how a fundamental input causes a predictable reaction within a defined system. Rather than getting lost in dense technical definitions, focus on the flow of cause and effect.';
  let localAnalogy = 'Think of this like sending money via OPay or mobile money: you enter your pin (the input), the network processes it behind the scenes (the mechanism), and the recipient gets an instant alert (the output). If the network breaks, the transaction fails.';
  let examEssentials = [
    'State the law or definition using precise scientific/economic terms in your opening sentence.',
    'Identify the independent variable (cause) versus the dependent variable (effect).',
    'Always specify the standard SI unit or economic indicator when providing calculations.'
  ];
  let quiz: SocraticQuiz = {
    question: 'What is the most critical factor that governs this process?',
    options: [
      'The direct relationship between the input force and the reacting medium',
      'Random environmental fluctuation with no fixed law',
      'Only the temperature of the laboratory',
      'The duration of observation alone'
    ],
    answerIndex: 0,
    explanation: 'Fundamental laws depend on the direct relationship between the input condition and the resulting medium reaction.'
  };

  if (isBio) {
    title = 'Photosynthesis & Plant Energy';
    if (language === 'pidgin') {
      simplifiedText = 'Photosynthesis simply mean say green leaves dey cook food for plant using sunlight as gas cooker. The plant suck water from soil through root, catch carbon dioxide from air through small mouth for leaf (stomata), then use sunlight energy turn everything to sweet glucose and blow oxygen give us to breathe.';
      localAnalogy = 'Look am like Mama Put cook: Sun na the gas fire, water from ground na the water inside pot, carbon dioxide na raw yam, while the green chlorophyll na Mama Put hands wey mix everything together to deliver hot Jollof (glucose).';
    } else if (language === 'yoruba') {
      simplifiedText = 'Photosynthesis ni bi awọn ewe alawọ ewe ṣe n se ounjẹ fun igi nipa lilo imọlẹ oorun. Igi n fa omi lati inu ilẹ, o si n gba afẹfẹ carbon dioxide lati inu afẹfẹ lati se ounjẹ glucose.';
      localAnalogy = 'Ronu nipa rẹ bi iyawo to n se amala lori ina: oorun ni ina ti a n fi se ounjẹ, omi inu ilẹ ni omi gbigbona, eweko si n lo gbogbo rẹ lati fun igi ni agbara.';
    } else if (language === 'hausa') {
      simplifiedText = 'Photosynthesis yana nufin yadda korayen ganyaye ke shirya abinci ga shuka ta hanyar amfani da hasken rana, ruwan kasa, da iskar carbon dioxide.';
      localAnalogy = 'Kamar yadda mai shayi ke amfani da wuta, ruwan zafi da sukari don hada shayi mai dadi, shuka ma na hada hasken rana da ruwa don ciyar da kanta.';
    } else if (language === 'igbo') {
      simplifiedText = 'Photosynthesis bu uzo osisi ndu si esi nri ha site n\'inweta anwu, mmiri sitere n\'ala na ikuku carbon dioxide iji meputa nri glucose na ikuku oxygen.';
      localAnalogy = 'Chee ya dika nne na-esi ofe onugbu: anwu bu oku, mmiri ala bu mmiri ofe, akwukwo ndu na-ejiko ha ka osisi nwee ike ito nke oma.';
    } else {
      simplifiedText = 'Photosynthesis is the cellular process by which plants convert light energy into chemical energy. Leaves absorb water from soil and carbon dioxide from the atmosphere, synthesizing glucose to fuel growth while releasing oxygen as a byproduct.';
      localAnalogy = 'Imagine a solar-powered bakery: sunlight is the electrical power, water and CO2 are flour and sugar, and the bakery outputs fresh bread (glucose) while venting out fresh clean air.';
    }
  } else if (isPhys) {
    title = 'Newton\'s Third Law of Motion';
    if (language === 'pidgin') {
      simplifiedText = 'Newton Third Law talk say: if you push anything, that thing go push you back with the exact same power, but for opposite direction. Action and reaction na 50-50 partner.';
      localAnalogy = 'When you dey jump commot from inside canoe go river bank: your leg push the canoe go back, then the canoe push you forward land for dry ground. If the canoe no push you back, you go fall enter water.';
    } else {
      simplifiedText = 'Newton\'s Third Law states that for every action force applied, there exists an equal and opposite reaction force simultaneously acting on the other body.';
      localAnalogy = 'Like firing an AK-47 or stepping off a small wooden boat: as you push the canoe backward, it pushes your body forward onto the riverbank.';
    }
  } else if (isEcon) {
    title = 'Inflation & Purchasing Power';
    if (language === 'pidgin') {
      simplifiedText = 'Inflation simply mean say price of things dey go up while the purchasing power of your money dey drop. No be say money disappear, but the same ₦1,000 wey dey buy 4 loaves of bread last year, now fit only buy 1 loaf.';
      localAnalogy = 'Picture Bodija or Mile 12 market: before, one basket of tomatoes na ₦2,000 because truck plenty. Once fuel price spike and fuel scarcity hit, transport cost triple, so that same basket turn ₦8,000.';
    } else {
      simplifiedText = 'Inflation is the generalized sustained increase in the price level of goods and services over time, which erodes the purchasing power of the national currency unit.';
      localAnalogy = 'Think of a bucket of water with a leak: the numbers on paper look the same, but the actual volume of goods you can carry home from the market diminishes every week.';
    }
  } else if (isTech) {
    title = 'Database Indexing & Fast Retrieval';
    if (language === 'pidgin') {
      simplifiedText = 'Database Index na like table of contents for book or phone contact list. Instead of computer reading all 10 million rows from top to bottom (full table scan), index dey take am straight to the exact page within 2 milliseconds.';
      localAnalogy = 'Look am like Alaba International Market: if you dey find one particular spare part and you dey waka shop by shop from shop 1 to 5,000, you go faint. But if apprentice guide lead you straight to Shop 42 Line B, you don finish within 2 minutes.';
    } else {
      simplifiedText = 'Database indexing is a data structure technique (typically B-Trees) that allows a database engine to locate records in logarithmic time without scanning every single row in storage.';
      localAnalogy = 'Imagine a library without an index card catalog where you had to open every book from page 1 to find a quote, versus an alphabetized directory that takes you directly to the shelf.';
    }
  }

  const whatsappText = `*💡 PLAINNOTES CAPSULE: ${title.toUpperCase()}*\n` +
    `*Language:* ${language.toUpperCase()} | *Subject:* ${subject}\n\n` +
    `*In Plain Words:*\n${simplifiedText}\n\n` +
    `*📌 Everyday African Analogy:*\n${localAnalogy}\n\n` +
    `*🎯 Exam Essentials:*\n` +
    examEssentials.map((item, idx) => `${idx + 1}. ${item}`).join('\n') +
    `\n\n*🚀 Master your exams with PlainNotes*`;

  return {
    id: crypto.randomUUID(),
    title,
    subject,
    level,
    language,
    originalText: text,
    simplifiedText,
    localAnalogy,
    examEssentials,
    quiz,
    whatsappText,
    createdAt: new Date().toISOString()
  };
}
