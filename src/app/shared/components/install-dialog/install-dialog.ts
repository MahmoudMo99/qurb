import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import {
  LucideArrowLeft,
  LucideCheck,
  LucideDownload,
  LucideMonitor,
  LucideShare2,
  LucideSmartphone,
  LucideX,
} from '@lucide/angular';

export type InstallPlatform = 'ios' | 'firefox' | 'other';

@Component({
  selector: 'app-install-dialog',
  imports: [
    LucideArrowLeft,
    LucideCheck,
    LucideDownload,
    LucideMonitor,
    LucideShare2,
    LucideSmartphone,
    LucideX,
  ],
  templateUrl: './install-dialog.html',
  styleUrl: './install-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallDialog implements OnInit, OnDestroy {
  readonly platform = input<InstallPlatform>('other');
  readonly closed = output<void>();

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  private previousActiveElement: HTMLElement | null = null;
  private previousBodyOverflow = '';

  @ViewChild('closeButton', { static: true })
  closeButton!: ElementRef<HTMLButtonElement>;

  ngOnInit(): void {
    this.previousActiveElement = document.activeElement as HTMLElement | null;
    this.previousBodyOverflow = document.body.style.overflow;

    this.renderer.setStyle(document.body, 'overflow', 'hidden');

    queueMicrotask(() => {
      this.closeButton?.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    this.renderer.setStyle(document.body, 'overflow', this.previousBodyOverflow);

    this.previousActiveElement?.focus();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements: HTMLElement[] = Array.from(
      this.elementRef.nativeElement.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ) as HTMLElement[];

    if (!focusableElements.length) {
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
