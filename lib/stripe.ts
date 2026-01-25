import Stripe from 'stripe';

// Initialize Stripe lazily to avoid build-time errors when env vars are not set
let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    
    // Initialize Stripe with the latest API version
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-11-17.clover", // Latest stable API version for Stripe SDK 20.0.0
      typescript: true,
      maxNetworkRetries: 2,
      timeout: 20000,
    });
    
    // Verify we're using test keys in development
    if (process.env.NODE_ENV !== 'production' && !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      console.warn('⚠️  WARNING: Using non-test Stripe key in non-production environment!');
    }
  }
  return stripeInstance;
}

// Export a proxy that lazily initializes Stripe
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient();
    return (client as any)[prop];
  }
});

export const MEMBERSHIP_PRICE = 500; // €5.00 in cents
export const MEMBERSHIP_DURATION_DAYS = 365; // 1 year
