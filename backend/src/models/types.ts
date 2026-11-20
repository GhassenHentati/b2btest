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
// ──────────────────────────────────────────────────────────────────────────
// Invoicing (Zoho-Invoice-style module): estimates → invoices → payments
// ──────────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  productId: string | null;
  name: string;
  description?: string;
  unitLabel: string;
  unitPrice: number;
  qty: number;
  discountPercent: number;
  taxRate: number;
  taxLabel: string;
  // computed
  lineBase: number;
  lineDiscountAmount: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface InvoiceDiscount {
  type: 'percent' | 'fixed';
  value: number;
}

export interface TaxBreakdownLine {
  label: string;
  rate: number;
  base: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxBreakdown: TaxBreakdownLine[];
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
}

export interface Payment {
  id: string;
  date: Date | string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  reference?: string;
  note?: string;
  createdAt: Date;
}

export interface ClientSnapshot {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface Invoice extends InvoiceTotals {
  id: string;
  number: string;
  type: 'invoice';
  clientId: string;
  clientSnapshot: ClientSnapshot;
  orderId?: string | null;
  estimateId?: string | null;
  status: InvoiceStatus;
  issueDate: Date | string;
  dueDate: Date | string;
  currency: string;
  items: InvoiceItem[];
  discount?: InvoiceDiscount;
  payments: Payment[];
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'invoiced';

export interface Estimate extends InvoiceTotals {
  id: string;
  number: string;
  type: 'estimate';
  clientId: string;
  clientSnapshot: ClientSnapshot;
  status: EstimateStatus;
  issueDate: Date | string;
  expiryDate: Date | string;
  currency: string;
  items: InvoiceItem[];
  discount?: InvoiceDiscount;
  convertedInvoiceId?: string | null;
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceSettings {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  taxId?: string; // VAT / matricule fiscal
  logoUrl?: string;
  currency: string;
  invoicePrefix: string;
  estimatePrefix: string;
  numberPadding: number;
  defaultDueDays: number;
  defaultTaxRate: number;
  defaultTaxLabel: string;
  defaultNotes?: string;
  defaultTerms?: string;
  updatedAt: Date;
}
