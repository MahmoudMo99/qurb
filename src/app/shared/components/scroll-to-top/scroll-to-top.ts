import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { LucideChevronUp } from '@lucide/angular';

@Component({
  selector: 'app-scroll-to-top',
  imports: [LucideChevronUp],
  templateUrl: './scroll-to-top.html',
  styleUrl: './scroll-to-top.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollToTop {
  readonly isVisible = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isVisible.set(window.scrollY > 520);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
