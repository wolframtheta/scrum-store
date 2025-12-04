import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonLabel,
  IonModal,
  IonButtons,
  IonItem,
  IonCheckbox,
  IonAccordionGroup,
  IonAccordion,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, leafOutline, storefrontOutline, locationOutline, personOutline, businessOutline, closeCircleOutline, funnelOutline, closeOutline, checkmarkOutline, closeCircle, close, cartOutline, removeOutline } from 'ionicons/icons';
import { ShowcaseService } from '../../core/services/showcase.service';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { CartService } from '../../core/services/cart.service';
import { Article } from '../../core/models/article.model';

@Component({
  selector: 'app-showcase',
  templateUrl: './showcase.page.html',
  styleUrls: ['./showcase.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonLabel,
    IonModal,
    IonButtons,
    IonItem,
    IonCheckbox,
    IonAccordionGroup,
    IonAccordion
  ]
})
export class ShowcasePage implements OnInit {
  searchText = signal('');
  isLoading = signal(true);
  allArticles = signal<Article[]>([]);
  isFiltersModalOpen = signal(false);
  isAddToCartModalOpen = signal(false);
  selectedArticle = signal<Article | null>(null);
  modalQuantity = signal(0);

  // Filtres
  selectedCategories = signal<string[]>([]);
  selectedProducts = signal<string[]>([]);
  selectedVarieties = signal<string[]>([]);
  showSeasonalOnly = signal<boolean>(false);

  // Computed: obtenir estructura jeràrquica de filtres
  filterHierarchy = computed(() => {
    const articles = this.allArticles();
    const hierarchy: {
      category: string;
      products: {
        product: string;
        varieties: string[];
      }[];
    }[] = [];

    // Agrupar per categoria
    const categoryMap = new Map<string, Set<string>>();
    const productVarietyMap = new Map<string, Set<string>>();

    articles.forEach(article => {
      const category = article.category || 'Sin categoría';
      const product = article.product || 'Sin producto';
      const variety = article.variety;

      // Agregar productos por categoría
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Set());
      }
      categoryMap.get(category)!.add(product);

      // Agregar variedades por producto
      const productKey = `${category}::${product}`;
      if (!productVarietyMap.has(productKey)) {
        productVarietyMap.set(productKey, new Set());
      }
      if (variety) {
        productVarietyMap.get(productKey)!.add(variety);
      }
    });

    // Construir jerarquía
    Array.from(categoryMap.keys()).sort().forEach(category => {
      const products = Array.from(categoryMap.get(category)!).sort().map(product => {
        const productKey = `${category}::${product}`;
        const varieties = Array.from(productVarietyMap.get(productKey) || []).sort();
        return { product, varieties };
      });
      hierarchy.push({ category, products });
    });

