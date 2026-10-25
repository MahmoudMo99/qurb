import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowUpLeft, LucideBookOpen, LucideBookmark, LucideHeart } from '@lucide/angular';

@Component({
  selector: 'app-home-routine',
  standalone: true,
  imports: [RouterLink, LucideArrowUpLeft, LucideBookOpen, LucideBookmark, LucideHeart],
  templateUrl: './routine-section.html',
  styleUrl: './routine-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutineSection {}
