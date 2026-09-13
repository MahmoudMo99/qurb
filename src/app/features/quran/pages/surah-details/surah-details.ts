import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBookOpen,
  LucideChevronLeft,
  LucideChevronRight,
  LucideList,
  LucideMinus,
  LucidePlus,
  LucideRotateCcw,
} from '@lucide/angular';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { FavoriteItem } from '../../../../core/models/favorite.model';
import { QuranAyah, QuranSurahDetails } from '../../../../core/models/quran.model';
import { QuranService } from '../../../../core/services/quran';
import { FavoriteButton } from '../../../../shared/components/favorite-button/favorite-button';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

type ReadingMode = 'surah' | 'mushaf';

interface MushafPageGroup {
  pageNumber: number;
  ayahs: QuranAyah[];
}

@Component({
  selector: 'app-surah-details',
  imports: [
    RouterLink,
    PageState,
    SkeletonCard,
    FavoriteButton,
    LucideArrowRight,
    LucideBookOpen,
    LucideChevronLeft,
    LucideChevronRight,
    LucideList,
    LucideMinus,
    LucidePlus,
    LucideRotateCcw,
  ],
  templateUrl: './surah-details.html',
  styleUrl: './surah-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurahDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly quranService = inject(QuranService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewportScroller = inject(ViewportScroller);

  private readonly lastReadStorageKey = 'qurb_last_read_surah';
  private readonly oldLastReadStorageKey = 'quran_sunnah_last_read_surah';
  private readonly fontSizeStorageKey = 'qurb_reading_font_size';
  private readonly oldFontSizeStorageKey = 'quran_sunnah_reading_font_size';
  private readonly readingModeStorageKey = 'qurb_quran_reading_mode';
  private readonly mushafPageStoragePrefix = 'qurb_quran_mushaf_page';

  readonly surah = signal<QuranSurahDetails | null>(null);
  readonly currentSurahNumber = signal(0);
  readonly fontSizeLevel = signal(this.getStoredFontSizeLevel());
  readonly readingMode = signal<ReadingMode>(this.getStoredReadingMode());
  readonly currentMushafPage = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly isFocusMode = signal(false);

  readonly canRetry = computed(() => {
    const surahNumber = this.currentSurahNumber();
    return surahNumber >= 1 && surahNumber <= 114;
  });

  readonly shouldShowBasmalah = computed(() => {
    const currentSurah = this.surah();

    if (!currentSurah) {
      return false;
    }

    return currentSurah.number !== 1 && currentSurah.number !== 9;
  });

  readonly displayAyahs = computed(() => {
    const currentSurah = this.surah();

    if (!currentSurah) {
      return [];
    }

    if (currentSurah.number === 1 || currentSurah.number === 9) {
      return currentSurah.ayahs;
    }

    return currentSurah.ayahs.map((ayah, index) => {
      if (index !== 0) {
        return ayah;
      }

      return {
        ...ayah,
        text: this.removeBasmalahFromFirstAyah(ayah.text),
      };
    });
  });

  readonly mushafPages = computed<MushafPageGroup[]>(() => {
    const pages = new Map<number, QuranAyah[]>();

    this.displayAyahs().forEach((ayah) => {
      const pageAyahs = pages.get(ayah.page) ?? [];
      pageAyahs.push(ayah);
      pages.set(ayah.page, pageAyahs);
    });

    return Array.from(pages.entries())
      .sort(([firstPage], [secondPage]) => firstPage - secondPage)
      .map(([pageNumber, ayahs]) => ({
        pageNumber,
        ayahs,
      }));
  });

  readonly firstMushafPage = computed(() => {
    return this.mushafPages()[0]?.pageNumber ?? null;
  });

  readonly lastMushafPage = computed(() => {
    const pages = this.mushafPages();
    return pages[pages.length - 1]?.pageNumber ?? null;
  });

  readonly currentMushafPageIndex = computed(() => {
    const pages = this.mushafPages();
    const pageIndex = pages.findIndex((page) => page.pageNumber === this.currentMushafPage());

    return pageIndex >= 0 ? pageIndex + 1 : 0;
  });

  readonly totalMushafPages = computed(() => {
    return this.mushafPages().length;
  });

  readonly currentMushafPageAyahs = computed(() => {
    const currentPage = this.currentMushafPage();

    return (
      this.mushafPages().find((page) => page.pageNumber === currentPage)?.ayahs ??
      this.mushafPages()[0]?.ayahs ??
      []
    );
  });

  readonly shouldShowBasmalahInView = computed(() => {
    if (!this.shouldShowBasmalah()) {
      return false;
    }

    if (this.readingMode() === 'surah') {
      return true;
    }

    return this.currentMushafPage() === this.firstMushafPage();
  });

  readonly canGoToPreviousMushafPage = computed(() => {
    const firstPage = this.firstMushafPage();

    if (!firstPage) {
      return false;
    }

    return this.currentMushafPage() > firstPage;
  });

  readonly canGoToNextMushafPage = computed(() => {
    const lastPage = this.lastMushafPage();

    if (!lastPage) {
      return false;
    }

    return this.currentMushafPage() < lastPage;
  });

  readonly previousSurahNumber = computed(() => {
    const currentSurah = this.surah();

    if (!currentSurah || currentSurah.number <= 1) {
      return null;
    }

    return currentSurah.number - 1;
  });

  readonly nextSurahNumber = computed(() => {
    const currentSurah = this.surah();

    if (!currentSurah || currentSurah.number >= 114) {
      return null;
    }

    return currentSurah.number + 1;
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('surahNumber'))),
        tap((surahNumber) => {
          this.currentSurahNumber.set(surahNumber);
          this.isLoading.set(true);
          this.errorMessage.set('');
          this.surah.set(null);
          this.currentMushafPage.set(0);
          this.isFocusMode.set(false);
        }),
        switchMap((surahNumber) => {
          if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
            this.errorMessage.set('رقم السورة غير صحيح.');
            this.isLoading.set(false);
            return of(null);
          }

          return this.quranService.getSurahDetails(surahNumber).pipe(
            catchError(() => {
              this.errorMessage.set('تعذر تحميل السورة الآن، حاول مرة أخرى لاحقًا.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((surah) => {
        this.handleSurahResponse(surah);
      });
  }

  reloadSurah(): void {
    const surahNumber = this.currentSurahNumber();

    if (surahNumber < 1 || surahNumber > 114) {
      this.errorMessage.set('رقم السورة غير صحيح.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.surah.set(null);
    this.currentMushafPage.set(0);

    this.quranService
      .getSurahDetails(surahNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (surah) => {
          this.handleSurahResponse(surah);
        },
        error: () => {
          this.errorMessage.set('تعذر تحميل السورة الآن، حاول مرة أخرى لاحقًا.');
          this.isLoading.set(false);
        },
      });
  }

  setReadingMode(mode: ReadingMode): void {
    if (this.readingMode() === mode) {
      return;
    }

    this.readingMode.set(mode);
    this.saveReadingMode(mode);

    if (mode === 'mushaf') {
      this.ensureValidMushafPage();
    }

    this.viewportScroller.scrollToAnchor('reading-card');
  }

  goToPreviousMushafPage(): void {
    this.goToMushafPageByOffset(-1);
  }

  goToNextMushafPage(): void {
    this.goToMushafPageByOffset(1);
  }

  getCurrentSurahFavoriteItem(surah: QuranSurahDetails): Omit<FavoriteItem, 'createdAt'> {
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

  increaseFontSize(): void {
    const nextLevel = Math.min(this.fontSizeLevel() + 1, 2);
    this.updateFontSize(nextLevel);
  }

  decreaseFontSize(): void {
    const nextLevel = Math.max(this.fontSizeLevel() - 1, 0);
    this.updateFontSize(nextLevel);
  }

  resetFontSize(): void {
    this.updateFontSize(0);
  }

  private handleSurahResponse(surah: QuranSurahDetails | null): void {
    this.surah.set(surah);

    if (surah) {
      this.saveLastReadSurah(surah);
      this.setInitialMushafPage(surah);
      this.viewportScroller.scrollToPosition([0, 0]);
    }

    this.isLoading.set(false);
  }

  private setInitialMushafPage(surah: QuranSurahDetails): void {
    const firstPage = surah.ayahs[0]?.page;

    if (!firstPage) {
      this.currentMushafPage.set(0);
      return;
    }

    const lastPage = surah.ayahs[surah.ayahs.length - 1]?.page ?? firstPage;
    const storedPage = this.getStoredMushafPage(surah.number);

    if (storedPage && storedPage >= firstPage && storedPage <= lastPage) {
      this.currentMushafPage.set(storedPage);
      return;
    }

    this.currentMushafPage.set(firstPage);
  }

  private ensureValidMushafPage(): void {
    const firstPage = this.firstMushafPage();
    const lastPage = this.lastMushafPage();
    const currentPage = this.currentMushafPage();

    if (!firstPage || !lastPage) {
      return;
    }

    if (currentPage >= firstPage && currentPage <= lastPage) {
      return;
    }

    this.currentMushafPage.set(firstPage);
  }

  private goToMushafPageByOffset(offset: number): void {
    const pages = this.mushafPages();
    const currentIndex = pages.findIndex((page) => page.pageNumber === this.currentMushafPage());
    const nextPage = pages[currentIndex + offset];

    if (!nextPage) {
      return;
    }

    this.currentMushafPage.set(nextPage.pageNumber);
    this.saveCurrentMushafPage(nextPage.pageNumber);
    this.viewportScroller.scrollToAnchor('reading-card');
  }

  private saveCurrentMushafPage(pageNumber: number): void {
    const surahNumber = this.currentSurahNumber();

    if (surahNumber < 1 || surahNumber > 114) {
      return;
    }

    try {
      localStorage.setItem(`${this.mushafPageStoragePrefix}_${surahNumber}`, pageNumber.toString());
    } catch {
      return;
    }
  }

  private getStoredMushafPage(surahNumber: number): number | null {
    try {
      const storedPage = Number(
        localStorage.getItem(`${this.mushafPageStoragePrefix}_${surahNumber}`),
      );

      return Number.isInteger(storedPage) && storedPage > 0 ? storedPage : null;
    } catch {
      return null;
    }
  }

  private updateFontSize(level: number): void {
    this.fontSizeLevel.set(level);

    try {
      localStorage.setItem(this.fontSizeStorageKey, level.toString());
    } catch {
      return;
    }
  }

  private getStoredFontSizeLevel(): number {
    try {
      const storedValue =
        localStorage.getItem(this.fontSizeStorageKey) ??
        localStorage.getItem(this.oldFontSizeStorageKey);

      if (!storedValue) {
        return 0;
      }

      const storedLevel = Number(storedValue);

      if ([0, 1, 2].includes(storedLevel)) {
        return storedLevel;
      }

      return 0;
    } catch {
      return 0;
    }
  }

  private saveReadingMode(mode: ReadingMode): void {
    try {
      localStorage.setItem(this.readingModeStorageKey, mode);
    } catch {
      return;
    }
  }

  private getStoredReadingMode(): ReadingMode {
    try {
      const storedMode = localStorage.getItem(this.readingModeStorageKey);

      if (storedMode === 'surah' || storedMode === 'mushaf') {
        return storedMode;
      }

      return 'surah';
    } catch {
      return 'surah';
    }
  }

  private saveLastReadSurah(surah: QuranSurahDetails): void {
    const value = JSON.stringify({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.numberOfAyahs,
      revelationType: surah.revelationType,
    });

    try {
      localStorage.setItem(this.lastReadStorageKey, value);
      localStorage.removeItem(this.oldLastReadStorageKey);
    } catch {
      return;
    }
  }

  toggleFocusMode(): void {
    this.isFocusMode.update((value) => !value);

    setTimeout(() => {
      this.viewportScroller.scrollToAnchor('reading-card');
    });
  }

  private removeBasmalahFromFirstAyah(text: string): string {
    const words = text.trim().split(/\s+/);

    if (words.length < 5) {
      return text;
    }

    const firstFourWords = words
      .slice(0, 4)
      .map((word) => this.normalizeArabic(word))
      .join(' ');

    if (firstFourWords === 'بسم الله الرحمن الرحيم') {
      return words.slice(4).join(' ');
    }

    return text;
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
