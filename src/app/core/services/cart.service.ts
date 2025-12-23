import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { Article } from '../models/article.model';

export interface CartItem {
  article: Article;
  quantity: number; // Quantitat en la unitat de mesura de l'article
  totalPrice: number;
  orderPeriodId?: string; // Nou: ID del període de pedido
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_STORAGE_KEY = 'cart_items';

  private _items = signal<CartItem[]>([]);

  // Public readonly signals
  public readonly items = this._items.asReadonly();

  // Computed: total d'articles diferents
  public readonly itemsCount = computed(() => this._items().length);

  // Computed: preu total de la cistella
  public readonly totalPrice = computed(() => {
    return this._items().reduce((sum, item) => sum + item.totalPrice, 0);
  });

  constructor(private storageService: StorageService) {
    this.loadCart();
  }

  /**
   * Carregar cistella des de storage
   */
  async loadCart(): Promise<void> {
    const items = await this.storageService.get<CartItem[]>(this.CART_STORAGE_KEY);
    if (items) {
      this._items.set(items);
    }
  }

  /**
   * Guardar cistella a storage
   */
  private async saveCart(): Promise<void> {
    await this.storageService.set(this.CART_STORAGE_KEY, this._items());
  }

  /**
   * Afegir o actualitzar article a la cistella
   */
  async addItem(article: Article, quantity: number): Promise<void> {
    const items = [...this._items()];
    const existingIndex = items.findIndex(item => item.article.id === article.id);

    const pricePerUnit = typeof article.pricePerUnit === 'string'
      ? parseFloat(article.pricePerUnit)
      : article.pricePerUnit;

    const totalPrice = pricePerUnit * quantity;

    // Extraer orderPeriodId si existe en el artículo
    const orderPeriodId = (article as any).orderPeriodId;

    if (existingIndex >= 0) {
      // Actualitzar quantitat si ja existeix
      items[existingIndex] = {
        article,
        quantity,
        totalPrice,
        orderPeriodId
      };
    } else {
      // Afegir nou article
      items.push({
        article,
        quantity,
        totalPrice,
        orderPeriodId
      });
    }

    this._items.set(items);
    await this.saveCart();
  }

  /**
   * Eliminar article de la cistella
   */
  async removeItem(articleId: string): Promise<void> {
    const items = this._items().filter(item => item.article.id !== articleId);
    this._items.set(items);
    await this.saveCart();
  }

  /**
   * Obtenir article de la cistella
   */
  getItem(articleId: string): CartItem | undefined {
    return this._items().find(item => item.article.id === articleId);
  }

  /**
   * Netejar cistella
   */
  async clearCart(): Promise<void> {
    this._items.set([]);
    await this.saveCart();
  }

  /**
   * Actualitzar quantitat d'un article
   */
  async updateQuantity(articleId: string, quantity: number): Promise<void> {
    const items = [...this._items()];
    const index = items.findIndex(item => item.article.id === articleId);

    if (index >= 0 && quantity > 0) {
      const article = items[index].article;
      const pricePerUnit = typeof article.pricePerUnit === 'string'
        ? parseFloat(article.pricePerUnit)
        : article.pricePerUnit;

      items[index] = {
        article,
        quantity,
        totalPrice: pricePerUnit * quantity,
        orderPeriodId: items[index].orderPeriodId // Mantener el periodId
      };
      this._items.set(items);
      await this.saveCart();
    } else if (index >= 0 && quantity <= 0) {
      // Si la quantitat és 0 o negativa, eliminar l'article
      await this.removeItem(articleId);
    }
  }
}
