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
import { QuranSurahDetails } from '../../../../core/models/quran.model';
import { QuranService } from '../../../../core/services/quran';
import { FavoriteButton } from '../../../../shared/components/favorite-button/favorite-button';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

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

  readonly surah = signal<QuranSurahDetails | null>(null);
  readonly currentSurahNumber = signal(0);
  readonly fontSizeLevel = signal(this.getStoredFontSizeLevel());
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

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

  private handleSurahResponse(surah: QuranSurahDetails | null): void {
    this.surah.set(surah);

    if (surah) {
      this.saveLastReadSurah(surah);
      this.viewportScroller.scrollToPosition([0, 0]);
    }

    this.isLoading.set(false);
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
