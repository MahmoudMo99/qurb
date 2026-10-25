import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, switchMap, throwError } from 'rxjs';

import { mapOfficialSurahAyahs } from '../mappers/official-quran.mapper';
import { OfficialQuranAyah, QuranSurah, QuranSurahDetails } from '../models/quran.model';

@Injectable({
  providedIn: 'root',
})
export class QuranService {
  private readonly http = inject(HttpClient);

  private readonly surahsUrl = '/data/quran/surahs.json';
  private readonly officialQuranUrl = '/data/quran/madinah-hafs.json';

  private surahsRequest$: Observable<QuranSurah[]> | null = null;
  private officialQuranRequest$: Observable<OfficialQuranAyah[]> | null = null;

  private readonly surahDetailsRequests = new Map<number, Observable<QuranSurahDetails>>();

  getSurahs(): Observable<QuranSurah[]> {
    if (!this.surahsRequest$) {
      this.surahsRequest$ = this.http.get<QuranSurah[]>(this.surahsUrl).pipe(
        map((surahs) => {
          if (!Array.isArray(surahs) || surahs.length !== 114) {
            throw new Error('Invalid Quran surahs dataset.');
          }

          return surahs;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.surahsRequest$;
  }

  getSurahDetails(surahNumber: number): Observable<QuranSurahDetails> {
    const cachedRequest = this.surahDetailsRequests.get(surahNumber);

    if (cachedRequest) {
      return cachedRequest;
    }

    const request$ = this.getSurahs().pipe(
      switchMap((surahs) => {
        const surah = surahs.find((item) => item.number === surahNumber);

        if (!surah) {
          return throwError(() => new Error('Surah not found.'));
        }

        return this.getOfficialQuranData().pipe(
          map((officialAyahs) => mapOfficialSurahAyahs(officialAyahs, surah)),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.surahDetailsRequests.set(surahNumber, request$);

    return request$;
  }

  getOfficialQuranData(): Observable<OfficialQuranAyah[]> {
    if (!this.officialQuranRequest$) {
      this.officialQuranRequest$ = this.http.get<OfficialQuranAyah[]>(this.officialQuranUrl).pipe(
        map((ayahs) => {
          if (!Array.isArray(ayahs) || ayahs.length !== 6236) {
            throw new Error('Invalid official Quran dataset.');
          }

          return ayahs;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.officialQuranRequest$;
  }
}
