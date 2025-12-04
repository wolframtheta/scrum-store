import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  constructor(private translate: TranslateService) {
    this.initLanguage();
  }

  private initLanguage() {
    // Configurar catalán como idioma por defecto
    this.translate.setDefaultLang('ca');

    // Obtener idioma guardado o usar catalán
    const savedLang = localStorage.getItem('language') || 'ca';
    this.translate.use(savedLang);
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }

  getCurrentLanguage(): string {
    return this.translate.currentLang || 'ca';
  }
}

