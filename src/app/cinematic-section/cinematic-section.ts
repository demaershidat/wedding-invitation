import { AfterViewInit, Component, DestroyRef, ElementRef, inject, Input, signal } from '@angular/core';

/**
 * A full-screen photo section with a slow cinematic push-in (Ken Burns),
 * an optional shimmer sweep or drifting dust, and a scroll-triggered reveal
 * for whatever content is projected into it.
 */
@Component({
  selector: 'app-cinematic-section',
  imports: [],
  templateUrl: './cinematic-section.html',
  styleUrl: './cinematic-section.css',
})
export class CinematicSection implements AfterViewInit {
  @Input({ required: true }) image!: string;
  @Input() shimmer = false;
  @Input() dust = false;
  /** Soft-focuses the photo so it reads as an atmospheric backdrop rather than a sharp,
   *  competing photograph — used on every scene except the invitation and the names reveal. */
  @Input() blur = false;

  protected readonly visible = signal(false);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.visible.set(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.visible.set(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(this.el.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
