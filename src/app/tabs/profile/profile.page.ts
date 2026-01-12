import { Component, OnInit, signal, computed } from '@angular/core';
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
  receiptOutline,
  cartOutline,
  calculatorOutline,
  leafOutline,
  pricetagOutline,
  cubeOutline,
  closeOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { OrdersService } from '../../core/services/orders.service';
import { VersionService } from '../../core/services/version.service';
import { User } from '../../core/models/auth.model';
import { ConsumerGroup } from '../../core/models/article.model';
import { Order, PaymentStatus } from '../../core/models/order.model';

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

  // Orders & Filters
  selectedPaymentTab = signal<string>('all');
  userOrders = computed(() => {
    const allOrders = this.ordersService.getUserOrders();
    const tab = this.selectedPaymentTab();

    if (tab === 'all') return allOrders;


    return allOrders.filter((order: Order) => {
      if (!order.paymentStatus) return tab === 'unpaid'; // Old orders without paymentStatus
      return order.paymentStatus === tab;
    });
  });

  unpaidCount = computed(() =>
    this.ordersService.getUserOrders().filter((o: Order) =>
      !o.paymentStatus || o.paymentStatus === PaymentStatus.UNPAID
    ).length
  );

  partialCount = computed(() =>
    this.ordersService.getUserOrders().filter((o: Order) =>
      o.paymentStatus === PaymentStatus.PARTIAL
    ).length
  );

  paidCount = computed(() =>
    this.ordersService.getUserOrders().filter((o: Order) =>
      o.paymentStatus === PaymentStatus.PAID
    ).length
  );

  // Order detail modal
  isOrderDetailOpen = signal(false);
  selectedOrder = signal<Order | null>(null);

  readonly PaymentStatus = PaymentStatus;

  constructor(
    private authService: AuthService,
    private consumerGroupService: ConsumerGroupService,
    private ordersService: OrdersService,
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
      receiptOutline,
      cartOutline,
      calculatorOutline,
      leafOutline,
      pricetagOutline,
      cubeOutline,
      closeOutline
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadConsumerGroups();
    this.versionService.loadVersion();
  }

  async loadOrders() {
    try {
      await this.ordersService.loadOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
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
        // Load orders after groups are loaded
        this.loadOrders();
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
      this.loadOrders(); // Reload orders for new group
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

  formatPrice(price: number | string | undefined | null): string {
    // Handle null/undefined
    if (price === undefined || price === null) {
      return '0,00 €';
    }
    
    // Convert to number
    let numPrice: number;
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      if (isNaN(parsed)) {
        return '0,00 €';
      }
      numPrice = parsed;
    } else {
      numPrice = price;
    }
    
    // Final safety check before toFixed
    if (typeof numPrice !== 'number' || isNaN(numPrice) || !isFinite(numPrice)) {
      return '0,00 €';
    }
    
    return `${numPrice.toFixed(2).replace('.', ',')} €`;
  }

  formatQuantity(quantity: number | string | undefined | null): string {
    if (quantity === undefined || quantity === null) return '0';
    
    const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    if (isNaN(numQuantity)) return '0';
    
    // Si és un número enter, retornar sense decimals
    if (numQuantity % 1 === 0) {
      return numQuantity.toString();
    }
    
    // Si té decimals, eliminar zeros innecessaris i convertir punt a coma
    const formatted = numQuantity.toString().replace(/\.?0+$/, '');
    return formatted.replace('.', ',');
  }

  getOrderStatusColor(status?: string): string {
    if (!status) return 'medium';
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getPaymentStatusLabel(order: Order): string {
    if (!order.paymentStatus) return 'PROFILE.ORDER_STATUS_PENDING';

    switch (order.paymentStatus) {
      case PaymentStatus.PAID:
        return 'PROFILE.PAYMENT_STATUS_PAID';
      case PaymentStatus.PARTIAL:
        return 'PROFILE.PAYMENT_STATUS_PARTIAL';
      case PaymentStatus.UNPAID:
        return 'PROFILE.PAYMENT_STATUS_UNPAID';
      default:
        return 'PROFILE.ORDER_STATUS_PENDING';
    }
  }

  getPaymentStatusColor(order: Order): string {
    if (!order.paymentStatus) return 'warning';

    switch (order.paymentStatus) {
      case PaymentStatus.PAID:
        return 'success';
      case PaymentStatus.PARTIAL:
        return 'warning';
      case PaymentStatus.UNPAID:
        return 'danger';
      default:
        return 'warning';
    }
  }

  getTotalToPay(order: Order): number {
    const total = order.totalPrice || order.totalAmount || 0;
    const paid = order.paidAmount || 0;
    return Math.max(0, total - paid);
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
      position: 'top',
      color
    });
    await toast.present();
  }

  getVersion(): string {
    return this.versionService.getVersion();
  }
}
