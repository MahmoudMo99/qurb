import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import {
  PrayerCoordinates,
  PrayerLocation,
  PrayerTimesApiResponse,
  PrayerTimesData,
} from '../models/prayer-times.model';

@Injectable({
  providedIn: 'root',
})
export class PrayerTimesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.aladhan.com/v1';
  private readonly cachePrefix = 'qurb_prayer_times_cache';
  private readonly oldCachePrefix = 'quran_sunnah_prayer_times_cache';

  getPrayerTimesByCity(location: PrayerLocation): Observable<PrayerTimesData> {
    const todayDate = this.getTodayDate();
    const cacheName = this.buildCacheName([
      'city',
      todayDate,
      location.city,
      location.country,
      location.method,
    ]);
    const cacheKey = `${this.cachePrefix}_${cacheName}`;
    const oldCacheKey = `${this.oldCachePrefix}_${cacheName}`;

    const params = new HttpParams()
      .set('city', location.city)
      .set('country', location.country)
      .set('method', location.method.toString());

    return this.http
      .get<PrayerTimesApiResponse>(`${this.apiUrl}/timingsByCity/${todayDate}`, {
        params,
      })
      .pipe(
        map((response) => response.data),
        tap((data) => this.saveCache(cacheKey, oldCacheKey, data)),
        catchError(() => this.getCachedOrThrow(cacheKey, oldCacheKey)),
      );
  }

  getPrayerTimesByCoordinates(coordinates: PrayerCoordinates): Observable<PrayerTimesData> {
    const todayDate = this.getTodayDate();
    const latitude = coordinates.latitude.toFixed(4);
    const longitude = coordinates.longitude.toFixed(4);
    const method = coordinates.method?.toString() ?? 'default';

    const cacheName = this.buildCacheName(['coordinates', todayDate, latitude, longitude, method]);
    const cacheKey = `${this.cachePrefix}_${cacheName}`;
    const oldCacheKey = `${this.oldCachePrefix}_${cacheName}`;

    let params = new HttpParams()
      .set('latitude', coordinates.latitude.toString())
      .set('longitude', coordinates.longitude.toString());

    if (coordinates.method) {
      params = params.set('method', coordinates.method.toString());
    }

    return this.http
      .get<PrayerTimesApiResponse>(`${this.apiUrl}/timings/${todayDate}`, { params })
      .pipe(
        map((response) => response.data),
        tap((data) => this.saveCache(cacheKey, oldCacheKey, data)),
        catchError(() => this.getCachedOrThrow(cacheKey, oldCacheKey)),
      );
  }

  private getTodayDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    return `${day}-${month}-${year}`;
  }

  private buildCacheName(parts: Array<string | number>): string {
    return parts
      .map((part) => {
        return String(part)
          .toLowerCase()
          .replace(/[^a-z0-9.-]+/g, '-');
      })
      .join('_');
  }

  private saveCache(key: string, oldKey: string, data: PrayerTimesData): void {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          cachedAt: new Date().toISOString(),
          data,
        }),
      );

      localStorage.removeItem(oldKey);
    } catch {
      return;
    }
  }

  private getCachedOrThrow(key: string, oldKey: string): Observable<PrayerTimesData> {
    const cachedData = this.getCachedData(key, oldKey);

    if (cachedData) {
      return of(cachedData);
    }

    return throwError(() => new Error('No cached prayer times data available.'));
  }

  private getCachedData(key: string, oldKey: string): PrayerTimesData | null {
    try {
      const storedValue = localStorage.getItem(key) ?? localStorage.getItem(oldKey);

      if (!storedValue) {
        return null;
      }

      const parsedValue = JSON.parse(storedValue) as {
        cachedAt: string;
        data: PrayerTimesData;
      };

      return parsedValue.data ?? null;
    } catch {
      return null;
    }
  }
}
