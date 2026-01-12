import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonSpinner,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonModal,
  IonButtons,
  IonIcon,
  IonButton,
  IonLabel
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  receiptOutline,
  cartOutline,
  calculatorOutline,
  leafOutline,
  pricetagOutline,
  cubeOutline,
  closeOutline,
  personOutline
} from 'ionicons/icons';
import { OrdersService } from '../../core/services/orders.service';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { Order, PaymentStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
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
    IonSpinner,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonModal,
    IonButtons,
    IonIcon,
    IonButton,
    IonLabel
  ]
})
export class OrdersPage implements OnInit {
  isLoading = signal(false);

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
    private ordersService: OrdersService,
    private consumerGroupService: ConsumerGroupService
  ) {
    addIcons({
      receiptOutline,
      cartOutline,
      calculatorOutline,
      leafOutline,
      pricetagOutline,
      cubeOutline,
      closeOutline,
      personOutline
    });

    // Recargar comandas cuando cambie el grupo
    effect(() => {
      const currentGroup = this.consumerGroupService.currentGroup();
      if (currentGroup?.id) {
        this.loadOrders();
      }
    });
  }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.isLoading.set(true);
    try {
      await this.ordersService.loadOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      this.isLoading.set(false);
    }
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
    console.log('Opening order detail:', order);

    // Open modal immediately with current data
    this.selectedOrder.set(order);
    this.isOrderDetailOpen.set(true);

    // Then fetch fresh data from backend
    try {
      const freshOrder = await this.ordersService.getOrderById(order.id);
      console.log('Fresh order from backend:', freshOrder);
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
}

