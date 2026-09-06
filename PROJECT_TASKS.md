# B2B Ordering Platform - Complete Task List

## Project Overview
Build a single PWA application (admin + client in same app) that is mobile-first, responsive, and simple to use, with a Node.js Express backend using Firebase Firestore and Storage.

**Tech Stack:**
- Frontend: Angular (avoid standalone, use modular approach) + Ionic + PWA - communicates with backend via REST API
- Backend: Node.js + Express + Firebase Admin SDK - handles ALL Firebase operations (Firestore + Storage)
- Storage: Firebase Firestore + Firebase Storage (accessed ONLY through backend API)

**Important:** Frontend does NOT use Firebase directly. All Firebase operations go through backend REST API.

---

## Phase 1: Project Foundation & Setup

### Task 1: Initialize Angular + Ionic Frontend Project
**Frontend:** Create Ionic Angular project with blank template (no tabs - client uses single page with overlays). Enable PWA support. Install dependencies (Router, Forms, HTTP client). Set up folder structure (core, shared, features). Configure TypeScript and environment files. Set up basic routing with routes for overlays (categories, products, favorites, cart, history). Ensure project runs locally.

### Task 2: Configure Global Theme System from ui-style.json
**Frontend:** Extract design tokens from ui-style.json. Create SCSS variables for colors, typography (Inter font, sizes, weights), and layout (padding, radius, heights). Create component style variables. Update global stylesheet. Ensure no hardcoded colors.

### Task 3: Setup Node.js Express Backend Project
**Backend:** Create backend directory. Initialize npm project. Install dependencies (Express, Firebase Admin SDK, jsonwebtoken, CORS, dotenv, express-validator, multer, axios). Create folder structure (config, controllers, middleware, models, routes, services, utils). Set up Express server with middleware. Configure error handling and logging. Test server startup.

### Task 4: Setup Firebase Project and Configuration
**Backend:** Create Firebase project. Enable Firestore and Storage. Generate service account key for backend. Store credentials in backend environment variables. Initialize Firebase Admin SDK in backend. Test Firebase connection from backend. Document security rules structure.

### Task 5: Define Complete Firestore Data Model and TypeScript Interfaces
**Backend:** Create TypeScript interfaces for all collections (User, Category, Product, Favorite, Order, HomeConfig). Document data relationships.

### Task 6: Build Express API Route Structure and Middleware
**Backend:** Create route files (auth, catalog, home, favorites, orders, users, categories, products, whatsapp). Set up JWT authentication middleware ( the simplest possible - a never expiring token ). Create role-based authorization middleware (admin/client). Implement hardcoded admin credentials check. Set up request validation (admin or not for certain tasks), error handling, CORS, and logging middleware. Test all routes.

### Task 7: Implement Authentication System
**Backend:** Create login endpoint. Implement admin authentication (hardcoded credentials). Implement client authentication (query Firestore users). Generate JWT tokens (no expiration). Return user role and basic info.
**Frontend:** Create auth service. Build login page with form validation. Store token in localStorage. Create auth guard and role guard. Set up HTTP interceptor for JWT. Implement logout. Test login flow for both roles.

---

## Phase 2: Client-Side Features

### Task 8: Build Client Home Screen (Single Page Layout)
**Backend:** Create GET /home endpoint. Fetch home/config from Firestore. Return slider array. Implement caching.
**Frontend:** Create single-page home component (no tabs, no sidebars). Build app header with WhatsApp and call buttons. Display slider component (Ionic slides) at top with titles/subtitles. Handle navigation from slider (product/category/none). Add "View Favorites" button below slider. Add "View History" button below favorites button. Display categories as small cards in grid below buttons. Each category card opens products overlay when clicked. Create floating cart button that persists across app (shows item count). Make responsive and mobile-first. Ensure appealing design.

### Task 9: Implement Catalog Browsing with Categories and Products (Overlay Style)
**Backend:** Create GET /me/catalog endpoint. Fetch categories and products from Firestore. Apply user-specific pricing if applicable. Return structured response (categories + products grouped). Implement caching.
**Frontend:** Create catalog service. Build categories/products overlay component (slides in from side, X button to close). Create route for category view (/category/:id) and product list (/category/:id/products). Build products list component inside overlay (filtered by selected category). Create product card component (image, name, unit, price, tax label, quantity controls, favorite icon, line total). Ensure mobile-optimized touch targets (44px min). Handle empty states. Support deep linking to categories/products via routes. - make sure to take into consideration price per client for products if it exists.

