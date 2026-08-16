import { Component, inject } from '@angular/core';
import { CinematicSection } from '../cinematic-section/cinematic-section';
import { LanguageService } from '../language.service';

@Component({
  selector: 'app-verse-section',
  imports: [CinematicSection],
  templateUrl: './verse-section.html',
  styleUrl: './verse-section.css',
})
export class VerseSection {
  protected readonly lang = inject(LanguageService).lang;
}
