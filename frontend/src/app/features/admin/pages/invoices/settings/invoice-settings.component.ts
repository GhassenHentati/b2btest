import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { InvoiceService } from 'src/app/core/services/invoice.service';

@Component({
  selector: 'app-invoice-settings',
  templateUrl: './invoice-settings.component.html',
  styleUrls: ['./invoice-settings.component.scss'],
})
export class InvoiceSettingsComponent implements OnInit {
  s: any = {};
  saving = false;

  constructor(private svc: InvoiceService, private toastCtrl: ToastController) {}

  ngOnInit(): void { this.svc.getSettings().subscribe((r) => (this.s = r)); }

  save(): void {
    this.saving = true;
    this.svc.saveSettings(this.s).subscribe({
      next: async (r) => {
        this.s = r; this.saving = false;
        (await this.toastCtrl.create({ message: 'Paramètres enregistrés', duration: 1500 })).present();
      },
      error: () => (this.saving = false),
    });
  }
}
