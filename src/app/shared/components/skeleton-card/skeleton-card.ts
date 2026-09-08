import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'grid' | 'list';

@Component({
  selector: 'app-skeleton-card',
  imports: [],
  templateUrl: './skeleton-card.html',
  styleUrl: './skeleton-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonCard {
  readonly count = input(6);
  readonly rows = input(3);
  readonly variant = input<SkeletonVariant>('grid');

  readonly items = computed(() => {
    return Array.from({ length: this.count() }, (_, index) => index);
  });

  readonly lines = computed(() => {
    return Array.from({ length: this.rows() }, (_, index) => index);
  });
}
