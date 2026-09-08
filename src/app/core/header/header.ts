import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBookOpen,
  LucideClock,
  LucideHeart,
  LucideHome,
  LucideMenu,
  LucideScrollText,
  LucideSparkles,
  LucideX,
} from '@lucide/angular';

type NavIcon = 'home' | 'quran' | 'prayer' | 'azkar' | 'hadith' | 'favorites';

interface NavLink {
  label: string;
  route: string;
  icon: NavIcon;
  exact?: boolean;
}

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideBookOpen,
    LucideClock,
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
  readonly isMenuOpen = signal(false);
  readonly isScrolled = signal(false);

  readonly navLinks: NavLink[] = [
    { label: 'الرئيسية', route: '/home', icon: 'home', exact: true },
    { label: 'القرآن', route: '/quran', icon: 'quran' },
    { label: 'مواقيت الصلاة', route: '/prayer-times', icon: 'prayer' },
    { label: 'الأذكار', route: '/azkar', icon: 'azkar' },
    { label: 'الأحاديث', route: '/hadith', icon: 'hadith' },
    { label: 'المفضلة', route: '/favorites', icon: 'favorites' },
  ];

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 10);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
