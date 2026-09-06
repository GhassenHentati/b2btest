import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Send WhatsApp message (admin)
router.post('/send', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, message } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ message: 'User IDs array required' });
      return;
    }

    if (!message) {
      res.status(400).json({ message: 'Message required' });
      return;
    }

    const db = getFirestore();
    const results = [];

    for (const userId of userIds) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          // TODO: Integrate with WhatsApp API (Twilio, etc.)
          console.log(`Would send to ${userData.phone}: ${message}`);
          results.push({ userId, status: 'pending' });
        }
      } catch (err) {
        results.push({ userId, status: 'error' });
      }
    }

    res.json({ message: 'Messages queued for sending', results });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ message: 'Failed to send messages' });
  }
});

export default router;