import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoicesListComponent } from './list/invoices-list.component';
import { InvoiceFormComponent } from './form/invoice-form.component';
import { InvoiceDetailComponent } from './detail/invoice-detail.component';
import { InvoiceSettingsComponent } from './settings/invoice-settings.component';

const routes: Routes = [
  { path: '', component: InvoicesListComponent },
  { path: 'new', component: InvoiceFormComponent },
  { path: 'settings', component: InvoiceSettingsComponent },
  { path: ':id', component: InvoiceDetailComponent },
  { path: ':id/edit', component: InvoiceFormComponent },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class InvoicesRoutingModule {}
