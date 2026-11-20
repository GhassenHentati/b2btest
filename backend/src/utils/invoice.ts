// Invoice/estimate financial engine — totals, tax breakdown, numbering.
// Reconstructed from the Zoho Invoice domain model (clients, line items,
// line + document discounts, multi-rate tax/VAT, partial payments).

import { getFirestore } from '../config/firebase';
import {
  InvoiceItem,
  InvoiceDiscount,
  TaxBreakdownLine,
  InvoiceTotals,
  Payment,
} from '../models/types';

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Normalise one raw line into a fully-computed InvoiceItem. */
export const computeLine = (raw: Partial<InvoiceItem>): InvoiceItem => {
  const unitPrice = Number(raw.unitPrice) || 0;
  const qty = Number(raw.qty) || 0;
  const discountPercent = Math.min(Math.max(Number(raw.discountPercent) || 0, 0), 100);
  const taxRate = Number(raw.taxRate) || 0;

  const lineBase = round2(unitPrice * qty);
  const lineDiscountAmount = round2(lineBase * (discountPercent / 100));
  const lineSubtotal = round2(lineBase - lineDiscountAmount);
  const lineTax = round2(lineSubtotal * (taxRate / 100));
  const lineTotal = round2(lineSubtotal + lineTax);

  return {
    productId: raw.productId || null,
    name: raw.name || '',
    description: raw.description || '',
    unitLabel: raw.unitLabel || '',
    unitPrice,
    qty,
    discountPercent,
    taxRate,
    taxLabel: raw.taxLabel || (taxRate ? `TVA ${taxRate}%` : 'Exonéré'),
    lineBase,
    lineDiscountAmount,
    lineSubtotal,
    lineTax,
    lineTotal,
  };
};

/**
 * Compute document totals. A document-level discount is applied to the
 * post-line-discount subtotal and spread proportionally across lines so the
 * tax breakdown stays exact.
 */
export const computeTotals = (
  rawItems: Partial<InvoiceItem>[],
  discount?: InvoiceDiscount,
  payments: Payment[] = []
): { items: InvoiceItem[] } & InvoiceTotals => {
  const items = (rawItems || []).map(computeLine);
  const subtotal = round2(items.reduce((s, it) => s + it.lineSubtotal, 0));

  let discountAmount = 0;
  if (discount && discount.value > 0 && subtotal > 0) {
    discountAmount =
      discount.type === 'percent'
        ? round2(subtotal * (Math.min(discount.value, 100) / 100))
        : round2(Math.min(discount.value, subtotal));
  }
  const discountFactor = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;

  // Group tax by label+rate on the discounted base.
  const groups = new Map<string, TaxBreakdownLine>();
  for (const it of items) {
    if (!it.taxRate) continue;
    const base = round2(it.lineSubtotal * discountFactor);
    const amount = round2(base * (it.taxRate / 100));
    const key = `${it.taxLabel}|${it.taxRate}`;
    const g = groups.get(key);
    if (g) {
      g.base = round2(g.base + base);
      g.amount = round2(g.amount + amount);
    } else {
      groups.set(key, { label: it.taxLabel, rate: it.taxRate, base, amount });
    }
  }
  const taxBreakdown = Array.from(groups.values());
  const taxTotal = round2(taxBreakdown.reduce((s, g) => s + g.amount, 0));
  const total = round2(subtotal - discountAmount + taxTotal);
  const amountPaid = round2((payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0));
  const amountDue = round2(total - amountPaid);

  return {
    items,
    subtotal,
    discountAmount,
    taxBreakdown,
    taxTotal,
    total,
    amountPaid,
    amountDue,
  };
};

/** Derive the effective invoice status (overdue is virtual, computed on read). */
export const deriveInvoiceStatus = (
  stored: string,
  amountDue: number,
  amountPaid: number,
  dueDate?: Date | string | null
): string => {
  if (stored === 'cancelled' || stored === 'draft') return stored;
  if (amountDue <= 0 && amountPaid > 0) return 'paid';
  if (amountPaid > 0 && amountDue > 0) return 'partially_paid';
  if (dueDate) {
    const due = new Date(dueDate);
    if (!isNaN(due.getTime()) && due.getTime() < Date.now()) return 'overdue';
  }
  return stored; // draft -> sent
};

/**
 * Atomically produce the next sequential number for a document kind
 * (e.g. "INV-000001" / "EST-000001"), honouring settings prefix + padding.
 */
export const nextNumber = async (
  kind: 'invoice' | 'estimate'
): Promise<string> => {
  const db = getFirestore();
  const settingsSnap = await db.collection('invoiceSettings').doc('default').get();
  const settings = settingsSnap.exists ? settingsSnap.data() || {} : {};
  const defaults = kind === 'invoice'
    ? { prefix: 'INV-', padding: 6 }
    : { prefix: 'EST-', padding: 6 };
  const prefix = (kind === 'invoice' ? settings.invoicePrefix : settings.estimatePrefix) || defaults.prefix;
  const padding = Number(settings.numberPadding) || defaults.padding;

  const counterRef = db.collection('counters').doc(kind);
  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists ? Number(snap.data()?.next) || 0 : 0;
    const value = current + 1;
    tx.set(counterRef, { next: value, updatedAt: new Date() }, { merge: true });
    return value;
  });

  return `${prefix}${String(next).padStart(padding, '0')}`;
};
