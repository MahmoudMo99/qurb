import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { ScrollToTop } from '../../shared/components/scroll-to-top/scroll-to-top';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header, Footer, ScrollToTop],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.updateSeo();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.updateSeo();
      });
  }

  private updateSeo(): void {
    let route = this.activatedRoute.snapshot;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const title = typeof route.title === 'string' ? route.title : 'قُرب';

    const description =
      typeof route.data['description'] === 'string'
        ? route.data['description']
        : 'قُرب تطبيق إسلامي عربي لقراءة القرآن الكريم، متابعة مواقيت الصلاة، تصفح الأذكار، وقراءة الأحاديث النبوية.';

    this.seoService.update(title, description);
  }
}
