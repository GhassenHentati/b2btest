import { Router, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { computeTotals, deriveInvoiceStatus, nextNumber, round2 } from '../utils/invoice';
import { ClientSnapshot, Invoice, InvoiceSettings, Payment } from '../models/types';
import { renderInvoiceHtml } from '../utils/invoice-pdf';

const router = Router();

const STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];

async function getSettings(db: FirebaseFirestore.Firestore): Promise<Partial<InvoiceSettings>> {
  const snap = await db.collection('invoiceSettings').doc('default').get();
  return snap.exists ? (snap.data() as InvoiceSettings) : {};
}

async function buildClientSnapshot(
  db: FirebaseFirestore.Firestore,
  clientId: string
): Promise<ClientSnapshot | null> {
  const doc = await db.collection('users').doc(clientId).get();
  if (!doc.exists) return null;
  const u = doc.data() as any;
  return {
    id: clientId,
    name: u.name || '',
    companyName: u.companyName || '',
    email: u.email || '',
    phone: u.phone || '',
    address: u.location?.fullAddressText || '',
  };
}

/** Recompute totals + virtual status for an API response. */
function serialize(id: string, data: any): any {
  const totals = computeTotals(data.items || [], data.discount, data.payments || []);
  const status = deriveInvoiceStatus(data.status, totals.amountDue, totals.amountPaid, data.dueDate);
  return { id, ...data, ...totals, status };
}

// ── List (admin) ────────────────────────────────────────────────────────────
router.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { status, clientId } = req.query as { status?: string; clientId?: string };
    let q: FirebaseFirestore.Query = db.collection('invoices');
    if (clientId) q = q.where('clientId', '==', clientId);
    const snapshot = await q.orderBy('createdAt', 'desc').get();
    let invoices = snapshot.docs.map((d) => serialize(d.id, d.data()));
    if (status) invoices = invoices.filter((i) => i.status === status);
    res.json(invoices);
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

// ── Client's own invoices ────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('invoices')
      .where('clientId', '==', req.user?.id)
      .orderBy('createdAt', 'desc')
      .get();
    // Clients never see drafts.
    const invoices = snapshot.docs
      .map((d) => serialize(d.id, d.data()))
      .filter((i) => i.status !== 'draft');
    res.json(invoices);
  } catch (error) {
    console.error('List my invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

// ── Single invoice (admin or owning client) ──────────────────────────────────
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('invoices').doc(req.params.id).get();
    if (!doc.exists) { res.status(404).json({ message: 'Invoice not found' }); return; }
    const data = doc.data() as any;
    if (req.user?.role !== 'admin' && data.clientId !== req.user?.id) {
      res.status(403).json({ message: 'Forbidden' }); return;
    }
    res.json(serialize(doc.id, data));
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
});

// ── Create (admin) ───────────────────────────────────────────────────────────
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { clientId, items, discount, issueDate, dueDate, notes, terms, status } = req.body;
    if (!clientId || !items || items.length === 0) {
      res.status(400).json({ message: 'clientId and at least one item are required' }); return;
    }
    const client = await buildClientSnapshot(db, clientId);
    if (!client) { res.status(400).json({ message: 'Unknown client' }); return; }

    const settings = await getSettings(db);
    const totals = computeTotals(items, discount, []);
    const number = await nextNumber('invoice');
    const issued = issueDate ? new Date(issueDate) : new Date();
    const due = dueDate
      ? new Date(dueDate)
      : new Date(issued.getTime() + (Number(settings.defaultDueDays) || 30) * 86400000);

    const id = db.collection('invoices').doc().id;
    const doc = {
      number,
      type: 'invoice' as const,
      clientId,
      clientSnapshot: client,
      orderId: req.body.orderId || null,
      estimateId: req.body.estimateId || null,
      status: status === 'sent' ? 'sent' : 'draft',
      issueDate: issued,
      dueDate: due,
      currency: settings.currency || 'EUR',
      items: totals.items,
      discount: discount || null,
      payments: [] as Payment[],
      notes: notes ?? settings.defaultNotes ?? '',
      terms: terms ?? settings.defaultTerms ?? '',
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxBreakdown: totals.taxBreakdown,
      taxTotal: totals.taxTotal,
      total: totals.total,
      amountPaid: 0,
      amountDue: totals.total,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('invoices').doc(id).set(doc);
    res.json(serialize(id, doc));
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Failed to create invoice' });
  }
});

// ── Create from an existing order (admin) ────────────────────────────────────
router.post('/from-order/:orderId', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const orderDoc = await db.collection('orders').doc(req.params.orderId).get();
    if (!orderDoc.exists) { res.status(404).json({ message: 'Order not found' }); return; }
    const order = orderDoc.data() as any;

    const client = await buildClientSnapshot(db, order.clientId);
    if (!client) { res.status(400).json({ message: 'Order client not found' }); return; }

    const items = (order.items || []).map((it: any) => ({
      productId: it.productId || null,
      name: it.nameSnapshot || it.name || '',
      unitLabel: it.unitLabelSnapshot || it.unitLabel || '',
      unitPrice: Number(it.priceSnapshot ?? it.unitPrice) || 0,
      qty: Number(it.qty) || 0,
      discountPercent: 0,
      taxRate: Number(it.taxSnapshot?.rate) || 0,
      taxLabel: it.taxSnapshot?.label || '',
    }));
    if (items.length === 0) { res.status(400).json({ message: 'Order has no items' }); return; }

    const settings = await getSettings(db);
    const totals = computeTotals(items, undefined, []);
    const number = await nextNumber('invoice');
    const issued = new Date();
    const due = new Date(issued.getTime() + (Number(settings.defaultDueDays) || 30) * 86400000);

    const id = db.collection('invoices').doc().id;
    const doc = {
      number,
      type: 'invoice' as const,
      clientId: order.clientId,
      clientSnapshot: client,
      orderId: req.params.orderId,
      estimateId: null,
      status: 'draft' as const,
      issueDate: issued,
      dueDate: due,
      currency: settings.currency || 'EUR',
      items: totals.items,
      discount: null,
      payments: [] as Payment[],
      notes: order.notes || settings.defaultNotes || '',
      terms: settings.defaultTerms || '',
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxBreakdown: totals.taxBreakdown,
      taxTotal: totals.taxTotal,
      total: totals.total,
      amountPaid: 0,
      amountDue: totals.total,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('invoices').doc(id).set(doc);
    res.json(serialize(id, doc));
  } catch (error) {
    console.error('Create invoice from order error:', error);
    res.status(500).json({ message: 'Failed to create invoice from order' });
  }
});

