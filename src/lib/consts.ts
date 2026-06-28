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
    blurb: 'من الحروف إلى الكلمة: تعلُّم القراءة والكتابة الصحيحة بالحركات.',
    categories: [
      { key: 'huruf', title: 'الحروف', blurb: 'الحروف الهجائية' },
      { key: 'harakat', title: 'الحركات والسكون والمدود', blurb: 'الحركات والسكون والمدود' },
      { key: 'tarkib', title: 'تكوين الكلمات والجمل', blurb: 'تكوين الكلمات والجمل' },
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
      { key: 'afaal', title: 'الأفعال وتصريفها', blurb: 'الأفعال وتصريفها' },
      { key: 'mushtaqqat', title: 'المشتقّات والجموع', blurb: 'المشتقّات والجموع' },
    ],
  },
  {
    key: 'balagha',
    route: 'balagha',
    title: 'البلاغة',
    blurb: 'بلاغة العربية: علوم المعاني والبيان والبديع.',
    categories: [
      { key: 'maani', title: 'علم المعاني', blurb: 'علم المعاني' },
      { key: 'bayan', title: 'علم البيان', blurb: 'علم البيان' },
      { key: 'badi', title: 'علم البديع', blurb: 'علم البديع' },
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
    blurb: 'جمال الكتابة العربية: أسس الخط وخطّا الرقعة والنسخ.',
    categories: [
      { key: 'usus', title: 'أسس الخط', blurb: 'أسس الخط' },
      { key: 'ruqaa', title: 'خط الرقعة', blurb: 'خط الرقعة' },
      { key: 'naskh', title: 'خط النسخ', blurb: 'خط النسخ' },
    ],
  },
  {
    key: 'quranArabic',
    route: 'quran-arabic',
    title: 'عربية القرآن',
    blurb: 'فهم لغة القرآن: ألفاظه ونحوه وبلاغته.',
    categories: [
      { key: 'alfaz', title: 'ألفاظ القرآن', blurb: 'ألفاظ القرآن' },
      { key: 'nahwq', title: 'نحو القرآن', blurb: 'نحو القرآن' },
      { key: 'balaghaq', title: 'بلاغة القرآن', blurb: 'بلاغة القرآن' },
    ],
  },
  {
    key: 'nonnative',
    route: 'nonnative',
    title: 'العربية لغير الناطقين بها',
    blurb: 'تعلُّم العربية خطوةً بخطوة لغير الناطقين بها.',
    categories: [
      { key: 'asasiyat', title: 'الأساسيات', blurb: 'الأساسيات' },
      { key: 'qawaid', title: 'القواعد', blurb: 'القواعد' },
      { key: 'mufradat', title: 'المفردات والحوار', blurb: 'المفردات والحوار' },
    ],
  },
];

export const REPO_URL = 'https://github.com/ehabterra/arabic-reference';
