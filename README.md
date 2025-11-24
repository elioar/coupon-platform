# CouponMe - Discount Coupon Platform

A modern, full-stack web platform where users and businesses can register and interact with discount coupons. Built with Next.js 16, TypeScript, Prisma, and Tailwind CSS.

## 🌟 Features

### Authentication & Roles
- **Admin**: Oversee approvals, memberships, and content
- **User**: Browse and use coupons (with membership)
- **Business**: Create and manage coupons

### Membership System
- Non-members can browse but can't view full coupon codes
- Paying members (€10/year) unlock all coupon codes
- Automatic membership tracking and expiration
- Stripe payment integration

### Coupon Management
- Businesses can create, edit, and delete coupons
- Each coupon includes: title, description, code, image, category, discount %, expiration
- Admin approval required before going public
- Automatic hiding of expired coupons
- Image upload support

### Admin Dashboard
- View, approve, or reject new coupons
- Manage users, businesses, and memberships
- View platform statistics
- Manual coupon management

### Internationalization
- English and Greek language support
- Language switcher in navigation
- All UI text available in both languages

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Stripe account (for payments)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd coupon-me
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `coupon-me` directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/couponme?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # Google Maps - Get from https://console.cloud.google.com/
   # Enable these APIs in your Google Cloud project:
   # 1. Maps JavaScript API (required for Places Autocomplete)
   # 2. Geocoding API (required for server-side geocoding)
   # 3. Places API (required for Places Autocomplete)
   GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
   # Same key for client-side (required for Places Autocomplete)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed initial categories (optional):**
   You can create categories via the admin API or manually insert them:
   ```bash
   npx prisma studio
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Creating an Admin User

Since the first user needs to be an admin, you'll need to manually update the database:

1. Register a new user through the UI
2. Open Prisma Studio: `npx prisma studio`
3. Find your user in the User table
4. Change the `role` field from `USER` to `ADMIN`

## 📁 Project Structure

```
coupon-me/
├── app/
│   ├── [locale]/                 # Internationalized routes
│   │   ├── coupons/             # Public coupons listing
│   │   ├── membership/          # Membership subscription page
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   └── dashboard/           # Role-specific dashboards
│   │       ├── admin/
│   │       ├── business/
│   │       └── user/
│   └── api/                      # API routes
│       ├── auth/                # NextAuth endpoints
│       ├── register/            # User registration
│       ├── coupons/             # Coupon CRUD
│       ├── categories/          # Category management
│       ├── membership/          # Stripe checkout
│       ├── admin/               # Admin-only endpoints
│       ├── upload/              # Image upload
│       └── webhooks/            # Stripe webhooks
├── components/                   # React components
│   ├── Navigation.tsx
│   ├── CouponCard.tsx
│   ├── CouponModal.tsx
│   ├── Button.tsx
│   ├── CategoryFilter.tsx
│   └── MembershipBadge.tsx
├── lib/                         # Utility functions
│   ├── prisma.ts               # Prisma client
│   ├── stripe.ts               # Stripe configuration
│   └── auth-helpers.ts         # Auth utility functions
├── messages/                    # i18n translations
│   ├── en.json
│   └── el.json
├── prisma/
│   └── schema.prisma           # Database schema
├── auth.ts                     # NextAuth configuration
├── middleware.ts               # Route protection & i18n
└── types/
    └── next-auth.d.ts          # TypeScript definitions
```

## 🔐 API Routes

### Public Routes
- `GET /api/coupons` - List approved coupons
- `GET /api/categories` - List all categories

### Authenticated Routes
- `POST /api/register` - User registration
- `POST /api/coupons` - Create coupon (Business only)
- `PATCH /api/coupons/[id]` - Update coupon
- `DELETE /api/coupons/[id]` - Delete coupon
- `POST /api/membership/checkout` - Create Stripe checkout session
- `POST /api/upload` - Upload coupon image

### Admin Routes
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `GET /api/admin/coupons/pending` - List pending coupons
- `POST /api/coupons/[id]/approve` - Approve/reject coupon
- `GET /api/admin/stats` - Get platform statistics

## 🎨 Styling

The app uses Tailwind CSS with:
- Violet primary color scheme
- Zinc neutrals for text and backgrounds
- Dark mode support
- Responsive design (mobile-first)
- Subtle hover/focus animations

## 🔧 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe
- **Styling**: Tailwind CSS v4
- **Internationalization**: next-intl
- **Forms**: React Hook Form (optional)
- **Validation**: Zod
- **Date Handling**: date-fns

## 🌐 Environment Setup

### Stripe Webhook Setup

For local development with Stripe webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the webhook secret to your `.env` file

### PostgreSQL Setup

You can use:
- Local PostgreSQL installation
- Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`
- Cloud services: Supabase, Neon, Railway, etc.

## 📝 License

This project is built for demonstration purposes.

## 🤝 Contributing

This is a complete implementation. To extend it, consider adding:
- Email notifications for coupon approvals
- Coupon favorites/bookmarks
- Search and advanced filtering
- Analytics dashboard
- Social sharing features
- Multi-currency support
