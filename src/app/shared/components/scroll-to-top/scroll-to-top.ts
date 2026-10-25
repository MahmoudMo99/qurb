import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { LucideChevronUp } from '@lucide/angular';

@Component({
  selector: 'app-scroll-to-top',
  imports: [LucideChevronUp],
  templateUrl: './scroll-to-top.html',
  styleUrl: './scroll-to-top.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollToTop implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  private readonly hasScrolled = signal(false);
  private readonly isFooterVisible = signal(false);

  readonly isVisible = signal(false);

  ngAfterViewInit(): void {
    this.updateScrollState();

    const footer = document.querySelector('.site-footer');

    if (!footer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        this.isFooterVisible.set(entry.isIntersecting);
        this.updateVisibility();
      },
      {
        threshold: 0,
      },
    );

    observer.observe(footer);

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  private updateScrollState(): void {
    this.hasScrolled.set(window.scrollY > 520);
    this.updateVisibility();
  }

  private updateVisibility(): void {
    this.isVisible.set(this.hasScrolled() && !this.isFooterVisible());
  }
}
