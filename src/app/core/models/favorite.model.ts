export type FavoriteType = 'surah' | 'ayah' | 'zikr' | 'hadith';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle: string;
  content?: string;
  route?: string;
  createdAt: string;
}
