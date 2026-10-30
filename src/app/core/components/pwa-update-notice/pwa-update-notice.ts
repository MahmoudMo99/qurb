import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PwaUpdateService } from '../../services/pwa-update';

@Component({
  selector: 'app-pwa-update-notice',
  standalone: true,
  imports: [],
  templateUrl: './pwa-update-notice.html',
  styleUrl: './pwa-update-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaUpdateNotice {
  readonly pwaUpdate = inject(PwaUpdateService);
}
