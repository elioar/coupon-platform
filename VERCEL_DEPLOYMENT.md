# Vercel Deployment Guide

## Required Environment Variables

Make sure to add these environment variables in your Vercel project settings:

### Database
- `DATABASE_URL` - Your PostgreSQL connection string (e.g., from Supabase, Neon, or Railway)

### NextAuth
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

### Stripe
- `STRIPE_SECRET_KEY` - Your Stripe secret key (use production keys for production)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (set up webhook in Stripe dashboard)

### App Configuration
- `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

### Prisma Accelerate (Optional)
- `PRISMA_ACCELERATE_URL` - Only if you're using Prisma Accelerate. If not set, the app will use direct database connections.

## Database Setup

1. **Create a PostgreSQL database** (recommended services):
   - [Supabase](https://supabase.com) - Free tier available
   - [Neon](https://neon.tech) - Free tier available
   - [Railway](https://railway.app) - Free tier available

2. **Run migrations**:
   After your first deployment, you'll need to run Prisma migrations. You can do this by:
   - Using Vercel's CLI: `vercel env pull` then `npx prisma migrate deploy`
   - Or connecting to your database directly and running: `npx prisma migrate deploy`

## Stripe Webhook Setup

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel

## Common Issues

### Build Fails with Prisma Error
- Make sure `DATABASE_URL` is set in Vercel environment variables
- Ensure the database is accessible from Vercel's IP ranges

### Authentication Not Working
- Verify `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your Vercel deployment URL exactly

### Stripe Payments Not Working
- Verify all Stripe keys are set correctly
- Check that webhook endpoint is configured in Stripe dashboard
- Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook secret from Stripe

### Database Connection Timeout
- Check that your database allows connections from Vercel's IP ranges
- For some providers, you may need to whitelist Vercel's IPs or use connection pooling

## Deployment Steps

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables listed above
4. Deploy
5. Run database migrations (if not done automatically)
6. Set up Stripe webhook endpoint
7. Test the deployment

