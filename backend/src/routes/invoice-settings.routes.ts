import { Router, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { InvoiceSettings } from '../models/types';

const router = Router();

const DEFAULT_SETTINGS: InvoiceSettings = {
  companyName: 'B2B Test',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  taxId: '',
  logoUrl: '',
  currency: 'EUR',
  invoicePrefix: 'INV-',
  estimatePrefix: 'EST-',
  numberPadding: 6,
  defaultDueDays: 30,
  defaultTaxRate: 20,
  defaultTaxLabel: 'TVA 20%',
  defaultNotes: '',
  defaultTerms: 'Paiement à réception de la facture.',
  updatedAt: new Date(),
};

// Get invoicing settings (admin)
router.get('/', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('invoiceSettings').doc('default').get();
    const settings = snap.exists ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS;
    res.json(settings);
  } catch (error) {
    console.error('Get invoice settings error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice settings' });
  }
});

// Update invoicing settings (admin)
router.put('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const payload = { ...req.body };
    delete payload.updatedAt;
    payload.updatedAt = new Date();
    await db.collection('invoiceSettings').doc('default').set(payload, { merge: true });
    const snap = await db.collection('invoiceSettings').doc('default').get();
    res.json({ ...DEFAULT_SETTINGS, ...snap.data() });
  } catch (error) {
    console.error('Update invoice settings error:', error);
    res.status(500).json({ message: 'Failed to update invoice settings' });
  }
});

export default router;
