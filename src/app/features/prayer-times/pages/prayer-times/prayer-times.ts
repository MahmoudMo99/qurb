import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideCalendarDays,
  LucideChevronDown,
  LucideCircleAlert,
  LucideClock,
  LucideCompass,
  LucideLocateFixed,
  LucideMapPin,
  LucideMoon,
  LucideSparkles,
  LucideSun,
  LucideSunrise,
  LucideSunset,
} from '@lucide/angular';

import {
  PrayerCoordinates,
  PrayerDisplayItem,
  PrayerLocation,
  PrayerTimesData,
  PrayerTimings,
} from '../../../../core/models/prayer-times.model';
import { PrayerLocationService } from '../../../../core/services/prayer-location';
import { PrayerTimesService } from '../../../../core/services/prayer-times';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

type MainPrayerKey = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

@Component({
  selector: 'app-prayer-times',
  imports: [
    PageState,
    SkeletonCard,
    LucideCalendarDays,
    LucideChevronDown,
    LucideCircleAlert,
    LucideClock,
    LucideCompass,
    LucideLocateFixed,
    LucideMapPin,
    LucideMoon,
    LucideSparkles,
    LucideSun,
    LucideSunrise,
    LucideSunset,
  ],
  templateUrl: './prayer-times.html',
  styleUrl: './prayer-times.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrayerTimes {
  private readonly prayerTimesService = inject(PrayerTimesService);
  private readonly prayerLocationService = inject(PrayerLocationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentLocationId = this.prayerLocationService.currentLocationId;
  readonly locations = this.prayerLocationService.locations;

  readonly selectedLocationId = signal(this.getInitialLocationId());
  readonly currentCoordinates = signal<PrayerCoordinates | null>(
    this.prayerLocationService.getStoredCoordinates(),
  );

  readonly prayerData = signal<PrayerTimesData | null>(null);
  readonly isLoading = signal(true);
  readonly isDetectingLocation = signal(false);
  readonly errorMessage = signal('');
  readonly locationMessage = signal('');

  readonly selectedLocation = computed<PrayerLocation>(() => {
    return (
      this.prayerLocationService.getLocationById(this.selectedLocationId()) ??
      this.prayerLocationService.getFallbackLocation()
    );
  });

  readonly selectedLocationLabel = computed(() => {
    return this.prayerLocationService.getLocationLabel(this.selectedLocationId());
  });

  readonly prayerItems = computed<PrayerDisplayItem[]>(() => {
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
        key: 'Sunrise',
        name: 'الشروق',
        time: this.cleanTime(data.timings.Sunrise),
        isNext: false,
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
    return this.prayerItems().find((item) => item.isNext) ?? null;
  });

  constructor() {
    this.loadPrayerTimes();
  }

  updateLocation(event: Event): void {
    const selectedId = (event.target as HTMLSelectElement).value;

    if (selectedId === this.currentLocationId) {
      this.useCurrentLocation();
      return;
    }

    const location = this.prayerLocationService.getLocationById(selectedId);

    if (!location) {
      return;
    }

    this.selectedLocationId.set(location.id);
    this.prayerLocationService.saveLocationId(location.id);
    this.loadPrayerTimes();
  }

  useCurrentLocation(): void {
    this.locationMessage.set('');

    if (!navigator.geolocation) {
      this.locationMessage.set('المتصفح لا يدعم تحديد الموقع الحالي.');
      return;
    }

    this.isDetectingLocation.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: PrayerCoordinates = {
          label: 'موقعك الحالي',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        this.currentCoordinates.set(coordinates);
        this.selectedLocationId.set(this.currentLocationId);

        this.prayerLocationService.saveCoordinates(coordinates);
        this.prayerLocationService.saveLocationId(this.currentLocationId);

        this.isDetectingLocation.set(false);
        this.loadPrayerTimes();
      },
      () => {
        this.locationMessage.set('لم نتمكن من الوصول لموقعك. يمكنك اختيار المدينة يدويًا.');
        this.isDetectingLocation.set(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000,
      },
    );
  }

  reloadPrayerTimes(): void {
    this.loadPrayerTimes();
  }

  private loadPrayerTimes(): void {
    const selectedId = this.selectedLocationId();
    const coordinates = this.currentCoordinates();

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.prayerData.set(null);

    const request$ =
      selectedId === this.currentLocationId && coordinates
        ? this.prayerTimesService.getPrayerTimesByCoordinates(coordinates)
        : this.prayerTimesService.getPrayerTimesByCity(this.selectedLocation());

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.prayerData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('تعذر تحميل مواقيت الصلاة الآن، حاول مرة أخرى لاحقًا.');
        this.isLoading.set(false);
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

  private getInitialLocationId(): string {
    const storedLocationId = this.prayerLocationService.getStoredLocationId();

    if (storedLocationId === this.currentLocationId) {
      return storedLocationId;
    }

    const storedLocation = this.prayerLocationService.getLocationById(storedLocationId);

    if (storedLocation) {
      return storedLocation.id;
    }

    return this.prayerLocationService.getFallbackLocation().id;
  }

  private cleanTime(time: string): string {
    return time.split(' ')[0];
  }
}
