import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CinematicSection } from '../cinematic-section/cinematic-section';
import { LanguageService } from '../language.service';

/** Thursday, October 29, 2026, 6:00 PM — Asia/Amman (Jordan no longer observes DST). */
const WEDDING_AT = new Date('2026-10-29T18:00:00+03:00').getTime();

@Component({
  selector: 'app-countdown-section',
  imports: [CinematicSection, DecimalPipe],
  templateUrl: './countdown-section.html',
  styleUrl: './countdown-section.css',
})
export class CountdownSection {
  protected readonly lang = inject(LanguageService).lang;

  private readonly now = signal(Date.now());

  constructor() {
    const id = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  private readonly remainingMs = computed(() => Math.max(0, WEDDING_AT - this.now()));

  protected readonly hasArrived = computed(() => this.remainingMs() <= 0);
  protected readonly days = computed(() => Math.floor(this.remainingMs() / 86_400_000));
  protected readonly hours = computed(() => Math.floor((this.remainingMs() % 86_400_000) / 3_600_000));
  protected readonly minutes = computed(() => Math.floor((this.remainingMs() % 3_600_000) / 60_000));
}
