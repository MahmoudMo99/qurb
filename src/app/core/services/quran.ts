import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';

import { QuranApiResponse, QuranSurah, QuranSurahDetails } from '../models/quran.model';

@Injectable({
  providedIn: 'root',
})
export class QuranService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.alquran.cloud/v1';
  private readonly cachePrefix = 'qurb_quran_cache';
  private readonly oldCachePrefix = 'quran_sunnah_quran_cache';

  private surahsRequest$: Observable<QuranSurah[]> | null = null;
  private readonly surahDetailsRequests = new Map<number, Observable<QuranSurahDetails>>();

  getSurahs(): Observable<QuranSurah[]> {
    if (this.surahsRequest$) {
      return this.surahsRequest$;
    }

    const cacheKey = `${this.cachePrefix}_surahs`;
    const oldCacheKey = `${this.oldCachePrefix}_surahs`;

    this.surahsRequest$ = this.http
      .get<QuranApiResponse<QuranSurah[]>>(`${this.apiUrl}/surah`)
      .pipe(
        map((response) => response.data),
        tap((data) => this.saveCache(cacheKey, oldCacheKey, data)),
        catchError(() => this.getCachedOrThrow<QuranSurah[]>(cacheKey, oldCacheKey)),
        shareReplay(1),
      );

    return this.surahsRequest$;
  }

  getSurahDetails(surahNumber: number): Observable<QuranSurahDetails> {
    const cachedRequest = this.surahDetailsRequests.get(surahNumber);

    if (cachedRequest) {
      return cachedRequest;
    }

    const cacheKey = `${this.cachePrefix}_surah_${surahNumber}`;
    const oldCacheKey = `${this.oldCachePrefix}_surah_${surahNumber}`;

    const request$ = this.http
      .get<QuranApiResponse<QuranSurahDetails>>(`${this.apiUrl}/surah/${surahNumber}/quran-uthmani`)
      .pipe(
        map((response) => response.data),
        tap((data) => this.saveCache(cacheKey, oldCacheKey, data)),
        catchError(() => this.getCachedOrThrow<QuranSurahDetails>(cacheKey, oldCacheKey)),
        shareReplay(1),
      );

    this.surahDetailsRequests.set(surahNumber, request$);

    return request$;
  }

  private saveCache<T>(key: string, oldKey: string, data: T): void {
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

  private getCachedOrThrow<T>(key: string, oldKey: string): Observable<T> {
    const cachedData = this.getCachedData<T>(key, oldKey);

    if (cachedData) {
      return of(cachedData);
    }

    return throwError(() => new Error('No cached quran data available.'));
  }

  private getCachedData<T>(key: string, oldKey: string): T | null {
    try {
      const storedValue = localStorage.getItem(key) ?? localStorage.getItem(oldKey);

      if (!storedValue) {
        return null;
      }

      const parsedValue = JSON.parse(storedValue) as {
        cachedAt: string;
        data: T;
      };

      return parsedValue.data ?? null;
    } catch {
      return null;
    }
  }
}