### Task 10: Implement Favorites System (Overlay Style - use same header style as Catalog Browsing)
**Backend:** Create GET /me/favorites endpoint. Create POST /me/favorites endpoint (toggle). Update Firestore favorites collection (userId document, productIds array). Return updated favorites list.
**Frontend:** Create favorites service. Implement toggle favorite in product cards. Create favorites overlay component (slides in from side, X button to close). Create route for favorites (/favorites) to support deep linking. Display favorited products in list with product cards. Show favorite icon state. Handle empty state. Allow adding to cart from favorites overlay.

### Task 11: Build Shopping Cart and Order Submission Flow (Floating Button + Overlay - use same header style as Catalog Browsing)
**Frontend:** Create in-memory cart service. Add items from product cards. Create persistent floating cart button (shows item count badge, always visible unless in cart view). Create cart overlay component (slides in from side, X button to close). Create route for cart (/cart) to support deep linking. Display cart items with quantities, line totals, tax info, but dont show the total of cart. Implement quantity modification and item removal in overlay. Add checkout/submit button in cart overlay.
**Backend:** Create POST /orders endpoint. Validate order data. Create order document in Firestore (clientId, status "submitted", item snapshots with line totals, notes, timestamps). Send WhatsApp notification to admin when order created. Return order ID.
**Frontend:** Submit order from cart overlay. Clear cart on success. Show success message. Close cart overlay. Navigate to order history overlay. Handle errors.

### Task 12: Build Order History for Clients (Overlay Style)
**Backend:** Create GET /me/orders endpoint. Query Firestore orders filtered by clientId. Return orders sorted by date (newest first) with item snapshots.
**Frontend:** Create order history service. Build order history overlay component (slides in from side, X button to close). Create route for order history (/orders) to support deep linking. Display orders grouped by date. Create order detail component (status, items, line totals, tax info, total, date, notes). Implement pull-to-refresh. Handle empty state. Allow viewing order details within overlay.

### Task 13: Add Contact Functionality (WhatsApp and Phone)
**Frontend:** Add WhatsApp and call functionality accessible from user menu. Implement WhatsApp button (opens WhatsApp with pre-filled message). Implement phone button (initiates phone call). Ensure buttons work on mobile (native apps) and desktop (web). Make buttons visually appealing and easily accessible.

---

## Phase 3: Admin Features

### Task 14: Build Admin Dashboard
**Frontend:** Create admin dashboard component. Display metrics (total orders, pending orders). Create navigation to all admin sections. Make mobile-friendly. Ensure admin-only access.

### Task 15: Implement Client Management (Admin)
**Backend:** Create GET /users endpoint (admin only, filter inactive). Create POST /users endpoint (create client with validation). Create PATCH /users/:id endpoint (update client). Create DELETE /users/:id endpoint (soft delete - set isActive: false). Validate phone, email formats, required fields.
**Frontend:** Create users management service. Build users list page. Create user form component (name, phone, email, companyName, location, deliveryDay). Create edit form. Handle inactive users toggle. Display success/error messages.

### Task 16: Implement Category Management (Admin)
**Backend:** Create GET /categories endpoint (admin only). Create POST /categories endpoint (create with image upload to Firebase Storage). Create PATCH /categories/:id endpoint (update name/image). Create DELETE /categories/:id endpoint (validate no products reference it). Return image URLs.
**Frontend:** Create category management service. Build categories list page. Create category form (name, image upload with preview). Display categories with images. Handle image updates.

### Task 17: Implement Product Management (Admin)
**Backend:** Create GET /products endpoint (admin only, optional category filter). Create POST /products endpoint (create with image upload to Firebase Storage). Create PATCH /products/:id endpoint (update product). Create DELETE /products/:id endpoint. Support client-specific pricing (store in productPrices collection: productId + userId). Return products with pricing info.
**Frontend:** Create product management service. Build products list page. Create product form (name, category, unitLabel, price, tax label/rate, image upload, client-specific pricing section). Display products with category grouping. Validate all fields.

### Task 18: Implement Slider Management (Admin)
**Backend:** Create GET /home endpoint (admin only, full config). Create PATCH /home endpoint (update slider). Implement image upload to Firebase Storage for slider images. Return updated configuration.
**Frontend:** Create home config management service. Build slider management page (add, edit, remove, reorder items). Create slider item form (image, title, subtitle, linkType, linkId). Implement image upload with preview.

