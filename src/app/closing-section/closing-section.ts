import { Component, inject } from '@angular/core';
import { CinematicSection } from '../cinematic-section/cinematic-section';
import { LanguageService } from '../language.service';

@Component({
  selector: 'app-closing-section',
  imports: [CinematicSection],
  templateUrl: './closing-section.html',
  styleUrl: './closing-section.css',
})
export class ClosingSection {
  protected readonly lang = inject(LanguageService).lang;
}
