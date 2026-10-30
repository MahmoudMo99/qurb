export interface QuranApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface QuranAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil?: number;
  page: number;
  ruku?: number;
  hizbQuarter?: number;
  sajda?: boolean | Record<string, unknown>;
}

export interface QuranSurahDetails extends QuranSurah {
  ayahs: QuranAyah[];
}

export interface OfficialQuranAyah {
  id: number;
  jozz: number;
  sura_no: number;
  sura_name_en: string;
  sura_name_ar: string;
  page: number;
  line_start: number;
  line_end: number;
  aya_no: number;
  aya_text_unicode: string;
  aya_text_emlaey: string;
}

export interface SelectedQuranAyah {
  surahNumber: number;
  ayahNumber: number;
  text: string;
  page: number;
}

export interface QuranTafsirAyah {
  sura_no: number;
  aya_no: number;
  aya_tafseer: string;
}
