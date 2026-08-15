import { Component, inject } from '@angular/core';
import { CinematicSection } from '../cinematic-section/cinematic-section';
import { LanguageService } from '../language.service';

@Component({
  selector: 'app-details-section',
  imports: [CinematicSection],
  templateUrl: './details-section.html',
  styleUrl: './details-section.css',
})
export class DetailsSection {
  protected readonly lang = inject(LanguageService).lang;
}
