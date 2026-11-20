import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InvoiceService, Invoice } from 'src/app/core/services/invoice.service';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss'],
})
export class InvoicesListComponent implements OnInit {
  segment: 'invoices' | 'estimates' = 'invoices';
  invoices: Invoice[] = [];
  estimates: any[] = [];
  statusFilter = '';
  loading = false;

  readonly invoiceStatuses = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];
  readonly statusLabels: Record<string, string> = {
    draft: 'Brouillon', sent: 'Envoyée', partially_paid: 'Part. payée',
    paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée',
    accepted: 'Acceptée', declined: 'Refusée', expired: 'Expirée', invoiced: 'Facturée',
  };

  constructor(private svc: InvoiceService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    if (this.segment === 'invoices') {
      this.svc.list(this.statusFilter ? { status: this.statusFilter } : undefined)
        .subscribe({ next: (r) => { this.invoices = r; this.loading = false; }, error: () => (this.loading = false) });
    } else {
      this.svc.listEstimates()
        .subscribe({ next: (r) => { this.estimates = r; this.loading = false; }, error: () => (this.loading = false) });
    }
  }

  onSegment(): void { this.statusFilter = ''; this.load(); }

  open(id: string): void { this.router.navigate(['/admin/invoices', id]); }
  create(): void { this.router.navigate(['/admin/invoices/new']); }
  settings(): void { this.router.navigate(['/admin/invoices/settings']); }

  convertEstimate(e: any, ev: Event): void {
    ev.stopPropagation();
    this.svc.convertEstimate(e.id).subscribe(() => this.load());
  }

  money(n: number, cur = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur || 'EUR' }).format(n || 0);
  }

  get totalOutstanding(): number {
    return this.invoices
      .filter((i) => ['sent', 'partially_paid', 'overdue'].includes(i.status))
      .reduce((s, i) => s + (i.amountDue || 0), 0);
  }
}
