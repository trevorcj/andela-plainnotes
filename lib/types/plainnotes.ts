export type LanguageCode =
  | 'pidgin'
  | 'yoruba'
  | 'hausa'
  | 'igbo'
  | 'english'
  | 'french'
  | 'swahili';

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
  flagUrl: string;
  description: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'pidgin',
    name: 'Nigerian Pidgin',
    nativeName: 'Naija Pidgin',
    region: 'West Africa',
    flag: '🇳🇬',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    description: 'Relatable everyday street talk with maximum clarity'
  },
  {
    code: 'yoruba',
    name: 'Yoruba',
    nativeName: 'Èdè Yorùbá',
    region: 'South-West Nigeria & Benin',
    flag: '🇳🇬',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    description: 'Rich tonal phrasing with indigenous analogies'
  },
  {
    code: 'hausa',
    name: 'Hausa',
    nativeName: 'Harshen Hausa',
    region: 'Northern Nigeria & Sahel',
    flag: '🇳🇬',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    description: 'Direct trade and daily life idioms'
  },
  {
    code: 'igbo',
    name: 'Igbo',
    nativeName: 'Asụsụ Igbo',
    region: 'South-East Nigeria',
    flag: '🇳🇬',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    description: 'Proverbial precision and enterprise analogies'
  },
  {
    code: 'english',
    name: 'Plain English',
    nativeName: 'Simple English',
    region: 'Pan-African',
    flag: '🌍',
    flagUrl: 'https://flagcdn.com/w40/un.png',
    description: 'Jargon-free 8th grade reading level, zero academic clutter'
  },
  {
    code: 'french',
    name: 'French (Français)',
    nativeName: 'Français Simple',
    region: 'Francophone Africa',
    flag: '🇨🇮',
    flagUrl: 'https://flagcdn.com/w40/ci.png',
    description: 'Clair, accessible et sans jargon complexe'
  },
  {
    code: 'swahili',
    name: 'Swahili (Kiswahili)',
    nativeName: 'Kiswahili Rahisi',
    region: 'East Africa',
    flag: '🇰🇪',
    flagUrl: 'https://flagcdn.com/w40/ke.png',
    description: 'Ufafanuzi rahisi wenye mifano ya maisha halisi'
  }
];

export interface SocraticQuiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface SimplifiedNote {
  id: string;
  userId?: string | null;
  title: string;
  subject: string;
  level: 'secondary' | 'tertiary' | 'vocational';
  language: LanguageCode;
  originalText: string;
  simplifiedText: string;
  localAnalogy: string;
  examEssentials: string[];
  quiz: SocraticQuiz;
  quizzes?: SocraticQuiz[]; // 10 interactive questions
  whatsappText: string;
  isCurated?: boolean;
  createdAt: string;
}

export interface SimplifyRequest {
  text: string;
  language: LanguageCode;
  subject?: string;
  level?: 'secondary' | 'tertiary' | 'vocational';
  imageBase64?: string;
}

export interface SimplifyResponse {
  success: boolean;
  note?: SimplifiedNote;
  error?: string;
}
