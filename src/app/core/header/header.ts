import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBookOpen,
  LucideCheck,
  LucideChevronDown,
  LucideClock3,
  LucideHeart,
  LucideHome,
  LucideMenu,
  LucideScrollText,
  LucideSparkles,
  LucideX,
} from '@lucide/angular';
import { filter } from 'rxjs';

type NavIcon = 'home' | 'quran' | 'wird' | 'prayer' | 'azkar' | 'hadith' | 'favorites';

interface NavLink {
  readonly label: string;
  readonly route: string;
  readonly icon: NavIcon;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBookOpen,
    LucideCheck,
    LucideChevronDown,
    LucideClock3,
    LucideHeart,
    LucideHome,
    LucideMenu,
    LucideScrollText,
    LucideSparkles,
    LucideX,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('mobileMenuButton')
  private mobileMenuButton?: ElementRef<HTMLButtonElement>;

  @ViewChild('mobilePanel')
  private mobilePanel?: ElementRef<HTMLElement>;

  @ViewChild('moreButton')
  private moreButton?: ElementRef<HTMLButtonElement>;

  @ViewChild('morePanel')
  private morePanel?: ElementRef<HTMLElement>;

  readonly isMenuOpen = signal(false);
  readonly isMoreOpen = signal(false);
  readonly isScrolled = signal(false);

  readonly currentUrl = signal(this.router.url);

  readonly primaryLinks: readonly NavLink[] = [
    { label: 'الرئيسية', route: '/home', icon: 'home', exact: true },
    { label: 'القرآن', route: '/quran', icon: 'quran' },
    { label: 'وردي', route: '/daily-wird', icon: 'wird' },
    { label: 'مواقيت الصلاة', route: '/prayer-times', icon: 'prayer' },
    { label: 'الأذكار', route: '/azkar', icon: 'azkar' },
  ];

  readonly moreLinks: readonly NavLink[] = [
    { label: 'الأحاديث', route: '/hadith', icon: 'hadith' },
    { label: 'المفضلة', route: '/favorites', icon: 'favorites' },
  ];

  readonly navLinks: readonly NavLink[] = [...this.primaryLinks, ...this.moreLinks];

  readonly isMoreActive = computed(() => {
    const url = this.currentUrl().split(/[?#]/)[0];

    return this.moreLinks.some((link) => url === link.route || url.startsWith(`${link.route}/`));
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.closeAll();
      });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrolled = window.scrollY > 16;

    if (scrolled !== this.isScrolled()) {
      this.isScrolled.set(scrolled);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 980 && this.isMenuOpen()) {
      this.closeMobileMenu();
    }

    if (window.innerWidth <= 980 && this.isMoreOpen()) {
      this.closeMore();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMenuOpen()) {
      this.closeMobileMenu(true);
    }

    if (this.isMoreOpen()) {
      this.closeMore(true);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (
      this.isMoreOpen() &&
      !this.moreButton?.nativeElement.contains(target) &&
      !this.morePanel?.nativeElement.contains(target)
    ) {
      this.closeMore();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    if (this.isMoreOpen()) {
      const button = this.moreButton?.nativeElement;
      const links = Array.from(
        this.morePanel?.nativeElement.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [],
      );

      const first = links[0];
      const last = links[links.length - 1];
      const active = document.activeElement;

      if (button && first && last) {
        if (event.shiftKey && active === first) {
          event.preventDefault();
          button.focus();
        } else if (!event.shiftKey && active === last) {
          this.closeMore();
        }
      }
    }

    if (!this.isMenuOpen()) {
      return;
    }

    const button = this.mobileMenuButton?.nativeElement;
    const links = Array.from(
      this.mobilePanel?.nativeElement.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [],
    );

    const first = links[0];
    const last = links[links.length - 1];

    if (!button || !first || !last) {
      return;
    }

    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      button.focus();
    } else if (!event.shiftKey && active === button) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      button.focus();
    } else if (!event.shiftKey && active === button) {
      event.preventDefault();
      first.focus();
    }
  }

  toggleMobileMenu(): void {
    if (this.isMenuOpen()) {
      this.closeMobileMenu();
      return;
    }

    this.closeMore();
    this.isMenuOpen.set(true);

    queueMicrotask(() => {
      if (!this.isMenuOpen()) {
        return;
      }

      this.mobilePanel?.nativeElement
        .querySelector<HTMLAnchorElement>('a.active, a[href]')
        ?.focus();
    });
  }

  closeMobileMenu(restoreFocus = false): void {
    if (!this.isMenuOpen()) {
      return;
    }

    this.isMenuOpen.set(false);

    if (restoreFocus) {
      this.mobileMenuButton?.nativeElement.focus();
    }
  }

  toggleMore(): void {
    if (this.isMoreOpen()) {
      this.closeMore();
      return;
    }

    this.closeMobileMenu();
    this.isMoreOpen.set(true);

    queueMicrotask(() => {
      if (!this.isMoreOpen()) {
        return;
      }

      this.morePanel?.nativeElement.querySelector<HTMLAnchorElement>('a.active, a[href]')?.focus();
    });
  }

  closeMore(restoreFocus = false): void {
    if (!this.isMoreOpen()) {
      return;
    }

    this.isMoreOpen.set(false);

    if (restoreFocus) {
      this.moreButton?.nativeElement.focus();
    }
  }

  closeAll(): void {
    this.closeMobileMenu();
    this.closeMore();
  }
}
