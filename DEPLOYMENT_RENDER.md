# 🚀 Déploiement sur Render (Backend)

## Architecture Finale
```
Frontend (Vercel)     ↔️ API HTTPS ↔️ Backend (Render)     ↔️ Firebase
https://app.com                      https://api.render.com        (Firestore)
```

---

## 📋 Prérequis

- ✅ Compte GitHub (tu l'as)
- ✅ Compte Vercel (pour frontend)
- ✅ Compte Firebase (pour BD)
- ✅ Compte Render: https://render.com

---

## 1️⃣ Créer un Compte Render

1. Aller sur **https://render.com**
2. Cliquer **"Sign Up"**
3. Connecter avec GitHub
4. Autoriser Render à accéder à tes repos

---

## 2️⃣ Déployer le Backend sur Render

### Étape 1: Créer un Web Service

1. Aller sur **https://dashboard.render.com**
2. Cliquer **"New +"** → **"Web Service"**
3. Sélectionner ton repo: **GhassenHentati/b2btest**
4. Connecter le repo

### Étape 2: Configurer le Service

Dans le formulaire de configuration:

```
Name: b2b-ordering-backend
Environment: Node
Region: Frankfurt (ou proche de toi)
Branch: main
Build Command: npm run build:backend
Start Command: npm run start:backend
```

### Étape 3: Ajouter les Variables d'Environnement

Cliquer sur **"Environment"** et ajouter:

```
NODE_ENV = production
PORT = 3000
JWT_SECRET = your-super-secret-key-change-this-in-production
FIREBASE_PROJECT_ID = ton-projet-id
FIREBASE_PRIVATE_KEY = ton-private-key
FIREBASE_CLIENT_EMAIL = ton-email@appspot.gserviceaccount.com
```

⚠️ **IMPORTANT:** La `FIREBASE_PRIVATE_KEY` doit être au format:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEF...
-----END PRIVATE KEY-----
```

### Étape 4: Créer le Service

Cliquer **"Create Web Service"**

✅ Attendre le déploiement (2-3 minutes)

**URL Backend:** `https://b2b-ordering-backend.onrender.com`

---

## 3️⃣ Mettre à Jour le Frontend

### Dans `frontend/src/core/services/auth.service.ts`:

```typescript
private apiUrl = 'https://b2b-ordering-backend.onrender.com/api';
```

### Redéployer sur Vercel

```bash
cd frontend
git add .
git commit -m "Update backend URL to Render"
git push
```

Vercel redéploiera automatiquement.

---

## 4️⃣ Configurer les Domaines

### Frontend (Vercel)

1. Vercel Dashboard → Ton projet → Settings → Domains
2. Ajouter: `app.tondomaine.com`
3. Configurer les DNS chez ton registrar

### Backend (Render)

1. Dashboard Render → Ton service → Settings → Custom Domain
2. Ajouter: `api.tondomaine.com`
3. Render te donnera un CNAME à configurer chez ton registrar

**Exemple DNS (chez Namecheap, OVH, etc.):**
```
app.tondomaine.com  CNAME  tonapp.vercel.app
api.tondomaine.com  CNAME  b2b-ordering-backend.onrender.com
```

---

## 5️⃣ Configuration Firebase

### Créer un Projet Firebase

1. Aller sur **https://firebase.google.com**
2. Cliquer **"Aller à la console"**
3. **"Créer un projet"**

Nom du projet:
```
b2b-ordering
```

### Activer Services

1. **Firestore Database**
   - Firestore → Créer une base de données
   - Mode de sécurité: Production
   - Région: europe-west1 (proche de toi)

2. **Storage**
   - Storage → Créer un bucket
   - Région: same as Firestore

### Créer la Clé de Service

1. Paramètres ⚙️ → Comptes de service
2. Cliquer **"Générer une nouvelle clé privée"**
3. Télécharger le fichier JSON
4. Copier les valeurs pour:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

---

## 6️⃣ Déployer Firebase Rules

### Installer Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
```

### Créer `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuth() {
      return request.auth != null;
    }
    
    function isAdmin() {
      let userData = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return userData.exists && userData.data.role == 'admin';
    }
    
    // Users: Les admins peuvent tout faire
    match /users/{userId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Catalog: Les clients authentifiés peuvent lire
    match /categories/{categoryId} {
      allow read: if isAuth();
      allow write: if isAdmin();
    }
    
    match /products/{productId} {
      allow read: if isAuth();
      allow write: if isAdmin();
    }
    
    // Orders: Les clients voient leurs propres commandes
    match /orders/{orderId} {
      allow read: if isAuth() && 
        (isAdmin() || resource.data.clientId == request.auth.uid);
      allow create: if isAuth() && !isAdmin();
      allow update: if isAdmin();
    }
    
    // Favorites
    match /favorites/{userId} {
      allow read: if isAuth() && request.auth.uid == userId;
      allow write: if isAuth() && request.auth.uid == userId;
    }
  }
}
```

### Créer `storage.rules`

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Déployer

```bash
firebase deploy
```

---

## 7️⃣ Tester en Production

### Tester le Backend

```bash
# Health check
curl https://b2b-ordering-backend.onrender.com/health

