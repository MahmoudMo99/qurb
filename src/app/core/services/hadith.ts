import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';

import { HadithEditionResponse } from '../models/hadith.model';

@Injectable({
  providedIn: 'root',
})
export class HadithService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
  private readonly cachePrefix = 'qurb_hadith_cache';
  private readonly oldCachePrefix = 'quran_sunnah_hadith_cache';
  private readonly memoryCache = new Map<string, Observable<HadithEditionResponse>>();

  getEdition(edition: string): Observable<HadithEditionResponse> {
    const cachedRequest = this.memoryCache.get(edition);

    if (cachedRequest) {
      return cachedRequest;
    }

    const cacheKey = `${this.cachePrefix}_${edition}`;
    const oldCacheKey = `${this.oldCachePrefix}_${edition}`;

    const request$ = this.http
      .get<HadithEditionResponse>(`${this.apiUrl}/editions/${edition}.min.json`)
      .pipe(
        catchError(() => {
          return this.http.get<HadithEditionResponse>(`${this.apiUrl}/editions/${edition}.json`);
        }),
        map((data) => this.normalizeHadithResponse(data)),
        tap((data) => this.saveCache(cacheKey, oldCacheKey, data)),
        catchError(() => this.getCachedOrThrow(cacheKey, oldCacheKey)),
        shareReplay(1),
      );

    this.memoryCache.set(edition, request$);

    return request$;
  }

  private normalizeHadithResponse(data: HadithEditionResponse): HadithEditionResponse {
    return {
      ...data,
      hadiths: data.hadiths
        .map((hadith) => ({
          ...hadith,
          text: this.normalizeHadithText(hadith.text),
        }))
        .filter((hadith) => hadith.text.length > 0),
    };
  }

  private normalizeHadithText(value: string): string {
    return value
      .replace(/&lt;br\s*\/?&gt;/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p\s*>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/\s*\(\s*\d+\s*\)/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  private saveCache(key: string, oldKey: string, data: HadithEditionResponse): void {
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

  private getCachedOrThrow(key: string, oldKey: string): Observable<HadithEditionResponse> {
    const cachedData = this.getCachedData(key, oldKey);

    if (cachedData) {
      return of(this.normalizeHadithResponse(cachedData));
    }

    return throwError(() => new Error('No cached hadith data available.'));
  }

  private getCachedData(key: string, oldKey: string): HadithEditionResponse | null {
    try {
      const storedValue = localStorage.getItem(key) ?? localStorage.getItem(oldKey);

      if (!storedValue) {
        return null;
      }

      const parsedValue = JSON.parse(storedValue) as {
        cachedAt: string;
        data: HadithEditionResponse;
      };

      return parsedValue.data ?? null;
    } catch {
      return null;
    }
  }
}
