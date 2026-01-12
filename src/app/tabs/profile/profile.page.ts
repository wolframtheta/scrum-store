import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonAvatar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonBadge,
  IonList,
  IonAccordionGroup,
  IonAccordion,
  IonModal,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  personOutline,
  mailOutline,
  callOutline,
  storefrontOutline,
  locationOutline,
  timeOutline,
  swapHorizontalOutline,
  notificationsOutline,
  closeOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { NoticesService } from '../../core/services/notices.service';
import { VersionService } from '../../core/services/version.service';
import { User } from '../../core/models/auth.model';
import { ConsumerGroup } from '../../core/models/article.model';
import { Notice } from '../../core/models/notice.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonButton,
    IonIcon,
    IonAvatar,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonBadge,
    IonList,
    IonAccordionGroup,
    IonAccordion,
    IonModal,
    IonButtons,
    IonSegment,
    IonSegmentButton
  ]
})
export class ProfilePage implements OnInit {
  currentUser = signal<User | null>(null);
  currentGroup = signal<ConsumerGroup | null>(null);
  userGroups = signal<ConsumerGroup[]>([]);
  isLoading = signal(false);
  isGroupOpen = signal(false);

  // Notices
  groupNotices = computed(() => this.noticesService.getNotices());

  // Notice detail modal
  isNoticeDetailOpen = signal(false);
  selectedNotice = signal<Notice | null>(null);

  constructor(
    private authService: AuthService,
    private consumerGroupService: ConsumerGroupService,
    private noticesService: NoticesService,
    private versionService: VersionService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    addIcons({
      logOutOutline,
      personOutline,
      mailOutline,
      callOutline,
      storefrontOutline,
      locationOutline,
      timeOutline,
      swapHorizontalOutline,
      notificationsOutline,
      closeOutline
    });

    // Recargar avisos cuando cambie el grupo
    effect(() => {
      const currentGroup = this.consumerGroupService.currentGroup();
      if (currentGroup?.id) {
        this.loadNotices();
      }
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadConsumerGroups();
    this.versionService.loadVersion();
  }

  async loadNotices() {
    try {
      await this.noticesService.loadNotices();
    } catch (error) {
      console.error('Error loading notices:', error);
    }
  }

  loadUserData() {
    // Subscribirse a los cambios del usuario actual
    this.currentUser.set(this.authService.currentUser());
  }

  loadConsumerGroups() {
    this.isLoading.set(true);
    this.consumerGroupService.loadUserGroups().subscribe({
      next: (groups) => {
        this.userGroups.set(groups);
        this.currentGroup.set(this.consumerGroupService.currentGroup());
        this.updateGroupStatus();
        this.isLoading.set(false);
        // Load notices after groups are loaded
        this.loadNotices();
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.isLoading.set(false);
      }
    });
  }

  updateGroupStatus() {
    const group = this.currentGroup();
    if (group) {
      this.isGroupOpen.set(this.consumerGroupService.isGroupOpen(group));
    }
  }

  onGroupChange(event: any) {
    const groupId = event.detail.value;
    const group = this.userGroups().find(g => g.id === groupId);
    if (group) {
      this.consumerGroupService.setCurrentGroup(group);
      this.currentGroup.set(group);
      this.updateGroupStatus();
      this.loadNotices(); // Reload notices for new group
      this.showToast(this.translate.instant('PROFILE.GROUP_CHANGED'), 'success');
    }
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: this.translate.instant('PROFILE.LOGOUT_CONFIRM_TITLE'),
      message: this.translate.instant('PROFILE.LOGOUT_CONFIRM_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('PROFILE.LOGOUT'),
          role: 'destructive',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    this.isLoading.set(true);
    try {
      await this.authService.logout();
      // El servicio de auth ya redirige al login
    } catch (error) {
      console.error('Error during logout:', error);
      this.showToast(this.translate.instant('PROFILE.LOGOUT_ERROR'), 'danger');
      this.isLoading.set(false);
    }
  }

  getGroupOpeningHoursToday(): string {
    const group = this.currentGroup();
    if (!group?.openingSchedule) return '-';

    const now = new Date();
    const day = now.toLocaleDateString('ca-ES', { weekday: 'long' }).toLowerCase();
    const hours = group.openingSchedule[day];

    if (!hours || hours.closed) {
      return this.translate.instant('PROFILE.CLOSED');
    }

    return `${hours.open} - ${hours.close}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('ca-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openNoticeDetail(notice: Notice) {
    this.selectedNotice.set(notice);
    this.isNoticeDetailOpen.set(true);
  }

  closeNoticeDetail() {
    this.isNoticeDetailOpen.set(false);
    setTimeout(() => this.selectedNotice.set(null), 300);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }

  getVersion(): string {
    return this.versionService.getVersion();
  }
}
