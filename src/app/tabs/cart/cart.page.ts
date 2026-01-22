import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButton,
  IonIcon,
  IonBadge,
  IonFooter,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { 
  trashOutline, 
  addOutline, 
  removeOutline, 
  checkmarkOutline,
  cartOutline,
  leafOutline
} from 'ionicons/icons';
import { CartService, CartItem } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButton,
    IonIcon,
    IonBadge,
    IonFooter
  ]
})
export class CartPage implements OnInit {
  items = this.cartService.items;
  totalPrice = this.cartService.totalPrice;
  totalPriceWithoutTax = this.cartService.totalPriceWithoutTax;
  totalTaxAmount = this.cartService.totalTaxAmount;
  taxSummary = this.cartService.taxSummary;

  constructor(
    private cartService: CartService,
    private ordersService: OrdersService,
    private toastController: ToastController,
    private alertController: AlertController,
    private translate: TranslateService
  ) {
    addIcons({ 
      trashOutline, 
      addOutline, 
      removeOutline, 
      checkmarkOutline,
      cartOutline,
      leafOutline
    });
  }

  ngOnInit() {}

  getQuantityStep(item: CartItem): number {
    return item.article.unitMeasure === 'kg' ? 0.5 : 1;
  }

  increaseQuantity(item: CartItem) {
    const newQuantity = item.quantity + this.getQuantityStep(item);
    this.cartService.updateQuantity(item.article.id, newQuantity);
  }

  decreaseQuantity(item: CartItem) {
    const step = this.getQuantityStep(item);
    const newQuantity = item.quantity - step;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.article.id, newQuantity);
    } else {
      this.removeItem(item);
    }
  }

  async removeItem(item: CartItem) {
    await this.cartService.removeItem(item.article.id);
    await this.showToast(this.translate.instant('CART.ITEM_REMOVED'), 'success');
  }

  formatPrice(price: number | string | undefined | null): string {
    if (price === undefined || price === null || price === '') return '0,00 €';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0,00 €';
    return `${numPrice.toFixed(2).replace('.', ',')} €`;
  }

  formatQuantity(quantity: number | string): string {
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

  formatMultiselectValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  async confirmOrder() {
    if (this.items().length === 0) {
      await this.showToast(this.translate.instant('CART.EMPTY_CART'), 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: this.translate.instant('CART.CONFIRM_ORDER_TITLE'),
      message: this.translate.instant('CART.CONFIRM_ORDER_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('CART.CONFIRM_BUTTON'),
          handler: async () => {
            await this.processOrder();
          }
        }
      ]
    });

    await alert.present();
  }

  async processOrder() {
    try {
      // Create order from cart items
      await this.ordersService.createOrder(this.items());
      
      // Clear cart after successful order
      await this.cartService.clearCart();
      
      await this.showToast(this.translate.instant('CART.ORDER_SUCCESS'), 'success');
    } catch (error) {
      console.error('Error processing order:', error);
      await this.showToast(this.translate.instant('COMMON.ERROR'), 'danger');
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

