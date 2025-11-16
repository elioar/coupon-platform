import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

export const MEMBERSHIP_PRICE = 1000; // €10.00 in cents
export const MEMBERSHIP_DURATION_DAYS = 365; // 1 year
