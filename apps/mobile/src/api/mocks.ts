import type {
  AuthMeResponse,
  AuthSessionResponse,
  DailyWord,
  DailyWordsResponse,
  RefreshResponse,
  SessionAnswerResponse,
  SessionCompleteResponse,
  SessionStartResponse,
  SurahListItem,
  SurahResponse,
  WordDetailResponse,
  WordInAyahDTO,
} from '@/types';

const me: AuthMeResponse = {
  id: 'mock-user-1',
  email: 'student@example.com',
  displayName: 'Hatem',
  preferredLanguage: 'en',
  dailyGoal: 5,
  streakDays: 3,
  masteryStats: {seen: 12, recognised: 8, understood: 5, retained: 3, mastered: 2},
  createdAt: '2026-05-01T00:00:00.000Z',
};

const session: AuthSessionResponse = {
  accessToken: 'mock-access',
  refreshToken: 'mock-refresh',
  user: me,
};

function makeWord(
  position: number,
  arabic: string,
  translit: string,
  meaning: string,
  root: string | null,
  state: WordInAyahDTO['mastery_state'],
): WordInAyahDTO {
  return {
    word_id: `w-1-1-${position}`,
    position,
    arabic_text: arabic,
    transliteration: translit,
    meaning,
    root,
    mastery_state: state,
  };
}

const alFatihaAyahs: SurahResponse['ayahs'] = [
  {
    surah: 1,
    ayah: 1,
    text_arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
    words: [
      makeWord(1, 'بِسْمِ', 'bismi', 'In the name of', 'س م و', 'recognised'),
      makeWord(2, 'ٱللَّهِ', 'Allāhi', 'Allah', 'أ ل ه', 'mastered'),
      makeWord(3, 'ٱلرَّحْمَٰنِ', 'ar-Raḥmāni', 'the Most Gracious', 'ر ح م', 'retained'),
      makeWord(4, 'ٱلرَّحِيمِ', 'ar-Raḥīmi', 'the Most Merciful', 'ر ح م', 'understood'),
    ],
  },
  {
    surah: 1,
    ayah: 2,
    text_arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
    translation: 'All praise is due to Allah, Lord of the worlds.',
    audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001002.mp3',
    words: [
      makeWord(1, 'ٱلْحَمْدُ', 'al-ḥamdu', 'All praise', 'ح م د', 'seen'),
      makeWord(2, 'لِلَّهِ', 'lillāhi', 'to Allah', 'أ ل ه', 'mastered'),
      makeWord(3, 'رَبِّ', 'rabbi', 'Lord', 'ر ب ب', 'recognised'),
      makeWord(4, 'ٱلْعَٰلَمِينَ', 'al-ʿālamīn', 'of the worlds', 'ع ل م', 'unseen'),
    ],
  },
  {
    surah: 1,
    ayah: 3,
    text_arabic: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translation: 'The Most Gracious, the Most Merciful.',
    audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001003.mp3',
    words: [
      makeWord(1, 'ٱلرَّحْمَٰنِ', 'ar-Raḥmāni', 'the Most Gracious', 'ر ح م', 'retained'),
      makeWord(2, 'ٱلرَّحِيمِ', 'ar-Raḥīmi', 'the Most Merciful', 'ر ح م', 'understood'),
    ],
  },
  {
    surah: 1,
    ayah: 4,
    text_arabic: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
    translation: 'Master of the Day of Judgment.',
    audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001004.mp3',
    words: [
      makeWord(1, 'مَٰلِكِ', 'māliki', 'Master', 'م ل ك', 'unseen'),
      makeWord(2, 'يَوْمِ', 'yawmi', 'of the Day', 'ي و م', 'seen'),
      makeWord(3, 'ٱلدِّينِ', 'ad-dīn', 'of Judgment', 'د ي ن', 'recognised'),
    ],
  },
  {
    surah: 1,
    ayah: 5,
    text_arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    translation: 'It is You we worship and You we ask for help.',
    audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001005.mp3',
    words: [
      makeWord(1, 'إِيَّاكَ', 'iyyāka', 'You alone', null, 'recognised'),
      makeWord(2, 'نَعْبُدُ', 'naʿbudu', 'we worship', 'ع ب د', 'understood'),
      makeWord(3, 'وَإِيَّاكَ', 'wa-iyyāka', 'and You alone', null, 'seen'),
      makeWord(4, 'نَسْتَعِينُ', 'nastaʿīn', 'we ask for help', 'ع و ن', 'unseen'),
    ],
  },
  {
    surah: 1,
    ayah: 6,
    text_arabic: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
    translation: 'Guide us to the straight path.',
    audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001006.mp3',
    words: [
      makeWord(1, 'ٱهْدِنَا', 'ihdinā', 'Guide us', 'ه د ي', 'recognised'),
      makeWord(2, 'ٱلصِّرَٰطَ', 'aṣ-ṣirāṭa', 'the path', 'ص ر ط', 'unseen'),
      makeWord(3, 'ٱلْمُسْتَقِيمَ', 'al-mustaqīm', 'the straight', 'ق و م', 'seen'),
    ],
  },
  {
    surah: 1,
    ayah: 7,
    text_arabic: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
    translation:
      'The path of those You have blessed — not of those who have earned anger, nor of those who go astray.',
    audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001007.mp3',
    words: [
      makeWord(1, 'صِرَٰطَ', 'ṣirāṭa', 'the path', 'ص ر ط', 'unseen'),
      makeWord(2, 'ٱلَّذِينَ', 'alladhīna', 'of those', null, 'seen'),
      makeWord(3, 'أَنْعَمْتَ', 'anʿamta', 'You have blessed', 'ن ع م', 'recognised'),
      makeWord(4, 'عَلَيْهِمْ', 'ʿalayhim', 'upon them', null, 'mastered'),
      makeWord(5, 'غَيْرِ', 'ghayri', 'not of', 'غ ي ر', 'unseen'),
      makeWord(6, 'ٱلْمَغْضُوبِ', 'al-maghḍūbi', 'those who earn anger', 'غ ض ب', 'unseen'),
      makeWord(7, 'عَلَيْهِمْ', 'ʿalayhim', 'upon them', null, 'mastered'),
      makeWord(8, 'وَلَا', 'wa-lā', 'and not', null, 'seen'),
      makeWord(9, 'ٱلضَّآلِّينَ', 'aḍ-ḍāllīn', 'those astray', 'ض ل ل', 'unseen'),
    ],
  },
];

