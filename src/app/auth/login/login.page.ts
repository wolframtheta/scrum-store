import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  IonIcon
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    IonContent,
    IonButton,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string = '/tabs/showcase';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private translate: TranslateService
  ) {

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Obtener returnUrl de query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tabs/showcase';

    // Si ya está autenticado, redirigir al home
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: async () => {
        // Esperar un momento para que el signal se actualice
        await new Promise(resolve => setTimeout(resolve, 100));
        // Usar navigateByUrl con replaceUrl para evitar que el guard se ejecute de nuevo
        this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        this.showToast(this.translate.instant('COMMON.WELCOME'), 'success');
      },
      error: (error) => {
        console.error('Login error:', error);
        this.showToast(this.translate.instant('LOGIN.ERRORS.LOGIN_FAILED'), 'danger');
        this.isLoading = false;
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}

