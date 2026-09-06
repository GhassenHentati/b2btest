import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all products (admin)
router.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('products').get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Create product (admin)
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { name, categoryId, unitLabel, price, tax, imageUrl } = req.body;

    if (!name || !categoryId || !unitLabel || !price || !tax) {
      res.status(400).json({ message: 'Required fields missing' });
      return;
    }

    const productId = db.collection('products').doc().id;

    await db.collection('products').doc(productId).set({
      name,
      categoryId,
      unitLabel,
      price,
      tax,
      imageUrl: imageUrl || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ id: productId, message: 'Product created' });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product (admin)
router.patch('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const updateData = req.body;

    updateData.updatedAt = new Date();

    await db.collection('products').doc(id).update(updateData);

    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { id } = req.params;

    await db.collection('products').doc(id).delete();

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;