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
    if (price === undefined || price === null || price === '') {
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
    
    // Format with 2 decimals
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

  // Calcula el subtotal sense IVA d'una comanda
  getOrderSubtotalWithoutTax(order: Order): number {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      const totalPrice = typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : (item.totalPrice || 0);
      return sum + totalPrice;
    }, 0);
  }

  // Calcula el desglossament d'IVA per taxa
  getOrderTaxSummary(order: Order): { taxRate: number; taxAmount: number }[] {
    if (!order.items || order.items.length === 0) return [];
    
    const taxMap = new Map<number, number>();
    
    order.items.forEach(item => {
      const taxRate = typeof item.article?.taxRate === 'string' 
        ? parseFloat(item.article.taxRate) 
        : (item.article?.taxRate || 0);
      const subtotal = typeof item.totalPrice === 'string' 
        ? parseFloat(item.totalPrice) 
        : (item.totalPrice || 0);
      const taxAmount = subtotal * (taxRate / 100);
      
      if (taxMap.has(taxRate)) {
        taxMap.set(taxRate, taxMap.get(taxRate)! + taxAmount);
      } else {
        taxMap.set(taxRate, taxAmount);
      }
    });
    
    return Array.from(taxMap.entries())
      .map(([taxRate, taxAmount]) => ({ taxRate, taxAmount }))
      .filter(tax => tax.taxRate > 0 && tax.taxAmount > 0)
      .sort((a, b) => a.taxRate - b.taxRate);
  }

  // Calcula el total d'IVA de la comanda
  getOrderTotalTax(order: Order): number {
    return this.getOrderTaxSummary(order).reduce((sum, tax) => sum + tax.taxAmount, 0);
  }

  // Calcula el total amb IVA de la comanda
  getOrderTotalWithTax(order: Order): number {
    return this.getOrderSubtotalWithoutTax(order) + this.getOrderTotalTax(order);
  }

  getTotalToPay(order: Order): number {
    const totalWithTax = this.getOrderTotalWithTax(order);
    const paid = typeof order.paidAmount === 'string' ? parseFloat(order.paidAmount) : (order.paidAmount || 0);
    return Math.max(0, totalWithTax - paid);
  }

  // Calcula el total amb IVA d'un article
  getItemTotalWithTax(item: any): number {
    const subtotal = typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : (item.totalPrice || 0);
    const taxRate = typeof item.article?.taxRate === 'string' ? parseFloat(item.article.taxRate) : (item.article?.taxRate || 0);
    return subtotal * (1 + taxRate / 100);
  }

  // Comprova si una comanda té pagaments
  hasPayments(order: Order | null): boolean {
    if (!order) return false;
    const paidAmount = typeof order.paidAmount === 'string' ? parseFloat(order.paidAmount) : (order.paidAmount || 0);
    return paidAmount > 0;
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

