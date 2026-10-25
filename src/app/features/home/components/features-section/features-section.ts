import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowUpLeft,
  LucideBookOpen,
  LucideClock3,
  LucideHeart,
  LucideScrollText,
} from '@lucide/angular';

@Component({
  selector: 'app-home-features',
  standalone: true,
  imports: [
    RouterLink,
    LucideArrowUpLeft,
    LucideBookOpen,
    LucideClock3,
    LucideHeart,
    LucideScrollText,
  ],
  templateUrl: './features-section.html',
  styleUrl: './features-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesSection {}