    return hierarchy;
  });

  // Mantener los computed originals para compatibilidad
  categories = computed(() => {
    const cats = this.allArticles()
      .map(a => a.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)].sort();
  });

  products = computed(() => {
    const prods = this.allArticles()
      .map(a => a.product)
      .filter((p): p is string => !!p);
    return [...new Set(prods)].sort();
  });

  varieties = computed(() => {
    const vars = this.allArticles()
      .map(a => a.variety)
      .filter((v): v is string => !!v);
    return [...new Set(vars)].sort();
  });

  // Computed signal per filtrar articles per cerca i filtres
  articles = computed(() => {
    let filtered = this.allArticles();

    // Filtre per cerca
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(article =>
        article.name?.toLowerCase().includes(search) ||
        article.product?.toLowerCase().includes(search) ||
        article.variety?.toLowerCase().includes(search) ||
        article.description?.toLowerCase().includes(search) ||
        article.producerName?.toLowerCase().includes(search) ||
        article.category?.toLowerCase().includes(search)
      );
    }

    // Filtre per categories
    const categories = this.selectedCategories();
    if (categories.length > 0) {
      filtered = filtered.filter(article => article.category && categories.includes(article.category));
    }

    // Filtre per productes
    const products = this.selectedProducts();
    if (products.length > 0) {
      filtered = filtered.filter(article => article.product && products.includes(article.product));
    }

    // Filtre per varietats
    const varieties = this.selectedVarieties();
    if (varieties.length > 0) {
      filtered = filtered.filter(article => article.variety && varieties.includes(article.variety));
    }

    // Filtre per temporada
    if (this.showSeasonalOnly()) {
      filtered = filtered.filter(article => article.isSeasonal);
    }

    return filtered;
  });

  constructor(
    private showcaseService: ShowcaseService,
    private consumerGroupService: ConsumerGroupService,
    private cartService: CartService,
    private toastController: ToastController,
    private alertController: AlertController,
    private translate: TranslateService
  ) {
    addIcons({ addOutline, leafOutline, storefrontOutline, locationOutline, personOutline, businessOutline, closeCircleOutline, funnelOutline, closeOutline, checkmarkOutline, closeCircle, close, cartOutline, removeOutline });
  }

  ngOnInit() {
    // Esperar a que el servicio se inicialice y luego cargar artículos
    this.waitForGroupAndLoad();
  }

  private async waitForGroupAndLoad() {
    this.isLoading.set(true);

    // Esperar hasta que haya un grupo o hayan pasado 5 segundos
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos (50 * 100ms)

    while (!this.consumerGroupService.currentGroup() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    this.loadArticles();
  }

  loadArticles() {
    this.isLoading.set(true);
    const currentGroup = this.consumerGroupService.currentGroup();
    console.log('currentGroup:', currentGroup);
    if (!currentGroup?.id) {
      console.warn('No hay grupo seleccionado después de esperar');
      this.isLoading.set(false);
      return;
    }

    this.showcaseService.getShowcaseArticles(currentGroup.id).subscribe({
      next: (articles) => {
        console.log('Articles:', articles);
        this.allArticles.set(articles);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading showcase articles:', error);
        this.isLoading.set(false);
      }
    });
  }

  handleRefresh(event: any) {
    this.loadArticles();
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  onSearchChange(event: any) {
    this.searchText.set(event.target.value || '');
  }

  toggleCategory(category: string) {
    const current = this.selectedCategories();
    if (current.includes(category)) {
      this.selectedCategories.set(current.filter(c => c !== category));
    } else {
      this.selectedCategories.set([...current, category]);
    }
  }

  toggleProduct(product: string) {
    const current = this.selectedProducts();
    if (current.includes(product)) {
      this.selectedProducts.set(current.filter(p => p !== product));
    } else {
      this.selectedProducts.set([...current, product]);
    }
  }

  toggleVariety(variety: string) {
    const current = this.selectedVarieties();
    if (current.includes(variety)) {
      this.selectedVarieties.set(current.filter(v => v !== variety));
    } else {
      this.selectedVarieties.set([...current, variety]);
    }
  }

  isSelectedCategory(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  isSelectedProduct(product: string): boolean {
    return this.selectedProducts().includes(product);
  }

  isSelectedVariety(variety: string): boolean {
    return this.selectedVarieties().includes(variety);
  }

  // Helper methods for accordion values
  getCategoryAccordionValues(): string[] {
    return this.filterHierarchy().map((_, i) => `category-${i}`);
  }

  getProductAccordionValues(categoryIndex: number): string[] {
    const categoryGroup = this.filterHierarchy()[categoryIndex];
    if (!categoryGroup) return [];
    return categoryGroup.products.map((_, j) => `product-${categoryIndex}-${j}`);
  }

  toggleSeasonalFilter() {
    this.showSeasonalOnly.set(!this.showSeasonalOnly());
  }

  openFiltersModal() {
    this.isFiltersModalOpen.set(true);
  }

  closeFiltersModal() {
    this.isFiltersModalOpen.set(false);
  }

  applyFilters() {
    this.closeFiltersModal();
  }

  clearFilters() {
    this.selectedCategories.set([]);
    this.selectedProducts.set([]);
    this.selectedVarieties.set([]);
    this.showSeasonalOnly.set(false);
    this.searchText.set('');
  }

  hasActiveFilters = computed(() => {
    return this.selectedCategories().length > 0 || this.selectedProducts().length > 0 || this.selectedVarieties().length > 0 || this.showSeasonalOnly() || !!this.searchText();
  });

  activeFiltersCount = computed(() => {
    return this.selectedCategories().length + this.selectedProducts().length + this.selectedVarieties().length + (this.showSeasonalOnly() ? 1 : 0);
  });

  addToCart(article: Article, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedArticle.set(article);
    this.modalQuantity.set(this.getQuantityStep());
    this.isAddToCartModalOpen.set(true);
  }

  closeAddToCartModal() {
    this.isAddToCartModalOpen.set(false);
    this.selectedArticle.set(null);
    this.modalQuantity.set(0);
  }

  getQuantityStep(): number {
    const article = this.selectedArticle();
    if (!article) return 1;
    return article.unitMeasure === 'kg' ? 0.5 : 1;
  }

  increaseQuantity() {
    this.modalQuantity.set(this.modalQuantity() + this.getQuantityStep());
  }

  decreaseQuantity() {
    const step = this.getQuantityStep();
    if (this.modalQuantity() > step) {
      this.modalQuantity.set(this.modalQuantity() - step);
    }
  }

  onModalQuantityChange(event: any) {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      this.modalQuantity.set(value);
    }
  }

  formatPrice(price: number | string, unit: string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0,00 €/' + unit;
    return `${numPrice.toFixed(2).replace('.', ',')} €/${unit}`;
  }

  formatTotalPrice(): string {
    const article = this.selectedArticle();
    if (!article) return '0,00 €';

    const price = typeof article.pricePerUnit === 'string' ? parseFloat(article.pricePerUnit) : article.pricePerUnit;
    const quantity = this.modalQuantity();

    if (isNaN(price)) return '0,00 €';

    const total = price * quantity;
    return `${total.toFixed(2).replace('.', ',')} €`;
  }

  async confirmAddToCart() {
    const article = this.selectedArticle();
    const quantity = this.modalQuantity();

    if (!article || quantity <= 0) return;

    // Check if article already exists in cart
    const existingItem = this.cartService.getItem(article.id);

    if (existingItem) {
      // Show alert asking if user wants to add more
      const alert = await this.alertController.create({
        header: this.translate.instant('SHOWCASE.ARTICLE_EXISTS_TITLE'),
        message: this.translate.instant('SHOWCASE.ARTICLE_EXISTS_MESSAGE', {
          quantity: existingItem.quantity,
          unit: article.unitMeasure
        }),
        buttons: [
          {
            text: this.translate.instant('COMMON.CANCEL'),
            role: 'cancel'
          },
          {
            text: this.translate.instant('SHOWCASE.ADD_MORE'),
            handler: async () => {
              await this.addToCartWithQuantity(article, existingItem.quantity + quantity);
            }
          }
        ]
      });

      await alert.present();
    } else {
      // Article doesn't exist, add it directly
      await this.addToCartWithQuantity(article, quantity);
    }
  }

  private async addToCartWithQuantity(article: Article, quantity: number) {
    try {
      await this.cartService.addItem(article, quantity);
      this.closeAddToCartModal();
      await this.showToast(this.translate.instant('SHOWCASE.ADDED_TO_CART'), 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      await this.showToast(this.translate.instant('COMMON.ERROR'), 'danger');
    }
  }

  async onAddToCart(quantity: number) {
    const article = this.selectedArticle();
    if (!article) return;

    try {
      await this.cartService.addItem(article, quantity);
      this.closeAddToCartModal();
      await this.showToast(this.translate.instant('SHOWCASE.ADDED_TO_CART'), 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      await this.showToast(this.translate.instant('COMMON.ERROR'), 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}

