const BUCKWALTER_TO_ARABIC: Record<string, string> = {
  "'": 'ء', // ء
  A: 'ا', // ا
  b: 'ب', // ب
  p: 'ة', // ة
  t: 'ت', // ت
  v: 'ث', // ث
  j: 'ج', // ج
  H: 'ح', // ح
  x: 'خ', // خ
  d: 'د', // د
  '*': 'ذ', // ذ
  r: 'ر', // ر
  z: 'ز', // ز
  s: 'س', // س
  $: 'ش', // ش
  S: 'ص', // ص
  D: 'ض', // ض
  T: 'ط', // ط
  Z: 'ظ', // ظ
  E: 'ع', // ع
  g: 'غ', // غ
  _: 'ـ', // ـ (tatweel)
  f: 'ف', // ف
  q: 'ق', // ق
  k: 'ك', // ك
  l: 'ل', // ل
  m: 'م', // م
  n: 'ن', // ن
  h: 'ه', // ه
  w: 'و', // و
  Y: 'ى', // ى
  y: 'ي', // ي
  F: 'ً', // tanwin fath
  N: 'ٌ', // tanwin damm
  K: 'ٍ', // tanwin kasr
  a: 'َ', // fatha
  u: 'ُ', // damma
  i: 'ِ', // kasra
  '~': 'ّ', // shadda
  o: 'ْ', // sukun
  '`': 'ٰ', // superscript alef
  '{': 'ٱ', // alef wasla
  '|': 'آ', // alef madda
  '>': 'أ', // alef hamza above
  '<': 'إ', // alef hamza below
  '&': 'ؤ', // waw hamza
  '}': 'ئ', // ya hamza
};

export function buckwalterToArabic(input: string): string {
  let out = '';
  for (const ch of input) {
    out += BUCKWALTER_TO_ARABIC[ch] ?? ch;
  }
  return out;
}
