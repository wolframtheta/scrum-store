export enum UnitMeasure {
  G = 'g',
  KG = 'kg',
  ML = 'ml',
  CL = 'cl',
  L = 'l',
  UNIT = 'unit',
}

export interface Article {
  id: string;
  name: string;
  category?: string;
  product?: string;
  variety?: string;
  description?: string;
  image?: string;
  unitMeasure: UnitMeasure;
  pricePerUnit: number;
  city?: string;
  producerId?: string;
  producerName?: string;
  supplierName?: string;
  consumerGroupId: string;
  inShowcase: boolean;
  isSeasonal: boolean;
  isEco?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Campos adicionales para el aparador
  maxQuantity?: number;
  orderedQuantity?: number;
}

export interface ConsumerGroup {
  id: string;
  email?: string;
  name: string;
  description?: string;
  city: string;
  address?: string;
  image?: string;
  openingSchedule?: OpeningHours;
  createdAt?: Date;
  updatedAt?: Date;
  role?: {
    isClient: boolean;
    isManager: boolean;
    isDefault: boolean;
  };
}

export interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

export interface CartItem {
  article: Article;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

