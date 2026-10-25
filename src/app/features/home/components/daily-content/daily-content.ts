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
import {
  LucideBookOpen,
  LucideCalendarDays,
  LucideCheck,
  LucideChevronLeft,
  LucideCopy,
  LucideScrollText,
  LucideSparkles,
} from '@lucide/angular';
import { HotToastService } from '@ngxpert/hot-toast';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { ZikrItem } from '../../../../core/models/azkar.model';
import { FavoriteItem } from '../../../../core/models/favorite.model';
import { HadithItem } from '../../../../core/models/hadith.model';
import { QuranAyah, QuranSurahDetails } from '../../../../core/models/quran.model';
import { AzkarService } from '../../../../core/services/azkar';
import { HadithService } from '../../../../core/services/hadith';
import { QuranService } from '../../../../core/services/quran';
import { FavoriteButton } from '../../../../shared/components/favorite-button/favorite-button';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

interface DailyAyah {
  surah: QuranSurahDetails;
  ayah: QuranAyah;
}

interface DailyHadith {
  bookLabel: string;
  edition: string;
  hadith: HadithItem;
}

interface DailyZikr {
  categoryLabel: string;
  zikr: ZikrItem;
}

interface DailyContentData {
  ayah: DailyAyah | null;
  hadith: DailyHadith | null;
  zikr: DailyZikr | null;
}

interface DailyHadithBook {
  label: string;
  edition: string;
}

interface DailyZikrCategory {
  label: string;
  value: string;
}

type DailyCopyType = 'ayah' | 'hadith' | 'zikr';