### Task 19: Implement Order Management (Admin)
**Backend:** Create GET /orders endpoint (admin only, all orders, optional status filter, pagination). Create PATCH /orders/:id/status endpoint (update status, validate transitions). Return updated order.
**Frontend:** Create orders management service. Build orders list page (client name, date, status, total, item count). Implement status filter dropdown. Create order detail page (client details, status, items, totals, timestamps, notes). Implement status update functionality. Show confirmation dialog.
allow the admin to change parts of the order ( but should keep the old state as it is and build apon it, allow the admin to reduce commands by reducing number of products requested, and allow him to add a note for why was that done )
the client side should see the old state with a line thro it, the new number, and why was it changed
the admin can confirm an order, which changes its state to the client as confirmed, the admin can also cancel it
changed orders remain the same exact state
and the admin can decide that its shipped and adds a date for shippment ( or by default use the next closest shipment day of the client )

### Task 20: Implement WhatsApp Messaging (Admin)
**Backend:** Research and choose WhatsApp API provider (Twilio, WhatsApp Business API, etc.). Set up API credentials in backend environment variables. Create POST /whatsapp/send endpoint (accepts user IDs array and message text). Validate user IDs exist and have phone numbers. Integrate WhatsApp API to send messages. Handle rate limits and errors. Return success/failure status per message.
**Frontend:** Create WhatsApp messaging service. Build WhatsApp messaging page (multi-select user list, message input, send button). Show loading state. Display success/error messages. Optionally show message history.

---

## Phase 4: Optimization & Polish

### Task 21: Implement Caching Strategy
**Backend:** Analyze endpoints for cacheable data. Implement in-memory caching (home config, catalog, user data). Set TTL values. Implement cache invalidation on data updates. Create cache management utilities.
**Frontend:** Implement service-level caching (home, catalog, favorites). Clear cache on logout. Refresh cache on pull-to-refresh. Test caching and measure Firebase call reduction.

### Task 22: Implement Pagination and List Optimization
**Backend:** Implement pagination for orders list (admin) with page size and offset/cursor. Add pagination for products list if needed. Return pagination metadata (total, current page, has more).
**Frontend:** Create pagination components or infinite scroll. Implement infinite scroll for product lists and order history. Add pagination controls for admin lists. Implement lazy loading for images. Add loading skeletons.

### Task 22.1: Migrate Image Storage to Firebase Storage
**Backend:** Replace local file storage with Firebase Storage. Update storage.service.ts to use Firebase Storage bucket instead of local filesystem. Update uploadImage(), deleteImage(), and getImageUrl() functions. Enable Firebase Storage in firebase.ts config. Update image serving endpoint or remove it (Firebase Storage provides direct URLs). Test image uploads and deletions. Ensure all existing images are migrated or handled gracefully.
**Frontend:** No changes needed - image URLs will be provided by backend. Test that images display correctly with Firebase Storage URLs.

### Task 22.2: Migrate Product Images to Firebase Storage
**Backend:** Migrate product image storage from local file system to Firebase Storage. Update products route to use Firebase Storage for product images. Ensure all existing product images are migrated or handled gracefully. Test product image uploads, updates, and deletions.
**Frontend:** No changes needed - image URLs will be provided by backend. Test that product images display correctly with Firebase Storage URLs.

### Task 22.3: Migrate Slider Images to Firebase Storage
**Backend:** Migrate slider image storage from local file system to Firebase Storage. Update home route to use Firebase Storage for slider images. Ensure all existing slider images are migrated or handled gracefully. Test slider image uploads, updates, and deletions.
**Frontend:** No changes needed - image URLs will be provided by backend. Test that slider images display correctly with Firebase Storage URLs.

### Task 23: Polish Mobile UX and Responsive Design
**Frontend:** Review all pages and overlays for mobile-first compliance. Ensure touch targets are 44px minimum. Add pull-to-refresh (home, order history overlay). Implement loading states and skeletons. Improve error messages. Add empty states for all lists. Test on various screen sizes. Optimize typography and spacing. Test one-handed use. Verify floating cart button and header buttons accessibility. Test overlay slide-in/out animations are smooth. Test forms, modals, dialogs on mobile. Test performance on slower devices. Ensure overlay transitions are performant.

### Task 24: Verify Contact Links and Deep Linking
**Frontend:** Verify header WhatsApp and call buttons work from all screens. Test deep linking to categories (/category/:id), products (/category/:id/products), favorites (/favorites), cart (/cart), and order history (/orders). Ensure routes work correctly and overlays open properly when accessed via direct links. Test on mobile and desktop.

