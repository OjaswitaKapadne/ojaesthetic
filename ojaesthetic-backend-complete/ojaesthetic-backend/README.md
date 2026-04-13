# 🦋 Ojaesthetic Backend

> Production-ready REST API for the Ojaesthetic art platform  
> Built with Node.js · Express · MongoDB · Cloudinary · JWT

---

## 📁 Project Structure

```
ojaesthetic-backend/
├── server.js                   ← Entry point
├── .env.example                ← Environment variable template
├── api.js                      ← Frontend API client (include in HTML)
├── package.json
│
├── config/
│   ├── db.js                   ← MongoDB connection
│   └── cloudinary.js           ← Cloudinary SDK setup
│
├── models/
│   ├── User.js                 ← Users, auth, favorites, orders
│   ├── Artwork.js              ← Gallery artworks
│   ├── Order.js                ← Custom artwork orders
│   ├── Review.js               ← User testimonials
│   └── Newsletter.js           ← Email subscriptions
│
├── middleware/
│   ├── auth.js                 ← JWT protect + authorize + optionalAuth
│   ├── errorHandler.js         ← Global error handling + AppError class
│   ├── upload.js               ← Multer + Cloudinary upload
│   └── validate.js             ← express-validator rules
│
├── controllers/
│   ├── authController.js       ← Signup, login, profile
│   ├── artworkController.js    ← Gallery CRUD + download
│   ├── orderController.js      ← Order lifecycle
│   ├── reviewController.js     ← Reviews + approval
│   ├── favoritesController.js  ← Wishlist management
│   ├── newsletterController.js ← Subscribe / unsubscribe
│   ├── uploadController.js     ← Avatar + reference images
│   └── adminController.js      ← Dashboard + user management
│
├── routes/
│   ├── auth.js
│   ├── artworks.js
│   ├── orders.js
│   ├── reviews.js
│   ├── favorites.js
│   ├── newsletter.js
│   ├── upload.js
│   └── admin.js
│
└── utils/
    ├── email.js                ← Nodemailer email sender
    └── seed.js                 ← DB seeder (admin + sample data)
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd ojaesthetic-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, Cloudinary keys, JWT secret, etc.
```

### 3. Seed the database
```bash
npm run seed
# Creates admin user + 6 sample artworks + 4 reviews
```

### 4. Start development server
```bash
npm run dev       # nodemon (auto-restart)
# or
npm start         # plain node
```

Server runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

---

## 🔐 Authentication

All protected routes require the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned on signup and login. They expire in **7 days** (configurable via `JWT_EXPIRES_IN`).

### Roles
| Role  | Access |
|-------|--------|
| user  | Browse, order, favorite, review, profile |
| admin | All of the above + upload art, manage orders, moderate reviews, view all data |

---

## 📡 API Reference

### Auth  `/api/auth`
| Method | Endpoint           | Auth     | Description              |
|--------|--------------------|----------|--------------------------|
| POST   | `/signup`          | Public   | Create account           |
| POST   | `/login`           | Public   | Login, receive JWT       |
| POST   | `/logout`          | User     | Logout (clears client)   |
| GET    | `/me`              | User     | Get own profile          |
| PATCH  | `/update-profile`  | User     | Update name/avatar       |
| PATCH  | `/change-password` | User     | Change password          |

### Artworks  `/api/artworks`
| Method | Endpoint            | Auth     | Description                  |
|--------|---------------------|----------|------------------------------|
| GET    | `/`                 | Public   | All artworks (search/filter) |
| GET    | `/:id`              | Public   | Single artwork               |
| GET    | `/:id/download`     | Public   | Download (if downloadable)   |
| POST   | `/`                 | Admin    | Upload new artwork           |
| PATCH  | `/:id`              | Admin    | Update artwork               |
| DELETE | `/:id`              | Admin    | Delete artwork + Cloudinary  |

**Query params for GET /:** `category`, `tags`, `search`, `featured`, `page`, `limit`, `sort`

### Orders  `/api/orders`
| Method | Endpoint         | Auth  | Description             |
|--------|------------------|-------|-------------------------|
| POST   | `/`              | User  | Place custom order      |
| GET    | `/my`            | User  | My orders               |
| GET    | `/:id`           | User  | Single order (own only) |
| GET    | `/`              | Admin | All orders (paginated)  |
| PATCH  | `/:id/status`    | Admin | Update order status     |
| DELETE | `/:id`           | Admin | Delete order            |

**Order statuses:** `pending` → `reviewing` → `accepted` → `in_progress` → `completed` / `cancelled`

### Favorites  `/api/favorites`
| Method | Endpoint  | Auth | Description       |
|--------|-----------|------|-------------------|
| GET    | `/`       | User | Get saved artworks|
| POST   | `/add`    | User | Save artwork      |
| POST   | `/remove` | User | Unsave artwork    |

