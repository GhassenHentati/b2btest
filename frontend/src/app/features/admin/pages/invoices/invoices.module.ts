import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { InvoicesRoutingModule } from './invoices-routing.module';
import { InvoicesListComponent } from './list/invoices-list.component';
import { InvoiceFormComponent } from './form/invoice-form.component';
import { InvoiceDetailComponent } from './detail/invoice-detail.component';
import { InvoiceSettingsComponent } from './settings/invoice-settings.component';

@NgModule({
  declarations: [
    InvoicesListComponent,
    InvoiceFormComponent,
    InvoiceDetailComponent,
    InvoiceSettingsComponent,
  ],
  imports: [CommonModule, FormsModule, IonicModule, InvoicesRoutingModule],
})
export class InvoicesModule {}
