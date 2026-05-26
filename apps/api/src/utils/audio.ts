export function ayahAudioUrl(
  surah: number,
  ayah: number,
  reciter: string = 'Alafasy_128kbps'
): string {
  const surahPadded = String(surah).padStart(3, '0');
  const ayahPadded = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${surahPadded}${ayahPadded}.mp3`;
}

// Per-word audio from Quran.com's word-by-word CDN.
export function wordAudioUrl(surah: number, ayah: number, position: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  const p = String(position).padStart(3, '0');
  return `https://audio.qurancdn.com/wbw/${s}_${a}_${p}.mp3`;
}
