import { OfficialQuranAyah, QuranAyah, QuranSurah, QuranSurahDetails } from '../models/quran.model';

export type OfficialMappedAyah = Pick<
  QuranAyah,
  'number' | 'text' | 'numberInSurah' | 'juz' | 'page'
> & {
  searchText: string;
  lineStart: number;
  lineEnd: number;
};

export function mapOfficialAyah(ayah: OfficialQuranAyah): OfficialMappedAyah {
  return {
    number: ayah.id,
    text: ayah.aya_text_unicode,
    numberInSurah: ayah.aya_no,
    juz: ayah.jozz,
    page: ayah.page,
    searchText: ayah.aya_text_emlaey,
    lineStart: ayah.line_start,
    lineEnd: ayah.line_end,
  };
}

export function mapOfficialSurahAyahs(
  officialAyahs: OfficialQuranAyah[],
  surah: QuranSurah,
): QuranSurahDetails {
  const ayahs: QuranAyah[] = officialAyahs
    .filter((ayah) => ayah.sura_no === surah.number)
    .map((ayah) => ({
      number: ayah.id,
      text: ayah.aya_text_unicode,
      numberInSurah: ayah.aya_no,
      juz: ayah.jozz,
      page: ayah.page,
    }));

  return {
    ...surah,
    ayahs,
  };
}
