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
  IonSpinner,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  leafOutline,
  pricetagOutline,
  cubeOutline,
  personOutline,
  calculatorOutline,
  arrowBackOutline,
  createOutline,
  trashOutline,
  addOutline,
  removeOutline
} from 'ionicons/icons';
import { OrdersService } from '../../core/services/orders.service';
import { Order, PaymentStatus, OrderItem } from '../../core/models/order.model';
import { getErrorMessage } from '../../core/models/http-error.model';

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
    IonSpinner,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class OrderDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly translate = inject(TranslateService);

  order = signal<Order | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  updatingItemId = signal<string | null>(null);

  readonly PaymentStatus = PaymentStatus;

  constructor() {
    addIcons({
      cartOutline,
      leafOutline,
      pricetagOutline,
      cubeOutline,
      personOutline,
      calculatorOutline,
      arrowBackOutline,
      createOutline,
      trashOutline,
      addOutline,
      removeOutline
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
      this.error.set(getErrorMessage(err, 'Error carregant la comanda'));
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

  canEditOrder(): boolean {
    const currentOrder = this.order();
    if (!currentOrder) return false;
    return currentOrder.paymentStatus !== PaymentStatus.PAID;
  }

  private toDateStr(d: Date | string): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  isPeriodExpired(item: OrderItem): boolean {
    const endDate = item.period?.endDate;
    if (!endDate) return false;
    const todayStr = this.toDateStr(new Date());
    const endStr = this.toDateStr(endDate);
    return todayStr > endStr;
  }

  canEditItem(item: OrderItem): boolean {
    return this.canEditOrder() && !this.isPeriodExpired(item);
  }

  isUpdatingItem(itemId: string | undefined): boolean {
    return !!itemId && this.updatingItemId() === itemId;
  }

  // Quantity step based on unit measure (same as cart)
  getQuantityStep(item: OrderItem): number {
    return item.article?.unitMeasure === 'kg' ? 0.5 : 1;
  }

  async increaseQuantity(item: OrderItem) {
    if (!item.id || !this.order()?.id || !this.canEditItem(item) || this.isUpdatingItem(item.id)) return;

    const currentQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
    const step = this.getQuantityStep(item);
    const newQuantity = Number((currentQuantity + step).toFixed(3));

    this.applyQuantityOptimistic(item, newQuantity);
    this.updateQuantityBackend(item, newQuantity);
  }

  async decreaseQuantity(item: OrderItem) {
    if (!item.id || !this.order()?.id || !this.canEditItem(item) || this.isUpdatingItem(item.id)) return;

    const currentQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
    const step = this.getQuantityStep(item);
    const newQuantity = Number((currentQuantity - step).toFixed(3));

    if (newQuantity <= 0) {
      await this.removeItem(item);
      return;
    }

    this.applyQuantityOptimistic(item, newQuantity);
    this.updateQuantityBackend(item, newQuantity);
  }

  private applyQuantityOptimistic(item: OrderItem, newQuantity: number) {
    const order = this.order();
    if (!order) return;

    const updatedItems = order.items.map(i =>
      i.id === item.id ? { ...i, quantity: newQuantity } : i
    );
    this.order.set({ ...order, items: updatedItems });
  }

  private async updateQuantityBackend(item: OrderItem, newQuantity: number) {
    if (!item.id || !this.order()?.id) return;

    this.updatingItemId.set(item.id);
    try {
      const updatedOrder = await this.ordersService.updateOrderItem(
        this.order()!.id,
        item.id,
        { quantity: newQuantity }
      );
      this.order.set(updatedOrder);
      await this.showToast(this.translate.instant('CART.ITEM_UPDATED') || 'Quantitat actualitzada', 'success');
    } catch (err) {
      console.error('Error updating quantity:', err);
      this.applyQuantityOptimistic(item, item.quantity);
      await this.showToast(getErrorMessage(err, 'Error actualitzant la quantitat'), 'danger');
    } finally {
      this.updatingItemId.set(null);
    }
  }

  async removeItem(item: OrderItem) {
    if (!item.id || !this.order()?.id || !this.canEditItem(item)) return;

    this.updatingItemId.set(item.id);
    try {
      await this.ordersService.deleteOrderItem(this.order()!.id, item.id);
      
      // Reload the order
      const updatedOrder = await this.ordersService.getOrderById(this.order()!.id);
      
      // If no items left, go back to orders list
      if (!updatedOrder.items || updatedOrder.items.length === 0) {
        await this.showToast(this.translate.instant('CART.ITEM_REMOVED') || 'Article eliminat', 'success');
        this.router.navigate(['/tabs/orders']);
      } else {
        this.order.set(updatedOrder);
        await this.showToast(this.translate.instant('CART.ITEM_REMOVED') || 'Article eliminat', 'success');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      await this.showToast(getErrorMessage(err, 'Error eliminant l\'article'), 'danger');
    } finally {
      this.updatingItemId.set(null);
    }
  }

  async openCustomizationDialog(item: OrderItem) {
    if (!item.id || !this.order()?.id || !item.selectedOptions || !this.canEditItem(item)) return;

    const alert = await this.alertController.create({
      header: 'Personalitzacions',
      message: 'Edita les opcions seleccionades:',
      inputs: item.selectedOptions.map(option => {
        if (option.type === 'boolean') {
          return {
            type: 'checkbox' as const,
            label: option.title + (option.price ? ` (+${this.formatPrice(option.price)})` : ''),
            value: option.optionId,
            checked: option.value as boolean
          };
        }
        return {
          type: 'text' as const,
          name: option.optionId,
          placeholder: option.title,
          value: option.type === 'multiselect' ? (option.value as string[]).join(', ') : String(option.value)
        };
      }),
      buttons: [
        {
          text: 'Cancel·lar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => this.saveCustomizations(item, data)
        }
      ]
    });

    await alert.present();
  }

  async saveCustomizations(item: OrderItem, data: any) {
    if (!item.id || !this.order()?.id || !item.selectedOptions) return;

    try {
      const updatedOptions = item.selectedOptions.map(option => {
        if (option.type === 'boolean') {
          return {
            ...option,
            value: Array.isArray(data) ? data.includes(option.optionId) : false
          };
        }
        const newValue = data[option.optionId];
        if (option.type === 'multiselect' && typeof newValue === 'string') {
          return {
            ...option,
            value: newValue.split(',').map(v => v.trim()).filter(v => v)
          };
        }
        return {
          ...option,
          value: newValue
        };
      });

      const updatedOrder = await this.ordersService.updateOrderItem(
        this.order()!.id,
        item.id,
        { selectedOptions: updatedOptions }
      );
      this.order.set(updatedOrder);
      await this.showToast('Personalitzacions actualitzades', 'success');
    } catch (err) {
      console.error('Error updating customizations:', err);
      await this.showToast(getErrorMessage(err, 'Error actualitzant les personalitzacions'), 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }
}
