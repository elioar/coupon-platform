import Stripe from 'stripe';

// Stripe is optional - only initialize if STRIPE_SECRET_KEY is provided
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  : null;

export const MEMBERSHIP_PRICE = 1000; // €10.00 in cents
export const MEMBERSHIP_DURATION_DAYS = 365; // 1 year

