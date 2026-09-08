import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideBookOpen, LucideClock, LucideSearch, LucideX } from '@lucide/angular';

import { FavoriteItem } from '../../../../core/models/favorite.model';
import { QuranSurah } from '../../../../core/models/quran.model';
import { QuranService } from '../../../../core/services/quran';
import { FavoriteButton } from '../../../../shared/components/favorite-button/favorite-button';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

type RevelationFilter = 'All' | 'Meccan' | 'Medinan';

interface FilterOption {
  label: string;
  value: RevelationFilter;
}

interface QuranStat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-quran-list',
  imports: [
    RouterLink,
    PageState,
    SkeletonCard,
    FavoriteButton,
    LucideBookOpen,
    LucideClock,
    LucideSearch,
    LucideX,
  ],
  templateUrl: './quran-list.html',
  styleUrl: './quran-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuranList {
  private readonly quranService = inject(QuranService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lastReadStorageKey = 'qurb_last_read_surah';
  private readonly oldLastReadStorageKey = 'quran_sunnah_last_read_surah';

  readonly surahs = signal<QuranSurah[]>([]);
  readonly searchTerm = signal('');
  readonly activeFilter = signal<RevelationFilter>('All');
  readonly lastReadSurah = signal<QuranSurah | null>(this.getLastReadSurah());
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly filters: FilterOption[] = [
    { label: 'الكل', value: 'All' },
    { label: 'مكية', value: 'Meccan' },
    { label: 'مدنية', value: 'Medinan' },
  ];

  readonly filteredSurahs = computed(() => {
    const rawTerm = this.searchTerm().trim();
    const term = this.normalizeArabic(rawTerm).toLowerCase();
    const filter = this.activeFilter();
    const numericTerm = Number(rawTerm);
    const isNumericSearch = rawTerm !== '' && Number.isInteger(numericTerm);

    return this.surahs().filter((surah) => {
      const matchesFilter = filter === 'All' || surah.revelationType === filter;

      const matchesSearch =
        !term ||
        this.normalizeArabic(surah.name).includes(term) ||
        surah.englishName.toLowerCase().includes(term) ||
        surah.englishNameTranslation.toLowerCase().includes(term) ||
        (isNumericSearch ? surah.number === numericTerm : false);

      return matchesFilter && matchesSearch;
    });
  });

  readonly resultCount = computed(() => this.filteredSurahs().length);

  readonly meccanCount = computed(() => {
    return this.surahs().filter((surah) => surah.revelationType === 'Meccan').length;
  });

  readonly medinanCount = computed(() => {
    return this.surahs().filter((surah) => surah.revelationType === 'Medinan').length;
  });

  readonly stats = computed<QuranStat[]>(() => [
    { value: `${this.surahs().length || 114}`, label: 'سورة' },
    { value: `${this.meccanCount() || 86}`, label: 'مكية' },
    { value: `${this.medinanCount() || 28}`, label: 'مدنية' },
  ]);

  readonly hasActiveSearch = computed(() => {
    return this.searchTerm().trim().length > 0 || this.activeFilter() !== 'All';
  });

  constructor() {
    this.loadSurahs();
  }

  updateSearchTerm(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  setFilter(filter: RevelationFilter): void {
    this.activeFilter.set(filter);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.activeFilter.set('All');
  }

  reloadSurahs(): void {
    this.loadSurahs();
  }

  getSurahFavoriteItem(surah: QuranSurah): Omit<FavoriteItem, 'createdAt'> {
    return {
      id: `surah-${surah.number}`,
      type: 'surah',
      title: surah.name,
      subtitle: `${surah.numberOfAyahs} آية - ${
        surah.revelationType === 'Meccan' ? 'سورة مكية' : 'سورة مدنية'
      }`,
      route: `/quran/${surah.number}`,
    };
  }

  private loadSurahs(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.quranService
      .getSurahs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (surahs) => {
          this.surahs.set(surahs);
          this.syncLastReadSurah(surahs);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('تعذر تحميل السور الآن، حاول مرة أخرى لاحقًا.');
          this.isLoading.set(false);
        },
      });
  }

  private syncLastReadSurah(surahs: QuranSurah[]): void {
    const lastRead = this.lastReadSurah();

    if (!lastRead) {
      return;
    }

    const matchedSurah = surahs.find((surah) => surah.number === lastRead.number);

    if (matchedSurah) {
      this.lastReadSurah.set(matchedSurah);
      this.saveLastReadSurah(matchedSurah);
    }
  }

  private getLastReadSurah(): QuranSurah | null {
    try {
      const storedSurah =
        localStorage.getItem(this.lastReadStorageKey) ??
        localStorage.getItem(this.oldLastReadStorageKey);

      if (!storedSurah) {
        return null;
      }

      return JSON.parse(storedSurah) as QuranSurah;
    } catch {
      return null;
    }
  }

  private saveLastReadSurah(surah: QuranSurah): void {
    try {
      localStorage.setItem(this.lastReadStorageKey, JSON.stringify(surah));
      localStorage.removeItem(this.oldLastReadStorageKey);
    } catch {
      return;
    }
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
