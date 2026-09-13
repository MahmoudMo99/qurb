import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusModeService {
  readonly isEnabled = signal(false);

  enable(): void {
    this.isEnabled.set(true);
  }

  disable(): void {
    this.isEnabled.set(false);
  }

  toggle(): void {
    this.isEnabled.update((value) => !value);
  }
}
