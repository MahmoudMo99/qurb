import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCopy, LucideSearch, LucideTrash2, LucideX } from '@lucide/angular';
import { HotToastService } from '@ngxpert/hot-toast';

import { FavoriteItem, FavoriteType } from '../../../../core/models/favorite.model';
import { FavoritesService } from '../../../../core/services/favorites';
import { PageState } from '../../../../shared/components/page-state/page-state';

type FavoritesFilter = FavoriteType | 'all';

interface FavoritesFilterOption {
  label: string;
  value: FavoritesFilter;
}

@Component({
  selector: 'app-favorites-list',
  imports: [RouterLink, PageState, LucideCopy, LucideSearch, LucideTrash2, LucideX],
  templateUrl: './favorites-list.html',
  styleUrl: './favorites-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesList {
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastService = inject(HotToastService);

  readonly activeFilter = signal<FavoritesFilter>('all');
  readonly searchTerm = signal('');
  readonly copiedFavoriteId = signal('');

  readonly totalCount = this.favoritesService.totalCount;
  readonly surahsCount = this.favoritesService.surahsCount;
  readonly ayahsCount = this.favoritesService.ayahsCount;
  readonly azkarCount = this.favoritesService.azkarCount;
  readonly hadithCount = this.favoritesService.hadithCount;

  readonly filters: FavoritesFilterOption[] = [
    { label: 'الكل', value: 'all' },
    { label: 'السور', value: 'surah' },
    { label: 'الآيات', value: 'ayah' },
    { label: 'الأذكار', value: 'zikr' },
    { label: 'الأحاديث', value: 'hadith' },
  ];

  readonly filteredFavorites = computed(() => {
    const term = this.normalizeArabic(this.searchTerm()).toLowerCase();
    const favorites = this.favoritesService.getFavoritesByType(this.activeFilter());

    if (!term) {
      return favorites;
    }

    return favorites.filter((item) => {
      return (
        this.normalizeArabic(item.title).includes(term) ||
        this.normalizeArabic(item.subtitle).includes(term) ||
        this.normalizeArabic(item.content ?? '').includes(term) ||
        this.normalizeArabic(this.getTypeLabel(item.type)).includes(term)
      );
    });
  });

  readonly resultCount = computed(() => this.filteredFavorites().length);
  readonly hasFavorites = computed(() => this.totalCount() > 0);

  readonly hasActiveSearch = computed(() => {
    return this.searchTerm().trim().length > 0 || this.activeFilter() !== 'all';
  });

  setFilter(filter: FavoritesFilter): void {
    this.activeFilter.set(filter);
  }

  updateSearchTerm(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.activeFilter.set('all');
  }

  removeFavorite(item: FavoriteItem): void {
    this.favoritesService.removeFavorite(item.id);
    this.toastService.info(`تمت إزالة ${this.getTypeLabel(item.type)} من المفضلة`);
  }

  clearFavorites(): void {
    const confirmed = confirm('هل أنت متأكد من مسح كل عناصر المفضلة؟');

    if (!confirmed) {
      return;
    }

    this.favoritesService.clearFavorites();
    this.searchTerm.set('');
    this.activeFilter.set('all');
    this.toastService.success('تم مسح كل عناصر المفضلة');
  }

  copyFavorite(item: FavoriteItem): void {
    if (!item.content) {
      this.toastService.info('لا يوجد نص متاح للنسخ في هذا العنصر');
      return;
    }

    const text = `${item.content}\n\n${item.title} - ${item.subtitle}`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.copiedFavoriteId.set(item.id);
        this.toastService.success('تم النسخ بنجاح');

        setTimeout(() => {
          if (this.copiedFavoriteId() === item.id) {
            this.copiedFavoriteId.set('');
          }
        }, 1600);
      })
      .catch(() => {
        this.copiedFavoriteId.set('');
        this.toastService.error('تعذر نسخ النص الآن');
      });
  }

  getTypeLabel(type: FavoriteType): string {
    const labels: Record<FavoriteType, string> = {
      surah: 'سورة',
      ayah: 'آية',
      zikr: 'ذكر',
      hadith: 'حديث',
    };

    return labels[type];
  }

  getFilterCount(filter: FavoritesFilter): number {
    const counts: Record<FavoritesFilter, number> = {
      all: this.totalCount(),
      surah: this.surahsCount(),
      ayah: this.ayahsCount(),
      zikr: this.azkarCount(),
      hadith: this.hadithCount(),
    };

    return counts[filter];
  }

  getEmptyContentMessage(item: FavoriteItem): string {
    if (item.type === 'surah') {
      return 'تم حفظ السورة للرجوع إليها وقراءتها بسرعة من زر الفتح.';
    }

    return 'هذا العنصر محفوظ في المفضلة.';
  }

  formatDate(value: string): string {
    return value.slice(0, 10);
  }

  private normalizeArabic(value: string): string {
    return value
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/\u0640/g, '')
      .replace(/[ٱأإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .trim();
  }
}
