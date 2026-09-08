import { Injectable } from '@angular/core';

import { PrayerCoordinates, PrayerLocation } from '../models/prayer-times.model';

@Injectable({
  providedIn: 'root',
})
export class PrayerLocationService {
  readonly currentLocationId = 'current-location';

  private readonly locationStorageKey = 'qurb_prayer_location';
  private readonly oldLocationStorageKey = 'quran_sunnah_prayer_location';
  private readonly coordinatesStorageKey = 'qurb_prayer_coordinates';
  private readonly oldCoordinatesStorageKey = 'quran_sunnah_prayer_coordinates';

  readonly locations: PrayerLocation[] = [
    { id: 'qena-eg', label: 'قنا، مصر', city: 'Qena', country: 'Egypt', method: 5 },
    { id: 'cairo-eg', label: 'القاهرة، مصر', city: 'Cairo', country: 'Egypt', method: 5 },
    {
      id: 'alexandria-eg',
      label: 'الإسكندرية، مصر',
      city: 'Alexandria',
      country: 'Egypt',
      method: 5,
    },
    { id: 'assiut-eg', label: 'أسيوط، مصر', city: 'Assiut', country: 'Egypt', method: 5 },
    { id: 'luxor-eg', label: 'الأقصر، مصر', city: 'Luxor', country: 'Egypt', method: 5 },
    { id: 'aswan-eg', label: 'أسوان، مصر', city: 'Aswan', country: 'Egypt', method: 5 },
    { id: 'makkah-sa', label: 'مكة، السعودية', city: 'Makkah', country: 'Saudi Arabia', method: 4 },
    {
      id: 'madinah-sa',
      label: 'المدينة، السعودية',
      city: 'Madinah',
      country: 'Saudi Arabia',
      method: 4,
    },
    {
      id: 'riyadh-sa',
      label: 'الرياض، السعودية',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      method: 4,
    },
    {
      id: 'dubai-ae',
      label: 'دبي، الإمارات',
      city: 'Dubai',
      country: 'United Arab Emirates',
      method: 8,
    },
    { id: 'doha-qa', label: 'الدوحة، قطر', city: 'Doha', country: 'Qatar', method: 10 },
  ];

  getStoredLocationId(): string {
    try {
      const storedValue =
        localStorage.getItem(this.locationStorageKey) ??
        localStorage.getItem(this.oldLocationStorageKey);

      if (storedValue === this.currentLocationId && this.getStoredCoordinates()) {
        return this.currentLocationId;
      }

      const matchedLocation = this.locations.find((location) => {
        return location.id === storedValue || location.city === storedValue;
      });

      return matchedLocation?.id ?? this.locations[0].id;
    } catch {
      return this.locations[0].id;
    }
  }

  saveLocationId(locationId: string): void {
    try {
      localStorage.setItem(this.locationStorageKey, locationId);
      localStorage.removeItem(this.oldLocationStorageKey);
    } catch {
      return;
    }
  }

  getStoredCoordinates(): PrayerCoordinates | null {
    try {
      const storedCoordinates =
        localStorage.getItem(this.coordinatesStorageKey) ??
        localStorage.getItem(this.oldCoordinatesStorageKey);

      if (!storedCoordinates) {
        return null;
      }

      const coordinates = JSON.parse(storedCoordinates) as PrayerCoordinates;

      if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        return null;
      }

      return coordinates;
    } catch {
      return null;
    }
  }

  saveCoordinates(coordinates: PrayerCoordinates): void {
    try {
      localStorage.setItem(this.coordinatesStorageKey, JSON.stringify(coordinates));
      localStorage.removeItem(this.oldCoordinatesStorageKey);
    } catch {
      return;
    }
  }

  getLocationById(locationId: string): PrayerLocation | null {
    return this.locations.find((location) => location.id === locationId) ?? null;
  }

  getFallbackLocation(): PrayerLocation {
    return this.locations[0];
  }

  isCurrentLocation(locationId: string): boolean {
    return locationId === this.currentLocationId;
  }

  getLocationLabel(locationId: string): string {
    if (this.isCurrentLocation(locationId)) {
      return 'موقعك الحالي';
    }

    return this.getLocationById(locationId)?.label ?? this.getFallbackLocation().label;
  }
}
