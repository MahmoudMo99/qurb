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

@Component({
  selector: 'app-daily-content',
  imports: [
    RouterLink,
    PageState,
    SkeletonCard,
    FavoriteButton,
    LucideBookOpen,
    LucideCalendarDays,
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

  private readonly hadithBooks: DailyHadithBook[] = [
    { label: 'صحيح البخاري', edition: 'ara-bukhari' },
    { label: 'صحيح مسلم', edition: 'ara-muslim' },
    { label: 'سنن أبي داود', edition: 'ara-abudawud' },
    { label: 'سنن الترمذي', edition: 'ara-tirmidhi' },
    { label: 'سنن النسائي', edition: 'ara-nasai' },
    { label: 'سنن ابن ماجه', edition: 'ara-ibnmajah' },
    { label: 'الأربعون النووية', edition: 'ara-nawawi' },
    { label: 'الأحاديث القدسية', edition: 'ara-qudsi' },
  ];

  private readonly zikrCategories: DailyZikrCategory[] = [
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
  readonly copiedItem = signal('');

  readonly todayLabel = computed(() => {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  });

  constructor() {
    this.loadDailyContent();
  }

  reloadDailyContent(): void {
    this.loadDailyContent();
  }

  copyText(type: 'ayah' | 'hadith' | 'zikr'): void {
    const content = this.dailyContent();

    const labelMap = {
      ayah: 'الآية',
      hadith: 'الحديث',
      zikr: 'الذكر',
    };

    if (!content) {
      this.toastService.info('لا يوجد محتوى متاح للنسخ الآن');
      return;
    }

    const textMap = {
      ayah: content.ayah
        ? `${content.ayah.ayah.text}\n\n${content.ayah.surah.name} - آية ${content.ayah.ayah.numberInSurah}`
        : '',
      hadith: content.hadith ? `${content.hadith.hadith.text}\n\n${content.hadith.bookLabel}` : '',
      zikr: content.zikr ? `${content.zikr.zikr.ar.text}\n\n${content.zikr.categoryLabel}` : '',
    };

    const text = textMap[type];

    if (!text) {
      this.toastService.info(`لا يوجد نص متاح لنسخ ${labelMap[type]}`);
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.copiedItem.set(type);
        this.toastService.success(`تم نسخ ${labelMap[type]} بنجاح`);

        setTimeout(() => {
          if (this.copiedItem() === type) {
            this.copiedItem.set('');
          }
        }, 1600);
      })
      .catch(() => {
        this.copiedItem.set('');
        this.toastService.error(`تعذر نسخ ${labelMap[type]} الآن`);
      });
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

    const ayah$ = this.quranService.getSurahs().pipe(
      switchMap((surahs) => {
        const surahIndex = this.getDailyIndex(surahs.length, 11);
        const selectedSurah = surahs[surahIndex];

        return this.quranService.getSurahDetails(selectedSurah.number).pipe(
          map((surah) => {
            const ayahIndex = this.getDailyIndex(surah.ayahs.length, 19);

            return {
              surah,
              ayah: surah.ayahs[ayahIndex],
            };
          }),
        );
      }),
      catchError(() => of(null)),
    );

    const hadithBook = this.hadithBooks[this.getDailyIndex(this.hadithBooks.length, 31)];

    const hadith$ = this.hadithService.getEdition(hadithBook.edition).pipe(
      map((data) => {
        const hadith = data.hadiths[this.getDailyIndex(data.hadiths.length, 43)] ?? null;

        if (!hadith) {
          return null;
        }

        return {
          bookLabel: hadithBook.label,
          edition: hadithBook.edition,
          hadith,
        };
      }),
      catchError(() => of(null)),
    );

    const zikrCategory = this.zikrCategories[this.getDailyIndex(this.zikrCategories.length, 53)];

    const zikr$ = this.azkarService.getAzkarByCategory(zikrCategory.value).pipe(
      map((data) => {
        const zikr = data.duas[this.getDailyIndex(data.duas.length, 67)] ?? null;

        if (!zikr) {
          return null;
        }

        return {
          categoryLabel: zikrCategory.label,
          zikr,
        };
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

  private getDailyIndex(length: number, salt: number): number {
    if (length <= 0) {
      return 0;
    }

    return (this.getTodaySeed() + salt * 9973) % length;
  }

  private getTodaySeed(): number {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    return year * 10000 + month * 100 + day;
  }
}