### Reviews  `/api/reviews`
| Method | Endpoint  | Auth  | Description              |
|--------|-----------|-------|--------------------------|
| GET    | `/`       | Public| Approved reviews         |
| POST   | `/`       | User  | Submit review (pending)  |
| GET    | `/all`    | Admin | All reviews              |
| PATCH  | `/:id`    | Admin | Approve / highlight      |
| DELETE | `/:id`    | Admin | Delete review            |

### Newsletter  `/api/newsletter`
| Method | Endpoint       | Auth  | Description          |
|--------|----------------|-------|----------------------|
| POST   | `/subscribe`   | Public| Subscribe email      |
| POST   | `/unsubscribe` | Public| Unsubscribe          |
| GET    | `/subscribers` | Admin | List all subscribers |

### Upload  `/api/upload`
| Method | Endpoint      | Auth | Description                     |
|--------|---------------|------|---------------------------------|
| POST   | `/avatar`     | User | Upload profile picture          |
| POST   | `/references` | User | Upload order reference images   |

### Admin  `/api/admin`
| Method | Endpoint                    | Auth  | Description               |
|--------|-----------------------------|-------|---------------------------|
| GET    | `/dashboard`                | Admin | Stats overview            |
| GET    | `/users`                    | Admin | All users                 |
| PATCH  | `/users/:id/toggle`         | Admin | Activate/deactivate user  |
| PATCH  | `/reviews/:id/moderate`     | Admin | Approve/highlight review  |
| GET    | `/newsletter/export`        | Admin | Download subscribers CSV  |

---

## 🖼️ Frontend Integration

Include `api.js` in your HTML before closing `</body>`:

```html
<script src="api.js"></script>
```

Then use `window.OjaAPI` anywhere:

```javascript
// Login
const { token, user } = await OjaAPI.auth.login('email@example.com', 'password');

// Fetch artworks
const { artworks } = await OjaAPI.artworks.getAll({ category: 'Painting', page: 1 });

// Place order
await OjaAPI.orders.create({ name, email, artworkType, message });

// Save to favorites
await OjaAPI.favorites.add('artwork_id_here');

// Subscribe to newsletter
await OjaAPI.newsletter.subscribe('email@example.com');

// Admin: get dashboard
const { stats } = await OjaAPI.admin.dashboard();
```

The `OjaAPI.UI.toast(message)` utility shows a soft teal notification.

---

## 🔒 Security Features

| Feature            | Implementation                          |
|--------------------|-----------------------------------------|
| Password hashing   | bcryptjs with salt rounds = 12          |
| JWT auth           | jsonwebtoken, 7-day expiry              |
| Rate limiting      | 200 req/15min global, 20 req/15min auth |
| NoSQL injection    | express-mongo-sanitize                  |
| HTTP headers       | helmet                                  |
| CORS               | Configured for specific origins         |
| Input validation   | express-validator on all POST/PATCH     |
| File type checks   | Multer fileFilter (images only, 8MB max)|
| Role-based access  | admin vs user middleware                |

---

## ☁️ Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Paste into `.env`

Images are organized into folders:
- `ojaesthetic/artworks/` — gallery images
- `ojaesthetic/avatars/` — user profile pictures
- `ojaesthetic/order-references/` — client reference images

---

## 🗄️ MongoDB Setup

**Local:** `MONGO_URI=mongodb://localhost:27017/ojaesthetic`

**MongoDB Atlas (recommended for production):**
1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add database user + network access (0.0.0.0/0 for cloud deploy)
3. Copy connection string → paste as `MONGO_URI` in `.env`

---

## 🚢 Deployment

### Railway / Render / Fly.io
```bash
# Set all .env variables in the platform dashboard
# Then deploy:
git push origin main
```

### Environment variables to set in production:
- `NODE_ENV=production`
- `MONGO_URI` — your Atlas connection string
- `JWT_SECRET` — long random string (use: `openssl rand -base64 64`)
- `CLOUDINARY_*` — your Cloudinary credentials
- `EMAIL_*` — your SMTP credentials
- `FRONTEND_URL` — your deployed frontend URL

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate an app password for "Mail"
4. Set `EMAIL_USER=your@gmail.com` and `EMAIL_PASS=<app_password>` in `.env`

---

## 🌱 Sample Request Bodies

**Signup:**
```json
{ "name": "Priya Sharma", "email": "priya@example.com", "password": "Priya@1234!" }
```

**Place Order:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "artworkType": "Canvas Portrait",
  "message": "I'd love a portrait of my grandmother in warm, earthy tones with soft floral accents.",
  "budget": 5000
}
```

**Submit Review:**
```json
{ "text": "Every piece feels like a story. So calming and beautiful!", "rating": 5 }
```

---

*Made with 🌿 for Ojaesthetic — where colors speak and art feels alive.*
