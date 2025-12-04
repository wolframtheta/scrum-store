import { Article } from './article.model';

export interface OrderItem {
  articleId?: string;
  article: Article;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  consumerGroupId: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

