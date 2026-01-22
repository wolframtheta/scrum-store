export enum UnitMeasure {
  G = 'g',
  KG = 'kg',
  ML = 'ml',
  CL = 'cl',
  L = 'l',
  UNIT = 'unit',
  MANAT = 'manat',
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
  taxRate?: number; // % d'IVA
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
  // Opciones de personalización
  customizationOptions?: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  title: string;
  type: 'boolean' | 'numeric' | 'string' | 'select' | 'multiselect';
  required?: boolean;
  price?: number; // Preu addicional quan s'activa/selecciona aquesta opció
  values?: CustomizationOptionValue[];
}

export interface CustomizationOptionValue {
  id: string;
  label: string;
  price?: number; // Preu addicional per aquest valor específic (per select/multiselect)
}

export interface SelectedOption {
  optionId: string;
  title: string;
  type: 'boolean' | 'numeric' | 'string' | 'select' | 'multiselect';
  value: boolean | number | string | string[];
  price?: number; // Preu addicional d'aquesta opció seleccionada
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
  selectedOptions?: SelectedOption[];
}

