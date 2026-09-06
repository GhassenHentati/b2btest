import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getFirestore } from '../config/firebase';
import { AuthRequest, authMiddleware } from '../middleware/auth.middleware';

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@b2btest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password required' });
      return;
    }

    // Admin authentication
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { id: 'admin', role: 'admin', email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        role: 'admin',
        user: { id: 'admin', email, role: 'admin' }
      });
      return;
    }

    // Client authentication - query Firestore
    const db = getFirestore();
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data();

    // Simple password check (in production, use hashing)
    if (user.password !== password) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: userDoc.id, role: 'client', email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      role: 'client',
      user: { id: userDoc.id, email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Verify token
router.get('/verify', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;