import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpLeft } from '@lucide/angular';

interface FooterNavLink {
  label: string;
  route: string;
}

interface FooterExternalLink {
  label: string;
  href: string;
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink, LucideArrowUpLeft],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly currentYear = new Date().getFullYear();

  readonly quickLinks: FooterNavLink[] = [
    { label: 'القرآن الكريم', route: '/quran' },
    { label: 'وردي اليومي', route: '/daily-wird' },
    { label: 'الأذكار', route: '/azkar' },
    { label: 'الأحاديث', route: '/hadith' },
    { label: 'مواقيت الصلاة', route: '/prayer-times' },
    { label: 'المفضلة', route: '/favorites' },
  ];

  readonly externalLinks: FooterExternalLink[] = [
    {
      label: 'الموقع الشخصي',
      href: 'https://mahmoud-mohamed-portfolio.vercel.app',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/MahmoudMo99',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/mahmoud-mo-mahmoud',
    },
  ];
}
