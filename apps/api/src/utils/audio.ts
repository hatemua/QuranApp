export function ayahAudioUrl(
  surah: number,
  ayah: number,
  reciter: string = 'Alafasy_128kbps'
): string {
  const surahPadded = String(surah).padStart(3, '0');
  const ayahPadded = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${reciter}/${surahPadded}${ayahPadded}.mp3`;
}