### Task 25: Configure PWA Manifest and Icons
**Frontend:** Create PWA manifest (name, description, theme colors, display mode, start URL, scope). Generate app icons (192x192, 512x512, iOS sizes). Create favicon. Configure service worker for offline caching. Test PWA installation on Android, iOS, desktop. Test standalone mode. Document installation instructions.

### Task 26: Final Testing and Bug Fixes
**Both:** Test complete client flow (login → browse → cart → order → history). Test complete admin flow (dashboard → manage all entities → orders → WhatsApp). Test edge cases (empty states, errors, network failures, invalid data, missing images). Test authentication edge cases. Fix all bugs. Test on multiple devices. Verify all README requirements. Test performance. Verify caching, image uploads, Firebase operations. Document known issues.

### Task 27: Code Review and Documentation
**Both:** Review code for consistency and project rules. Ensure no hardcoded colors. Verify DRY principles. Check error handling. Create API documentation (endpoints, methods, parameters, responses). Document environment variables. Create deployment checklist. Document Firebase security rules. Update README with setup instructions.

---

## Task Tracking

| Task # | Task Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Initialize Angular + Ionic Frontend Project | ⬜ | |
| 2 | Configure Global Theme System from ui-style.json | ⬜ | |
| 3 | Setup Node.js Express Backend Project | ⬜ | |
| 4 | Setup Firebase Project and Configuration | ⬜ | |
| 5 | Define Complete Firestore Data Model and TypeScript Interfaces | ⬜ | |
| 6 | Build Express API Route Structure and Middleware | ⬜ | |
| 7 | Implement Authentication System | ⬜ | |
| 8 | Build Client Home Screen with Slider and Promos | ⬜ | |
| 9 | Implement Catalog Browsing with Categories and Products | ⬜ | |
| 10 | Implement Favorites System | ⬜ | |
| 11 | Build Shopping Cart and Order Submission Flow | ⬜ | |
| 12 | Build Order History for Clients | ⬜ | |
| 13 | Add Contact Functionality (WhatsApp and Phone) | ⬜ | |
| 14 | Build Admin Dashboard | ⬜ | |
| 15 | Implement Client Management (Admin) | ⬜ | |
| 16 | Implement Category Management (Admin) | ⬜ | |
| 17 | Implement Product Management (Admin) | ⬜ | |
| 18 | Implement Slider Management (Admin) | ⬜ | |
| 19 | Implement Order Management (Admin) | ⬜ | |
| 20 | Implement WhatsApp Messaging (Admin) | ⬜ | |
| 21 | Implement Caching Strategy | ⬜ | |
| 22 | Implement Pagination and List Optimization | ⬜ | |
| 22.1 | Migrate Image Storage to Firebase Storage | ⬜ | Replace local file storage with Firebase Storage |
| 22.2 | Migrate Product Images to Firebase Storage | ⬜ | Migrate product images from local storage to Firebase Storage |
| 22.3 | Migrate Slider Images to Firebase Storage | ⬜ | Migrate slider images from local storage to Firebase Storage |
| 23 | Polish Mobile UX and Responsive Design | ⬜ | |
| 24 | Implement Contact Links Throughout App | ⬜ | |
| 25 | Configure PWA Manifest and Icons | ⬜ | |
| 26 | Final Testing and Bug Fixes | ⬜ | |
| 27 | Code Review and Documentation | ⬜ | |

**Status Legend:**
- ⬜ Pending - Not started
- ✅ Completed - Finished and tested

**Progress Summary:**
- Total Tasks: 27
- Completed: 0
- In Progress: 0
- Pending: 27
- Blocked: 0
- Completion: 0%

---

## Important Notes

- **Client UI Structure:** Client app uses single-page layout (no tabs, no sidebars). Home page shows slider → favorites button → history button → categories as small cards. Floating cart button persists. Header has WhatsApp and call buttons. All sections (categories, products, favorites, cart, history) open as overlays/slide-ins with X button to close. Each overlay has its own route for deep linking.

- Update task status as you progress through the project
- Add notes to tasks when you encounter blockers or important information
- Test each task thoroughly before marking as completed
- Follow the project principles: simplicity, mobile-first, use proven libraries
- Keep code clean and readable
- Don't over-engineer solutions
- Focus on getting features working correctly rather than perfect architecture

to do achraf ( cursor AI please avoid this ):
- once the project is done you may need to implement pagination for better performance and less requests toward firebase