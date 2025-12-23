import { Article } from './article.model';

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

export interface OrderItem {
  id?: string;
  articleId?: string;
  article: Article;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  paidAmount?: number;
}

export interface Order {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  consumerGroupId: string;
  items: OrderItem[];
  totalPrice: number;
  totalAmount?: number; // Alias for totalPrice
  paidAmount?: number;
  paymentStatus?: PaymentStatus;
  isDelivered?: boolean;
  status?: 'pending' | 'confirmed' | 'delivered' | 'cancelled'; // Keep for backwards compatibility
  createdAt: Date;
  updatedAt?: Date;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

