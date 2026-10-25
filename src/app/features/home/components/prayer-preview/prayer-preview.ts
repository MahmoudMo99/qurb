import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpLeft, LucideClock3, LucideMapPin, LucideRotateCcw } from '@lucide/angular';

import { HomePrayerPreviewService } from '../../../../core/services/home-prayer-preview';

@Component({
  selector: 'app-home-prayer-preview',
  standalone: true,
  imports: [RouterLink, LucideArrowUpLeft, LucideClock3, LucideMapPin, LucideRotateCcw],
  templateUrl: './prayer-preview.html',
  styleUrl: './prayer-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePrayerPreview {
  readonly prayerService = inject(HomePrayerPreviewService);
}