# Login admin
curl -X POST https://b2b-ordering-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@b2btest.com",
    "password": "admin123"
  }'
```

### Tester le Frontend

1. Aller sur: https://ton-app.vercel.app
2. Se connecter avec:
   - Email: `admin@b2btest.com`
   - Password: `admin123`
3. Vérifier que tout fonctionne

---

## 8️⃣ Monitoring Render

### Voir les Logs

Dashboard Render → Ton service → Logs

### Voir la Santé

Dashboard Render → Ton service → Deploys

### Redéployer

Si tu veux forcer un redéploiement:
```bash
git commit --allow-empty -m "Trigger deploy"
git push
```

---

## 9️⃣ Configuration CORS

Si tu as des erreurs CORS, ajouter dans `backend/src/server.ts`:

```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://ton-app.vercel.app',
  'https://app.tondomaine.com',
  'http://localhost:4200' // Pour dev local
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

---

## 🔐 Sécurité en Production

### Checklist

- [ ] Changer `JWT_SECRET` (générer une clé forte)
- [ ] Changer mot de passe admin
- [ ] Configurer Firestore Rules
- [ ] Activer HTTPS (automatique sur Render/Vercel)
- [ ] Mettre en place rate limiting
- [ ] Configurer backups Firebase
- [ ] Activer Cloud Audit Logs
- [ ] Tester authentification
- [ ] Tester permissions Firestore

### Générer une Clé JWT Forte

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copier la sortie dans `JWT_SECRET` sur Render.

---

## 🚀 Résumé URLs

```
Frontend:  https://ton-app.vercel.app
Backend:   https://b2b-ordering-backend.onrender.com
Firebase:  https://console.firebase.google.com

Admin:     https://ton-app.vercel.app/login
           Email: admin@b2btest.com
           Password: (à changer)
```

---

## ❌ Résolution de Problèmes

### Le backend ne démarre pas

1. Vérifier les logs: `Dashboard Render → Logs`
2. Vérifier les variables d'environnement
3. Vérifier `FIREBASE_PRIVATE_KEY` (doit avoir `\n` literals)

### Erreurs CORS

```
Access to XMLHttpRequest... has been blocked by CORS policy
```

Solution: Ajouter l'URL frontend dans `allowedOrigins` (voir section CORS)

### Firestore Rules rejettent les requêtes

1. Vérifier les logs Firestore: Firebase Console → Firestore → Logs
2. Mettre à jour les rules
3. Redéployer: `firebase deploy`

### La clé Firebase est invalide

Vérifier que `FIREBASE_PRIVATE_KEY` contient les `\n` littéraux:

```
-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----
```

---

## 📞 Support Render

- Docs: https://render.com/docs
- Status: https://render-status.com
- Support: help@render.com

---

## ✅ Après Déploiement

```
✅ Frontend live sur Vercel
✅ Backend live sur Render
✅ BD live sur Firebase
✅ Admin accessible
✅ Clients peuvent se connecter
✅ Commandes fonctionnent
✅ WhatsApp intégré
```

**Bravo! 🎉 Ton app est en production!**