function buildSurah(n: number): SurahResponse {
  if (n === 1) {
    return {
      number: 1,
      name_arabic: 'ٱلْفَاتِحَة',
      name_transliteration: 'Al-Fātiḥah',
      name_translation: 'The Opening',
      ayah_count: 7,
      revelation_place: 'meccan',
      ayahs: alFatihaAyahs,
    };
  }
  if (n === 112) {
    return {
      number: 112,
      name_arabic: 'ٱلْإِخْلَاص',
      name_transliteration: 'Al-Ikhlāṣ',
      name_translation: 'Sincerity',
      ayah_count: 4,
      revelation_place: 'meccan',
      ayahs: [
        {
          surah: 112,
          ayah: 1,
          text_arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
          translation: 'Say: He is Allah, the One.',
          audio_url: 'https://everyayah.com/data/Alafasy_128kbps/112001.mp3',
          words: [
            makeWord(1, 'قُلْ', 'qul', 'Say', 'ق و ل', 'recognised'),
            makeWord(2, 'هُوَ', 'huwa', 'He', null, 'mastered'),
            makeWord(3, 'ٱللَّهُ', 'Allāhu', 'is Allah', 'أ ل ه', 'mastered'),
            makeWord(4, 'أَحَدٌ', 'aḥad', 'One', 'أ ح د', 'recognised'),
          ],
        },
        {
          surah: 112,
          ayah: 2,
          text_arabic: 'ٱللَّهُ ٱلصَّمَدُ',
          translation: 'Allah, the Eternal, Absolute.',
          audio_url: 'https://everyayah.com/data/Alafasy_128kbps/112002.mp3',
          words: [
            makeWord(1, 'ٱللَّهُ', 'Allāhu', 'Allah', 'أ ل ه', 'mastered'),
            makeWord(2, 'ٱلصَّمَدُ', 'aṣ-ṣamad', 'the Eternal', 'ص م د', 'unseen'),
          ],
        },
        {
          surah: 112,
          ayah: 3,
          text_arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
          translation: 'He neither begets nor is born.',
          audio_url: 'https://everyayah.com/data/Alafasy_128kbps/112003.mp3',
          words: [
            makeWord(1, 'لَمْ', 'lam', 'Not', null, 'seen'),
            makeWord(2, 'يَلِدْ', 'yalid', 'He begets', 'و ل د', 'recognised'),
            makeWord(3, 'وَلَمْ', 'wa-lam', 'and not', null, 'seen'),
            makeWord(4, 'يُولَدْ', 'yūlad', 'He is born', 'و ل د', 'recognised'),
          ],
        },
        {
          surah: 112,
          ayah: 4,
          text_arabic: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ',
          translation: 'And there is none equal to Him.',
          audio_url: 'https://everyayah.com/data/Alafasy_128kbps/112004.mp3',
          words: [
            makeWord(1, 'وَلَمْ', 'wa-lam', 'And not', null, 'seen'),
            makeWord(2, 'يَكُن', 'yakun', 'there is', 'ك و ن', 'recognised'),
            makeWord(3, 'لَّهُۥ', 'lahu', 'to Him', null, 'mastered'),
            makeWord(4, 'كُفُوًا', 'kufuwan', 'equal', 'ك ف أ', 'unseen'),
            makeWord(5, 'أَحَدٌ', 'aḥad', 'any', 'أ ح د', 'recognised'),
          ],
        },
      ],
    };
  }
  return {
    number: n,
    name_arabic: 'سُورَة',
    name_transliteration: `Surah ${n}`,
    name_translation: 'Surah',
    ayah_count: 1,
    revelation_place: 'meccan',
    ayahs: [
      {
        surah: n,
        ayah: 1,
        text_arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
        audio_url: `https://everyayah.com/data/Alafasy_128kbps/${String(n).padStart(3, '0')}001.mp3`,
        words: [
          makeWord(1, 'بِسْمِ', 'bismi', 'In the name of', 'س م و', 'recognised'),
          makeWord(2, 'ٱللَّهِ', 'Allāhi', 'Allah', 'أ ل ه', 'mastered'),
        ],
      },
    ],
  };
}

