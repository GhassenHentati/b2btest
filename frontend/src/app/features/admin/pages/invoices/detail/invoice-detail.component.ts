import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { InvoiceService, Invoice } from 'src/app/core/services/invoice.service';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss'],
})
export class InvoiceDetailComponent implements OnInit {
  inv?: Invoice;
  loading = true;
  readonly statusLabels: Record<string, string> = {
    draft: 'Brouillon', sent: 'Envoyée', partially_paid: 'Partiellement payée',
    paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée',
  };

  readonly methodLabels: Record<string, string> = {
    cash: 'Espèces', bank_transfer: 'Virement', card: 'Carte bancaire', cheque: 'Chèque', other: 'Autre',
  };

  constructor(
    private svc: InvoiceService, private route: ActivatedRoute, private router: Router,
    private alertCtrl: AlertController, private toastCtrl: ToastController
  ) {}

  ngOnInit(): void { this.reload(); }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.svc.get(id).subscribe({ next: (i) => { this.inv = i; this.loading = false; }, error: () => (this.loading = false) });
  }

  money(n: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: this.inv?.currency || 'EUR' }).format(n || 0);
  }

  async toast(msg: string) {
    (await this.toastCtrl.create({ message: msg, duration: 1800, position: 'bottom' })).present();
  }

  edit(): void { this.router.navigate(['/admin/invoices', this.inv!.id, 'edit']); }
  openPdf(): void { window.open(this.svc.pdfUrl(this.inv!.id), '_blank'); }

  markSent(): void { this.svc.setStatus(this.inv!.id, 'sent').subscribe(() => { this.toast('Facture marquée envoyée'); this.reload(); }); }

  async cancel(): Promise<void> {
    const a = await this.alertCtrl.create({
      header: 'Annuler la facture ?', message: 'Cette action est irréversible.',
      buttons: [{ text: 'Non', role: 'cancel' }, {
        text: 'Annuler la facture', role: 'destructive',
        handler: () => this.svc.setStatus(this.inv!.id, 'cancelled').subscribe(() => { this.toast('Facture annulée'); this.reload(); }),
      }],
    });
    a.present();
  }

  async recordPayment(): Promise<void> {
    const a = await this.alertCtrl.create({
      header: 'Enregistrer un paiement',
      inputs: [
        { name: 'amount', type: 'number', placeholder: 'Montant', value: this.inv?.amountDue },
        { name: 'reference', type: 'text', placeholder: 'Référence (optionnel)' },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Enregistrer', handler: (d) => {
            if (!d.amount || Number(d.amount) <= 0) return false;
            this.svc.addPayment(this.inv!.id, { amount: Number(d.amount), method: 'bank_transfer', reference: d.reference })
              .subscribe(() => { this.toast('Paiement enregistré'); this.reload(); });
            return true;
          } },
      ],
    });
    a.present();
  }

  deletePayment(pid: string): void {
    this.svc.deletePayment(this.inv!.id, pid).subscribe(() => { this.toast('Paiement supprimé'); this.reload(); });
  }
}
