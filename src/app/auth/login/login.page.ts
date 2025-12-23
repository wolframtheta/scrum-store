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
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { ToastController } from '@ionic/angular';
import { GroupSelectorModalComponent } from '../components/group-selector-modal.component';
import { firstValueFrom } from 'rxjs';

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
    private consumerGroupService: ConsumerGroupService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private modalController: ModalController,
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

        // Cargar grupos del usuario
        try {
          const groups = await firstValueFrom(this.consumerGroupService.loadUserGroups());
          console.log('Grupos cargados después del login:', groups);

          // Verificar si hay un grupo seleccionado
          const currentGroup = this.consumerGroupService.currentGroup();

          // Si no hay grupo seleccionado y hay múltiples grupos, mostrar modal
          if (!currentGroup && groups.length > 1) {
            console.log('Mostrando modal de selección de grupo');
            await this.showGroupSelectorModal(groups);
          } else if (!currentGroup && groups.length === 0) {
            this.showToast(this.translate.instant('LOGIN.NO_GROUPS'), 'warning');
          }
        } catch (error) {
          console.error('Error loading groups:', error);
        }

        // Navegar a la página principal
        this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        this.showToast(this.translate.instant('COMMON.WELCOME'), 'success');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Login error:', error);
        this.showToast(this.translate.instant('LOGIN.ERRORS.LOGIN_FAILED'), 'danger');
        this.isLoading = false;
      }
    });
  }

  async showGroupSelectorModal(groups: any[]) {
    const modal = await this.modalController.create({
      component: GroupSelectorModalComponent,
      componentProps: {
        groups: groups
      },
      backdropDismiss: false
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'selected' && data) {
      console.log('Grupo seleccionado en modal:', data);
      await this.consumerGroupService.setCurrentGroup(data);
      this.showToast(
        this.translate.instant('PROFILE.GROUP_CHANGED') + ': ' + data.name,
        'success'
      );
    }
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

