# B2B Ordering Platform (PWA) - Simplified Scope
**Single App (Admin + Client) · PWA-first · Mobile-responsive · Firebase + Node.js/Express**

## 1) Goal
Build a **simple, good-looking, mobile-first PWA** for a packaging company:
- Clients browse products and place orders easily
- Admin manages products, prices, and orders
- **Same app** for both roles (Admin + Client), with role-based screens/permissions

**Priority:** simplicity, speed of delivery, professional UI, minimum requests to firebase
**Not a priority:** optimization, security, invoices, are all not important

---

## 2) Users & Roles
### Client
- Login
- View home slider
- View order history
- Browse categories/products
- View product price (personalized if needed)
- Select quantity and see:
  - **Line total** (qty × price)
  - **Tax info per product** (important)
- Add/remove favorites
- Contact company (WhatsApp / phone)

### Admin ( one hard coded admin in backend code - not even saved in the database )
- Login (admin role)
- Manage clients (basic details: location, delivery day, phone…)
- Manage categories
- Manage products (price, tax per product, image, price per client)
- Manage home slider items
- View and update orders status (basic workflow)
- Select X users and send them a message with whatsapp ( API in backend )

---

## 3) Key Functional Scope (Simplified)
### Catalog
- Categories list
- Product list per category
- Product card: image, name, unit, price, tax label, quick add/remove quantity, quick love icon for favorite

### Ordering
- Cart-like selection
- Show **line total per item** while selecting
- Taxes:
  - Must store/display **tax per product** (label + rate or type)
- No need for a complex invoice screen
- Order submission: client sends order, admin receives it ( with a whatsapp message as well )

### Favorites
- Client can favorite products
- Quick access to favorites

### Order History
- Client sees past orders (basic list + details) grouped by date
- Admin sees orders and can update status

### Home Slider
- Admin can configure:
  - Home slider images (1..N)
- Client home page displays slider

---

## 4) Tech Stack
### Frontend (Single App)
- Angular
- Ionic UI (recommended for fast, consistent mobile UI)
- PWA enabled (installable, responsive)

### Backend
- Node.js + Express REST API
- Firebase Admin SDK

### Storage
- Firestore: app data
- Firebase Storage: product images + slider images
- Firestore Database

---

## 5) Firestore Collections (Estimated Structure)
This is a **practical, minimal** structure. Adjust as needed.

### `users` (clients)
Document ID: `userId`
Fields:
- `name`
- `phone`
- `email` (optional)
- `companyName` (optional)
- `location`: `{ city, township, postalCode, fullAddressText }`
- `deliveryDay`: `numeric 0..6`
- `isActive`: boolean (deleting a user makes it inactive and therefore hides it everywhere)
- `createdAt`, `updatedAt`
---

### `categories`
Document ID: `categoryId`
Fields:
- `name`
- `imageUrl?`
- `createdAt`, `updatedAt`

---

### `products`
Document ID: `productId`
Fields:
- `name`
- `categoryId`
- `unitLabel` (e.g. "piece", "pack", "kg")
- `price` (number)
- `tax`: `{ label: string, rate: number }`  // rate as 0.19 etc
- `imageUrl?`
- `promo?`: `{ rate: number, from: date, to: date }`
- `createdAt`, `updatedAt`

---

### `favorites`
Option A (simple, scalable): one document per user
Document ID: `userId`
Fields:
- `productIds`: string[]  (limit reasonably)
- `updatedAt`

---

### `orders`
Document ID: `orderId`
Fields:
- `clientId`
- `status`: `"submitted" | "confirmed" | "shipped" | "cancelled"`
- `notes?`
- `createdAt`, `updatedAt`
- `items`: [
  {
    "productId": string,
    "nameSnapshot": string,
    "unitLabelSnapshot": string,
    "priceSnapshot": number,
    "taxSnapshot": { "label": string, "rate": number },
    "qty": number,
    "lineTotal": number
  }
]

Notes:
- Store `lineTotal` to avoid recalculation and keep historical accuracy.
- No need for global totals screen; totals can exist in data if helpful.

---

### `home`
Single document (configuration) OR split by type
Option A: single doc `home/config`
Fields:
- `slider`: [
  { "imageUrl": string, "title?": string, "subtitle?": string, "linkType?": "product|category|none", "linkId?": string }
]
- `updatedAt`

(Keep it simple: global for all users.)

---

### `activity` (lightweight history)
`orders` already is the history. That is enough.

---

## 6) API (High Level)
Backend should expose simple endpoints (examples):
- Auth: verify session/token
- Catalog:
  - `GET /me/catalog` (categories + products + prices of current user)
- Home:
  - `GET /home` (slider)
- Favorites:
  - `GET /me/favorites`
  - `POST /me/favorites` (add/remove)
- Orders:
  - `POST /orders` (create/submit)
  - `GET /me/orders`
  - `GET /orders` (admin)
  - `PATCH /orders/:id/status` (admin)

Make sure to use caching with invalidation in case of edition.
Keep endpoints minimal and practical. 

---

## 7) UI Requirements
- **Mobile-first** (smartphone priority)
- Responsive for tablet
- professional, elegant visuals
- Product images should look great (neutral UI background)
- Quick interactions: add/remove quantity, favorites, submit order
- **MANDATORY: Style consistency across ALL screens** - Login, home, admin, and all other screens must use the same theme from ui-style.json
- **NO hardcoded colors** - Always use theme variables from ui-style.json
- **NO default Ionic/cannon styles** - All components must use the app's custom theme
- Define colors globally and use them as SCSS variables throughout the app

---

## 8) Code Quality (Pragmatic)
- Clean structure, readable code
- DRY where it truly reduces repetition
- SOLID principles where useful, but **avoid over-engineering**
- Prefer shipping a stable simple solution over "perfect architecture"

---