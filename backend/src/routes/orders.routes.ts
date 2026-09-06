import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Create order (client)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const clientId = req.user?.id;
    const { items, notes } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Order items required' });
      return;
    }

    const orderId = db.collection('orders').doc().id;

    await db.collection('orders').doc(orderId).set({
      clientId,
      status: 'submitted',
      items,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ id: orderId, message: 'Order submitted' });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get user orders
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const clientId = req.user?.id;

    const snapshot = await db.collection('orders')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get all orders (admin)
router.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Update order status (admin)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { status } = req.body;

    if (!['submitted', 'confirmed', 'shipped', 'cancelled'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    await db.collection('orders').doc(id).update({
      status,
      updatedAt: new Date()
    });

    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

export default router;