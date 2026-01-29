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
  IonSpinner,
  IonBadge,
  IonSegment,
  IonSegmentButton,
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
  leafOutline,
  pricetagOutline,
  cubeOutline,
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
    IonButtons,
    IonIcon,
    IonButton,
    IonLabel
  ]
})
export class OrdersPage implements OnInit {
  isLoading = signal(false);

  // Orders & Filters
  selectedPaymentTab = signal<string>('unpaid');
  userOrders = computed(() => {
    const allOrders = this.ordersService.getUserOrders();
    const tab = this.selectedPaymentTab();

    if (tab === 'all') return allOrders;

    return allOrders.filter((order: Order) => {
      if (!order.paymentStatus) return tab === 'unpaid';
      if (tab === 'unpaid') return order.paymentStatus === PaymentStatus.UNPAID || order.paymentStatus === PaymentStatus.PARTIAL;
      return order.paymentStatus === tab;
    });
  });

  readonly PaymentStatus = PaymentStatus;

  constructor(
    private ordersService: OrdersService,
    private consumerGroupService: ConsumerGroupService,
    private router: Router
  ) {
    addIcons({
      receiptOutline,
      cartOutline,
      leafOutline,
      pricetagOutline,
      cubeOutline,
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
      // totalPrice del backend ja és sense IVA (segons la documentació)
      // Però per estar segurs, calculem el subtotal sense IVA basant-nos en pricePerUnit i quantity
      const pricePerUnit = typeof item.pricePerUnit === 'string' ? parseFloat(item.pricePerUnit) : (item.pricePerUnit || 0);
      const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
      
      // Preu base de l'article
      let basePrice = pricePerUnit * quantity;
      
      // Afegir preu de les personalitzacions
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        for (const option of item.selectedOptions) {
          if (option.price && option.price > 0) {
            basePrice += option.price * quantity;
          }
        }
      }
      
      return sum + basePrice;
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
      
      // Calcular subtotal sense IVA (incloent personalitzacions)
      const pricePerUnit = typeof item.pricePerUnit === 'string' ? parseFloat(item.pricePerUnit) : (item.pricePerUnit || 0);
      const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
      
      let subtotal = pricePerUnit * quantity;
      
      // Afegir preu de les personalitzacions
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        for (const option of item.selectedOptions) {
          if (option.price && option.price > 0) {
            subtotal += option.price * quantity;
          }
        }
      }
      
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

  hasPayments(order: Order | null): boolean {
    if (!order) return false;
    const paidAmount = typeof order.paidAmount === 'string' ? parseFloat(order.paidAmount) : (order.paidAmount || 0);
    return paidAmount > 0;
  }

  openOrderDetail(order: Order) {
    this.router.navigate(['/tabs/orders', order.id]);
  }
}

