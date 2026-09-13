import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
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
import { FocusModeService } from '../../../../core/services/focus-mode';
import { QuranService } from '../../../../core/services/quran';
import { FavoriteButton } from '../../../../shared/components/favorite-button/favorite-button';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

type ReadingMode = 'surah' | 'mushaf';

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
  private readonly focusModeService = inject(FocusModeService);

  private readonly lastReadStorageKey = 'qurb_last_read_surah';
  private readonly oldLastReadStorageKey = 'quran_sunnah_last_read_surah';
  private readonly fontSizeStorageKey = 'qurb_reading_font_size';
  private readonly oldFontSizeStorageKey = 'quran_sunnah_reading_font_size';
  private readonly readingModeStorageKey = 'qurb_quran_reading_mode';
  private readonly mushafPageStoragePrefix = 'qurb_mushaf_page_surah_';
  private readonly focusTapMoveThreshold = 12;

  private focusControlsTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private focusPointerStart: { x: number; y: number } | null = null;

  readonly surah = signal<QuranSurahDetails | null>(null);
  readonly currentSurahNumber = signal(0);
  readonly fontSizeLevel = signal(this.getStoredFontSizeLevel());
  readonly readingMode = signal<ReadingMode>(this.getStoredReadingMode());
  readonly currentMushafPage = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly isFocusMode = this.focusModeService.isEnabled;
  readonly isFocusControlsVisible = signal(false);

  readonly canRetry = computed(() => {
    const surahNumber = this.currentSurahNumber();
    return surahNumber >= 1 && surahNumber <= 114;
  });

  readonly displayAyahs = computed(() => {
    const currentSurah = this.surah();

    if (!currentSurah) {
      return [];
    }

    return this.prepareAyahs(currentSurah.ayahs, currentSurah.number);
  });

  readonly mushafPages = computed(() => {
    const currentSurah = this.surah();

    if (!currentSurah) {
      return [];
    }

    return Array.from(new Set(currentSurah.ayahs.map((ayah) => ayah.page))).sort((a, b) => a - b);
  });

  readonly firstMushafPage = computed(() => {
    return this.mushafPages()[0] ?? null;
  });

  readonly lastMushafPage = computed(() => {
    const pages = this.mushafPages();
    return pages[pages.length - 1] ?? null;
  });

  readonly totalMushafPages = computed(() => {
    return this.mushafPages().length;
  });

  readonly currentMushafPageIndex = computed(() => {
    const currentPage = this.currentMushafPage();
    const pageIndex = this.mushafPages().indexOf(currentPage);

    if (pageIndex === -1) {
      return 0;
    }

    return pageIndex + 1;
  });

  readonly currentMushafPageAyahs = computed(() => {
    const currentSurah = this.surah();
    const currentPage = this.currentMushafPage();

    if (!currentSurah || !currentPage) {
      return [];
    }

    const pageAyahs = currentSurah.ayahs.filter((ayah) => ayah.page === currentPage);

    return this.prepareAyahs(pageAyahs, currentSurah.number);
  });

  readonly shouldShowBasmalahInView = computed(() => {
    const currentSurah = this.surah();

    if (!currentSurah || currentSurah.number === 1 || currentSurah.number === 9) {
      return false;
    }

    if (this.readingMode() === 'surah') {
      return true;
    }

    return currentSurah.ayahs.some((ayah) => {
      return ayah.page === this.currentMushafPage() && ayah.numberInSurah === 1;
    });
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

  readonly canGoToPreviousMushafPage = computed(() => {
    return this.currentMushafPageIndex() > 1;
  });

  readonly canGoToNextMushafPage = computed(() => {
    return this.currentMushafPageIndex() < this.totalMushafPages();
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.leaveFocusModeSilently();
    });

    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('surahNumber'))),
        tap((surahNumber) => {
          this.currentSurahNumber.set(surahNumber);
          this.isLoading.set(true);
          this.errorMessage.set('');
          this.surah.set(null);
          this.currentMushafPage.set(0);
          this.leaveFocusModeSilently();
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

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isFocusMode()) {
      this.exitFocusMode();
    }
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

  setReadingMode(mode: ReadingMode): void {
    this.readingMode.set(mode);
    this.saveReadingMode(mode);

    if (mode === 'mushaf') {
      this.ensureCurrentMushafPage();
    }

    this.scrollToReadingCard();
  }

  goToPreviousMushafPage(): void {
    this.goToMushafPageByOffset(-1);
  }

  goToNextMushafPage(): void {
    this.goToMushafPageByOffset(1);
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
    this.updateFontSize(1);
  }

  toggleFocusMode(): void {
    if (this.isFocusMode()) {
      this.exitFocusMode();
      return;
    }

    this.enterFocusMode();
  }

  exitFocusMode(): void {
    this.focusModeService.disable();
    this.hideFocusControls();
    this.focusPointerStart = null;
  }

  onFocusPointerDown(event: PointerEvent): void {
    if (!this.isFocusMode()) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    this.focusPointerStart = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  onFocusPointerMove(event: PointerEvent): void {
    if (!this.isFocusMode() || !this.focusPointerStart) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - this.focusPointerStart.x,
      event.clientY - this.focusPointerStart.y,
    );

    if (distance > this.focusTapMoveThreshold) {
      this.focusPointerStart = null;
      this.hideFocusControls();
    }
  }

  onFocusPointerUp(event: PointerEvent): void {
    if (!this.isFocusMode() || !this.focusPointerStart) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - this.focusPointerStart.x,
      event.clientY - this.focusPointerStart.y,
    );

    this.focusPointerStart = null;

    if (distance <= this.focusTapMoveThreshold) {
      this.showFocusControls();
    }
  }

  onFocusPointerCancel(): void {
    this.focusPointerStart = null;
  }

  showFocusControls(): void {
    if (!this.isFocusMode()) {
      return;
    }

    this.isFocusControlsVisible.set(true);
    this.clearFocusControlsTimer();

    this.focusControlsTimeoutId = setTimeout(() => {
      this.isFocusControlsVisible.set(false);
      this.focusControlsTimeoutId = null;
    }, 2600);
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

  private enterFocusMode(): void {
    this.focusModeService.enable();
    this.showFocusControls();
    this.scrollToReadingCard();
  }

  private leaveFocusModeSilently(): void {
    this.focusModeService.disable();
    this.hideFocusControls();
    this.focusPointerStart = null;
  }

  private hideFocusControls(): void {
    this.isFocusControlsVisible.set(false);
    this.clearFocusControlsTimer();
  }

  private clearFocusControlsTimer(): void {
    if (!this.focusControlsTimeoutId) {
      return;
    }

    clearTimeout(this.focusControlsTimeoutId);
    this.focusControlsTimeoutId = null;
  }

  private goToMushafPageByOffset(offset: number): void {
    const pages = this.mushafPages();
    const currentIndex = pages.indexOf(this.currentMushafPage());
    const nextPage = pages[currentIndex + offset];

    if (!nextPage) {
      return;
    }

    this.currentMushafPage.set(nextPage);
    this.saveCurrentMushafPage(nextPage);
    this.showFocusControls();
    this.scrollToReadingCard();
  }

  private setInitialMushafPage(surah: QuranSurahDetails): void {
    const pages = Array.from(new Set(surah.ayahs.map((ayah) => ayah.page))).sort((a, b) => a - b);

    const storedPage = this.getStoredMushafPage(surah.number);
    const initialPage = storedPage && pages.includes(storedPage) ? storedPage : pages[0];

    this.currentMushafPage.set(initialPage ?? 0);
  }

  private ensureCurrentMushafPage(): void {
    const pages = this.mushafPages();

    if (!pages.length) {
      return;
    }

    if (!pages.includes(this.currentMushafPage())) {
      this.currentMushafPage.set(pages[0]);
    }
  }

  private saveCurrentMushafPage(page: number): void {
    const currentSurah = this.surah();

    if (!currentSurah) {
      return;
    }

    try {
      localStorage.setItem(
        `${this.mushafPageStoragePrefix}${currentSurah.number}`,
        page.toString(),
      );
    } catch {
      return;
    }
  }

  private getStoredMushafPage(surahNumber: number): number | null {
    try {
      const storedPage = Number(
        localStorage.getItem(`${this.mushafPageStoragePrefix}${surahNumber}`),
      );

      if (Number.isInteger(storedPage) && storedPage > 0) {
        return storedPage;
      }

      return null;
    } catch {
      return null;
    }
  }

  private updateFontSize(level: number): void {
    this.fontSizeLevel.set(level);

    try {
      localStorage.setItem(this.fontSizeStorageKey, level.toString());
      localStorage.removeItem(this.oldFontSizeStorageKey);
    } catch {
      return;
    }
  }

  private getStoredFontSizeLevel(): number {
    try {
      const storedLevel = Number(
        localStorage.getItem(this.fontSizeStorageKey) ??
          localStorage.getItem(this.oldFontSizeStorageKey),
      );

      if ([0, 1, 2].includes(storedLevel)) {
        return storedLevel;
      }

      return 1;
    } catch {
      return 1;
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

  private prepareAyahs(ayahs: QuranAyah[], surahNumber: number): QuranAyah[] {
    if (surahNumber === 1 || surahNumber === 9) {
      return ayahs;
    }

    return ayahs.map((ayah) => {
      if (ayah.numberInSurah !== 1) {
        return ayah;
      }

      return {
        ...ayah,
        text: this.removeBasmalahFromFirstAyah(ayah.text),
      };
    });
  }

  private scrollToReadingCard(): void {
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
