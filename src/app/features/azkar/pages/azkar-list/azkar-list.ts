import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideCheck,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCopy,
  LucideRotateCcw,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import { HotToastService } from '@ngxpert/hot-toast';

import { ActivatedRoute } from '@angular/router';
import {
  AzkarCategoriesData,
  AzkarCategory,
  AzkarCategoryDetailsData,
  AzkarShortcutOption,
  ZikrItem,
} from '../../../../core/models/azkar.model';
import { FavoriteItem } from '../../../../core/models/favorite.model';
import { AzkarService } from '../../../../core/services/azkar';
import { FavoriteButton } from '../../../../shared/components/favorite-button/favorite-button';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { SkeletonCard } from '../../../../shared/components/skeleton-card/skeleton-card';

@Component({
  selector: 'app-azkar-list',
  imports: [
    PageState,
    SkeletonCard,
    FavoriteButton,
    LucideCheck,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCopy,
    LucideRotateCcw,
    LucideSearch,
    LucideX,
  ],
  templateUrl: './azkar-list.html',
  styleUrl: './azkar-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AzkarList {
  private readonly azkarService = inject(AzkarService);
  private readonly toastService = inject(HotToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly countersStorageKey = 'qurb_azkar_daily_counters';
  private readonly oldCountersStorageKey = 'quran_sunnah_azkar_daily_counters';

  private isPointerActive = false;
  private dragStartX = 0;
  private dragStartScrollLeft = 0;
  private dragDistance = 0;
  private shouldBlockShortcutClick = false;

  readonly shortcutScroller = viewChild<ElementRef<HTMLDivElement>>('shortcutScroller');

  readonly shortcutOptions: AzkarShortcutOption[] = [
    { label: 'الصباح', value: 'morning', description: 'أذكار الصباح' },
    { label: 'المساء', value: 'evening', description: 'أذكار المساء' },
    { label: 'بعد الصلاة', value: 'after-prayer', description: 'الأذكار بعد الصلاة' },
    { label: 'قبل النوم', value: 'before-sleep', description: 'أذكار النوم' },
    { label: 'الاستيقاظ', value: 'waking-up', description: 'عند الاستيقاظ' },
    { label: 'الصلاة', value: 'prayer', description: 'أدعية الصلاة' },
    { label: 'المسجد', value: 'mosque', description: 'دخول وخروج المسجد' },
    { label: 'السفر', value: 'travel', description: 'أدعية السفر' },
    { label: 'الطعام', value: 'food', description: 'الطعام والشراب' },
    { label: 'البيت', value: 'home', description: 'أذكار البيت' },
    { label: 'الهم والحزن', value: 'anxiety', description: 'الكرب والضيق' },
    { label: 'الحفظ', value: 'protection', description: 'الحفظ والتحصين' },
    { label: 'الاستغفار', value: 'forgiveness', description: 'طلب المغفرة' },
    { label: 'الحج والعمرة', value: 'hajj', description: 'أدعية الحج والعمرة' },
  ];

  readonly selectedCategory = signal(this.getInitialCategory());
  readonly categoriesData = signal<AzkarCategoriesData | null>(null);
  readonly azkarData = signal<AzkarCategoryDetailsData | null>(null);
  readonly searchTerm = signal('');
  readonly copiedZikrId = signal('');
  readonly showAllCategories = signal(false);
  readonly isShortcutDragging = signal(false);
  readonly zikrCounters = signal<Record<string, number>>(this.getStoredCounters());

  readonly isCategoriesLoading = signal(true);
  readonly isAzkarLoading = signal(true);
  readonly errorMessage = signal('');

  readonly categories = computed<AzkarCategory[]>(() => {
    return this.categoriesData()?.categories ?? [];
  });

  readonly filteredAzkar = computed<ZikrItem[]>(() => {
    const data = this.azkarData();
    const term = this.normalizeArabic(this.searchTerm()).toLowerCase();

    if (!data) {
      return [];
    }

    return data.duas.filter((zikr) => {
      return (
        !term ||
        this.normalizeArabic(zikr.ar.text).includes(term) ||
        this.normalizeArabic(zikr.category.ar).includes(term) ||
        zikr.en.text.toLowerCase().includes(term) ||
        zikr.number.includes(term)
      );
    });
  });

  readonly resultCount = computed(() => this.filteredAzkar().length);

  readonly selectedCategoryTitle = computed(() => {
    const data = this.azkarData();

    if (!data) {
      return 'الأذكار';
    }

    if (data.category?.ar) {
      return data.category.ar;
    }

    const shortcut = this.shortcutOptions.find((item) => item.value === data.shortcut);

    return shortcut?.description ?? data.label ?? 'الأذكار';
  });

  readonly selectedCategoryDescription = computed(() => {
    const selected = this.shortcutOptions.find((item) => item.value === this.selectedCategory());
    return selected?.description ?? 'تصنيف مختار من الأذكار';
  });

  readonly totalCategories = computed(() => {
    return this.categoriesData()?.total_categories ?? this.categories().length;
  });

  readonly totalAzkar = computed(() => {
    const total = this.categories().reduce((sum, category) => sum + Number(category.count || 0), 0);
    return total || 268;
  });

  constructor() {
    this.loadCategories();
    this.loadAzkar(this.selectedCategory());
    this.listenToCategoryQueryParam();
  }

  updateSearchTerm(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  toggleAllCategories(): void {
    this.showAllCategories.update((value) => !value);
  }

  scrollShortcuts(direction: 'previous' | 'next'): void {
    const scroller = this.shortcutScroller()?.nativeElement;

    if (!scroller) {
      return;
    }

    const amount = Math.max(scroller.clientWidth * 0.7, 220);
    const delta = direction === 'next' ? amount : -amount;

    scroller.scrollBy({ left: delta, behavior: 'smooth' });
  }

  startShortcutDrag(event: PointerEvent): void {
    const scroller = this.shortcutScroller()?.nativeElement;

    if (!scroller) {
      return;
    }

    this.isPointerActive = true;
    this.dragDistance = 0;
    this.shouldBlockShortcutClick = false;
    this.dragStartX = event.clientX;
    this.dragStartScrollLeft = scroller.scrollLeft;
  }

  moveShortcutDrag(event: PointerEvent): void {
    const scroller = this.shortcutScroller()?.nativeElement;

    if (!this.isPointerActive || !scroller) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;
    this.dragDistance = Math.abs(deltaX);

    if (this.dragDistance > 10) {
      this.isShortcutDragging.set(true);
      this.shouldBlockShortcutClick = true;
    }

    scroller.scrollLeft = this.dragStartScrollLeft - deltaX;
  }

  endShortcutDrag(): void {
    if (!this.isPointerActive) {
      return;
    }

    this.isPointerActive = false;
    this.isShortcutDragging.set(false);

    if (this.dragDistance <= 10) {
      this.shouldBlockShortcutClick = false;
      return;
    }

    setTimeout(() => {
      this.shouldBlockShortcutClick = false;
    }, 120);
  }

  selectShortcut(category: string): void {
    if (this.shouldBlockShortcutClick) {
      return;
    }

    this.selectedCategory.set(category);
    this.searchTerm.set('');
    this.showAllCategories.set(false);
    this.loadAzkar(category);
  }

  selectCategory(categoryNumber: string): void {
    this.selectedCategory.set(categoryNumber);
    this.searchTerm.set('');
    this.showAllCategories.set(false);
    this.loadAzkar(categoryNumber);
  }

  reloadAzkar(): void {
    this.loadAzkar(this.selectedCategory());
  }

  private listenToCategoryQueryParam(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const category = params.get('category');

      if (!category || category === this.selectedCategory()) {
        return;
      }

      this.selectedCategory.set(category);
      this.searchTerm.set('');
      this.showAllCategories.set(false);
      this.loadAzkar(category);
    });
  }

  private getInitialCategory(): string {
    return this.route.snapshot.queryParamMap.get('category') ?? 'morning';
  }

  copyZikr(zikr: ZikrItem): void {
    const zikrId = this.getZikrId(zikr);

    navigator.clipboard
      .writeText(zikr.ar.text)
      .then(() => {
        this.copiedZikrId.set(zikrId);
        this.toastService.success('تم نسخ الذكر بنجاح');

        setTimeout(() => {
          if (this.copiedZikrId() === zikrId) {
            this.copiedZikrId.set('');
          }
        }, 1800);
      })
      .catch(() => {
        this.copiedZikrId.set('');
        this.toastService.error('تعذر نسخ الذكر الآن');
      });
  }

  increaseZikrCounter(zikr: ZikrItem): void {
    const zikrId = this.getZikrId(zikr);
    const target = this.getRepeatTarget(zikr);
    const current = this.getCurrentRepeat(zikr);
    const nextValue = Math.min(current + 1, target);

    this.updateCounter(zikrId, nextValue);
  }

  resetZikrCounter(zikr: ZikrItem): void {
    this.updateCounter(this.getZikrId(zikr), 0);
  }

  getCurrentRepeat(zikr: ZikrItem): number {
    return this.zikrCounters()[this.getZikrId(zikr)] ?? 0;
  }

  getRepeatTarget(zikr: ZikrItem): number {
    const text = this.normalizeDigits(
      `${this.normalizeArabic(zikr.ar.text)} ${zikr.en.text}`.toLowerCase(),
    );

    const numericMatch = text.match(/(\d{1,3})\s*(مرة|مرات|time|times)/);

    if (numericMatch?.[1]) {
      return this.limitRepeatTarget(Number(numericMatch[1]));
    }

    if (
      text.includes('ثلاث وثلاثين') ||
      text.includes('ثلاثا وثلاثين') ||
      text.includes('thirty three') ||
      text.includes('thirty-three')
    ) {
      return 33;
    }

    if (
      text.includes('اربعا وثلاثين') ||
      text.includes('اربع وثلاثين') ||
      text.includes('thirty four') ||
      text.includes('thirty-four')
    ) {
      return 34;
    }

    if (
      text.includes('مائة مرة') ||
      text.includes('مئة مرة') ||
      text.includes('مائه مرة') ||
      text.includes('hundred times') ||
      text.includes('one hundred times')
    ) {
      return 100;
    }

    if (text.includes('سبع مرات') || text.includes('سبعا') || text.includes('seven times')) {
      return 7;
    }

    if (text.includes('خمس مرات') || text.includes('خمسا') || text.includes('five times')) {
      return 5;
    }

    if (
      text.includes('ثلاث مرات') ||
      text.includes('ثلاثا') ||
      text.includes('three times') ||
      text.includes('thrice')
    ) {
      return 3;
    }

    if (
      text.includes('مرتين') ||
      text.includes('مرتان') ||
      text.includes('twice') ||
      text.includes('two times')
    ) {
      return 2;
    }

    return 1;
  }

  isZikrCompleted(zikr: ZikrItem): boolean {
    return this.getCurrentRepeat(zikr) >= this.getRepeatTarget(zikr);
  }

  getZikrId(zikr: ZikrItem): string {
    return `${zikr.category.number}-${zikr.number}`;
  }

  getZikrFavoriteItem(zikr: ZikrItem): Omit<FavoriteItem, 'createdAt'> {
    return {
      id: `zikr-${this.getZikrId(zikr)}`,
      type: 'zikr',
      title: zikr.category.ar,
      subtitle: `ذكر رقم ${zikr.number}`,
      content: zikr.ar.text,
      route: '/azkar',
    };
  }

  private updateCounter(zikrId: string, value: number): void {
    const counters = {
      ...this.zikrCounters(),
      [zikrId]: value,
    };

    this.zikrCounters.set(counters);
    this.saveCounters(counters);
  }

  private getStoredCounters(): Record<string, number> {
    try {
      const storedValue =
        localStorage.getItem(this.countersStorageKey) ??
        localStorage.getItem(this.oldCountersStorageKey);

      if (!storedValue) {
        return {};
      }

      const parsedValue = JSON.parse(storedValue) as {
        date: string;
        counters: Record<string, number>;
      };

      if (parsedValue.date !== this.getTodayKey()) {
        return {};
      }

      return parsedValue.counters ?? {};
    } catch {
      return {};
    }
  }

  private saveCounters(counters: Record<string, number>): void {
    try {
      localStorage.setItem(
        this.countersStorageKey,
        JSON.stringify({
          date: this.getTodayKey(),
          counters,
        }),
      );
      localStorage.removeItem(this.oldCountersStorageKey);
    } catch {
      return;
    }
  }

  private getTodayKey(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    return `${year}-${month}-${day}`;
  }

  private limitRepeatTarget(value: number): number {
    if (!Number.isFinite(value) || value < 1) {
      return 1;
    }

    return Math.min(value, 100);
  }

  private loadCategories(): void {
    this.isCategoriesLoading.set(true);

    this.azkarService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.categoriesData.set(data);
          this.isCategoriesLoading.set(false);
        },
        error: () => {
          this.isCategoriesLoading.set(false);
        },
      });
  }

  private loadAzkar(category: string): void {
    this.isAzkarLoading.set(true);
    this.errorMessage.set('');
    this.azkarData.set(null);

    this.azkarService
      .getAzkarByCategory(category)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.azkarData.set(data);
          this.isAzkarLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('تعذر تحميل الأذكار الآن، حاول مرة أخرى لاحقًا.');
          this.isAzkarLoading.set(false);
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

  private normalizeDigits(value: string): string {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

    return value
      .replace(/[٠-٩]/g, (digit) => arabicDigits.indexOf(digit).toString())
      .replace(/[۰-۹]/g, (digit) => persianDigits.indexOf(digit).toString());
  }
}
