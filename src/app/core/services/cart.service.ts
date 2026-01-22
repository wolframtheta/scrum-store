import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { Article, SelectedOption } from '../models/article.model';

export interface CartItem {
  article: Article;
  quantity: number; // Quantitat en la unitat de mesura de l'article
  totalPrice: number; // Preu total amb IVA
  totalPriceWithoutTax: number; // Preu total sense IVA
  taxAmount: number; // Quantitat d'IVA
  orderPeriodId?: string; // Nou: ID del període de pedido
  selectedOptions?: SelectedOption[]; // Opciones personalizadas seleccionadas
}

export interface TaxSummary {
  taxRate: number;
  subtotalWithoutTax: number;
  taxAmount: number;
  subtotalWithTax: number;
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

  // Computed: preu total de la cistella (amb IVA)
  public readonly totalPrice = computed(() => {
    return this._items().reduce((sum, item) => sum + item.totalPrice, 0);
  });

  // Computed: preu total sense IVA
  public readonly totalPriceWithoutTax = computed(() => {
    return this._items().reduce((sum, item) => sum + item.totalPriceWithoutTax, 0);
  });

  // Computed: total d'IVA
  public readonly totalTaxAmount = computed(() => {
    return this._items().reduce((sum, item) => sum + item.taxAmount, 0);
  });

  // Computed: resum agrupat per tipus d'IVA
  public readonly taxSummary = computed(() => {
    const summary = new Map<number, TaxSummary>();
    
    this._items().forEach(item => {
      const taxRate = item.article.taxRate || 0;
      const existing = summary.get(taxRate);
      
      if (existing) {
        existing.subtotalWithoutTax += item.totalPriceWithoutTax;
        existing.taxAmount += item.taxAmount;
        existing.subtotalWithTax += item.totalPrice;
      } else {
        summary.set(taxRate, {
          taxRate,
          subtotalWithoutTax: item.totalPriceWithoutTax,
          taxAmount: item.taxAmount,
          subtotalWithTax: item.totalPrice
        });
      }
    });
    
    return Array.from(summary.values())
      .filter(tax => tax.taxRate > 0 && tax.taxAmount > 0)
      .sort((a, b) => a.taxRate - b.taxRate);
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
   * Calcular preus amb IVA
   */
  private calculatePrices(pricePerUnit: number, quantity: number, taxRate: number = 0): {
    totalPriceWithoutTax: number;
    taxAmount: number;
    totalPrice: number;
  } {
    const totalPriceWithoutTax = pricePerUnit * quantity;
    const taxAmount = totalPriceWithoutTax * (taxRate / 100);
    const totalPrice = totalPriceWithoutTax + taxAmount;
    
    return {
      totalPriceWithoutTax: Math.round(totalPriceWithoutTax * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100
    };
  }

  /**
   * Afegir o actualitzar article a la cistella
   */
  async addItem(article: Article, quantity: number, selectedOptions?: SelectedOption[]): Promise<void> {
    const items = [...this._items()];
    const existingIndex = items.findIndex(item => item.article.id === article.id);

    const pricePerUnit = typeof article.pricePerUnit === 'string'
      ? parseFloat(article.pricePerUnit)
      : article.pricePerUnit;

    const taxRate = article.taxRate || 0;
    const prices = this.calculatePrices(pricePerUnit, quantity, taxRate);

    // Extraer orderPeriodId si existe en el artículo
    const orderPeriodId = (article as any).orderPeriodId;

    if (existingIndex >= 0) {
      // Actualitzar quantitat si ja existeix
      items[existingIndex] = {
        article,
        quantity,
        totalPrice: prices.totalPrice,
        totalPriceWithoutTax: prices.totalPriceWithoutTax,
        taxAmount: prices.taxAmount,
        orderPeriodId,
        selectedOptions
      };
    } else {
      // Afegir nou article
      items.push({
        article,
        quantity,
        totalPrice: prices.totalPrice,
        totalPriceWithoutTax: prices.totalPriceWithoutTax,
        taxAmount: prices.taxAmount,
        orderPeriodId,
        selectedOptions
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

      const taxRate = article.taxRate || 0;
      const prices = this.calculatePrices(pricePerUnit, quantity, taxRate);

      items[index] = {
        article,
        quantity,
        totalPrice: prices.totalPrice,
        totalPriceWithoutTax: prices.totalPriceWithoutTax,
        taxAmount: prices.taxAmount,
        orderPeriodId: items[index].orderPeriodId, // Mantener el periodId
        selectedOptions: items[index].selectedOptions // Mantener las opciones seleccionadas
      };
      this._items.set(items);
      await this.saveCart();
    } else if (index >= 0 && quantity <= 0) {
      // Si la quantitat és 0 o negativa, eliminar l'article
      await this.removeItem(articleId);
    }
  }
}
