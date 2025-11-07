# CouponMe Setup Guide

This guide will help you get CouponMe up and running on your local machine.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd coupon-me
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a new database:
   ```sql
   CREATE DATABASE couponme;
   ```
3. Note your connection string: `postgresql://user:password@localhost:5432/couponme`

#### Option B: Docker
```bash
docker run --name couponme-postgres \
  -e POSTGRES_DB=couponme \
  -e POSTGRES_USER=couponme \
  -e POSTGRES_PASSWORD=couponme123 \
  -p 5432:5432 \
  -d postgres:15
```

#### Option C: Cloud Database (Recommended for production)
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app (Free tier available)

### 3. Configure Environment Variables

Create a `.env` file in the `coupon-me` directory:

```env
# Database - Update with your actual database URL
DATABASE_URL="postgresql://couponme:couponme123@localhost:5432/couponme?schema=public"

# NextAuth - Generate a secret key
# Run: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set Up Stripe

1. Create a Stripe account: https://dashboard.stripe.com/register
2. Get your API keys from: https://dashboard.stripe.com/test/apikeys
3. Copy the secret key to `.env` as `STRIPE_SECRET_KEY`
4. Copy the publishable key to `.env` as `STRIPE_PUBLISHABLE_KEY`

For webhook testing locally:
```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe
# Or download from: https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret (starts with whsec_) to .env
```

### 5. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 6. Seed Initial Data

You need to create categories for the coupons. You can do this via Prisma Studio or directly:

```bash
npx prisma studio
```

Then in the Category table, add these categories:

| nameEn       | nameEl              | slug         |
|------------- |---------------------|------------- |
| Fashion      | Μόδα                | fashion      |
| Electronics  | Ηλεκτρονικά         | electronics  |
| Food         | Φαγητό              | food         |
| Travel       | Ταξίδια             | travel       |
| Beauty       | Ομορφιά             | beauty       |
| Home         | Σπίτι               | home         |
| Sports       | Αθλητισμός          | sports       |
| Entertainment| Ψυχαγωγία           | entertainment|

### 7. Create Admin User

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Click "Register" and create a new account

4. Open Prisma Studio: 
   ```bash
   npx prisma studio
   ```

5. In the User table, find your user and change `role` from `USER` to `ADMIN`

6. Refresh your browser and you should now have access to the admin dashboard

### 8. Test the Application

#### As Admin:
1. Go to `/en/dashboard/admin`
2. View pending coupons, users, and statistics
3. Approve or reject coupons

#### As Business:
1. Register a new business account (select "Business" during registration)
2. Go to `/en/dashboard/business`
3. Create a test coupon
4. Wait for admin approval (or approve it yourself as admin)

#### As User:
1. Register a new user account
2. Browse coupons at `/en/coupons`
3. Notice that coupon codes are blurred
4. Go to `/en/membership` to subscribe
5. Use test card: `4242 4242 4242 4242`, any future date, any CVC
6. After payment, coupon codes should be visible

## Common Issues

### Database Connection Error
```
Error: P1001: Can't reach database server
```
**Solution**: Check that PostgreSQL is running and DATABASE_URL is correct

### Prisma Generate Error
```
Error: @prisma/client did not initialize yet
```
**Solution**: Run `npx prisma generate`

### NextAuth Error
```
[next-auth][error][NO_SECRET]
```
**Solution**: Make sure NEXTAUTH_SECRET is set in .env

### Stripe Webhook Error
```
Error: No signatures found matching the expected signature
```
**Solution**: 
1. Make sure Stripe CLI is running with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Copy the webhook secret to .env

### Upload Directory Error
```
ENOENT: no such file or directory, open '.../public/uploads/coupons/...'
```
**Solution**: Create the directory:
```bash
mkdir -p public/uploads/coupons
```

## Production Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
- Update `NEXTAUTH_URL` to your production domain
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Use production Stripe keys
- Set up Stripe webhook endpoint in Stripe dashboard pointing to: `https://yourdomain.com/api/webhooks/stripe`

## Next Steps

1. Customize the branding (colors, logo)
2. Add more categories
3. Configure email notifications (optional)
4. Set up monitoring and analytics
5. Configure backup strategy for database
6. Set up proper file storage (e.g., Cloudinary, AWS S3) for production

## Support

For issues or questions, check the README.md or review the code comments.