const surahList: SurahListItem[] = [
  {number: 1, name_arabic: 'ٱلْفَاتِحَة', name_transliteration: 'Al-Fātiḥah', name_translation: 'The Opening', ayah_count: 7, revelation_place: 'meccan'},
  {number: 2, name_arabic: 'ٱلْبَقَرَة', name_transliteration: 'Al-Baqarah', name_translation: 'The Cow', ayah_count: 286, revelation_place: 'medinan'},
  {number: 112, name_arabic: 'ٱلْإِخْلَاص', name_transliteration: 'Al-Ikhlāṣ', name_translation: 'Sincerity', ayah_count: 4, revelation_place: 'meccan'},
  {number: 113, name_arabic: 'ٱلْفَلَق', name_transliteration: 'Al-Falaq', name_translation: 'The Daybreak', ayah_count: 5, revelation_place: 'meccan'},
  {number: 114, name_arabic: 'ٱلنَّاس', name_transliteration: 'An-Nās', name_translation: 'Mankind', ayah_count: 6, revelation_place: 'meccan'},
];

const dailyWords: DailyWord[] = [
  {
    word_id: 'w-rahma-1',
    arabic_text: 'رَحْمَة',
    transliteration: 'raḥmah',
    meaning: 'mercy',
    root: 'ر ح م',
    example_ayah: {
      surah: 1,
      ayah: 1,
      text_arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
      highlighted_word_position: 3,
    },
    mastery_state: 'seen',
    distractor_meanings: ['justice', 'patience', 'guidance'],
  },
  {
    word_id: 'w-hamd-1',
    arabic_text: 'حَمْد',
    transliteration: 'ḥamd',
    meaning: 'praise',
    root: 'ح م د',
    example_ayah: {
      surah: 1,
      ayah: 2,
      text_arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
      translation: 'All praise is due to Allah, Lord of the worlds.',
      audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001002.mp3',
      highlighted_word_position: 1,
    },
    mastery_state: 'recognised',
    distractor_meanings: ['gratitude', 'remembrance', 'glory'],
  },
  {
    word_id: 'w-rabb-1',
    arabic_text: 'رَبّ',
    transliteration: 'rabb',
    meaning: 'lord',
    root: 'ر ب ب',
    example_ayah: {
      surah: 1,
      ayah: 2,
      text_arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
      translation: 'All praise is due to Allah, Lord of the worlds.',
      audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001002.mp3',
      highlighted_word_position: 3,
    },
    mastery_state: 'understood',
    distractor_meanings: ['servant', 'witness', 'creator'],
  },
  {
    word_id: 'w-din-1',
    arabic_text: 'دِين',
    transliteration: 'dīn',
    meaning: 'judgment',
    root: 'د ي ن',
    example_ayah: {
      surah: 1,
      ayah: 4,
      text_arabic: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
      translation: 'Master of the Day of Judgment.',
      audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001004.mp3',
      highlighted_word_position: 3,
    },
    mastery_state: 'seen',
    distractor_meanings: ['kingdom', 'faith', 'mercy'],
  },
  {
    word_id: 'w-sirat-1',
    arabic_text: 'صِرَاط',
    transliteration: 'ṣirāṭ',
    meaning: 'path',
    root: 'ص ر ط',
    example_ayah: {
      surah: 1,
      ayah: 6,
      text_arabic: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
      translation: 'Guide us to the straight path.',
      audio_url: 'https://everyayah.com/data/Alafasy_128kbps/001006.mp3',
      highlighted_word_position: 2,
    },
    mastery_state: 'unseen',
    distractor_meanings: ['light', 'truth', 'door'],
  },
];

