import { Injectable, signal } from '@angular/core';

export type Lang = 'ar' | 'en';

const STORAGE_KEY = 'wedding-invitation-lang';

function detectDefault(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') {
      return stored;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) - fall through to detection.
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

/** Shared across every section so the whole invitation switches language together. */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<Lang>(detectDefault());

  toggle(): void {
    this.set(this.lang() === 'ar' ? 'en' : 'ar');
  }

  set(lang: Lang): void {
    this.lang.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore - persistence is a nicety, not a requirement.
    }
  }
}
