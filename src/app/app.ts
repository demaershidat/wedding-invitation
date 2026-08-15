import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CountdownSection } from './countdown-section/countdown-section';
import { DetailsSection } from './details-section/details-section';
import { ClosingSection } from './closing-section/closing-section';
import { LanguageService } from './language.service';

type Stage = 'closed' | 'breaking' | 'opening' | 'open';

@Component({
  selector: 'app-root',
  imports: [CountdownSection, DetailsSection, ClosingSection],
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

  /** Purely decorative ambient sparkles, rendered with @for */
  protected readonly sparkles = Array.from({ length: 16 }, (_, i) => i);

  protected openInvitation(): void {
    if (this.stage() !== 'closed') {
      return;
    }

    this.playChime();
    this.startBackgroundMusic();
    document.body.classList.add('invitation-open'); // unlocks scroll past the hero

    // The wax seal cracks first...
    this.stage.set('breaking');
    // ...then the flap lifts and the letter glides out...
    setTimeout(() => this.stage.set('opening'), 450);
    // ...and finally the invitation settles into its open state.
    setTimeout(() => this.stage.set('open'), 2650);
  }

  protected toggleLanguage(): void {
    this.languageService.toggle();
  }

  protected toggleSound(): void {
    this.soundOn.update((on) => !on);
    const audio = this.bgMusic()?.nativeElement;
    if (audio) {
      audio.muted = !this.soundOn();
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
