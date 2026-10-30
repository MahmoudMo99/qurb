import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of, take } from 'rxjs';

import { FavoriteItem, FavoriteType } from '../models/favorite.model';
import { createAyahFavoriteItem } from '../utils/ayah-favorite';
import { QuranService } from './quran';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly storageKey = 'qurb_favorites';
  private readonly oldStorageKey = 'quran_sunnah_favorites';

  private readonly quranService = inject(QuranService);

  private ayahMigrationInProgress = false;

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

  migrateLegacyAyahFavorites(): void {
    if (this.ayahMigrationInProgress) {
      return;
    }

    const ayahFavorites = this.favorites().filter(
      (item) => item.type === 'ayah' && /^ayah-(\d+)-(\d+)$/.test(item.id),
    );

    if (!ayahFavorites.length) {
      return;
    }

    const surahNumbers = [
      ...new Set(ayahFavorites.map((item) => Number(item.id.split('-')[1]))),
    ].filter((number) => Number.isInteger(number) && number >= 1 && number <= 114);

    if (!surahNumbers.length) {
      return;
    }

    this.ayahMigrationInProgress = true;

    const requests = surahNumbers.map((surahNumber) =>
      this.quranService.getSurahDetails(surahNumber).pipe(catchError(() => of(null))),
    );

    forkJoin(requests)
      .pipe(take(1))
      .subscribe({
        next: (surahs) => {
          const surahMap = new Map(
            surahs.filter((surah) => surah !== null).map((surah) => [surah.number, surah]),
          );

          const nextItems = { ...this.itemsState() };

          let hasChanges = false;

          for (const item of ayahFavorites) {
            const match = /^ayah-(\d+)-(\d+)$/.exec(item.id);

            if (!match) {
              continue;
            }

            const surahNumber = Number(match[1]);
            const ayahNumber = Number(match[2]);

            const surah = surahMap.get(surahNumber);

            if (!surah) {
              continue;
            }

            const ayah = surah.ayahs.find(
              (currentAyah) => currentAyah.numberInSurah === ayahNumber,
            );

            if (!ayah) {
              continue;
            }

            const normalized = createAyahFavoriteItem({
              surahNumber,
              surahName: surah.name,
              ayahNumber,
              text: ayah.text,
              page: ayah.page,
            });

            const current = nextItems[item.id];

            if (!current || current.type !== 'ayah') {
              continue;
            }

            const updated: FavoriteItem = {
              ...current,
              ...normalized,
              createdAt: current.createdAt,
            };

            if (
              current.title !== updated.title ||
              current.subtitle !== updated.subtitle ||
              current.content !== updated.content ||
              current.route !== updated.route
            ) {
              nextItems[item.id] = updated;
              hasChanges = true;
            }
          }

          if (hasChanges) {
            this.updateFavorites(nextItems);
          }

          this.ayahMigrationInProgress = false;
        },
        error: () => {
          this.ayahMigrationInProgress = false;
        },
      });
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

      if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
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
