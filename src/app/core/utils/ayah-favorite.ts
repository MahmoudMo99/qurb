import { FavoriteItem } from '../models/favorite.model';

export interface AyahFavoriteInput {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  page: number;
}

export function createAyahFavoriteItem(ayah: AyahFavoriteInput): Omit<FavoriteItem, 'createdAt'> {
  return {
    id: `ayah-${ayah.surahNumber}-${ayah.ayahNumber}`,
    type: 'ayah',
    title: `سورة ${ayah.surahName} - الآية ${ayah.ayahNumber}`,
    subtitle: `الصفحة ${ayah.page}`,
    content: ayah.text,
    route: `/quran/${ayah.surahNumber}?ayah=${ayah.ayahNumber}`,
  };
}