@Component({
  selector: 'app-daily-content',
  imports: [
    RouterLink,
    PageState,
    SkeletonCard,
    FavoriteButton,
    LucideBookOpen,
    LucideCalendarDays,
    LucideCheck,
    LucideChevronLeft,
    LucideCopy,
    LucideScrollText,
    LucideSparkles,
  ],
  templateUrl: './daily-content.html',
  styleUrl: './daily-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyContent {
  private readonly quranService = inject(QuranService);
  private readonly hadithService = inject(HadithService);
  private readonly azkarService = inject(AzkarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(HotToastService);

  private readonly hadithBooks: readonly DailyHadithBook[] = [
    { label: 'صحيح البخاري', edition: 'ara-bukhari' },
    { label: 'صحيح مسلم', edition: 'ara-muslim' },
    { label: 'سنن أبي داود', edition: 'ara-abudawud' },
    { label: 'سنن الترمذي', edition: 'ara-tirmidhi' },
    { label: 'سنن النسائي', edition: 'ara-nasai' },
    { label: 'سنن ابن ماجه', edition: 'ara-ibnmajah' },
    { label: 'الأربعون النووية', edition: 'ara-nawawi' },
    { label: 'الأحاديث القدسية', edition: 'ara-qudsi' },
  ];

  private readonly zikrCategories: readonly DailyZikrCategory[] = [
    { label: 'أذكار الصباح', value: 'morning' },
    { label: 'أذكار المساء', value: 'evening' },
    { label: 'الأذكار بعد الصلاة', value: 'after-prayer' },
    { label: 'أذكار النوم', value: 'before-sleep' },
    { label: 'عند الاستيقاظ', value: 'waking-up' },
    { label: 'أدعية الصلاة', value: 'prayer' },
    { label: 'أذكار المسجد', value: 'mosque' },
    { label: 'أدعية السفر', value: 'travel' },
    { label: 'الطعام والشراب', value: 'food' },
    { label: 'أذكار البيت', value: 'home' },
    { label: 'الكرب والضيق', value: 'anxiety' },
    { label: 'الحفظ والتحصين', value: 'protection' },
    { label: 'الاستغفار', value: 'forgiveness' },
    { label: 'الحج والعمرة', value: 'hajj' },
  ];

  readonly dailyContent = signal<DailyContentData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly copiedItem = signal<DailyCopyType | null>(null);

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date()),
  );

  constructor() {
    this.loadDailyContent();
  }

  reloadDailyContent(): void {
    this.loadDailyContent();
  }

  async copyText(type: DailyCopyType): Promise<void> {
    const content = this.dailyContent();

    const labels: Record<DailyCopyType, string> = {
      ayah: 'الآية',
      hadith: 'الحديث',
      zikr: 'الذكر',
    };

    if (!content) {
      this.toastService.info('لا يوجد محتوى متاح للنسخ الآن');
      return;
    }

    const texts: Record<DailyCopyType, string> = {
      ayah: content.ayah
        ? `${content.ayah.ayah.text}\n\n${content.ayah.surah.name} - آية ${content.ayah.ayah.numberInSurah}`
        : '',
      hadith: content.hadith
        ? `${content.hadith.hadith.text}\n\n${content.hadith.bookLabel} - حديث رقم ${content.hadith.hadith.hadithnumber}`
        : '',
      zikr: content.zikr ? `${content.zikr.zikr.ar.text}\n\n${content.zikr.categoryLabel}` : '',
    };

    const text = texts[type];

    if (!text) {
      this.toastService.info(`لا يوجد نص متاح لنسخ ${labels[type]}`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);

      this.copiedItem.set(type);
      this.toastService.success(`تم نسخ ${labels[type]} بنجاح`);

      setTimeout(() => {
        if (this.copiedItem() === type) {
          this.copiedItem.set(null);
        }
      }, 1600);
    } catch {
      this.copiedItem.set(null);
      this.toastService.error(`تعذر نسخ ${labels[type]} الآن`);
    }
  }

  getDailyAyahFavoriteItem(ayah: DailyAyah): Omit<FavoriteItem, 'createdAt'> {
    return {
      id: `ayah-${ayah.surah.number}-${ayah.ayah.numberInSurah}`,
      type: 'ayah',
      title: `آية من ${ayah.surah.name}`,
      subtitle: `آية ${ayah.ayah.numberInSurah}`,
      content: ayah.ayah.text,
      route: `/quran/${ayah.surah.number}`,
    };
  }

  getDailyHadithFavoriteItem(hadith: DailyHadith): Omit<FavoriteItem, 'createdAt'> {
    return {
      id: `hadith-${hadith.edition}-${hadith.hadith.hadithnumber}`,
      type: 'hadith',
      title: hadith.bookLabel,
      subtitle: `حديث رقم ${hadith.hadith.hadithnumber}`,
      content: hadith.hadith.text,
      route: '/hadith',
    };
  }

  getDailyZikrFavoriteItem(zikr: DailyZikr): Omit<FavoriteItem, 'createdAt'> {
    return {
      id: `zikr-${zikr.zikr.category.number}-${zikr.zikr.number}`,
      type: 'zikr',
      title: zikr.categoryLabel,
      subtitle: `ذكر رقم ${zikr.zikr.number}`,
      content: zikr.zikr.ar.text,
      route: '/azkar',
    };
  }

  private loadDailyContent(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.dailyContent.set(null);

    const ayah$ = this.quranService.getSurahs().pipe(
      switchMap((surahs) => {
        const selectedSurah = surahs[this.getDailyIndex(surahs.length, 11)];

        if (!selectedSurah) {
          return of(null);
        }

        return this.quranService.getSurahDetails(selectedSurah.number).pipe(
          map((surah) => {
            const ayah = surah.ayahs[this.getDailyIndex(surah.ayahs.length, 19)];

            return ayah ? { surah, ayah } : null;
          }),
        );
      }),
      catchError(() => of(null)),
    );

    const hadithBook = this.hadithBooks[this.getDailyIndex(this.hadithBooks.length, 31)];

    const hadith$ = this.hadithService.getEdition(hadithBook.edition).pipe(
      map((data) => {
        const hadith = this.selectDailyHadith(data.hadiths);

        return hadith
          ? {
              bookLabel: hadithBook.label,
              edition: hadithBook.edition,
              hadith,
            }
          : null;
      }),
      catchError(() => of(null)),
    );

    const zikrCategory = this.zikrCategories[this.getDailyIndex(this.zikrCategories.length, 53)];

    const zikr$ = this.azkarService.getAzkarByCategory(zikrCategory.value).pipe(
      map((data) => {
        const zikr = data.duas[this.getDailyIndex(data.duas.length, 67)];

        return zikr
          ? {
              categoryLabel: zikrCategory.label,
              zikr,
            }
          : null;
      }),
      catchError(() => of(null)),
    );

    forkJoin({
      ayah: ayah$,
      hadith: hadith$,
      zikr: zikr$,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.dailyContent.set(content);
          this.isLoading.set(false);

          if (!content.ayah && !content.hadith && !content.zikr) {
            this.errorMessage.set('تعذر تحميل محتوى اليوم الآن.');
          }
        },
        error: () => {
          this.errorMessage.set('تعذر تحميل محتوى اليوم الآن.');
          this.isLoading.set(false);
        },
      });
  }

  private selectDailyHadith(hadiths: HadithItem[]): HadithItem | null {
    const suitableHadiths = hadiths.filter((hadith) => {
      const length = this.getPlainTextLength(hadith.text);
      return length >= 40 && length <= 850;
    });

    const source = suitableHadiths.length ? suitableHadiths : hadiths;

    return source[this.getDailyIndex(source.length, 43)] ?? null;
  }

  private getPlainTextLength(value: string): number {
    return value.replace(/\s+/g, ' ').trim().length;
  }

  private getDailyIndex(length: number, salt: number): number {
    if (length <= 0) {
      return 0;
    }

    return (this.getTodaySeed() + salt * 9973) % length;
  }

  private getTodaySeed(): number {
    const today = new Date();

    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  }
}
