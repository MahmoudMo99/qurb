import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, interval } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  private initialized = false;

  readonly updateAvailable = signal(false);

  init(): void {
    if (this.initialized || !this.swUpdate.isEnabled) {
      return;
    }

    this.initialized = true;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.updateAvailable.set(true);
      });

    this.appRef.isStable
      .pipe(
        filter((isStable) => isStable),
        first(),
      )
      .subscribe(() => {
        void this.startUpdateChecks();
      });
  }

  private async startUpdateChecks(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      await navigator.serviceWorker.ready;

      await this.checkForUpdates();

      interval(6 * 60 * 60 * 1000).subscribe(() => {
        void this.checkForUpdates();
      });
    } catch (error) {
      console.error('PWA update initialization failed:', error);
    }
  }

  dismissUpdate(): void {
    this.updateAvailable.set(false);
  }

  installUpdate(): void {
    window.location.reload();
  }

  private async checkForUpdates(): Promise<void> {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (error) {
      console.error('PWA update check failed:', error);
    }
  }
}
