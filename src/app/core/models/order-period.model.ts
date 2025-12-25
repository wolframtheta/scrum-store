export interface ShowcaseArticleItem {
  id: string;
  articleId: string;
  product: string;
  variety?: string;
  category?: string;
  pricePerUnit: number;
  unitMeasure: string;
  image?: string;
  producerName?: string;
  isAvailable: boolean;
  isEco?: boolean;
  isSeasonal: boolean;
  description?: string;
  city?: string;
}

export interface ShowcasePeriod {
  periodId: string;
  periodName: string;
  deliveryDate: Date | string;
  startDate: Date | string;
  endDate: Date | string;
  status: 'open' | 'closed' | 'processing' | 'delivered';
  articles: ShowcaseArticleItem[];
}

