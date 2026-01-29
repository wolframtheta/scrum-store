import { Component, OnInit, signal, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonBadge,
  IonButtons,
  IonIcon,
  IonButton,
  IonLabel,
  IonBackButton,
  IonSpinner
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  leafOutline,
  pricetagOutline,
  cubeOutline,
  personOutline,
  calculatorOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { OrdersService } from '../../core/services/orders.service';
import { Order, PaymentStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonBadge,
    IonButtons,
    IonIcon,
    IonButton,
    IonLabel,
    IonBackButton,
    IonSpinner
  ]
})
export class OrderDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);

  order = signal<Order | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  readonly PaymentStatus = PaymentStatus;

  constructor() {
    addIcons({
      cartOutline,
      leafOutline,
      pricetagOutline,
      cubeOutline,
      personOutline,
      calculatorOutline,
      arrowBackOutline
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tabs/orders']);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    try {
      const order = await this.ordersService.getOrderById(id);
      this.order.set(order);
    } catch (err) {
      console.error('Error loading order:', err);
      this.error.set('Error carregant la comanda');
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
    if (price === undefined || price === null || price === '') return '0,00 €';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || !isFinite(numPrice)) return '0,00 €';
    return `${numPrice.toFixed(2).replace('.', ',')} €`;
  }

  formatQuantity(quantity: number | string | undefined | null): string {
    if (quantity === undefined || quantity === null) return '0';
    const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    if (isNaN(numQuantity)) return '0';
    if (numQuantity % 1 === 0) return numQuantity.toString();
    return numQuantity.toString().replace(/\.?0+$/, '').replace('.', ',');
  }

  getPaymentStatusLabel(order: Order): string {
    if (!order.paymentStatus) return 'PROFILE.ORDER_STATUS_PENDING';
    switch (order.paymentStatus) {
      case PaymentStatus.PAID: return 'PROFILE.PAYMENT_STATUS_PAID';
      case PaymentStatus.PARTIAL: return 'PROFILE.PAYMENT_STATUS_PARTIAL';
      case PaymentStatus.UNPAID: return 'PROFILE.PAYMENT_STATUS_UNPAID';
      default: return 'PROFILE.ORDER_STATUS_PENDING';
    }
  }

  getPaymentStatusColor(order: Order): string {
    if (!order.paymentStatus) return 'warning';
    switch (order.paymentStatus) {
      case PaymentStatus.PAID: return 'success';
      case PaymentStatus.PARTIAL: return 'warning';
      case PaymentStatus.UNPAID: return 'danger';
      default: return 'warning';
    }
  }

  getOrderSubtotalWithoutTax(order: Order): number {
    if (!order.items?.length) return 0;
    return order.items.reduce((sum, item) => {
      const pricePerUnit = typeof item.pricePerUnit === 'string' ? parseFloat(item.pricePerUnit) : (item.pricePerUnit || 0);
      const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
      let basePrice = pricePerUnit * quantity;
      if (item.selectedOptions?.length) {
        for (const option of item.selectedOptions) {
          if (option.price && option.price > 0) basePrice += option.price * quantity;
        }
      }
      return sum + basePrice;
    }, 0);
  }

  getOrderTaxSummary(order: Order): { taxRate: number; taxAmount: number }[] {
    if (!order.items?.length) return [];
    const taxMap = new Map<number, number>();
    order.items.forEach(item => {
      const taxRate = typeof item.article?.taxRate === 'string' ? parseFloat(item.article.taxRate) : (item.article?.taxRate || 0);
      const pricePerUnit = typeof item.pricePerUnit === 'string' ? parseFloat(item.pricePerUnit) : (item.pricePerUnit || 0);
      const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
      let subtotal = pricePerUnit * quantity;
      if (item.selectedOptions?.length) {
        for (const option of item.selectedOptions) {
          if (option.price && option.price > 0) subtotal += option.price * quantity;
        }
      }
      const taxAmount = subtotal * (taxRate / 100);
      taxMap.set(taxRate, (taxMap.get(taxRate) || 0) + taxAmount);
    });
    return Array.from(taxMap.entries())
      .map(([taxRate, taxAmount]) => ({ taxRate, taxAmount }))
      .filter(tax => tax.taxRate > 0 && tax.taxAmount > 0)
      .sort((a, b) => a.taxRate - b.taxRate);
  }

  getOrderTotalTax(order: Order): number {
    return this.getOrderTaxSummary(order).reduce((sum, tax) => sum + tax.taxAmount, 0);
  }

  getOrderTotalWithTax(order: Order): number {
    return this.getOrderSubtotalWithoutTax(order) + this.getOrderTotalTax(order);
  }

  getTotalToPay(order: Order): number {
    const totalWithTax = this.getOrderTotalWithTax(order);
    const paid = typeof order.paidAmount === 'string' ? parseFloat(order.paidAmount) : (order.paidAmount || 0);
    return Math.max(0, totalWithTax - paid);
  }

  getItemTotalWithTax(item: any): number {
    const pricePerUnit = typeof item.pricePerUnit === 'string' ? parseFloat(item.pricePerUnit) : (item.pricePerUnit || 0);
    const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
    let subtotal = pricePerUnit * quantity;
    if (item.selectedOptions?.length) {
      for (const option of item.selectedOptions) {
        if (option.price && option.price > 0) subtotal += option.price * quantity;
      }
    }
    const taxRate = typeof item.article?.taxRate === 'string' ? parseFloat(item.article.taxRate) : (item.article?.taxRate || 0);
    return subtotal * (1 + taxRate / 100);
  }

  formatMultiselectValue(value: any): string {
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  hasPayments(order: Order | null): boolean {
    if (!order) return false;
    const paidAmount = typeof order.paidAmount === 'string' ? parseFloat(order.paidAmount) : (order.paidAmount || 0);
    return paidAmount > 0;
  }
}
