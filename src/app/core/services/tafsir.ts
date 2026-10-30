import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';

type TafsirDataset = Record<string, Record<string, string>>;

@Injectable({
  providedIn: 'root',
})
export class TafsirService {
  private readonly http = inject(HttpClient);

  private readonly tafsirUrl = '/data/quran/tafsir-muyassar.json';

  private tafsirRequest$: Observable<TafsirDataset> | null = null;

  getAyahTafsir(surahNumber: number, ayahNumber: number): Observable<string> {
    if (
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > 114 ||
      !Number.isInteger(ayahNumber) ||
      ayahNumber < 1
    ) {
      return throwError(() => new Error('Invalid surah or ayah number.'));
    }

    return this.getTafsirData().pipe(
      map((data) => {
        const tafsir = data[String(surahNumber)]?.[String(ayahNumber)];

        if (typeof tafsir !== 'string' || !tafsir.trim()) {
          throw new Error('Tafsir not found for this ayah.');
        }

        return tafsir;
      }),
    );
  }

  private getTafsirData(): Observable<TafsirDataset> {
    if (!this.tafsirRequest$) {
      this.tafsirRequest$ = this.http.get<TafsirDataset>(this.tafsirUrl).pipe(
        map((data) => {
          if (
            !data ||
            typeof data !== 'object' ||
            Array.isArray(data) ||
            Object.keys(data).length !== 114
          ) {
            throw new Error('Invalid Tafsir dataset.');
          }

          return data;
        }),
        catchError((error) => {
          this.tafsirRequest$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.tafsirRequest$;
  }
}
