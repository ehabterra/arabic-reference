export const SITE_TITLE = 'المرجع العربي';
export const SITE_DESC =
  'مرجع تفاعلي لتعلُّم العربية: القراءة والكتابة، النحو، الصرف، البلاغة، التجويد، الخط، وعربية القرآن — بأمثلة ومخططات واختبارات وتتبُّع للتقدّم.';
export const SITE_DESC_EN =
  'An interactive reference for learning Arabic: reading & writing, grammar (nahw), morphology (sarf), rhetoric (balagha), tajwid, calligraphy, and Qur’anic Arabic — with examples, diagrams, quizzes, and progress tracking.';

export interface CategoryMeta {
  key: string;
  title: string;
  title_en?: string;
  blurb: string;
  blurb_en?: string;
}

export interface TrackMeta {
  key: string;
  route: string;
  title: string;
  title_en?: string;
  blurb: string;
  blurb_en?: string;
  categories: CategoryMeta[];
}

export const TRACKS: TrackMeta[] = [
  {
    key: 'qiraa',
    route: 'qiraa',
    title: 'القراءة والكتابة',
    title_en: 'Reading & Writing',
    blurb: 'تعلُّم القراءة الصحيحة من الحرف إلى الكلمة فالآية، على منهج نور البيان.',
    blurb_en: 'Learn correct reading from letter to word to verse, following the Nur al-Bayan method.',
    categories: [
      { key: 'huruf', title: 'الحروف', title_en: 'Letters', blurb: 'الحروف الهجائية وأشكالها في مواضع الكلمة', blurb_en: 'Arabic letters and their forms in word positions' },
      { key: 'harakat', title: 'الحركات والسكون والمدود', title_en: 'Vowels, Sukun & Madd', blurb: 'الحركات والسكون والمدود', blurb_en: 'Short vowels, sukun, and long vowel (madd) rules' },
      { key: 'tarkib', title: 'القراءة المتصلة', title_en: 'Connected Reading', blurb: 'القراءة المتصلة من الكلمة إلى الجملة فالآية', blurb_en: 'Flowing reading from word to sentence to verse' },
    ],
  },
  {
    key: 'nahw',
    route: 'nahw',
    title: 'النحو',
    title_en: 'Grammar (Nahw)',
    blurb: 'إعراب الكلمة وموقعها: المرفوعات والمنصوبات والمجرورات وبناء الجملة.',
    blurb_en: 'Word inflection and position: nominatives, accusatives, genitives, and sentence structure.',
    categories: [
      { key: 'kalam', title: 'الكلام والإعراب', title_en: 'Speech & Inflection', blurb: 'أقسام الكلام، الجملة، الإعراب والبناء وعلاماته', blurb_en: "Parts of speech, sentences, i'rab, bina and their markers" },
      { key: 'marfuaat', title: 'المرفوعات', title_en: 'Nominatives', blurb: 'الفاعل، نائب الفاعل، المبتدأ والخبر، اسم كان وخبر إنّ', blurb_en: "Subject, passive subject, mubtada and khabar, ism kana and khabar inna" },
      { key: 'mansubat', title: 'المنصوبات', title_en: 'Accusatives', blurb: 'المفاعيل، الحال، التمييز، الاستثناء، المنادى', blurb_en: 'Objects, hal, tamyiz, exception, munada' },
      { key: 'majrurat', title: 'المجرورات', title_en: 'Genitives', blurb: 'حروف الجر والإضافة', blurb_en: 'Prepositions and idafa (genitive construction)' },
      { key: 'tawabi', title: 'التوابع', title_en: "Followers (Tawabi')", blurb: 'النعت، العطف، التوكيد، البدل', blurb_en: "Adjective (na't), conjunction ('atf), emphasis, substitute" },
      { key: 'asalib', title: 'الأفعال والأساليب', title_en: 'Verbs & Constructions', blurb: 'نصب وجزم المضارع، الأفعال الخمسة، أساليب الشرط والنداء والتعجب والعدد', blurb_en: "Nasb and jazm of the mudari', five verbs, conditional, vocative, exclamation, and number constructions" },
    ],
  },
  {
    key: 'sarf',
    route: 'sarf',
    title: 'الصرف',
    title_en: 'Morphology (Sarf)',
    blurb: 'أبنية الكلمة وأوزانها: الميزان الصرفي والأفعال والمشتقات.',
    blurb_en: 'Word patterns and forms: the morphological scale, verbs, and derivatives.',
    categories: [
      { key: 'mizan', title: 'الميزان الصرفي', title_en: 'Morphological Scale', blurb: 'الميزان الصرفي', blurb_en: 'Al-mizan al-sarfi: the root-pattern framework' },
      { key: 'afaal', title: 'الأفعال وأبنيتها', title_en: 'Verbs & Patterns', blurb: 'الأفعال وأبنيتها وتصريفها', blurb_en: 'Verb forms, augmented roots, and conjugation' },
      { key: 'mushtaqqat', title: 'المشتقّات والجموع', title_en: 'Derivatives & Plurals', blurb: 'المشتقّات والجموع', blurb_en: "Derived forms (ism fa'il, sifa, etc.) and plural patterns" },
    ],
  },
  {
    key: 'balagha',
    route: 'balagha',
    title: 'البلاغة',
    title_en: 'Rhetoric (Balagha)',
    blurb: 'علوم البلاغة الثلاثة نظريًّا، وتطبيقها على بلاغة القرآن.',
    blurb_en: 'The three rhetorical sciences in theory, applied to the rhetoric of the Quran.',
    categories: [
      { key: 'maani', title: 'علم المعاني', title_en: "Ilm al-Ma'ani", blurb: 'علم المعاني', blurb_en: 'The science of meanings and communicative structure' },
      { key: 'bayan', title: 'علم البيان', title_en: 'Ilm al-Bayan', blurb: 'علم البيان', blurb_en: 'The science of figurative language and clarity' },
      { key: 'badi', title: 'علم البديع', title_en: "Ilm al-Badi'", blurb: 'علم البديع', blurb_en: 'The science of rhetorical ornament and embellishment' },
      { key: 'balaghaq', title: 'بلاغة القرآن التطبيقية', title_en: 'Applied Quranic Rhetoric', blurb: 'تطبيق علوم البلاغة على آيات القرآن الكريم', blurb_en: 'Applying the three rhetorical sciences to verses of the Quran' },
    ],
  },
  {
    key: 'tajwid',
    route: 'tajwid',
    title: 'التجويد',
    title_en: 'Tajwid',
    blurb: 'أحكام تلاوة القرآن: المخارج والصفات وأحكام النون والمدود.',
    blurb_en: 'Rules of Quran recitation: articulation points, letter characteristics, and the rules of nun and madd.',
    categories: [
      { key: 'makharij', title: 'المخارج والصفات', title_en: 'Articulation Points & Characteristics', blurb: 'المخارج والصفات', blurb_en: 'Makhaarij al-huruf and sifaat al-huruf' },
      { key: 'ahkam', title: 'أحكام النون والميم والمدّ', title_en: 'Rules of Nun, Mim & Madd', blurb: 'أحكام النون والميم والمدّ', blurb_en: 'Rules of the silent nun, mim, and madd (vowel prolongation)' },
      { key: 'tilawa', title: 'التلاوة والوقف', title_en: 'Recitation & Stopping', blurb: 'التلاوة والوقف', blurb_en: 'Applying tajwid in continuous recitation and waqf rules' },
    ],
  },
  {
    key: 'khat',
    route: 'khat',
    title: 'الخط العربي',
    title_en: 'Arabic Calligraphy',
    blurb: 'من أساسيات الكتابة بخط النسخ إلى الرقعة والخطوط الفنية.',
    blurb_en: "From naskh handwriting fundamentals to ruq'a and artistic calligraphic scripts.",
    categories: [
      { key: 'usus', title: 'أسس الخط والكتابة', title_en: 'Script Fundamentals', blurb: 'أسس الخط العربي وأساسيات الكتابة اليدوية', blurb_en: 'Foundations of Arabic calligraphy and handwriting basics' },
      { key: 'naskh', title: 'خط النسخ', title_en: 'Naskh Script', blurb: 'خط النسخ', blurb_en: 'The naskh calligraphic style — basis of modern Arabic print' },
      { key: 'ruqaa', title: 'خط الرقعة', title_en: "Ruq'a Script", blurb: 'خط الرقعة', blurb_en: "The ruq'a calligraphic style — everyday handwriting" },
      { key: 'khutut_okhra', title: 'خطوط أخرى (الفارسي والديواني)', title_en: 'Other Scripts (Farsi & Diwani)', blurb: 'الخط الفارسي والديواني وغيرهما من الخطوط الفنية', blurb_en: "Farsi (ta'liq), Diwani, and other artistic calligraphic styles" },
    ],
  },
  {
    key: 'quranArabic',
    route: 'arabic-via-quran',
    title: 'العربية عبر القرآن',
    title_en: 'Arabic via the Quran',
    blurb: 'دورة متدرّجة لتعلُّم العربية عبر القرآن من المبتدئ إلى المتقدّم — وأساسٌ لغير الناطقين بها.',
    blurb_en: 'A graded Arabic course via the Quran from beginner to advanced — a foundation for non-native speakers.',
    categories: [
      { key: 'mustawa1', title: 'المستوى الأول (مبتدئ)', title_en: 'Level 1 — Beginner', blurb: 'المستوى الأول: أساسيات العربية للمبتدئين عبر القرآن', blurb_en: 'Level 1: Arabic fundamentals for beginners via the Quran' },
      { key: 'mustawa2', title: 'المستوى الثاني (متوسط)', title_en: 'Level 2 — Intermediate', blurb: 'المستوى الثاني: توسُّع في القواعد والمفردات', blurb_en: 'Level 2: Expanding grammar and vocabulary through Quranic text' },
      { key: 'mustawa3', title: 'المستوى الثالث (متقدّم)', title_en: 'Level 3 — Advanced', blurb: 'المستوى الثالث: تعمُّق في لغة القرآن وأسلوبه', blurb_en: 'Level 3: Deep dive into Quranic language, style, and rhetoric' },
      { key: 'qiraaq', title: 'القراءة القرآنية', title_en: 'Quranic Reading', blurb: 'القراءة القرآنية المتصلة مع الفهم', blurb_en: 'Connected Quranic reading with comprehension and application' },
      { key: 'alfaz', title: 'ألفاظ القرآن', title_en: 'Quranic Vocabulary', blurb: 'ألفاظ القرآن ودلالاتها', blurb_en: 'Quranic words, their meanings, and semantic fields' },
    ],
  },
];

export const REPO_URL = 'https://github.com/ehabterra/arabic-reference';
