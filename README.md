# 💪 GymPro — Production-Ready Gym Management System

A complete, scalable MERN Stack web application with AI features, real-time chat, payment integration, and gamification.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Framer Motion, Chart.js, TanStack Query, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Cache | Redis (ioredis) |
| Real-time | Socket.io |
| Auth | JWT + Refresh Tokens + bcrypt |
| Payments | Razorpay + Stripe |
| Media | Cloudinary |
| Email | Nodemailer |
| PDF | PDFKit |
| DevOps | Docker + Docker Compose + Nginx |

---

## 📁 Project Structure

```
gym-management-system/
├── backend/
│   └── src/
│       ├── config/        # DB, Redis, Cloudinary
│       ├── controllers/   # Business logic
│       ├── models/        # MongoDB schemas
│       ├── routes/        # API routes (all in index.js)
│       ├── middleware/     # Auth, validation, error, rate limit
│       ├── services/      # AI, Payment, Notification
│       ├── sockets/       # Socket.io server
│       ├── jobs/          # Cron jobs
│       ├── utils/         # JWT, logger, helpers
│       └── seed/          # Seed data
├── frontend/
│   └── src/
│       ├── assets/        # Global CSS
│       ├── components/    # Reusable UI components
│       ├── context/       # Auth store (Zustand) + Socket context
│       ├── pages/         # All page components
│       └── services/      # API service layer
└── docker-compose.yml
```

---

## ⚙️ Setup Guide

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Git

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd gym-management-system
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
```

Edit `.env` with your values:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB (local)
MONGO_URI=mongodb://localhost:27017/gym_management

# Redis (local)
REDIS_URL=redis://localhost:6379

# JWT — generate strong secrets
JWT_SECRET=your_64_char_random_secret_here
JWT_REFRESH_SECRET=another_64_char_random_secret_here

# Cloudinary (create free account at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (use Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16char_app_password
EMAIL_FROM=GymPro <noreply@gympro.com>

# Razorpay (create at razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_secret

# Stripe (optional alternative)
STRIPE_SECRET_KEY=sk_test_xxxx
```

```bash
# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install

cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
```

```bash
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

### 4. Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gympro.com | Admin@123 |
| Trainer | trainer1@gympro.com | Trainer@123 |
| Member | member1@gympro.com | Member@123 |

---

## 🐳 Docker Setup (Production)

```bash
# Copy env files
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Build and run all services
docker-compose up -d

# Seed data inside container
docker exec gympro-backend npm run seed

# View logs
docker-compose logs -f backend
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB Express (dev only): http://localhost:8081

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

#### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Register user | Public |
| POST | /auth/verify-email | Verify OTP | Public |
| POST | /auth/login | Login | Public |
| POST | /auth/logout | Logout | Required |
| POST | /auth/refresh-token | Refresh JWT | Cookie |
| POST | /auth/forgot-password | Send reset link | Public |
| PATCH | /auth/reset-password/:token | Reset password | Public |
| GET | /auth/me | Get current user | Required |

#### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /users | All users | Admin |
| GET | /users/trainers | List trainers | Required |
| GET | /users/leaderboard | Leaderboard | Required |
| PATCH | /users/profile | Update profile | Required |
| PATCH | /users/avatar | Upload avatar | Required |
| GET | /users/ai/recommend | AI workout recs | Required |
| GET | /users/ai/diet | AI diet plan | Required |
| PATCH | /users/save-workout/:id | Save workout | Required |

#### Workouts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /workouts | Browse workouts | Optional |
| POST | /workouts | Create workout | Trainer/Admin |
| GET | /workouts/:id | Workout detail | Optional |
| PATCH | /workouts/:id | Update | Trainer/Admin |
| DELETE | /workouts/:id | Delete | Trainer/Admin |
| POST | /workouts/:id/rate | Rate workout | Required |
| POST | /workouts/:id/assign | Assign to member | Trainer/Admin |
| GET | /workouts/weekly-plan | Weekly planner | Required |

#### Exercises
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /exercises | Exercise library |
| POST | /exercises | Create exercise |
| GET | /exercises/:id | Exercise detail |
| POST | /exercises/:id/media | Upload video/image |
| PATCH | /exercises/:id/approve | Approve (Admin) |

#### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /progress | Log workout/measurement |
| GET | /progress/history | History with filters |
| GET | /progress/summary | Chart data |
| GET | /progress/records | Personal records |
| GET | /progress/report/download | PDF report |

#### Membership
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /membership/plans | Available plans |
| GET | /membership/my | My membership |
| POST | /membership/initiate-payment | Start Razorpay |
| POST | /membership/verify-payment | Verify & activate |
| PATCH | /membership/cancel | Cancel subscription |
| GET | /membership/payments | Payment history |

#### Booking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /booking/classes | Available classes |
| POST | /booking/classes | Create class (Trainer) |
| POST | /booking | Book class/session |
| GET | /booking/my | My bookings |
| PATCH | /booking/:id/cancel | Cancel booking |

#### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /chat/conversations | My conversations |
| GET | /chat/conversations/:id/get-or-create | Start conversation |
| GET | /chat/conversations/:id/messages | Get messages |
| POST | /chat/conversations/:id/messages | Send message |

