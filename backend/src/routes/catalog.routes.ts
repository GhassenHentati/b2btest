import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get catalog (categories + products) for current user
router.get('/me/catalog', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();

    // Fetch categories
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch products
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      categories,
      products
    });
  } catch (error) {
    console.error('Catalog error:', error);
    res.status(500).json({ message: 'Failed to fetch catalog' });
  }
});

export default router;