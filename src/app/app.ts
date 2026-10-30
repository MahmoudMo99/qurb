import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PwaUpdateNotice } from './core/components/pwa-update-notice/pwa-update-notice';
import { Layout } from './core/layout/layout';
import { PwaUpdateService } from './core/services/pwa-update';

@Component({
  selector: 'app-root',
  imports: [Layout, PwaUpdateNotice],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly pwaUpdateService = inject(PwaUpdateService);

  constructor() {
    this.pwaUpdateService.init();
  }
}
