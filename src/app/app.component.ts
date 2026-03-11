import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/services/auth.service';
import { PwaInstallBannerComponent } from './core/components/pwa-install-banner/pwa-install-banner.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, PwaInstallBannerComponent],
})
export class AppComponent implements OnInit {
  constructor(
    private translate: TranslateService,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    // Configurar catalán como idioma por defecto
    this.translate.setDefaultLang('ca');
    this.translate.use('ca');

    // Cargar estado de autenticación desde storage
    await this.authService.loadStoredAuth();
  }

  async ngOnInit() {
    console.log('App initialized with language:', this.translate.currentLang);

  }
}
