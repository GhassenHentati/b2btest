# Deployment Guide - B2B Ordering Platform

## 🚀 Déploiement Complet

### Architecture Proposée
```
┌─────────────────────────────────────┐
│     Frontend (Angular + Ionic)      │
│  Vercel / Netlify / Firebase        │
└─────────────────────────────────────┘
            ↓ API HTTP
┌─────────────────────────────────────┐
│   Backend (Node.js + Express)       │
│  Heroku / Railway / Render          │
└─────────────────────────────────────┘
            ↓ Firestore
┌─────────────────────────────────────┐
│   Firebase (Firestore + Storage)    │
└─────────────────────────────────────┘
```

---

## 1️⃣ Préparer le Déploiement

### Créer un compte Firebase
1. Aller sur https://firebase.google.com
2. Créer un nouveau projet
3. Activer Firestore Database
4. Activer Storage
5. Créer une clé de service:
   - Paramètres → Comptes de service
   - Générer nouvelle clé privée JSON
   - Garder le fichier en sécurité ⚠️

---

## 2️⃣ Déployer le Frontend (Vercel)

### Option A: Via CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer depuis le dossier frontend
cd frontend
vercel

# Suivre les instructions
# - Link to existing project? No
# - Project name: b2b-ordering-frontend
# - Build command: npm run build
# - Output directory: dist/browser
```

### Option B: Via GitHub (Recommandé)

1. Aller sur https://vercel.com
2. Sign up / Login
3. Cliquer "New Project"
4. Connecter ton repo GitHub (GhassenHentati/b2btest)
5. Configuration:
   - Framework: Angular
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist/browser`
6. Ajouter variables d'environnement:
   ```
   ANGULAR_BACKEND_URL=https://ton-backend.herokuapp.com
   ```
7. Cliquer "Deploy"

**URL Frontend:** https://ton-app.vercel.app

### Mettre à jour l'API Backend

Après déploiement, mettre à jour l'URL du backend dans le frontend:

`frontend/src/core/services/auth.service.ts`
```typescript
private apiUrl = 'https://ton-backend.herokuapp.com/api';
```

Puis redéployer.

---

## 3️⃣ Déployer le Backend (Heroku)

### Prérequis
- Compte Heroku: https://heroku.com
- Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

### Étapes

```bash
# 1. Login à Heroku
heroku login

# 2. Créer une nouvelle app
heroku create b2b-ordering-backend

# 3. Ajouter les variables d'environnement
heroku config:set -a b2b-ordering-backend \
  NODE_ENV=production \
  PORT=3000 \
  JWT_SECRET=your-super-secret-key-change-this \
  FIREBASE_PROJECT_ID=your-firebase-project-id \
  FIREBASE_PRIVATE_KEY='your-private-key-from-json' \
  FIREBASE_CLIENT_EMAIL=your-firebase-email@appspot.gserviceaccount.com

# 4. Déployer
git push heroku main

# 5. Vérifier les logs
heroku logs --tail -a b2b-ordering-backend
```

**URL Backend:** https://b2b-ordering-backend.herokuapp.com

### Alternative: Railway (Plus facile)

1. Aller sur https://railway.app
2. Créer compte GitHub
3. New Project → GitHub Repo → Sélectionner b2btest
4. Ajouter variables d'environnement
5. Deploy

---

## 4️⃣ Configuration DNS & Domaine

### Si tu as un domaine

#### Frontend (Vercel)
1. Vercel Dashboard → Settings → Domains
2. Ajouter ton domaine
3. Pointer les DNS nameservers vers Vercel

#### Backend (Heroku)
1. Heroku Dashboard → Settings → Domains
2. Ajouter un sous-domaine (api.tondomaine.com)
3. Configuration DNS:
   ```
   api.tondomaine.com CNAME b2b-ordering-backend.herokuapp.com
   ```

---

## 5️⃣ Configuration Firebase en Production

### Firestore Rules

`firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Authentification avec JWT
    function isAuth() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
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
    
    // Favorites: Chaque utilisateur ses favoris
    match /favorites/{userId} {
      allow read: if isAuth() && request.auth.uid == userId;
      allow write: if isAuth() && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules

`storage.rules`
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read, admin write
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/root/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

Déployer avec Firebase CLI:
```bash
firebase deploy --only firestore:rules,storage
```

---

## 6️⃣ Variables d'Environnement en Production

### Frontend (.env.production)
```
NG_APP_API_URL=https://ton-backend.herokuapp.com/api
NG_APP_ENV=production
```

### Backend (.env)
```
NODE_ENV=production
PORT=3000
JWT_SECRET=change-this-to-a-very-secure-random-key
ADMIN_EMAIL=admin@b2btest.com
ADMIN_PASSWORD=change-this-password
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-email
```

---

## 7️⃣ CI/CD avec GitHub Actions

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: b2b-ordering-backend
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
```

---

## 8️⃣ Monitoring & Logs

### Vercel
- Dashboard: https://vercel.com/dashboard
- Logs: Analytics → Logs

### Heroku
```bash
# Voir les logs en temps réel
heroku logs --tail -a b2b-ordering-backend

# Redémarrer l'app
heroku restart -a b2b-ordering-backend

# Logs spécifiques
heroku logs --app b2b-ordering-backend --num 100
```

### Firebase
- Console: https://console.firebase.google.com
- Firestore: Voir les données
- Storage: Voir les fichiers
- Analytics: Voir les statistiques

---

## 9️⃣ Checklist de Déploiement

- [ ] Firebase project créé et configuré
- [ ] Firestore Database activée
- [ ] Storage activée
- [ ] Clé de service téléchargée
- [ ] Backend déployé sur Heroku/Railway
- [ ] Frontend déployé sur Vercel
- [ ] URL Backend mise à jour dans le frontend
- [ ] Variables d'environnement configurées
- [ ] Firestore Rules déployées
- [ ] Tests en production
- [ ] Admin credentials changées
- [ ] SSL/HTTPS activé
- [ ] CORS configuré correctement
- [ ] Monitoring en place

---

## 🔗 URLs de l'Application

```
Frontend:  https://ton-app.vercel.app
Backend:   https://b2b-ordering-backend.herokuapp.com
Firebase:  https://console.firebase.google.com
Admin:     https://ton-app.vercel.app/login
           Email: admin@b2btest.com
           Password: (À définir)
```

---

## ⚠️ Sécurité

✅ Avant d'aller en production:
- [ ] Changer le JWT_SECRET
- [ ] Changer le mot de passe admin
- [ ] Configurer Firestore Rules
- [ ] Configurer Storage Rules
- [ ] Activer HTTPS partout
- [ ] Configurer CORS (whitelist domains)
- [ ] Mettre en place rate limiting
- [ ] Ajouter validation des entrées
- [ ] Ajouter monitoring/alertes
- [ ] Configurer backups Firebase

---

## 📞 Support

Pour des problèmes:
1. Vérifier les logs (Vercel/Heroku)
2. Vérifier les variables d'environnement
3. Vérifier les Firestore Rules
4. Tester localement d'abord

