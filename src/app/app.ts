import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { VerseSection } from './verse-section/verse-section';
import { CountdownSection } from './countdown-section/countdown-section';
import { DetailsSection } from './details-section/details-section';
import { ClosingSection } from './closing-section/closing-section';
import { LanguageService } from './language.service';

type Stage = 'closed' | 'breaking' | 'video' | 'opening' | 'open';

@Component({
  selector: 'app-root',
  imports: [VerseSection, CountdownSection, DetailsSection, ClosingSection],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly languageService = inject(LanguageService);
  /** Shared with every section so the whole invitation switches language together. */
  protected readonly lang = this.languageService.lang;

  /** Drives the whole envelope choreography: closed -> breaking -> opening -> open */
  protected readonly stage = signal<Stage>('closed');
  protected readonly soundOn = signal(true);

  /** The background track only ever plays this window (1:15 - 2:42), then loops back to the start of it */
  private readonly musicStart = 75;
  private readonly musicEnd = 162;
  private readonly bgMusic = viewChild<ElementRef<HTMLAudioElement>>('bgMusic');

  /** The real footage of the seal vanishing and the flap opening onto the garden, played
   *  in full from the very first frame. */
  private readonly envelopeVideo = viewChild<ElementRef<HTMLVideoElement>>('envelopeVideo');
  private readonly videoStartAt = 0;
  private videoFallbackTimer?: ReturnType<typeof setTimeout>;

  /** Purely decorative ambient sparkles, rendered with @for */
  protected readonly sparkles = Array.from({ length: 16 }, (_, i) => i);

  /** A persistent nudge for guests who might not realize the page scrolls - some won't.
   *  Shown once the envelope is open and there's still unseen content below the fold, and
   *  (unlike the old cue that lived only inside the hero and vanished once scrolled past)
   *  it follows them down through every section, so there's always a visible "there's more"
   *  signal no matter where they stop - and it's tappable, for anyone who doesn't think to
   *  scroll at all. */
  protected readonly showScrollHint = signal(false);

  constructor() {
    const updateHint = () => this.updateScrollHint();
    window.addEventListener('scroll', updateHint, { passive: true });
    window.addEventListener('resize', updateHint);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', updateHint);
      window.removeEventListener('resize', updateHint);
    });
  }

  private updateScrollHint(): void {
    if (this.stage() !== 'open') {
      this.showScrollHint.set(false);
      return;
    }
    const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    this.showScrollHint.set(remaining > 48); // hides once the closing section is fully in view
  }

  protected scrollToNext(): void {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  }

  protected openInvitation(): void {
    if (this.stage() !== 'closed') {
      return;
    }

    this.playChime();
    this.startBackgroundMusic();
    document.body.classList.add('invitation-open'); // unlocks scroll past the hero

    // The wax seal cracks and drops away, and the screen flashes fully white...
    this.stage.set('breaking');
    // ...and behind that flash, the real footage of the flap lifting takes over -
    // this fires while the flash is at full opacity, so the cut is never actually seen.
    setTimeout(() => this.startEnvelopeVideo(), 450);
  }

  private startEnvelopeVideo(): void {
    this.stage.set('video');

    const video = this.envelopeVideo()?.nativeElement;
    if (!video) {
      this.finishOpening();
      return;
    }

    video.currentTime = this.videoStartAt;
    video.play().catch(() => {
      // Autoplay blocked - move on rather than stalling the invitation on a frozen frame.
      this.finishOpening();
    });

    // Safety net in case 'ended' never fires (a seek/load hiccup, etc.) - comfortably
    // past the clip's own ~5s length now that it plays in full from the start.
    this.videoFallbackTimer = setTimeout(() => this.finishOpening(), 7000);
  }

  protected onEnvelopeVideoEnded(): void {
    this.finishOpening();
  }

  private finishOpening(): void {
    if (this.stage() !== 'video') {
      return;
    }
    clearTimeout(this.videoFallbackTimer);

    // ...the flap fades away and the letter glides out...
    this.stage.set('opening');
    // ...and finally the invitation settles into its open state.
    setTimeout(() => {
      this.stage.set('open');
      this.updateScrollHint();
    }, 2000);
  }

  protected toggleLanguage(): void {
    this.languageService.toggle();
  }

  protected toggleSound(): void {
    this.soundOn.update((on) => !on);
    const audio = this.bgMusic()?.nativeElement;
    if (!audio) {
      return;
    }
    audio.muted = !this.soundOn();

    // Mobile browsers (especially the in-app browsers WhatsApp/Instagram/Messenger use for
    // shared links) often silently block the very first autoplay-on-open attempt even with
    // a user gesture behind it - this tap is itself a fresh gesture, so retry here rather
    // than leaving the invitation silent for the rest of the visit.
    if (this.soundOn() && audio.paused) {
      audio.play().catch((error) => {
        console.error('🎵 Background music still blocked on retry:', error);
      });
    }
  }

private startBackgroundMusic(): void {
  const audio = this.bgMusic()?.nativeElement;

  if (!audio) {
    console.error('Background music element not found');
    return;
  }

  audio.muted = !this.soundOn();

  // Start from 1:15
  audio.currentTime = this.musicStart;

  const playPromise = audio.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('🎵 Background music started successfully');
      })
      .catch((error) => {
        console.error('🎵 Background music failed to play:', error);
      });
  }
}

  /** Keeps playback boxed inside the 1:15-2:42 window, looping back to the start once it reaches the end */
  protected onMusicTimeUpdate(): void {
    const audio = this.bgMusic()?.nativeElement;
    if (audio && audio.currentTime >= this.musicEnd) {
      audio.currentTime = this.musicStart;
    }
  }

  private playChime(): void {
    if (!this.soundOn()) {
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 - a soft little arpeggio
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.16;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.05, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 1.35);
      });
    } catch {
      // Web Audio isn't available - the visuals carry the moment on their own.
    }
  }
}
