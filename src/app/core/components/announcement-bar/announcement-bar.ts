import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { LucideDownload, LucideSparkles, LucideX } from '@lucide/angular';
import { InstallDialog } from '../../../shared/components/install-dialog/install-dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

@Component({
  selector: 'app-announcement-bar',
  imports: [LucideDownload, LucideSparkles, LucideX, InstallDialog],
  templateUrl: './announcement-bar.html',
  styleUrl: './announcement-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementBar implements OnInit {
  readonly closed = output<void>();
  readonly isVisible = signal(true);
  readonly isInstalling = signal(false);
  readonly showInstallDialog = signal(false);
  readonly installPlatform = signal<'ios' | 'firefox' | 'other'>('other');

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  ngOnInit(): void {
    if (this.isStandalone()) {
      this.close();
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
  }

  @HostListener('window:appinstalled')
  onAppInstalled(): void {
    this.deferredPrompt = null;
    this.showInstallDialog.set(false);
    this.close();
  }

  async installApp(): Promise<void> {
    if (this.isInstalling()) {
      return;
    }

    if (this.isStandalone()) {
      this.close();
      return;
    }

    if (this.deferredPrompt) {
      const promptEvent = this.deferredPrompt;
      this.deferredPrompt = null;

      this.isInstalling.set(true);

      try {
        await promptEvent.prompt();

        const choice = await promptEvent.userChoice;

        if (choice.outcome === 'accepted') {
          this.close();
        }
      } catch {
        this.openInstallDialog();
      } finally {
        this.isInstalling.set(false);
      }

      return;
    }

    this.openInstallDialog();
  }

  close(): void {
    this.isVisible.set(false);
    this.showInstallDialog.set(false);
    this.closed.emit();
  }

  closeInstallDialog(): void {
    this.showInstallDialog.set(false);
  }

  private openInstallDialog(): void {
    const userAgent = navigator.userAgent;

    const isIOS =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isFirefox = /Firefox\//.test(userAgent) && !/Android|iPad|iPhone|iPod/i.test(userAgent);

    this.installPlatform.set(isIOS ? 'ios' : isFirefox ? 'firefox' : 'other');

    this.showInstallDialog.set(true);
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true)
    );
  }
}
