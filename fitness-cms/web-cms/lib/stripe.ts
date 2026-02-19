import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Client-side Stripe promise
let stripePromise: Promise<StripeClient | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Re-export from constants so existing server-side imports continue to work
import { PLATFORM_FEE_PERCENT } from './constants';
export { PLATFORM_FEE_PERCENT };

// Calculate platform fee
export const calculatePlatformFee = (amount: number) => {
  return Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
};
