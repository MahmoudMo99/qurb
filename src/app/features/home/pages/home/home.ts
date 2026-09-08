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
  LucideChevronLeft,
  LucideClock,
  LucideHeart,
  LucideMapPin,
  LucideRotateCcw,
  LucideScrollText,
  LucideSparkles,
} from '@lucide/angular';

import {
  PrayerCoordinates,
  PrayerLocation,
  PrayerTimesData,
  PrayerTimings,
} from '../../../../core/models/prayer-times.model';
import { PrayerLocationService } from '../../../../core/services/prayer-location';
import { PrayerTimesService } from '../../../../core/services/prayer-times';
import { DailyContent } from '../../components/daily-content/daily-content';

type MainPrayerKey = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
type FeatureIcon = 'quran' | 'prayer' | 'azkar' | 'hadith';

interface StatItem {
  value: string;
  label: string;
}

interface FeatureCard {
  title: string;
  eyebrow: string;
  description: string;
  icon: FeatureIcon;
  id: string;
  action: string;
  route: string;
}

interface RoutineStep {
  title: string;
  description: string;
  marker: string;
}

interface PrayerPreview {
  key: MainPrayerKey;
  name: string;
  time: string;
  isNext: boolean;
}

interface ValueItem {
  title: string;
  description: string;
  marker: string;
}

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    DailyContent,
    LucideBookOpen,
    LucideChevronLeft,
    LucideClock,
    LucideHeart,
    LucideMapPin,
    LucideRotateCcw,
    LucideScrollText,
    LucideSparkles,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly prayerTimesService = inject(PrayerTimesService);
  private readonly prayerLocationService = inject(PrayerLocationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentLocationId = this.prayerLocationService.currentLocationId;
  readonly locations = this.prayerLocationService.locations;

  readonly selectedLocationId = signal(this.prayerLocationService.getStoredLocationId());
  readonly currentCoordinates = signal<PrayerCoordinates | null>(
    this.prayerLocationService.getStoredCoordinates(),
  );

  readonly prayerData = signal<PrayerTimesData | null>(null);
  readonly isPrayerLoading = signal(true);
  readonly prayerErrorMessage = signal('');

  readonly selectedLocation = computed<PrayerLocation>(() => {
    return (
      this.prayerLocationService.getLocationById(this.selectedLocationId()) ??
      this.prayerLocationService.getFallbackLocation()
    );
  });

  readonly selectedLocationLabel = computed(() => {
    return this.prayerLocationService.getLocationLabel(this.selectedLocationId());
  });

  readonly stats: StatItem[] = [
    { value: '114', label: 'سورة' },
    { value: '5', label: 'صلوات يومية' },
    { value: 'ورد', label: 'متجدد' },
    { value: 'حفظ', label: 'للمفضلة' },
  ];

  readonly featureCards: FeatureCard[] = [
    {
      title: 'القرآن الكريم',
      eyebrow: 'قراءة واضحة',
      description: 'انتقل بين السور واقرأ بالرسم العثماني في واجهة مريحة تناسب القراءة اليومية.',
      icon: 'quran',
      id: 'quran',
      action: 'ابدأ القراءة',
      route: '/quran',
    },
    {
      title: 'مواقيت الصلاة',
      eyebrow: 'حسب مدينتك',
      description:
        'اعرف مواقيت اليوم والصلاة القادمة بسرعة، مع دعم اختيار المدينة أو الموقع الحالي.',
      icon: 'prayer',
      id: 'prayer-times',
      action: 'عرض المواقيت',
      route: '/prayer-times',
    },
    {
      title: 'الأذكار والأدعية',
      eyebrow: 'ذكر مستمر',
      description: 'أذكار الصباح والمساء والنوم والسفر وغيرها، مع عداد للتكرار ونسخ سريع.',
      icon: 'azkar',
      id: 'azkar',
      action: 'تصفح الأذكار',
      route: '/azkar',
    },
    {
      title: 'الأحاديث النبوية',
      eyebrow: 'مصادر منظمة',
      description: 'تصفح كتب الحديث والبحث داخل النصوص مع حفظ ونسخ ما تحتاج الرجوع إليه.',
      icon: 'hadith',
      id: 'hadith',
      action: 'قراءة الأحاديث',
      route: '/hadith',
    },
  ];

  readonly routineSteps: RoutineStep[] = [
    {
      title: 'افتح ورد اليوم',
      description: 'ابدأ بآية وحديث وذكر مختارين لليوم، بدون بحث أو خطوات كثيرة.',
      marker: '01',
    },
    {
      title: 'ارجع لما تحتاجه',
      description: 'انتقل مباشرة إلى القرآن، الأذكار، الحديث، أو مواقيت الصلاة حسب وقتك.',
      marker: '02',
    },
    {
      title: 'احفظ ما يلمسك',
      description: 'أضف الآيات والأذكار والأحاديث المهمة إلى المفضلة لتعود إليها لاحقًا.',
      marker: '03',
    },
  ];

  readonly prayerPreview = computed<PrayerPreview[]>(() => {
    const data = this.prayerData();

    if (!data) {
      return [];
    }

    const nextPrayerKey = this.getNextPrayerKey(data.timings, data.meta.timezone);

    return [
      {
        key: 'Fajr',
        name: 'الفجر',
        time: this.cleanTime(data.timings.Fajr),
        isNext: nextPrayerKey === 'Fajr',
      },
      {
        key: 'Dhuhr',
        name: 'الظهر',
        time: this.cleanTime(data.timings.Dhuhr),
        isNext: nextPrayerKey === 'Dhuhr',
      },
      {
        key: 'Asr',
        name: 'العصر',
        time: this.cleanTime(data.timings.Asr),
        isNext: nextPrayerKey === 'Asr',
      },
      {
        key: 'Maghrib',
        name: 'المغرب',
        time: this.cleanTime(data.timings.Maghrib),
        isNext: nextPrayerKey === 'Maghrib',
      },
      {
        key: 'Isha',
        name: 'العشاء',
        time: this.cleanTime(data.timings.Isha),
        isNext: nextPrayerKey === 'Isha',
      },
    ];
  });

  readonly nextPrayer = computed(() => {
    return this.prayerPreview().find((prayer) => prayer.isNext) ?? null;
  });

  readonly values: ValueItem[] = [
    {
      title: 'هدوء',
      description: 'تصميم بسيط ومساحات مريحة تخلي التركيز على النص والمعنى.',
      marker: '01',
    },
    {
      title: 'وضوح',
      description: 'كل قسم واضح ومباشر، من غير تشتيت أو ازدحام في الواجهة.',
      marker: '02',
    },
    {
      title: 'استمرارية',
      description: 'ورد يومي ومفضلة ونسخ سريع يساعدوك تحافظ على القرب خطوة بخطوة.',
      marker: '03',
    },
  ];

  constructor() {
    this.loadPrayerPreview();
  }

  reloadPrayerPreview(): void {
    this.loadPrayerPreview();
  }

  private loadPrayerPreview(): void {
    const selectedId = this.selectedLocationId();
    const coordinates = this.currentCoordinates();

    this.isPrayerLoading.set(true);
    this.prayerErrorMessage.set('');

    const request$ =
      selectedId === this.currentLocationId && coordinates
        ? this.prayerTimesService.getPrayerTimesByCoordinates(coordinates)
        : this.prayerTimesService.getPrayerTimesByCity(this.selectedLocation());

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.prayerData.set(data);
        this.isPrayerLoading.set(false);
      },
      error: () => {
        this.prayerErrorMessage.set('تعذر تحميل مواقيت الصلاة الآن.');
        this.isPrayerLoading.set(false);
      },
    });
  }

  private getNextPrayerKey(timings: PrayerTimings, timezone: string): MainPrayerKey {
    const keys: MainPrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = this.getDateInTimezone(timezone);

    for (const key of keys) {
      const prayerDate = this.getPrayerDate(timings[key], timezone);

      if (prayerDate > now) {
        return key;
      }
    }

    return 'Fajr';
  }

  private getPrayerDate(time: string, timezone: string): Date {
    const cleanTime = this.cleanTime(time);
    const [hours, minutes] = cleanTime.split(':').map(Number);
    const targetDate = this.getDateInTimezone(timezone);

    return new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      hours,
      minutes,
      0,
    );
  }

  private getDateInTimezone(timezone: string): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  }

  private cleanTime(time: string): string {
    return time.split(' ')[0];
  }
}
