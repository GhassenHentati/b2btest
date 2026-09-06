import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all categories (admin)
router.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('categories').get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Create category (admin)
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { name, imageUrl } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Category name required' });
      return;
    }

    const categoryId = db.collection('categories').doc().id;

    await db.collection('categories').doc(categoryId).set({
      name,
      imageUrl: imageUrl || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ id: categoryId, message: 'Category created' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// Update category (admin)
router.patch('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const updateData = req.body;

    updateData.updatedAt = new Date();

    await db.collection('categories').doc(id).update(updateData);

    res.json({ message: 'Category updated' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// Delete category (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { id } = req.params;

    await db.collection('categories').doc(id).delete();

    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

export default router;