/**
 * One-time script to create FitToday Pro and Elite products/prices in Stripe.
 * Run with: npx tsx scripts/setup-stripe-plans.ts
 *
 * After running, copy the printed price IDs to your .env.local:
 *   STRIPE_PRO_PRICE_ID=price_xxx
 *   STRIPE_ELITE_PRICE_ID=price_xxx
 */

import Stripe from 'stripe';

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('Error: STRIPE_SECRET_KEY is not set in environment');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2026-01-28.clover' as any,
  });

  console.log('Creating FitToday platform subscription plans in Stripe...\n');

  // Create Pro product + price
  const proProduct = await stripe.products.create({
    name: 'FitToday Pro',
    description: 'Plano Pro FitToday — alunos ilimitados, analytics avançado, comissão 5%',
    metadata: { plan: 'pro' },
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 9700, // R$97.00 in centavos
    currency: 'brl',
    recurring: { interval: 'month' },
    nickname: 'FitToday Pro Mensal',
    metadata: { plan: 'pro' },
  });

  console.log('Pro plan created:');
  console.log(`  Product ID: ${proProduct.id}`);
  console.log(`  Price ID:   ${proPrice.id}`);

  // Create Elite product + price
  const eliteProduct = await stripe.products.create({
    name: 'FitToday Elite',
    description: 'Plano Elite FitToday — tudo do Pro + marca própria, suporte prioritário, 0% comissão',
    metadata: { plan: 'elite' },
  });

  const elitePrice = await stripe.prices.create({
    product: eliteProduct.id,
    unit_amount: 19700, // R$197.00 in centavos
    currency: 'brl',
    recurring: { interval: 'month' },
    nickname: 'FitToday Elite Mensal',
    metadata: { plan: 'elite' },
  });

  console.log('\nElite plan created:');
  console.log(`  Product ID: ${eliteProduct.id}`);
  console.log(`  Price ID:   ${elitePrice.id}`);

  console.log('\n--- Add these to your .env.local and Vercel environment ---');
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log(`STRIPE_ELITE_PRICE_ID=${elitePrice.id}`);
  console.log(`NEXT_PUBLIC_APP_URL=https://fittoday.me`);
  console.log('-----------------------------------------------------------');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