// ── Update a draft (admin) ───────────────────────────────────────────────────
router.patch('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('invoices').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Invoice not found' }); return; }
    const current = doc.data() as any;
    if (current.status !== 'draft') {
      res.status(400).json({ message: 'Only draft invoices can be edited' }); return;
    }
    const { items, discount, issueDate, dueDate, notes, terms, clientId } = req.body;
    const update: any = { updatedAt: new Date() };

    if (clientId && clientId !== current.clientId) {
      const client = await buildClientSnapshot(db, clientId);
      if (!client) { res.status(400).json({ message: 'Unknown client' }); return; }
      update.clientId = clientId;
      update.clientSnapshot = client;
    }
    if (items) {
      const totals = computeTotals(items, discount ?? current.discount, []);
      update.items = totals.items;
      update.subtotal = totals.subtotal;
      update.discountAmount = totals.discountAmount;
      update.taxBreakdown = totals.taxBreakdown;
      update.taxTotal = totals.taxTotal;
      update.total = totals.total;
      update.amountDue = totals.total;
    }
    if (discount !== undefined) update.discount = discount || null;
    if (issueDate) update.issueDate = new Date(issueDate);
    if (dueDate) update.dueDate = new Date(dueDate);
    if (notes !== undefined) update.notes = notes;
    if (terms !== undefined) update.terms = terms;

    await ref.update(update);
    const fresh = await ref.get();
    res.json(serialize(fresh.id, fresh.data()));
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Failed to update invoice' });
  }
});

// ── Change status (admin): send / cancel / reopen ────────────────────────────
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { status } = req.body;
    if (!['draft', 'sent', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Status must be draft, sent or cancelled' }); return;
    }
    const ref = db.collection('invoices').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Invoice not found' }); return; }
    await ref.update({ status, updatedAt: new Date() });
    const fresh = await ref.get();
    res.json(serialize(fresh.id, fresh.data()));
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// ── Record a payment (admin) ─────────────────────────────────────────────────
router.post('/:id/payments', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { amount, method, reference, note, date } = req.body;
    const amt = Number(amount);
    if (!amt || amt <= 0) { res.status(400).json({ message: 'A positive amount is required' }); return; }

    const ref = db.collection('invoices').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Invoice not found' }); return; }
    const current = doc.data() as any;
    if (current.status === 'cancelled') {
      res.status(400).json({ message: 'Cannot pay a cancelled invoice' }); return;
    }

    const payment: Payment = {
      id: db.collection('_').doc().id,
      amount: round2(amt),
      method: ['cash', 'bank_transfer', 'card', 'cheque', 'other'].includes(method) ? method : 'other',
      reference: reference || '',
      note: note || '',
      date: date ? new Date(date) : new Date(),
      createdAt: new Date(),
    };
    const payments = [...(current.payments || []), payment];
    const totals = computeTotals(current.items || [], current.discount, payments);
    await ref.update({
      payments,
      amountPaid: totals.amountPaid,
      amountDue: totals.amountDue,
      status: current.status === 'draft' ? 'sent' : current.status,
      updatedAt: new Date(),
    });
    const fresh = await ref.get();
    res.json(serialize(fresh.id, fresh.data()));
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Failed to record payment' });
  }
});

// ── Delete a payment (admin) ─────────────────────────────────────────────────
router.delete('/:id/payments/:paymentId', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('invoices').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Invoice not found' }); return; }
    const current = doc.data() as any;
    const payments = (current.payments || []).filter((p: Payment) => p.id !== req.params.paymentId);
    const totals = computeTotals(current.items || [], current.discount, payments);
    await ref.update({
      payments,
      amountPaid: totals.amountPaid,
      amountDue: totals.amountDue,
      updatedAt: new Date(),
    });
    const fresh = await ref.get();
    res.json(serialize(fresh.id, fresh.data()));
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Failed to delete payment' });
  }
});

// ── Delete a draft invoice (admin) ───────────────────────────────────────────
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('invoices').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Invoice not found' }); return; }
    if ((doc.data() as any).status !== 'draft') {
      res.status(400).json({ message: 'Only draft invoices can be deleted; cancel instead' }); return;
    }
    await ref.delete();
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
});

// ── Printable HTML / PDF (admin or owning client) ────────────────────────────
router.get('/:id/pdf', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('invoices').doc(req.params.id).get();
    if (!doc.exists) { res.status(404).send('Invoice not found'); return; }
    const data = doc.data() as any;
    if (req.user?.role !== 'admin' && data.clientId !== req.user?.id) {
      res.status(403).send('Forbidden'); return;
    }
    const settings = await getSettings(db);
    const html = renderInvoiceHtml(serialize(doc.id, data), settings);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Render invoice error:', error);
    res.status(500).send('Failed to render invoice');
  }
});

export default router;
