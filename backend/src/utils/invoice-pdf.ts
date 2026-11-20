// Self-contained printable invoice (browser "Print → Save as PDF").
import { InvoiceSettings } from '../models/types';

const esc = (s: any): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  partially_paid: 'Partiellement payée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  card: 'Carte bancaire',
  cheque: 'Chèque',
  other: 'Autre',
};

export const renderInvoiceHtml = (inv: any, settings: Partial<InvoiceSettings>): string => {
  const cur = inv.currency || settings.currency || 'EUR';
  const money = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(Number(n) || 0);
  const date = (d: any) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
  const c = inv.clientSnapshot || {};

  const rows = (inv.items || [])
    .map(
      (it: any) => `
      <tr>
        <td>
          <strong>${esc(it.name)}</strong>
          ${it.description ? `<div class="muted">${esc(it.description)}</div>` : ''}
        </td>
        <td class="r">${esc(it.qty)} ${esc(it.unitLabel)}</td>
        <td class="r">${money(it.unitPrice)}</td>
        <td class="r">${it.discountPercent ? it.discountPercent + '%' : '—'}</td>
        <td class="r">${it.taxRate ? it.taxRate + '%' : '—'}</td>
        <td class="r">${money(it.lineTotal)}</td>
      </tr>`
    )
    .join('');

  const taxRows = (inv.taxBreakdown || [])
    .map((t: any) => `<tr><td>${esc(t.label)}</td><td class="r">${money(t.amount)}</td></tr>`)
    .join('');

  const paymentRows = (inv.payments || [])
    .map(
      (p: any) =>
        `<tr><td>${date(p.date)}</td><td>${esc(METHOD_LABELS[p.method] || p.method)}</td><td>${esc(p.reference || '')}</td><td class="r">${money(p.amount)}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Facture ${esc(inv.number)}</title>
<style>
  :root { --ink:#1a2233; --muted:#6b7280; --line:#e5e7eb; --brand:#2563eb; }
  * { box-sizing:border-box; }
  body { font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:var(--ink); margin:0; padding:32px; background:#f4f6fb; }
  .sheet { max-width:820px; margin:0 auto; background:#fff; padding:40px; border-radius:12px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
  .head { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
  .brand { font-size:20px; font-weight:700; }
  h1 { font-size:28px; margin:0 0 4px; letter-spacing:.5px; }
  .muted { color:var(--muted); font-size:13px; }
  .pill { display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; background:#eef2ff; color:var(--brand); }
  .pill.paid { background:#ecfdf5; color:#059669; }
  .pill.overdue { background:#fef2f2; color:#dc2626; }
  .pill.cancelled { background:#f3f4f6; color:#6b7280; }
  .grid { display:flex; gap:40px; margin:28px 0; flex-wrap:wrap; }
  .grid > div { flex:1; min-width:200px; }
  .label { text-transform:uppercase; font-size:11px; letter-spacing:.8px; color:var(--muted); margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); border-bottom:2px solid var(--line); padding:10px 8px; }
  td { padding:10px 8px; border-bottom:1px solid var(--line); font-size:14px; vertical-align:top; }
  .r { text-align:right; }
  .totals { margin-left:auto; width:300px; margin-top:16px; }
  .totals td { border:none; padding:6px 8px; }
  .totals .grand td { border-top:2px solid var(--ink); font-size:18px; font-weight:700; padding-top:12px; }
  .totals .due td { color:#dc2626; font-weight:700; }
  .foot { margin-top:36px; font-size:13px; color:var(--muted); border-top:1px solid var(--line); padding-top:16px; white-space:pre-line; }
  @media print { body { background:#fff; padding:0; } .sheet { box-shadow:none; border-radius:0; } }
</style></head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">${esc(settings.companyName || 'B2B')}</div>
        <div class="muted">${esc(settings.companyAddress || '')}</div>
        <div class="muted">${esc(settings.companyEmail || '')} ${settings.companyPhone ? '· ' + esc(settings.companyPhone) : ''}</div>
        ${settings.taxId ? `<div class="muted">TVA / Matricule : ${esc(settings.taxId)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <h1>FACTURE</h1>
        <div class="muted">${esc(inv.number)}</div>
        <div style="margin-top:8px"><span class="pill ${esc(inv.status)}">${STATUS_LABELS[inv.status] || esc(inv.status)}</span></div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="label">Facturé à</div>
        <strong>${esc(c.companyName || c.name)}</strong>
        ${c.companyName && c.name ? `<div>${esc(c.name)}</div>` : ''}
        <div class="muted">${esc(c.address || '')}</div>
        <div class="muted">${esc(c.email || '')} ${c.phone ? '· ' + esc(c.phone) : ''}</div>
      </div>
      <div>
        <div class="label">Date d'émission</div><div>${date(inv.issueDate)}</div>
        <div class="label" style="margin-top:12px">Échéance</div><div>${date(inv.dueDate)}</div>
      </div>
    </div>

    <table>
      <thead><tr>
        <th>Article</th><th class="r">Qté</th><th class="r">P.U. HT</th><th class="r">Remise</th><th class="r">TVA</th><th class="r">Total TTC</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="totals">
      <tr><td>Sous-total HT</td><td class="r">${money(inv.subtotal)}</td></tr>
      ${inv.discountAmount ? `<tr><td>Remise</td><td class="r">-${money(inv.discountAmount)}</td></tr>` : ''}
      ${taxRows}
      <tr class="grand"><td>Total TTC</td><td class="r">${money(inv.total)}</td></tr>
      ${inv.amountPaid ? `<tr><td>Payé</td><td class="r">-${money(inv.amountPaid)}</td></tr>` : ''}
      ${inv.amountDue > 0 && inv.amountPaid ? `<tr class="due"><td>Reste dû</td><td class="r">${money(inv.amountDue)}</td></tr>` : ''}
    </table>

    ${paymentRows ? `
    <div style="margin-top:28px">
      <div class="label">Paiements</div>
      <table><thead><tr><th>Date</th><th>Mode</th><th>Référence</th><th class="r">Montant</th></tr></thead>
      <tbody>${paymentRows}</tbody></table>
    </div>` : ''}

    ${(inv.notes || inv.terms) ? `<div class="foot">${esc(inv.notes || '')}${inv.notes && inv.terms ? '\n\n' : ''}${esc(inv.terms || '')}</div>` : ''}
  </div>
</body></html>`;
};
