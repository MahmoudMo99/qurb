import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideHeart } from '@lucide/angular';
import { HotToastService } from '@ngxpert/hot-toast';

import { FavoriteItem } from '../../../core/models/favorite.model';
import { FavoritesService } from '../../../core/services/favorites';

export type FavoriteButtonMode = 'default' | 'hero' | 'small';

@Component({
  selector: 'app-favorite-button',
  imports: [LucideHeart],
  templateUrl: './favorite-button.html',
  styleUrl: './favorite-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButton {
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastService = inject(HotToastService);

  readonly favoriteItem = input.required<Omit<FavoriteItem, 'createdAt'>>();
  readonly label = input('حفظ');
  readonly savedLabel = input('محفوظ');
  readonly mode = input<FavoriteButtonMode>('default');

  readonly isSaved = computed(() => {
    return this.favoritesService.isFavorite(this.favoriteItem().id);
  });

  toggleFavorite(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const isAdded = this.favoritesService.toggleFavorite(this.favoriteItem());

    if (isAdded) {
      this.toastService.success('تمت الإضافة إلى المفضلة');
      return;
    }

    this.toastService.info('تمت الإزالة من المفضلة');
  }
}
