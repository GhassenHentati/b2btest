import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService, InvoiceItem } from 'src/app/core/services/invoice.service';

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.scss'],
})
export class InvoiceFormComponent implements OnInit {
  id: string | null = null;
  clients: any[] = [];
  products: any[] = [];
  settings: any = { currency: 'EUR', defaultTaxRate: 20, defaultDueDays: 30 };

  clientId = '';
  issueDate = new Date().toISOString().substring(0, 10);
  dueDate = '';
  items: InvoiceItem[] = [];
  discount = { type: 'percent' as 'percent' | 'fixed', value: 0 };
  notes = '';
  terms = '';
  saving = false;

  constructor(private svc: InvoiceService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.svc.clients().subscribe((c) => (this.clients = c));
    this.svc.products().subscribe((p) => (this.products = p));
    this.svc.getSettings().subscribe((s) => {
      this.settings = s;
      this.notes = this.notes || s.defaultNotes || '';
      this.terms = this.terms || s.defaultTerms || '';
      if (!this.dueDate) this.computeDueDate();
    });

    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.svc.get(this.id).subscribe((inv) => {
        this.clientId = inv.clientId;
        this.issueDate = (inv.issueDate || '').substring(0, 10);
        this.dueDate = (inv.dueDate || '').substring(0, 10);
        this.items = inv.items.map((i) => ({ ...i }));
        this.discount = inv.discount || { type: 'percent', value: 0 };
        this.notes = inv.notes || '';
        this.terms = inv.terms || '';
      });
    } else {
      this.addItem();
    }
  }

  computeDueDate(): void {
    const d = new Date(this.issueDate);
    d.setDate(d.getDate() + (Number(this.settings.defaultDueDays) || 30));
    this.dueDate = d.toISOString().substring(0, 10);
  }

  addItem(): void {
    this.items.push({
      name: '', unitLabel: 'u', unitPrice: 0, qty: 1,
      discountPercent: 0, taxRate: Number(this.settings.defaultTaxRate) || 0,
    });
  }
  removeItem(i: number): void { this.items.splice(i, 1); }

  onProduct(item: InvoiceItem, productId: string): void {
    const p = this.products.find((x) => x.id === productId);
    if (!p) return;
    item.name = p.name;
    item.unitLabel = p.unitLabel || 'u';
    item.unitPrice = p.price || 0;
    item.taxRate = p.tax?.rate ?? item.taxRate;
    item.taxLabel = p.tax?.label;
  }

  lineTotal(it: InvoiceItem): number {
    const base = (it.unitPrice || 0) * (it.qty || 0);
    const sub = base - base * ((it.discountPercent || 0) / 100);
    return sub + sub * ((it.taxRate || 0) / 100);
  }
  get subtotal(): number {
    return this.items.reduce((s, it) => {
      const base = (it.unitPrice || 0) * (it.qty || 0);
      return s + (base - base * ((it.discountPercent || 0) / 100));
    }, 0);
  }
  get discountAmount(): number {
    if (!this.discount.value) return 0;
    return this.discount.type === 'percent'
      ? this.subtotal * (this.discount.value / 100)
      : Math.min(this.discount.value, this.subtotal);
  }
  get taxTotal(): number {
    const factor = this.subtotal > 0 ? (this.subtotal - this.discountAmount) / this.subtotal : 1;
    return this.items.reduce((s, it) => {
      const base = (it.unitPrice || 0) * (it.qty || 0);
      const sub = (base - base * ((it.discountPercent || 0) / 100)) * factor;
      return s + sub * ((it.taxRate || 0) / 100);
    }, 0);
  }
  get total(): number { return this.subtotal - this.discountAmount + this.taxTotal; }

  money(n: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: this.settings.currency || 'EUR' }).format(n || 0);
  }

  private payload(status?: string): any {
    return {
      clientId: this.clientId, issueDate: this.issueDate, dueDate: this.dueDate,
      items: this.items, discount: this.discount.value ? this.discount : null,
      notes: this.notes, terms: this.terms, ...(status ? { status } : {}),
    };
  }

  valid(): boolean {
    return !!this.clientId && this.items.length > 0 && this.items.every((i) => i.name && i.qty > 0);
  }

  save(status?: string): void {
    if (!this.valid() || this.saving) return;
    this.saving = true;
    const done = (inv: any) => { this.saving = false; this.router.navigate(['/admin/invoices', inv.id]); };
    const fail = () => (this.saving = false);
    if (this.id) {
      this.svc.update(this.id, this.payload()).subscribe({
        next: (inv) => {
          if (status === 'sent') this.svc.setStatus(inv.id, 'sent').subscribe({ next: done, error: fail });
          else done(inv);
        }, error: fail,
      });
    } else {
      this.svc.create(this.payload(status)).subscribe({ next: done, error: fail });
    }
  }
}
