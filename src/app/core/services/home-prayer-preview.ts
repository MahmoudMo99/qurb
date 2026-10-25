import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import {
  PrayerCoordinates,
  PrayerLocation,
  PrayerTimesData,
  PrayerTimings,
} from '../models/prayer-times.model';
import { PrayerLocationService } from './prayer-location';
import { PrayerTimesService } from './prayer-times';

type MainPrayerKey = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface HomePrayerItem {
  key: MainPrayerKey;
  name: string;
  time: string;
  isNext: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HomePrayerPreviewService {
  private readonly prayerTimesService = inject(PrayerTimesService);
  private readonly prayerLocationService = inject(PrayerLocationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly prayerKeys: MainPrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  private readonly prayerNames: Record<MainPrayerKey, string> = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
  };

  private requestSubscription?: Subscription;
  private tomorrowSubscription?: Subscription;
  private clockInterval?: ReturnType<typeof setInterval>;
  private loadedDate = '';
  private requestVersion = 0;

  readonly selectedLocationId = this.prayerLocationService.selectedLocationId;
  readonly currentCoordinates = this.prayerLocationService.selectedCoordinates;

  readonly prayerData = signal<PrayerTimesData | null>(null);
  readonly tomorrowPrayerData = signal<PrayerTimesData | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly now = signal(Date.now());

  readonly selectedLocation = computed<PrayerLocation>(() => {
    return (
      this.prayerLocationService.getLocationById(this.selectedLocationId()) ??
      this.prayerLocationService.getFallbackLocation()
    );
  });

  readonly locationLabel = computed(() => {
    return this.prayerLocationService.getLocationLabel(this.selectedLocationId());
  });

  readonly prayers = computed<HomePrayerItem[]>(() => {
    const data = this.prayerData();

    if (!data) {
      return [];
    }

    const nextKey = this.getNextPrayerKey(data.timings, data.meta.timezone, this.now());

    const isTomorrowFajr = nextKey === 'Fajr' && this.isAfterIsha(data.timings, data.meta.timezone);

    return this.prayerKeys.map((key) => ({
      key,
      name: this.prayerNames[key],
      time: this.cleanTime(data.timings[key]),
      isNext: key === nextKey && !(isTomorrowFajr && !this.tomorrowPrayerData()),
    }));
  });

  readonly nextPrayer = computed<HomePrayerItem | null>(() => {
    const data = this.prayerData();

    if (!data) {
      return null;
    }

    const next = this.prayers().find((prayer) => prayer.isNext);

    if (!next) {
      return null;
    }

    if (next.key === 'Fajr' && this.isAfterIsha(data.timings, data.meta.timezone)) {
      const tomorrow = this.tomorrowPrayerData();

      if (!tomorrow) {
        return null;
      }

      return {
        ...next,
        time: this.cleanTime(tomorrow.timings.Fajr),
      };
    }

    return next;
  });

  constructor() {
    effect(() => {
      const locationId = this.selectedLocationId();
      const coordinates = this.currentCoordinates();

      this.load(locationId, coordinates);
    });

    this.clockInterval = setInterval(() => {
      this.now.set(Date.now());
      this.checkDateChange();
    }, 60_000);

    this.destroyRef.onDestroy(() => {
      this.requestSubscription?.unsubscribe();
      this.tomorrowSubscription?.unsubscribe();

      if (this.clockInterval) {
        clearInterval(this.clockInterval);
      }
    });
  }

  reload(): void {
    this.load(this.selectedLocationId(), this.currentCoordinates());
  }

  private load(locationId: string, coordinates: PrayerCoordinates | null): void {
    this.requestVersion++;
    const version = this.requestVersion;

    this.requestSubscription?.unsubscribe();
    this.tomorrowSubscription?.unsubscribe();

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.prayerData.set(null);
    this.tomorrowPrayerData.set(null);

    const location =
      this.prayerLocationService.getLocationById(locationId) ??
      this.prayerLocationService.getFallbackLocation();

    const request$ =
      locationId === this.prayerLocationService.currentLocationId && coordinates
        ? this.prayerTimesService.getPrayerTimesByCoordinates(coordinates)
        : this.prayerTimesService.getPrayerTimesByCity(location);

    this.requestSubscription = request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        if (version !== this.requestVersion) {
          return;
        }

        this.prayerData.set(data);
        this.loadedDate = this.getDateKey(data.meta.timezone, Date.now());
        this.now.set(Date.now());
        this.isLoading.set(false);

        this.loadTomorrow(locationId, coordinates, location, version);
      },
      error: () => {
        if (version !== this.requestVersion) {
          return;
        }

        this.errorMessage.set('تعذر تحميل مواقيت الصلاة الآن.');
        this.isLoading.set(false);
      },
    });
  }

  private loadTomorrow(
    locationId: string,
    coordinates: PrayerCoordinates | null,
    location: PrayerLocation,
    version: number,
  ): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const request$ =
      locationId === this.prayerLocationService.currentLocationId && coordinates
        ? this.prayerTimesService.getPrayerTimesByCoordinates(coordinates, tomorrow)
        : this.prayerTimesService.getPrayerTimesByCity(location, tomorrow);

    this.tomorrowSubscription = request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        if (version === this.requestVersion) {
          this.tomorrowPrayerData.set(data);
        }
      },
    });
  }

  private checkDateChange(): void {
    const data = this.prayerData();

    if (!data || this.isLoading()) {
      return;
    }

    const today = this.getDateKey(data.meta.timezone, this.now());

    if (today !== this.loadedDate) {
      this.reload();
    }
  }

  private getNextPrayerKey(
    timings: PrayerTimings,
    timezone: string,
    timestamp: number,
  ): MainPrayerKey {
    const currentMinutes = this.getMinutesInTimezone(timezone, timestamp);

    for (const key of this.prayerKeys) {
      const [hours, minutes] = this.cleanTime(timings[key]).split(':').map(Number);

      if (hours * 60 + minutes > currentMinutes) {
        return key;
      }
    }

    return 'Fajr';
  }

  private isAfterIsha(timings: PrayerTimings, timezone: string): boolean {
    const currentMinutes = this.getMinutesInTimezone(timezone, this.now());

    const [hours, minutes] = this.cleanTime(timings.Isha).split(':').map(Number);

    return currentMinutes >= hours * 60 + minutes;
  }

  private getMinutesInTimezone(timezone: string, timestamp: number): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(timestamp));

    const hours = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);

    const minutes = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);

    return hours * 60 + minutes;
  }

  private getDateKey(timezone: string, timestamp: number): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(timestamp));
  }

  private cleanTime(time: string): string {
    return time.split(' ')[0];
  }
}
