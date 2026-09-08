import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideCircleAlert, LucideInbox, LucideRotateCcw } from '@lucide/angular';

export type PageStateType = 'loading' | 'error' | 'empty';

@Component({
  selector: 'app-page-state',
  imports: [LucideCircleAlert, LucideInbox, LucideRotateCcw],
  templateUrl: './page-state.html',
  styleUrl: './page-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageState {
  readonly type = input<PageStateType>('loading');
  readonly title = input('');
  readonly message = input('');
  readonly actionLabel = input('');

  readonly action = output<void>();

  handleAction(): void {
    this.action.emit();
  }
}
