import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get home config (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('home').doc('config').get();

    if (!doc.exists) {
      res.json({ slider: [] });
      return;
    }

    res.json(doc.data());
  } catch (error) {
    console.error('Home config error:', error);
    res.status(500).json({ message: 'Failed to fetch home config' });
  }
});

// Update home config (admin only)
router.patch('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getFirestore();
    const { slider } = req.body;

    await db.collection('home').doc('config').set({
      slider: slider || [],
      updatedAt: new Date()
    });

    res.json({ message: 'Home config updated' });
  } catch (error) {
    console.error('Update home config error:', error);
    res.status(500).json({ message: 'Failed to update home config' });
  }
});

export default router;