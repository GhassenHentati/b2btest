export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  location?: {
    city: string;
    township: string;
    postalCode: string;
    fullAddressText: string;
  };
  deliveryDay: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  unitLabel: string;
  price: number;
  tax: {
    label: string;
    rate: number;
  };
  imageUrl?: string;
  promo?: {
    rate: number;
    from: Date;
    to: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  nameSnapshot: string;
  unitLabelSnapshot: string;
  priceSnapshot: number;
  taxSnapshot: {
    label: string;
    rate: number;
  };
  qty: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  clientId: string;
  status: 'submitted' | 'confirmed' | 'shipped' | 'cancelled';
  items: OrderItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomeConfig {
  slider: Array<{
    imageUrl: string;
    title?: string;
    subtitle?: string;
    linkType?: 'product' | 'category' | 'none';
    linkId?: string;
  }>;
  updatedAt: Date;
}