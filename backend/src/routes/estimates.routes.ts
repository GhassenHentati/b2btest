import { Router, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { computeTotals, nextNumber } from '../utils/invoice';
import { ClientSnapshot, InvoiceSettings, Payment } from '../models/types';

const router = Router();

async function getSettings(db: FirebaseFirestore.Firestore): Promise<Partial<InvoiceSettings>> {
  const snap = await db.collection('invoiceSettings').doc('default').get();
  return snap.exists ? (snap.data() as InvoiceSettings) : {};
}

async function buildClientSnapshot(db: FirebaseFirestore.Firestore, clientId: string): Promise<ClientSnapshot | null> {
  const doc = await db.collection('users').doc(clientId).get();
  if (!doc.exists) return null;
  const u = doc.data() as any;
  return {
    id: clientId, name: u.name || '', companyName: u.companyName || '',
    email: u.email || '', phone: u.phone || '', address: u.location?.fullAddressText || '',
  };
}

function serialize(id: string, data: any): any {
  const totals = computeTotals(data.items || [], data.discount, []);
  return { id, ...data, ...totals };
}

// List (admin)
router.get('/', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('estimates').orderBy('createdAt', 'desc').get();
    res.json(snapshot.docs.map((d) => serialize(d.id, d.data())));
  } catch (error) {
    console.error('List estimates error:', error);
    res.status(500).json({ message: 'Failed to fetch estimates' });
  }
});

// Single (admin)
router.get('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('estimates').doc(req.params.id).get();
    if (!doc.exists) { res.status(404).json({ message: 'Estimate not found' }); return; }
    res.json(serialize(doc.id, doc.data()));
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({ message: 'Failed to fetch estimate' });
  }
});

// Create (admin)
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { clientId, items, discount, issueDate, expiryDate, notes, terms } = req.body;
    if (!clientId || !items || items.length === 0) {
      res.status(400).json({ message: 'clientId and at least one item are required' }); return;
    }
    const client = await buildClientSnapshot(db, clientId);
    if (!client) { res.status(400).json({ message: 'Unknown client' }); return; }

    const settings = await getSettings(db);
    const totals = computeTotals(items, discount, []);
    const number = await nextNumber('estimate');
    const issued = issueDate ? new Date(issueDate) : new Date();
    const expiry = expiryDate ? new Date(expiryDate) : new Date(issued.getTime() + 30 * 86400000);

    const id = db.collection('estimates').doc().id;
    const doc = {
      number, type: 'estimate' as const, clientId, clientSnapshot: client,
      status: 'draft' as const, issueDate: issued, expiryDate: expiry,
      currency: settings.currency || 'EUR', items: totals.items, discount: discount || null,
      convertedInvoiceId: null, notes: notes ?? settings.defaultNotes ?? '', terms: terms ?? settings.defaultTerms ?? '',
      subtotal: totals.subtotal, discountAmount: totals.discountAmount, taxBreakdown: totals.taxBreakdown,
      taxTotal: totals.taxTotal, total: totals.total, amountPaid: 0, amountDue: totals.total,
      createdAt: new Date(), updatedAt: new Date(),
    };
    await db.collection('estimates').doc(id).set(doc);
    res.json(serialize(id, doc));
  } catch (error) {
    console.error('Create estimate error:', error);
    res.status(500).json({ message: 'Failed to create estimate' });
  }
});

// Update status (admin): draft/sent/accepted/declined/expired
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { status } = req.body;
    if (!['draft', 'sent', 'accepted', 'declined', 'expired'].includes(status)) {
      res.status(400).json({ message: 'Invalid estimate status' }); return;
    }
    const ref = db.collection('estimates').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Estimate not found' }); return; }
    await ref.update({ status, updatedAt: new Date() });
    const fresh = await ref.get();
    res.json(serialize(fresh.id, fresh.data()));
  } catch (error) {
    console.error('Update estimate status error:', error);
    res.status(500).json({ message: 'Failed to update estimate' });
  }
});

// Convert estimate -> invoice (admin)
router.post('/:id/convert', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('estimates').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Estimate not found' }); return; }
    const est = doc.data() as any;
    if (est.convertedInvoiceId) {
      res.status(400).json({ message: 'Estimate already converted', invoiceId: est.convertedInvoiceId }); return;
    }

    const settings = await getSettings(db);
    const totals = computeTotals(est.items || [], est.discount, []);
    const number = await nextNumber('invoice');
    const issued = new Date();
    const due = new Date(issued.getTime() + (Number(settings.defaultDueDays) || 30) * 86400000);

    const invId = db.collection('invoices').doc().id;
    const invoice = {
      number, type: 'invoice' as const, clientId: est.clientId, clientSnapshot: est.clientSnapshot,
      orderId: null, estimateId: req.params.id, status: 'draft' as const,
      issueDate: issued, dueDate: due, currency: est.currency || settings.currency || 'EUR',
      items: totals.items, discount: est.discount || null, payments: [] as Payment[],
      notes: est.notes || '', terms: est.terms || settings.defaultTerms || '',
      subtotal: totals.subtotal, discountAmount: totals.discountAmount, taxBreakdown: totals.taxBreakdown,
      taxTotal: totals.taxTotal, total: totals.total, amountPaid: 0, amountDue: totals.total,
      createdAt: new Date(), updatedAt: new Date(),
    };
    await db.collection('invoices').doc(invId).set(invoice);
    await ref.update({ status: 'invoiced', convertedInvoiceId: invId, updatedAt: new Date() });
    res.json({ invoiceId: invId, invoice: { id: invId, ...invoice } });
  } catch (error) {
    console.error('Convert estimate error:', error);
    res.status(500).json({ message: 'Failed to convert estimate' });
  }
});

// Delete draft (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const ref = db.collection('estimates').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) { res.status(404).json({ message: 'Estimate not found' }); return; }
    if ((doc.data() as any).convertedInvoiceId) {
      res.status(400).json({ message: 'Cannot delete a converted estimate' }); return;
    }
    await ref.delete();
    res.json({ message: 'Estimate deleted' });
  } catch (error) {
    console.error('Delete estimate error:', error);
    res.status(500).json({ message: 'Failed to delete estimate' });
  }
});

export default router;
