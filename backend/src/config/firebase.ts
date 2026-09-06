import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: admin.app.App | null = null;
let db: FirebaseFirestore.Firestore | null = null;
let storage: admin.storage.Storage | null = null;

export const initializeFirebase = (): void => {
  try {
    if (!firebaseApp) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });

      db = admin.firestore();
      storage = admin.storage();

      console.log('✅ Firebase initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    process.exit(1);
  }
};

export const getFirestore = (): FirebaseFirestore.Firestore => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

export const getStorage = (): admin.storage.Storage => {
  if (!storage) {
    throw new Error('Storage not initialized');
  }
  return storage;
};