#### Analytics (Admin/Trainer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /analytics/dashboard | Admin dashboard stats |
| GET | /analytics/revenue | Revenue chart data |
| GET | /analytics/users | User activity chart |
| GET | /analytics/workouts | Workout analytics |

---

## 🔌 Socket.io Events

### Client → Server
```js
// Join conversation room
socket.emit('chat:join', conversationId)

// Typing indicator
socket.emit('chat:typing', { conversationId, isTyping: true })

// Workout started
socket.emit('workout:start', { workoutId, workoutTitle })

// Workout completed
socket.emit('workout:complete', { workoutId, duration, calories })
```

### Server → Client
```js
// New message received
socket.on('message:new', { conversationId, message })

// User online/offline
socket.on('user:online', { userId, name })
socket.on('user:offline', { userId })

// Workout assigned
socket.on('workout:assigned', { workoutId, workoutTitle, assignedBy })

// Booking confirmed
socket.on('booking:confirmed', { bookingId })

// Membership expiry warning
socket.on('notification:membership', { type, daysLeft, message })

// Live stats (admin only)
socket.on('stats:live', { activeUsers, timestamp })
```

---

## 🏗️ Architecture Decisions

### Security
- JWT access tokens (15 min) + refresh tokens (7 days)
- Refresh token rotation (single-use)
- Blacklist access tokens on logout (Redis TTL)
- Account lockout after 5 failed logins
- bcrypt password hashing (salt rounds: 12)
- Rate limiting per endpoint type
- MongoDB sanitization + XSS protection
- Helmet security headers

### Performance
- Redis caching on workout/exercise lists (2-10 min TTL)
- Query pagination on all list endpoints
- MongoDB compound indexes on hot query paths
- Frontend lazy loading with React.lazy()
- Vite code splitting (vendor/charts/motion chunks)
- React Query stale-time prevents redundant fetches

### Real-time
- Socket.io with JWT authentication middleware
- Personal rooms (`user:{id}`) for targeted events
- Role rooms (`role:trainer`) for broadcasts
- Socket failover with polling transport fallback

---

## 🧠 AI Modules

### Workout Recommendation Engine
Located in `backend/src/services/ai.service.js`

Algorithm:
1. Maps fitness goal → workout categories
2. Filters by user's fitness level
3. Excludes recently completed workouts
4. BMI-based intensity adjustment
5. Scores each workout (rating × 10 + completions × 0.1 + goal bonus)
6. Ensures category variety in final set

### Diet Plan Generator
1. Calculates TDEE using Mifflin-St Jeor equation
2. Applies goal-based calorie adjustment (±300-500 kcal)
3. Distributes macros: 30% protein / 45% carbs / 25% fat
4. Generates 4-meal template with Indian food examples
5. Provides goal-specific tips and supplement recommendations

### Progress Prediction
1. Linear regression on weight measurement history
2. Predicts weight for next 4 weeks
3. Estimates goal attainment timeline

---

## 📅 Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| 0 9 * * * | Membership expiry | Notifies users 7/3/1 days before |
| 0 * * * * | Mark expired | Updates status to 'expired' |
| 0 7 * * * | Workout reminders | Emails users with broken streaks |
| 0 0 * * 1 | Leaderboard | Awards bonus points to top 3 |
| 0 0 * * 0 | Cleanup | Removes old read notifications |

---

## 🎨 Frontend Design System

- **Font Display**: Bebas Neue (headings)
- **Font Body**: DM Sans (text)
- **Font Mono**: JetBrains Mono (code)
- **Primary**: #e63946 (brand red)
- **Accent**: #ff6b35 (orange)
- **Theme**: Dark-first, CSS custom properties
- **Animations**: Framer Motion + CSS keyframes

---

## 🔧 Troubleshooting

### Redis not connecting
```bash
# Start Redis locally
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:alpine
```

### MongoDB not connecting
```bash
# Start MongoDB locally
mongod --dbpath /data/db

# Or with Docker
docker run -d -p 27017:27017 mongo:7
```

### Email not sending
- Enable Gmail 2FA
- Create App Password at myaccount.google.com → Security → App Passwords
- Use the 16-character app password in EMAIL_PASS

### Razorpay integration
1. Create account at dashboard.razorpay.com
2. Get Test API keys from Settings → API Keys
3. Add to backend `.env` and frontend `.env`

---

## 📦 Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
JWT_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<64+ char random string>
MONGO_URI=<MongoDB Atlas connection string>
REDIS_URL=<Redis Cloud URL>
CLIENT_URL=https://yourdomain.com
```

### Recommended Stack
- **Backend**: Railway / Render / AWS EC2
- **Frontend**: Vercel / Netlify
- **MongoDB**: MongoDB Atlas (free tier available)
- **Redis**: Upstash (free tier available)
- **Media**: Cloudinary (free tier: 25 GB)

---

## 📄 License

MIT License — Free to use for personal and commercial projects.

---

Built with ❤️ using MERN Stack + Socket.io + AI
