import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  receiptOutline,
  cartOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { OrdersService } from '../../core/services/orders.service';
import { User } from '../../core/models/auth.model';
import { ConsumerGroup } from '../../core/models/article.model';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonButtons
  ]
})
export class ProfilePage implements OnInit {
  currentUser = signal<User | null>(null);
  currentGroup = signal<ConsumerGroup | null>(null);
  userGroups = signal<ConsumerGroup[]>([]);
  isLoading = signal(false);
  isGroupOpen = signal(false);
  
  // Orders
  userOrders = computed(() => this.ordersService.getUserOrders());
  
  // Order detail modal
  isOrderDetailOpen = signal(false);
  selectedOrder = signal<Order | null>(null);

  constructor(
    private authService: AuthService,
    private consumerGroupService: ConsumerGroupService,
    private ordersService: OrdersService,
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
      receiptOutline,
      cartOutline
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadConsumerGroups();
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

  formatPrice(price: number): string {
    return `${price.toFixed(2).replace('.', ',')} €`;
  }

  getOrderStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  async openOrderDetail(order: Order) {
    console.log('Opening order detail:', order); // Debug
    
    // Open modal immediately with current data
    this.selectedOrder.set(order);
    this.isOrderDetailOpen.set(true);
    
    // Then fetch fresh data from backend
    try {
      const freshOrder = await this.ordersService.getOrderById(order.id);
      console.log('Fresh order from backend:', freshOrder); // Debug
      this.selectedOrder.set(freshOrder);
    } catch (error) {
      console.error('Error loading order detail:', error);
      // Keep showing the data we already have
    }
  }

  closeOrderDetail() {
    this.isOrderDetailOpen.set(false);
    setTimeout(() => this.selectedOrder.set(null), 300);
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
