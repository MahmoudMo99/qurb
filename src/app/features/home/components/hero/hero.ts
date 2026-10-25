import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideBookOpen, LucideClock3 } from '@lucide/angular';

export interface HomeHeroPrayer {
  name: string;
  time: string;
}

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [RouterLink, LucideArrowLeft, LucideBookOpen, LucideClock3],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHero {
  readonly prayer = input<HomeHeroPrayer | null>(null);
  readonly prayerLoading = input(false);
  readonly locationLabel = input('');
}
