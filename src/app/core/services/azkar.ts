import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';

import {
  AzkarApiResponse,
  AzkarCategoriesData,
  AzkarCategoryDetailsData,
} from '../models/azkar.model';

@Injectable({
  providedIn: 'root',
})
export class AzkarService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.islamic.app/v1';
  private readonly cachePrefix = 'qurb_azkar_cache';
  private readonly oldCachePrefix = 'quran_sunnah_azkar_cache';

  private categoriesRequest$: Observable<AzkarCategoriesData> | null = null;
  private readonly categoryRequests = new Map<string, Observable<AzkarCategoryDetailsData>>();

  getCategories(): Observable<AzkarCategoriesData> {
    if (this.categoriesRequest$) {
      return this.categoriesRequest$;
    }

    const cacheKey = `${this.cachePrefix}_categories`;
    const oldCacheKey = `${this.oldCachePrefix}_categories`;

    this.categoriesRequest$ = this.http
      .get<AzkarApiResponse<AzkarCategoriesData>>(`${this.apiUrl}/dhikr`)
      .pipe(
        map((response) => response.data),
        tap((data) => this.saveCache(cacheKey, oldCacheKey, data)),
        catchError(() => this.getCachedOrThrow<AzkarCategoriesData>(cacheKey, oldCacheKey)),
        shareReplay(1),
      );

    return this.categoriesRequest$;
  }

  getAzkarByCategory(category: string): Observable<AzkarCategoryDetailsData> {
    const cachedRequest = this.categoryRequests.get(category);

    if (cachedRequest) {
      return cachedRequest;
    }

    const cacheKey = `${this.cachePrefix}_category_${category}`;
    const oldCacheKey = `${this.oldCachePrefix}_category_${category}`;

    const request$ = this.http
      .get<AzkarApiResponse<AzkarCategoryDetailsData>>(`${this.apiUrl}/dhikr/${category}`)
      .pipe(
        map((response) => response.data),
        tap((data) => this.saveCache(cacheKey, oldCacheKey, data)),
        catchError(() => this.getCachedOrThrow<AzkarCategoryDetailsData>(cacheKey, oldCacheKey)),
        shareReplay(1),
      );

    this.categoryRequests.set(category, request$);

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

    return throwError(() => new Error('No cached azkar data available.'));
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
