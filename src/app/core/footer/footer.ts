import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideBookOpen,
  LucideClock,
  LucideExternalLink,
  LucideGlobe,
  LucideHeart,
  LucideLink,
  LucideScrollText,
  LucideSparkles,
} from '@lucide/angular';

type FooterExternalIcon = 'github' | 'portfolio' | 'linkedin';
type FooterNavIcon = 'quran' | 'prayer' | 'azkar' | 'hadith' | 'favorites';

interface FooterLink {
  label: string;
  href: string;
  icon: FooterExternalIcon;
}

interface FooterNavLink {
  label: string;
  route: string;
  icon: FooterNavIcon;
}

@Component({
  selector: 'app-footer',
  imports: [
    RouterLink,
    LucideBookOpen,
    LucideClock,
    LucideExternalLink,
    LucideGlobe,
    LucideHeart,
    LucideLink,
    LucideScrollText,
    LucideSparkles,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly currentYear = new Date().getFullYear();

  readonly quickLinks: FooterNavLink[] = [
    { label: 'القرآن الكريم', route: '/quran', icon: 'quran' },
    { label: 'مواقيت الصلاة', route: '/prayer-times', icon: 'prayer' },
    { label: 'الأذكار', route: '/azkar', icon: 'azkar' },
    { label: 'الأحاديث', route: '/hadith', icon: 'hadith' },
    { label: 'المفضلة', route: '/favorites', icon: 'favorites' },
  ];

  readonly links: FooterLink[] = [
    {
      label: 'Portfolio',
      href: 'https://mahmoud-mohamed-portfolio.vercel.app',
      icon: 'portfolio',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/MahmoudMo99',
      icon: 'github',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/mahmoud-mo-mahmoud',
      icon: 'linkedin',
    },
  ];
}
