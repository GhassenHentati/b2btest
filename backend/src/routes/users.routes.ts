import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all users (admin)
router.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();

    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create user (admin)
router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { name, phone, email, companyName, location, deliveryDay, password } = req.body;

    if (!name || !phone || !deliveryDay) {
      res.status(400).json({ message: 'Required fields missing' });
      return;
    }

    const userId = db.collection('users').doc().id;

    await db.collection('users').doc(userId).set({
      name,
      phone,
      email: email || '',
      companyName: companyName || '',
      location: location || {},
      deliveryDay,
      password: password || 'temp123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ id: userId, message: 'User created' });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update user (admin)
router.patch('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const updateData = req.body;

    updateData.updatedAt = new Date();

    await db.collection('users').doc(id).update(updateData);

    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (admin) - soft delete
router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { id } = req.params;

    await db.collection('users').doc(id).update({
      isActive: false,
      updatedAt: new Date()
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;