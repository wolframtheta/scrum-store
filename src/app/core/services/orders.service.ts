import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { StorageService } from './storage.service';
import { Order } from '../models/order.model';
import { CartItem } from './cart.service';
import { AuthService } from './auth.service';
import { ConsumerGroupService } from './consumer-group.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly ORDERS_STORAGE_KEY = 'user_orders';
  private readonly API_URL = `${environment.urlServer}/orders`;
  
  private _orders = signal<Order[]>([]);
  
  // Public readonly signals
  public readonly orders = this._orders.asReadonly();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private authService: AuthService,
    private consumerGroupService: ConsumerGroupService
  ) {
    // Load orders only if user is authenticated
    if (this.authService.currentUser()) {
      this.loadOrders();
    } else {
      // Try to load from local storage only
      this.loadOrdersFromStorage();
    }
  }

  /**
   * Carregar comandes des de local storage
   */
  private async loadOrdersFromStorage(): Promise<void> {
    const localOrders = await this.storageService.get<Order[]>(this.ORDERS_STORAGE_KEY);
    if (localOrders) {
      const ordersWithDates = localOrders.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
      }));
      this._orders.set(ordersWithDates);
    }
  }

  /**
   * Carregar comandes des del backend
   */
  async loadOrders(): Promise<void> {
    // Only try to load from backend if user is authenticated
    if (!this.authService.currentUser()) {
      await this.loadOrdersFromStorage();
      return;
    }

    try {
      const orders = await firstValueFrom(
        this.http.get<Order[]>(this.API_URL)
      );
      
      // Convert date strings back to Date objects
      const ordersWithDates = orders.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
      }));
      
      this._orders.set(ordersWithDates);
      
      // Also save to local storage as backup
      await this.storageService.set(this.ORDERS_STORAGE_KEY, ordersWithDates);
    } catch (error) {
      console.error('Error loading orders from backend:', error);
      // Fallback to local storage
      await this.loadOrdersFromStorage();
    }
  }

  /**
   * Crear una nova comanda des de la cistella
   */
  async createOrder(cartItems: CartItem[]): Promise<Order> {
    const user = this.authService.currentUser();
    const group = this.consumerGroupService.currentGroup();

    if (!user || !group) {
      throw new Error('User or consumer group not found');
    }

    const orderItems = cartItems.map(item => ({
      articleId: item.article.id,
      quantity: item.quantity,
      pricePerUnit: typeof item.article.pricePerUnit === 'string' 
        ? parseFloat(item.article.pricePerUnit) 
        : item.article.pricePerUnit,
      totalPrice: item.totalPrice,
      article: item.article
    }));

    const createOrderDto = {
      consumerGroupId: group.id,
      items: orderItems
    };

    try {
      const newOrder = await firstValueFrom(
        this.http.post<Order>(this.API_URL, createOrderDto)
      );

      // Add article details to the order items
      const orderWithArticles: Order = {
        ...newOrder,
        items: orderItems,
        createdAt: new Date(newOrder.createdAt)
      };

      const orders = [...this._orders(), orderWithArticles];
      this._orders.set(orders);
      
      // Save to local storage
      await this.storageService.set(this.ORDERS_STORAGE_KEY, orders);

      return orderWithArticles;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Obtenir comandes de l'usuari actual
   */
  getUserOrders(): Order[] {
    return this._orders()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtenir una comanda per ID des del backend
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const order = await firstValueFrom(
        this.http.get<Order>(`${this.API_URL}/${orderId}`)
      );

      // Convert date strings back to Date objects
      const orderWithDates: Order = {
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
      };

      return orderWithDates;
    } catch (error) {
      console.error('Error loading order detail from backend:', error);
      // Fallback to local data
      const localOrder = this._orders().find(o => o.id === orderId);
      if (!localOrder) {
        throw new Error('Order not found');
      }
      return localOrder;
    }
  }

  /**
   * Obtenir una comanda per ID des de la memòria local
   */
  getOrderByIdLocal(orderId: string): Order | undefined {
    return this._orders().find(order => order.id === orderId);
  }

  /**
   * Actualitzar estat d'una comanda
   */
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(`${this.API_URL}/${orderId}/status`, { status })
      );

      const orders = this._orders().map(order => 
        order.id === orderId 
          ? { ...order, status, updatedAt: new Date() }
          : order
      );
      this._orders.set(orders);
      
      await this.storageService.set(this.ORDERS_STORAGE_KEY, orders);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Cancel·lar una comanda
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'cancelled');
  }
}

