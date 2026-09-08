import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideBookOpen, LucideCopy, LucidePlus, LucideSearch, LucideX } from '@lucide/angular';
import { HotToastService } from '@ngxpert/hot-toast';

import { FavoriteItem } from '../../../../core/models/favorite.model';
import {
  HadithBookOption,
  HadithEditionResponse,
  HadithItem,
} from '../../../../core/models/hadith.model';
import { HadithService } from '../../../../core/services/hadith';
import { FavoriteButton } from '../../../../shared/components/favorite-button/favorite-button';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

@Component({
  selector: 'app-hadith-list',
  imports: [
    PageState,
    SkeletonCard,
    FavoriteButton,
    LucideBookOpen,
    LucideCopy,
    LucidePlus,
    LucideSearch,
    LucideX,
  ],
  templateUrl: './hadith-list.html',
  styleUrl: './hadith-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HadithList {
  private readonly hadithService = inject(HadithService);
  private readonly toastService = inject(HotToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageSize = 24;

  readonly books: HadithBookOption[] = [
    {
      label: 'صحيح البخاري',
      edition: 'ara-bukhari',
      description: 'من أشهر كتب السنة النبوية',
    },
    {
      label: 'صحيح مسلم',
      edition: 'ara-muslim',
      description: 'أحاديث صحيحة مرتبة في أبواب',
    },
    {
      label: 'سنن أبي داود',
      edition: 'ara-abudawud',
      description: 'كتاب جامع في السنن والأحكام',
    },
    {
      label: 'سنن الترمذي',
      edition: 'ara-tirmidhi',
      description: 'أحاديث مع أحكام وتبويب',
    },
    {
      label: 'سنن النسائي',
      edition: 'ara-nasai',
      description: 'من كتب السنن المعروفة',
    },
    {
      label: 'سنن ابن ماجه',
      edition: 'ara-ibnmajah',
      description: 'من كتب الحديث المشهورة',
    },
    {
      label: 'الأربعون النووية',
      edition: 'ara-nawawi',
      description: 'أحاديث جامعة في الدين',
    },
    {
      label: 'الأحاديث القدسية',
      edition: 'ara-qudsi',
      description: 'مجموعة من الأحاديث القدسية',
    },
  ];

  readonly selectedEdition = signal(this.books[0].edition);
  readonly hadithData = signal<HadithEditionResponse | null>(null);
  readonly searchTerm = signal('');
  readonly visibleCount = signal(this.pageSize);
  readonly copiedHadithId = signal('');

  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly selectedBook = computed(() => {
    return this.books.find((book) => book.edition === this.selectedEdition()) ?? this.books[0];
  });

  readonly sectionsCount = computed(() => {
    const metadata = this.hadithData()?.metadata;

    if (!metadata) {
      return 0;
    }

    return Object.keys(metadata.section ?? metadata.sections ?? {}).length;
  });

  readonly filteredHadiths = computed<HadithItem[]>(() => {
    const data = this.hadithData();
    const term = this.normalizeArabic(this.searchTerm()).toLowerCase();

    if (!data) {
      return [];
    }

    return data.hadiths.filter((hadith) => {
      return (
        !term ||
        this.normalizeArabic(hadith.text).includes(term) ||
        hadith.hadithnumber.toString().includes(term) ||
        hadith.arabicnumber?.toString().includes(term) ||
        this.normalizeArabic(this.getReferenceText(hadith)).includes(term) ||
        this.getGradesText(hadith).toLowerCase().includes(term)
      );
    });
  });

  readonly visibleHadiths = computed(() => {
    return this.filteredHadiths().slice(0, this.visibleCount());
  });

  readonly canLoadMore = computed(() => {
    return this.visibleCount() < this.filteredHadiths().length;
  });

  readonly resultCount = computed(() => this.filteredHadiths().length);

  constructor() {
    this.loadHadithBook(this.selectedEdition());
  }

  selectBook(edition: string): void {
    if (this.selectedEdition() === edition) {
      return;
    }

    this.selectedEdition.set(edition);
    this.searchTerm.set('');
    this.visibleCount.set(this.pageSize);
    this.loadHadithBook(edition);
  }

  updateSearchTerm(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.visibleCount.set(this.pageSize);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.visibleCount.set(this.pageSize);
  }

  loadMore(): void {
    this.visibleCount.update((value) => value + this.pageSize);
  }

  reloadHadith(): void {
    this.loadHadithBook(this.selectedEdition());
  }

  copyHadith(hadith: HadithItem): void {
    const hadithId = this.getHadithId(hadith);
    const content = `${hadith.text}\n\n${this.selectedBook().label} - حديث رقم ${hadith.hadithnumber}`;

    navigator.clipboard
      .writeText(content)
      .then(() => {
        this.copiedHadithId.set(hadithId);
        this.toastService.success('تم نسخ الحديث بنجاح');

        setTimeout(() => {
          if (this.copiedHadithId() === hadithId) {
            this.copiedHadithId.set('');
          }
        }, 1800);
      })
      .catch(() => {
        this.copiedHadithId.set('');
        this.toastService.error('تعذر نسخ الحديث الآن');
      });
  }

  getHadithId(hadith: HadithItem): string {
    return `${this.selectedEdition()}-${hadith.hadithnumber}`;
  }

  getHadithFavoriteItem(hadith: HadithItem): Omit<FavoriteItem, 'createdAt'> {
    return {
      id: `hadith-${this.getHadithId(hadith)}`,
      type: 'hadith',
      title: this.selectedBook().label,
      subtitle: `حديث رقم ${hadith.hadithnumber}`,
      content: hadith.text,
      route: '/hadith',
    };
  }

  getSectionName(hadith: HadithItem): string {
    const metadata = this.hadithData()?.metadata;
    const sections = metadata?.section ?? metadata?.sections ?? {};
    const sectionNumber = hadith.reference?.book?.toString();

    if (!sectionNumber) {
      return 'باب الحديث';
    }

    return sections[sectionNumber] ?? `باب رقم ${sectionNumber}`;
  }

  getReferenceText(hadith: HadithItem): string {
    const book = hadith.reference?.book;
    const referenceHadith = hadith.reference?.hadith;

    if (!book && !referenceHadith) {
      return '';
    }

    return `كتاب ${book ?? '-'} - حديث ${referenceHadith ?? '-'}`;
  }

  getGradesText(hadith: HadithItem): string {
    return hadith.grades?.map((grade) => `${grade.name}: ${grade.grade}`).join(' - ') ?? '';
  }

  private loadHadithBook(edition: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.hadithData.set(null);

    this.hadithService
      .getEdition(edition)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.hadithData.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('تعذر تحميل الأحاديث الآن، حاول مرة أخرى لاحقًا.');
          this.isLoading.set(false);
        },
      });
  }

  private normalizeArabic(value: string): string {
    return value
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/\u0640/g, '')
      .replace(/[ٱأإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .trim();
  }
}
