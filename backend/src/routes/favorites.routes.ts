import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get user favorites
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.user?.id;

    const doc = await db.collection('favorites').doc(userId).get();

    if (!doc.exists) {
      res.json({ productIds: [] });
      return;
    }

    res.json(doc.data());
  } catch (error) {
    console.error('Favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

// Toggle favorite
router.post('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ message: 'Product ID required' });
      return;
    }

    const favDoc = await db.collection('favorites').doc(userId).get();
    let productIds: string[] = [];

    if (favDoc.exists) {
      productIds = favDoc.data()?.productIds || [];
    }

    if (productIds.includes(productId)) {
      productIds = productIds.filter(id => id !== productId);
    } else {
      productIds.push(productId);
    }

    await db.collection('favorites').doc(userId).set({
      productIds,
      updatedAt: new Date()
    });

    res.json({ productIds });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Failed to toggle favorite' });
  }
});

export default router;