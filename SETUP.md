# B2B Ordering Platform

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase Project

### Installation

```bash
# Clone repository
git clone https://github.com/GhassenHentati/b2btest.git
cd b2btest

# Install all dependencies
npm run install:all
```

### Configure Environment

#### Frontend
```bash
cd frontend
# Update API endpoint in src/core/services/auth.service.ts if needed
```

#### Backend
```bash
cd backend
# Copy .env.example to .env
cp .env.example .env

# Update with your Firebase credentials
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY=your-private-key
# FIREBASE_CLIENT_EMAIL=your-client-email
```

### Running the Application

#### Development Mode (Frontend + Backend)
```bash
npm run dev
```

Or run separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

- Backend: http://localhost:3000
- Frontend: http://localhost:4200

#### Production Build
```bash
npm run build:frontend
npm run build:backend
```

### Default Admin Credentials
- Email: `admin@b2btest.com`
- Password: `admin123`

⚠️ **Change these credentials in production!**

## 📁 Project Structure

```
.
├── frontend/                 # Angular + Ionic PWA
│   ├── src/
│   │   ├── app/             # Main app module
│   │   ├── core/            # Services, guards, interceptors
│   │   ├── features/        # Feature modules (auth, client, admin)
│   │   └── styles/          # Global styles & theme
│   └── public/              # Static assets, manifest
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── config/          # Firebase config
│   │   ├── middleware/      # Auth, error handling
│   │   ├── models/          # TypeScript interfaces
│   │   ├── routes/          # API endpoints
│   │   └── server.ts        # Express app
│   └── .env                 # Environment variables
└── package.json             # Root package file
```

## 🔑 Key Features

✅ **Client Features**
- Login / Authentication
- Home slider
- Browse categories & products
- Add to favorites
- Shopping cart
- Order submission
- Order history
- WhatsApp & phone contact

✅ **Admin Features**
- Admin dashboard
- Client management
- Category management
- Product management
- Slider/promo management
- Order management & status updates
- WhatsApp messaging

✅ **Technical**
- PWA-ready (installable, offline-capable)
- Mobile-first responsive design
- TypeScript strict mode
- Ionic components
- Firebase integration (Firestore, Storage)
- JWT authentication
- CORS enabled

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### Client
- `GET /api/catalog/me/catalog` - Get categories & products
- `GET /api/home` - Get home slider config
- `GET /api/favorites/me` - Get user favorites
- `POST /api/favorites/me` - Toggle favorite
- `POST /api/orders` - Create order
- `GET /api/orders/me` - Get user orders

### Admin
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft)
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `GET /api/products` - Get products
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/orders` - Get all orders
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/whatsapp/send` - Send WhatsApp messages

## 🎨 Design System

Theme colors and tokens are defined in `ui-style.json` and compiled to SCSS variables in `frontend/src/styles/_theme.scss`.

**No hardcoded colors** - All components use theme variables.

## 📱 PWA Configuration

PWA manifest at `frontend/public/manifest.json`

- Installable on Android, iOS, desktop
- Standalone display mode
- App icons (192x192, 512x512, maskable)
- Theme colors matching brand

## 🔐 Security Notes

- ⚠️ Default admin password must be changed in production
- Store Firebase credentials in secure environment variables
- JWT tokens expire after 7 days
- CORS configured for development - restrict in production
- Implement rate limiting for API endpoints
- Use HTTPS in production

## 📝 Task Progress

See `PROJECT_TASKS.md` for detailed task list and progress tracking.

## 🚀 Deployment

### Frontend
- Vercel: `vercel`
- Netlify: `netlify deploy`
- Firebase Hosting: `firebase deploy`

### Backend
- Heroku: `git push heroku main`
- Firebase Cloud Functions
- Railway, Render, etc.

## 📞 Support

For issues or questions, create an issue on GitHub.

## 📄 License

MIT