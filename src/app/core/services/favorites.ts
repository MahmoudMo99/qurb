import { Injectable, computed, signal } from '@angular/core';

import { FavoriteItem, FavoriteType } from '../models/favorite.model';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly storageKey = 'qurb_favorites';
  private readonly oldStorageKey = 'quran_sunnah_favorites';

  private readonly itemsState = signal<Record<string, FavoriteItem>>(this.getStoredFavorites());

  readonly favorites = computed(() => {
    return Object.values(this.itemsState()).sort((first, second) => {
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });
  });

  readonly totalCount = computed(() => this.favorites().length);

  readonly surahsCount = computed(() => {
    return this.favorites().filter((item) => item.type === 'surah').length;
  });

  readonly ayahsCount = computed(() => {
    return this.favorites().filter((item) => item.type === 'ayah').length;
  });

  readonly azkarCount = computed(() => {
    return this.favorites().filter((item) => item.type === 'zikr').length;
  });

  readonly hadithCount = computed(() => {
    return this.favorites().filter((item) => item.type === 'hadith').length;
  });

  isFavorite(id: string): boolean {
    return Boolean(this.itemsState()[id]);
  }

  getFavoritesByType(type: FavoriteType | 'all'): FavoriteItem[] {
    if (type === 'all') {
      return this.favorites();
    }

    return this.favorites().filter((item) => item.type === type);
  }

  toggleFavorite(item: Omit<FavoriteItem, 'createdAt'>): boolean {
    if (this.isFavorite(item.id)) {
      this.removeFavorite(item.id);
      return false;
    }

    this.addFavorite(item);
    return true;
  }

  addFavorite(item: Omit<FavoriteItem, 'createdAt'>): void {
    const nextItems = {
      ...this.itemsState(),
      [item.id]: {
        ...item,
        createdAt: new Date().toISOString(),
      },
    };

    this.updateFavorites(nextItems);
  }

  removeFavorite(id: string): void {
    const nextItems = { ...this.itemsState() };
    delete nextItems[id];

    this.updateFavorites(nextItems);
  }

  clearFavorites(): void {
    this.updateFavorites({});
  }

  private updateFavorites(items: Record<string, FavoriteItem>): void {
    this.itemsState.set(items);
    this.saveFavorites(items);
  }

  private getStoredFavorites(): Record<string, FavoriteItem> {
    try {
      const storedValue =
        localStorage.getItem(this.storageKey) ?? localStorage.getItem(this.oldStorageKey);

      if (!storedValue) {
        return {};
      }

      const parsedValue = JSON.parse(storedValue) as Record<string, FavoriteItem>;

      if (!parsedValue || typeof parsedValue !== 'object') {
        return {};
      }

      localStorage.setItem(this.storageKey, JSON.stringify(parsedValue));
      localStorage.removeItem(this.oldStorageKey);

      return parsedValue;
    } catch {
      return {};
    }
  }

  private saveFavorites(items: Record<string, FavoriteItem>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
      localStorage.removeItem(this.oldStorageKey);
    } catch {
      return;
    }
  }
}
