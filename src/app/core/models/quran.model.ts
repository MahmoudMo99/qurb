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
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | Record<string, unknown>;
}

export interface QuranSurahDetails extends QuranSurah {
  ayahs: QuranAyah[];
}
