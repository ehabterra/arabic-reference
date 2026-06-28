export const SITE_TITLE = 'المرجع العربي';
export const SITE_DESC =
  'مرجع تفاعلي لتعلُّم العربية: القراءة والكتابة، النحو، الصرف، البلاغة، التجويد، الخط، وعربية القرآن — بأمثلة ومخططات واختبارات وتتبُّع للتقدّم.';

export interface CategoryMeta {
  key: string;
  title: string;
  blurb: string;
}

export interface TrackMeta {
  key: string;
  route: string;
  title: string;
  blurb: string;
  categories: CategoryMeta[];
}

export const TRACKS: TrackMeta[] = [
  {
    key: 'qiraa',
    route: 'qiraa',
    title: 'القراءة والكتابة',
    blurb: 'تعلُّم القراءة الصحيحة من الحرف إلى الكلمة فالآية، على منهج نور البيان.',
    categories: [
      { key: 'huruf', title: 'الحروف', blurb: 'الحروف الهجائية وأشكالها في مواضع الكلمة' },
      { key: 'harakat', title: 'الحركات والسكون والمدود', blurb: 'الحركات والسكون والمدود' },
      { key: 'tarkib', title: 'القراءة المتصلة', blurb: 'القراءة المتصلة من الكلمة إلى الجملة فالآية' },
    ],
  },
  {
    key: 'nahw',
    route: 'nahw',
    title: 'النحو',
    blurb: 'إعراب الكلمة وموقعها: المرفوعات والمنصوبات والمجرورات وبناء الجملة.',
    categories: [
      { key: 'kalam', title: 'الكلام والإعراب', blurb: 'أقسام الكلام، الجملة، الإعراب والبناء وعلاماته' },
      { key: 'marfuaat', title: 'المرفوعات', blurb: 'الفاعل، نائب الفاعل، المبتدأ والخبر، اسم كان وخبر إنّ' },
      { key: 'mansubat', title: 'المنصوبات', blurb: 'المفاعيل، الحال، التمييز، الاستثناء، المنادى' },
      { key: 'majrurat', title: 'المجرورات', blurb: 'حروف الجر والإضافة' },
      { key: 'tawabi', title: 'التوابع', blurb: 'النعت، العطف، التوكيد، البدل' },
      { key: 'asalib', title: 'الأفعال والأساليب', blurb: 'نصب وجزم المضارع، الأفعال الخمسة، أساليب الشرط والنداء والتعجب والعدد' },
    ],
  },
  {
    key: 'sarf',
    route: 'sarf',
    title: 'الصرف',
    blurb: 'أبنية الكلمة وأوزانها: الميزان الصرفي والأفعال والمشتقات.',
    categories: [
      { key: 'mizan', title: 'الميزان الصرفي', blurb: 'الميزان الصرفي' },
      { key: 'afaal', title: 'الأفعال وأبنيتها', blurb: 'الأفعال وأبنيتها وتصريفها' },
      { key: 'mushtaqqat', title: 'المشتقّات والجموع', blurb: 'المشتقّات والجموع' },
    ],
  },
  {
    key: 'balagha',
    route: 'balagha',
    title: 'البلاغة',
    blurb: 'علوم البلاغة الثلاثة نظريًّا، وتطبيقها على بلاغة القرآن.',
    categories: [
      { key: 'maani', title: 'علم المعاني', blurb: 'علم المعاني' },
      { key: 'bayan', title: 'علم البيان', blurb: 'علم البيان' },
      { key: 'badi', title: 'علم البديع', blurb: 'علم البديع' },
      { key: 'balaghaq', title: 'بلاغة القرآن التطبيقية', blurb: 'تطبيق علوم البلاغة على آيات القرآن الكريم' },
    ],
  },
  {
    key: 'tajwid',
    route: 'tajwid',
    title: 'التجويد',
    blurb: 'أحكام تلاوة القرآن: المخارج والصفات وأحكام النون والمدود.',
    categories: [
      { key: 'makharij', title: 'المخارج والصفات', blurb: 'المخارج والصفات' },
      { key: 'ahkam', title: 'أحكام النون والميم والمدّ', blurb: 'أحكام النون والميم والمدّ' },
      { key: 'tilawa', title: 'التلاوة والوقف', blurb: 'التلاوة والوقف' },
    ],
  },
  {
    key: 'khat',
    route: 'khat',
    title: 'الخط العربي',
    blurb: 'من أساسيات الكتابة بخط النسخ إلى الرقعة والخطوط الفنية.',
    categories: [
      { key: 'usus', title: 'أسس الخط والكتابة', blurb: 'أسس الخط العربي وأساسيات الكتابة اليدوية' },
      { key: 'naskh', title: 'خط النسخ', blurb: 'خط النسخ' },
      { key: 'ruqaa', title: 'خط الرقعة', blurb: 'خط الرقعة' },
      { key: 'khutut_okhra', title: 'خطوط أخرى (الفارسي والديواني)', blurb: 'الخط الفارسي والديواني وغيرهما من الخطوط الفنية' },
    ],
  },
  {
    key: 'quranArabic',
    route: 'arabic-via-quran',
    title: 'العربية عبر القرآن',
    blurb: 'دورة متدرّجة لتعلُّم العربية عبر القرآن من المبتدئ إلى المتقدّم — وأساسٌ لغير الناطقين بها.',
    categories: [
      { key: 'mustawa1', title: 'المستوى الأول (مبتدئ)', blurb: 'المستوى الأول: أساسيات العربية للمبتدئين عبر القرآن' },
      { key: 'mustawa2', title: 'المستوى الثاني (متوسط)', blurb: 'المستوى الثاني: توسُّع في القواعد والمفردات' },
      { key: 'mustawa3', title: 'المستوى الثالث (متقدّم)', blurb: 'المستوى الثالث: تعمُّق في لغة القرآن وأسلوبه' },
      { key: 'qiraaq', title: 'القراءة القرآنية', blurb: 'القراءة القرآنية المتصلة مع الفهم' },
      { key: 'alfaz', title: 'ألفاظ القرآن', blurb: 'ألفاظ القرآن ودلالاتها' },
    ],
  },
];

export const REPO_URL = 'https://github.com/ehabterra/arabic-reference';