const dailyResponse: DailyWordsResponse = {
  date: new Date().toISOString().split('T')[0] ?? '2026-05-25',
  goal: 5,
  words: dailyWords,
  recentlyLearned: dailyWords.slice(0, 3),
  streak: Array.from({length: 7}, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0] ?? '',
    active: i >= 4,
  })),
};

function buildWordDetail(id: string): WordDetailResponse {
  const found = dailyWords.find(w => w.word_id === id);
  const base = found ?? dailyWords[0]!;
  return {
    word_id: base.word_id,
    arabic_text: base.arabic_text,
    transliteration: base.transliteration,
    meaning: base.meaning,
    root: base.root ? {letters: base.root, frequency: 42} : null,
    derived: base.root
      ? [
          {word_id: `${base.word_id}-d1`, arabic_text: 'مَرْحُوم', meaning: 'one shown mercy', occurrences: 6},
          {word_id: `${base.word_id}-d2`, arabic_text: 'رَاحِم', meaning: 'merciful', occurrences: 4},
        ]
      : [],
    example_ayahs: [base.example_ayah],
    mastery_state: base.mastery_state,
    saved: false,
  };
}

let sessionCounter = 0;

function buildSession(): SessionStartResponse {
  sessionCounter += 1;
  return {
    sessionId: `mock-session-${sessionCounter}`,
    words: dailyWords,
  };
}

export async function handle(path: string, init: RequestInit): Promise<unknown | null> {
  await new Promise(r => setTimeout(r, 150));
  const method = (init.method ?? 'GET').toUpperCase();

  if (method === 'POST' && path === '/auth/register') return session;
  if (method === 'POST' && path === '/auth/login') return session;
  if (method === 'POST' && path === '/auth/logout') return undefined;
  if (method === 'POST' && path === '/auth/refresh') {
    const r: RefreshResponse = {accessToken: 'mock-access', refreshToken: 'mock-refresh'};
    return r;
  }
  if (method === 'GET' && path === '/auth/me') return me;
  if (method === 'PATCH' && path === '/auth/me') {
    const body = init.body ? JSON.parse(String(init.body)) : {};
    return {...me, ...body};
  }

  if (method === 'GET' && path === '/quran/surahs') return surahList;
  const surahMatch = path.match(/^\/quran\/surah\/(\d+)$/);
  if (method === 'GET' && surahMatch) return buildSurah(Number(surahMatch[1]));

  if (method === 'GET' && path === '/words/daily') return dailyResponse;
  const wordMatch = path.match(/^\/words\/([^/]+)$/);
  if (method === 'GET' && wordMatch) return buildWordDetail(wordMatch[1]!);
  const saveMatch = path.match(/^\/words\/([^/]+)\/save$/);
  if ((method === 'POST' || method === 'DELETE') && saveMatch) return undefined;
  if (method === 'GET' && path === '/words/saved') return [];

  if (method === 'POST' && path === '/sessions/start') return buildSession();
  if (method === 'POST' && /^\/sessions\/[^/]+\/answer$/.test(path)) {
    const ans: SessionAnswerResponse = {newMasteryState: 'recognised'};
    return ans;
  }
  if (method === 'POST' && /^\/sessions\/[^/]+\/complete$/.test(path)) {
    const c: SessionCompleteResponse = {
      wordsLearned: 5,
      accuracy: 0.8,
      newMasteries: dailyWords.slice(0, 5).map(w => ({word_id: w.word_id, mastery_state: 'recognised'})),
    };
    return c;
  }

  return null;
}
