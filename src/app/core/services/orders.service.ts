import { Injectable, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { ConsumerGroupService } from './consumer-group.service';
import { Order } from '../models/order.model';
import { CartItem } from './cart.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private orders = signal<Order[]>([]);

  constructor(
    private apiService: ApiService,
    private consumerGroupService: ConsumerGroupService
  ) {}

  getUserOrders(): Order[] {
    return this.orders();
  }

  async loadOrders(): Promise<void> {
    const currentGroup = this.consumerGroupService.currentGroup();
    if (!currentGroup?.id) {
      this.orders.set([]);
      return;
    }

    try {
      const orders = await firstValueFrom(
        this.apiService.get<Order[]>(`/consumer-groups/${currentGroup.id}/orders`)
      );
      this.orders.set(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
      this.orders.set([]);
    }
  }

  async createOrder(cartItems: CartItem[]): Promise<Order> {
    const currentGroup = this.consumerGroupService.currentGroup();
    if (!currentGroup?.id) {
      throw new Error('No consumer group selected');
    }

    const orderData = {
      consumerGroupId: currentGroup.id,
      items: cartItems.map(item => ({
        articleId: item.article.id,
        quantity: item.quantity,
        ...(item.orderPeriodId && { orderPeriodId: item.orderPeriodId })
      }))
    };

    const order = await firstValueFrom(
      this.apiService.post<Order>(`/consumer-groups/${currentGroup.id}/orders`, orderData)
    );

    // Reload orders after creating a new one
    await this.loadOrders();

    return order;
  }

  async getOrderById(orderId: string): Promise<Order> {
    const currentGroup = this.consumerGroupService.currentGroup();
    if (!currentGroup?.id) {
      throw new Error('No consumer group selected');
    }

    return await firstValueFrom(
      this.apiService.get<Order>(`/consumer-groups/${currentGroup.id}/orders/${orderId}`)
    );
  }
}
