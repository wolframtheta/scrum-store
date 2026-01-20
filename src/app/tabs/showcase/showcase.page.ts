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
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
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
  IonText,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline, leafOutline, storefrontOutline, locationOutline, personOutline, businessOutline, closeCircleOutline, funnelOutline, closeOutline, checkmarkOutline, closeCircle, close, cartOutline, removeOutline, timeOutline, calendarOutline } from 'ionicons/icons';
import { ShowcaseService } from '../../core/services/showcase.service';
import { ConsumerGroupService } from '../../core/services/consumer-group.service';
import { CartService } from '../../core/services/cart.service';
import { ShowcasePeriod, ShowcaseArticleItem } from '../../core/models/order-period.model';

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
  allPeriods = signal<ShowcasePeriod[]>([]);
  isFiltersModalOpen = signal(false);
  isAddToCartModalOpen = signal(false);
  selectedArticle = signal<ShowcaseArticleItem | null>(null);
  selectedPeriodId = signal<string | null>(null);
  modalQuantity = signal(0);

  // Filtres
  selectedCategories = signal<string[]>([]);
  selectedProducts = signal<string[]>([]);
  selectedVarieties = signal<string[]>([]);
  selectedProducers = signal<string[]>([]);
  selectedSuppliers = signal<string[]>([]);
  showEcoOnly = signal<boolean>(false);

  // Computed: obtenir tots els articles de tots els períodes
  allArticles = computed(() => {
    return this.allPeriods().flatMap((period: ShowcasePeriod) =>
      period.articles.map((article: ShowcaseArticleItem) => ({
        ...article,
        periodId: period.periodId,
        periodName: period.periodName
      }))
    );
  });

  // Computed: obtenir articles filtrats
  filteredArticles = computed(() => {
    return this.filteredPeriods().flatMap((period: ShowcasePeriod) =>
      period.articles.map((article: ShowcaseArticleItem) => ({
        ...article,
        periodId: period.periodId,
        periodName: period.periodName
      }))
    );
  });

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

    const categoryMap = new Map<string, Set<string>>();
    const productVarietyMap = new Map<string, Set<string>>();

    articles.forEach((article: ShowcaseArticleItem & { periodId?: string; periodName?: string }) => {
      const category = article.category || 'Sin categoría';
      const product = article.product || 'Sin producto';
      const variety = article.variety;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Set());
      }
      categoryMap.get(category)!.add(product);

      const productKey = `${category}::${product}`;
      if (!productVarietyMap.has(productKey)) {
        productVarietyMap.set(productKey, new Set());
      }
      if (variety) {
        productVarietyMap.get(productKey)!.add(variety);
      }
    });

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

  // Computed: obtenir llista única de productors
  uniqueProducers = computed(() => {
    const articles = this.allArticles();
    const producers = new Set<string>();
    articles.forEach((article: ShowcaseArticleItem) => {
      if (article.producerName) {
        producers.add(article.producerName);
      }
    });
    return Array.from(producers).sort();
  });

  // Computed: obtenir llista única de proveïdors (des dels articles)
  uniqueSuppliers = computed(() => {
    const articles = this.allArticles();
    const suppliers = new Set<string>();
    articles.forEach((article: ShowcaseArticleItem & { supplierName?: string }) => {
      if (article.supplierName) {
        suppliers.add(article.supplierName);
      }
    });
    return Array.from(suppliers).sort();
  });

  // Computed: filtrar períodes per cerca i filtres
  filteredPeriods = computed(() => {
    let periods = this.allPeriods();
    const search = this.searchText().toLowerCase().trim();

    if (!search && this.selectedCategories().length === 0 &&
        this.selectedProducts().length === 0 && this.selectedVarieties().length === 0 &&
        this.selectedProducers().length === 0 && this.selectedSuppliers().length === 0 &&
        !this.showEcoOnly()) {
      return periods;
    }

    return periods.map(period => {
      let articles = period.articles;

      // Filtre per cerca
      if (search) {
        articles = articles.filter((article: ShowcaseArticleItem) =>
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
        articles = articles.filter((article: ShowcaseArticleItem) => article.category && categories.includes(article.category));
      }

      // Filtre per productes
      const products = this.selectedProducts();
      if (products.length > 0) {
        articles = articles.filter((article: ShowcaseArticleItem) => article.product && products.includes(article.product));
      }

      // Filtre per varietats
      const varieties = this.selectedVarieties();
      if (varieties.length > 0) {
        articles = articles.filter((article: ShowcaseArticleItem) => article.variety && varieties.includes(article.variety));
      }

      // Filtre per productors
      const producers = this.selectedProducers();
      if (producers.length > 0) {
        articles = articles.filter((article: ShowcaseArticleItem) => article.producerName && producers.includes(article.producerName));
      }

      // Filtre per proveïdors
      const suppliers = this.selectedSuppliers();
      if (suppliers.length > 0) {
        articles = articles.filter((article: ShowcaseArticleItem & { supplierName?: string }) => 
          article.supplierName && suppliers.includes(article.supplierName)
        );
      }

      // Filtre per ecològic
      if (this.showEcoOnly()) {
        articles = articles.filter((article: ShowcaseArticleItem) => article.isEco === true);
      }

      return { ...period, articles };
    }).filter(period => period.articles.length > 0);
  });

  constructor(
    private showcaseService: ShowcaseService,
    private consumerGroupService: ConsumerGroupService,
    private cartService: CartService,
    private toastController: ToastController,
    private alertController: AlertController,
    private translate: TranslateService
  ) {
    addIcons({ addOutline, leafOutline, storefrontOutline, locationOutline, personOutline, businessOutline, closeCircleOutline, funnelOutline, closeOutline, checkmarkOutline, closeCircle, close, cartOutline, removeOutline, timeOutline, calendarOutline });
  }

  ngOnInit() {
    this.waitForGroupAndLoad();
  }

  private async waitForGroupAndLoad() {
    this.isLoading.set(true);

    let attempts = 0;
    const maxAttempts = 50;

    while (!this.consumerGroupService.currentGroup() && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    this.loadPeriods();
  }

  loadPeriods() {
    this.isLoading.set(true);
    const currentGroup = this.consumerGroupService.currentGroup();
    console.log('currentGroup:', currentGroup);
    if (!currentGroup?.id) {
      console.warn('No hay grupo seleccionado después de esperar');
      this.isLoading.set(false);
      return;
    }

    this.showcaseService.getShowcasePeriods(currentGroup.id).subscribe({
      next: (periods: ShowcasePeriod[]) => {
        console.log('[Showcase] Received periods:', periods);
        console.log('[Showcase] Total periods:', periods.length);
        console.log('[Showcase] Total articles:', periods.reduce((sum, p) => sum + (p.articles?.length || 0), 0));
        this.allPeriods.set(periods);
        console.log('[Showcase] allArticles computed:', this.allArticles().length);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('[Showcase] Error loading showcase periods:', error);
        this.isLoading.set(false);
      }
    });
  }

  handleRefresh(event: CustomEvent) {
    this.loadPeriods();
    setTimeout(() => {
      (event.target as any).complete();
    }, 500);
  }

  onSearchChange(event: CustomEvent) {
    this.searchText.set((event.target as HTMLIonSearchbarElement).value || '');
  }

  // Filtres
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

  toggleProducer(producer: string) {
    const current = this.selectedProducers();
    if (current.includes(producer)) {
      this.selectedProducers.set(current.filter(p => p !== producer));
    } else {
      this.selectedProducers.set([...current, producer]);
    }
  }

  toggleSupplier(supplier: string) {
    const current = this.selectedSuppliers();
    if (current.includes(supplier)) {
      this.selectedSuppliers.set(current.filter(s => s !== supplier));
    } else {
      this.selectedSuppliers.set([...current, supplier]);
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

  isSelectedProducer(producer: string): boolean {
    return this.selectedProducers().includes(producer);
  }

  isSelectedSupplier(supplier: string): boolean {
    return this.selectedSuppliers().includes(supplier);
  }

  getCategoryAccordionValues(): string[] {
    return this.filterHierarchy().map((_, i) => `category-${i}`);
  }

  getProductAccordionValues(categoryIndex: number): string[] {
    const categoryGroup = this.filterHierarchy()[categoryIndex];
    if (!categoryGroup) return [];
    return categoryGroup.products.map((_, j) => `product-${categoryIndex}-${j}`);
  }

  toggleEcoFilter() {
    this.showEcoOnly.set(!this.showEcoOnly());
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
    this.selectedProducers.set([]);
    this.selectedSuppliers.set([]);
    this.showEcoOnly.set(false);
    this.searchText.set('');
  }

  hasActiveFilters = computed(() => {
    return this.selectedCategories().length > 0 || this.selectedProducts().length > 0 || this.selectedVarieties().length > 0 || 
           this.selectedProducers().length > 0 || this.selectedSuppliers().length > 0 || this.showEcoOnly() || !!this.searchText();
  });

  activeFiltersCount = computed(() => {
    return this.selectedCategories().length + this.selectedProducts().length + this.selectedVarieties().length + 
           this.selectedProducers().length + this.selectedSuppliers().length + (this.showEcoOnly() ? 1 : 0);
  });

  // Carreto
  addToCart(article: ShowcaseArticleItem, periodId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedArticle.set(article);
    this.selectedPeriodId.set(periodId);
    this.modalQuantity.set(this.getQuantityStep());
    this.isAddToCartModalOpen.set(true);
  }

  closeAddToCartModal() {
    this.isAddToCartModalOpen.set(false);
    this.selectedArticle.set(null);
    this.selectedPeriodId.set(null);
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

  onModalQuantityChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value) && value >= 0) {
      this.modalQuantity.set(value);
    }
  }

  async confirmAddToCart() {
    const article = this.selectedArticle();
    const periodId = this.selectedPeriodId();
    const quantity = this.modalQuantity();

    if (!article || !periodId || quantity <= 0) return;

    const existingItem = this.cartService.getItem(article.articleId);

    if (existingItem) {
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
              await this.addToCartWithQuantity(article, periodId, existingItem.quantity + quantity);
            }
          }
        ]
      });

      await alert.present();
    } else {
      await this.addToCartWithQuantity(article, periodId, quantity);
    }
  }

  private async addToCartWithQuantity(article: ShowcaseArticleItem, periodId: string, quantity: number) {
    try {
      // Convertir ShowcaseArticleItem a formato Article para el cart
      const cartArticle = {
        id: article.articleId,
        product: article.product,
        variety: article.variety,
        category: article.category,
        pricePerUnit: article.pricePerUnit,
        taxRate: article.taxRate,
        unitMeasure: article.unitMeasure,
        image: article.image,
        producerName: article.producerName,
        isEco: article.isEco,
        isSeasonal: article.isSeasonal,
        description: article.description,
        city: article.city,
        orderPeriodId: periodId
      } as any;

      await this.cartService.addItem(cartArticle, quantity);
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
      position: 'top',
      color
    });
    await toast.present();
  }

  formatPrice(price: number | string, unit?: string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return unit ? '0,00 €/' + unit : '0,00 €';
    }
    if (unit) {
      return `${numPrice.toFixed(2).replace('.', ',')} €/${unit}`;
    }
    return `${numPrice.toFixed(2).replace('.', ',')} €`;
  }

  formatTotalPrice(): string {
    const article = this.selectedArticle();
    if (!article) return '0,00 €';

    const price = article.pricePerUnit;
    const quantity = this.modalQuantity();
    const taxRate = article.taxRate || 0;

    const totalWithoutTax = price * quantity;
    const taxAmount = totalWithoutTax * (taxRate / 100);
    const totalWithTax = totalWithoutTax + taxAmount;

    if (taxRate > 0) {
      return `${totalWithTax.toFixed(2).replace('.', ',')} € (${totalWithoutTax.toFixed(2).replace('.', ',')} € + ${taxAmount.toFixed(2).replace('.', ',')} € IVA)`;
    }
    return `${totalWithTax.toFixed(2).replace('.', ',')} €`;
  }

  getTotalWithoutTax(): number {
    const article = this.selectedArticle();
    if (!article) return 0;
    return article.pricePerUnit * this.modalQuantity();
  }

  getTaxAmount(): number {
    const article = this.selectedArticle();
    if (!article || !article.taxRate) return 0;
    const totalWithoutTax = this.getTotalWithoutTax();
    return totalWithoutTax * (article.taxRate / 100);
  }

  getTotalWithTax(): number {
    const article = this.selectedArticle();
    if (!article) return 0;
    return this.getTotalWithoutTax() + this.getTaxAmount();
  }

  // Helpers per dates
  getTimeRemaining(endDate: Date | string): string {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Cerrado';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
