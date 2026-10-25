import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

import { PrayerCoordinates, PrayerDisplayItem } from '../../../../core/models/prayer-times.model';
import { HomePrayerPreviewService } from '../../../../core/services/home-prayer-preview';
import { PrayerLocationService } from '../../../../core/services/prayer-location';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

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
  private readonly prayerLocationService = inject(PrayerLocationService);
  private readonly prayerService = inject(HomePrayerPreviewService);

  readonly currentLocationId = this.prayerLocationService.currentLocationId;
  readonly locations = this.prayerLocationService.locations;

  readonly selectedLocationId = this.prayerLocationService.selectedLocationId;
  readonly currentCoordinates = this.prayerService.currentCoordinates;

  readonly prayerData = this.prayerService.prayerData;
  readonly isLoading = this.prayerService.isLoading;
  readonly errorMessage = this.prayerService.errorMessage;

  readonly isDetectingLocation = signal(false);
  readonly locationMessage = signal('');

  readonly selectedLocationLabel = this.prayerService.locationLabel;

  readonly prayerItems = computed<PrayerDisplayItem[]>(() => {
    const data = this.prayerData();

    if (!data) {
      return [];
    }

    const prayers = this.prayerService.prayers();

    return [
      {
        key: 'Fajr',
        name: 'الفجر',
        time: prayers.find((item) => item.key === 'Fajr')?.time ?? '',
        isNext: prayers.some((item) => item.key === 'Fajr' && item.isNext),
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
        time: prayers.find((item) => item.key === 'Dhuhr')?.time ?? '',
        isNext: prayers.some((item) => item.key === 'Dhuhr' && item.isNext),
      },
      {
        key: 'Asr',
        name: 'العصر',
        time: prayers.find((item) => item.key === 'Asr')?.time ?? '',
        isNext: prayers.some((item) => item.key === 'Asr' && item.isNext),
      },
      {
        key: 'Maghrib',
        name: 'المغرب',
        time: prayers.find((item) => item.key === 'Maghrib')?.time ?? '',
        isNext: prayers.some((item) => item.key === 'Maghrib' && item.isNext),
      },
      {
        key: 'Isha',
        name: 'العشاء',
        time: prayers.find((item) => item.key === 'Isha')?.time ?? '',
        isNext: prayers.some((item) => item.key === 'Isha' && item.isNext),
      },
    ];
  });

  readonly nextPrayer = this.prayerService.nextPrayer;

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

    this.locationMessage.set('');
    this.prayerLocationService.saveLocationId(location.id);
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

        this.prayerLocationService.saveCoordinates(coordinates);
        this.prayerLocationService.saveLocationId(this.currentLocationId);

        this.isDetectingLocation.set(false);
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
    this.prayerService.reload();
  }

  private cleanTime(time: string): string {
    return time.split(' ')[0];
  }
}
