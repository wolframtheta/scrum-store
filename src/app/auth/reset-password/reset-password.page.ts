import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) {
    return null;
  }
  
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
    IonContent,
    IonButton,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner
  ]
})
export class ResetPasswordPage implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  returnUrl: string = '/login';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    // Obtener returnUrl de query params para saber si viene de app o backoffice
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  get email() {
    return this.resetForm.get('email');
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }

  async onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    // Verificar que las contraseñas coincidan
    if (this.resetForm.errors?.['passwordMismatch']) {
      const toast = await this.toastController.create({
        message: await this.translate.get('RESET_PASSWORD.PASSWORDS_NOT_MATCH').toPromise(),
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.resetForm.value;
      await firstValueFrom(
        this.apiService.post('/auth/reset-password', {
          email: formValue.email,
          password: formValue.password,
          confirmPassword: formValue.confirmPassword
        })
      );

      const toast = await this.toastController.create({
        message: await this.translate.get('RESET_PASSWORD.SUCCESS').toPromise(),
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();

      // Esperar un momento antes de redirigir
      setTimeout(async () => {
        // Redirigir según el origen
        if (this.returnUrl.includes('backoffice') || this.returnUrl.startsWith('http')) {
          // Si viene del backoffice, redirigir al login del backoffice
          window.location.href = this.returnUrl.startsWith('http') 
            ? this.returnUrl 
            : `http://localhost:4200/login`;
        } else {
          // Si viene de la app, redirigir al login de la app
          await this.router.navigate(['/login']);
        }
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.error?.message || await this.translate.get('RESET_PASSWORD.ERROR').toPromise();
      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }
}

