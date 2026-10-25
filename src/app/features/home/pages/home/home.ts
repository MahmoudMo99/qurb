import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { HomePrayerPreviewService } from '../../../../core/services/home-prayer-preview';
import { DailyContent } from '../../components/daily-content/daily-content';
import { FeaturesSection } from '../../components/features-section/features-section';
import { HomeHero } from '../../components/hero/hero';
import { HomePrayerPreview } from '../../components/prayer-preview/prayer-preview';
import { RoutineSection } from '../../components/routine-section/routine-section';

@Component({
  selector: 'app-home',
  imports: [HomeHero, DailyContent, FeaturesSection, RoutineSection, HomePrayerPreview],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly prayerService = inject(HomePrayerPreviewService);
}
