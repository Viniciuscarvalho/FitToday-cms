# FitToday Stripe API Documentation

This document describes the Stripe payment API for the FitToday mobile app.

## Base URL

```
Production: https://fittoday-cms.vercel.app/api/stripe
Development: http://localhost:3001/api/stripe
```

## Platform Fee

The platform fee is **10%** on all transactions. The trainer receives 90% of the sale value.

---

## Endpoints

### 1. Create Checkout Session

Creates a Stripe Checkout session for purchasing a program.

**Endpoint:** `POST /checkout`

#### Request Body

```typescript
{
  // Required
  programId: string;           // Firestore program ID
  trainerId: string;           // Firestore trainer ID
  trainerStripeAccountId: string; // Trainer's Stripe Connected Account ID
  studentId: string;           // Firestore student ID

  // For one-time payment (mode: 'payment')
  price: number;               // Price in CENTS (e.g., 9900 for R$99.00)
  programName?: string;        // Display name for checkout
  programDescription?: string; // Description for checkout

  // For recurring subscription (mode: 'subscription')
  priceId?: string;            // Stripe Price ID (created via /prices endpoint)
  mode?: 'payment' | 'subscription'; // Default: 'payment'

  // Optional
  currency?: string;           // Default: 'brl'
  studentEmail?: string;       // Pre-fills email in checkout
  successUrl?: string;         // Redirect after success (use deep link for mobile)
  cancelUrl?: string;          // Redirect after cancel (use deep link for mobile)
}
```

#### Response (Success - 200)

```typescript
{
  sessionId: string;           // Stripe Checkout Session ID
  url: string;                 // URL to redirect user to Stripe Checkout
  mode: 'payment' | 'subscription';
  platformFee?: number;        // Only for payment mode, in cents
  trainerEarnings?: number;    // Only for payment mode, in cents
}
```

#### Example: One-Time Purchase

```bash
curl -X POST https://fittoday-cms.vercel.app/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "abc123",
    "programName": "Hipertrofia em 12 Semanas",
    "programDescription": "Programa completo de ganho de massa muscular",
    "price": 9700,
    "trainerId": "trainer456",
    "trainerStripeAccountId": "acct_xxxxx",
    "studentId": "student789",
    "studentEmail": "aluno@email.com",
    "successUrl": "fittoday://checkout/success",
    "cancelUrl": "fittoday://checkout/cancel"
  }'
```

#### Example: Monthly Subscription

```bash
curl -X POST https://fittoday-cms.vercel.app/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "abc123",
    "mode": "subscription",
    "priceId": "price_xxxxx",
    "trainerId": "trainer456",
    "trainerStripeAccountId": "acct_xxxxx",
    "studentId": "student789",
    "studentEmail": "aluno@email.com",
    "successUrl": "fittoday://checkout/success",
    "cancelUrl": "fittoday://checkout/cancel"
  }'
```

---

### 2. Get Checkout Session

Retrieves details of a checkout session (useful after redirect).

**Endpoint:** `GET /checkout?sessionId={sessionId}`

#### Response (Success - 200)

```typescript
{
  id: string;
  status: 'open' | 'complete' | 'expired';
  mode: 'payment' | 'subscription';
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required';
  amountTotal: number;         // Total in cents
  currency: string;
  customerEmail: string | null;
  metadata: {
    trainerId: string;
    programId: string;
    studentId: string;
  };
  subscription?: {             // Only for subscription mode
    id: string;
    status: string;
    currentPeriodEnd: number;  // Unix timestamp
  };
}
```

---

### 3. Create Product (for Subscriptions)

Creates a Stripe Product for a program (required before creating prices).

**Endpoint:** `POST /products`

#### Request Body

```typescript
{
  programId: string;
  name: string;
  description?: string;
  trainerId: string;
  trainerStripeAccountId: string;
  imageUrl?: string;
}
```

#### Response (Success - 200)

```typescript
{
  productId: string;           // Stripe Product ID
  name: string;
  description: string | null;
  active: boolean;
}
```

---

### 4. Create Price (for Subscriptions)

Creates a Stripe Price for a product.

**Endpoint:** `POST /prices`

#### Request Body

```typescript
{
  productId: string;           // From /products response
  programId: string;
  trainerId: string;
  trainerStripeAccountId: string;
  unitAmount: number;          // Price in cents
  currency?: string;           // Default: 'brl'
  recurring?: {
    interval: 'month' | 'year';
    intervalCount?: number;    // Default: 1
  };
}
```

#### Response (Success - 200)

```typescript
{
  priceId: string;             // Use this in /checkout for subscriptions
  productId: string;
  unitAmount: number;
  currency: string;
  type: 'one_time' | 'recurring';
  recurring?: {
    interval: string;
    intervalCount: number;
  };
  active: boolean;
}
```

---

## Mobile App Integration

### Deep Links for Success/Cancel

Configure your app to handle these deep links:

```
fittoday://checkout/success?session_id={CHECKOUT_SESSION_ID}
fittoday://checkout/cancel
```

### Recommended Flow

1. **One-Time Purchase:**
   ```
   App → POST /checkout (mode: 'payment') → Open URL → Stripe Checkout → Deep Link → App
   ```

2. **Subscription:**
   ```
   App → POST /products → POST /prices → POST /checkout (mode: 'subscription') → Open URL → Stripe Checkout → Deep Link → App
   ```

### After Payment Success

The webhook automatically:
- Creates `subscriptions` document in Firestore
- Creates `transactions` document in Firestore
- Updates trainer's `financial.totalEarnings`
- Grants program access to student (`users/{studentId}.programs.{programId}`)

The app should:
1. Call `GET /checkout?sessionId={id}` to verify payment status
2. Refresh user data from Firestore to get new program access

---

## Firestore Data Models

### Collection: `subscriptions`

```typescript
{
  id: string;
  studentId: string;
  trainerId: string;
  programId: string;
  stripeSubscriptionId?: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'expired';
  type: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
  price: number;               // cents
  platformFee: number;         // cents
  trainerEarnings: number;     // cents
  currency: string;
  startDate: Timestamp;
  currentPeriodEnd?: Timestamp;
  createdAt: Timestamp;
}
```

### Collection: `transactions`

```typescript
{
  id: string;
  subscriptionId: string;
  trainerId: string;
  studentId: string;
  programId: string;
  type: 'purchase' | 'renewal' | 'refund';
  grossAmount: number;         // cents
  platformFee: number;         // cents
  netAmount: number;           // cents (trainer earnings)
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  createdAt: Timestamp;
}
```

---

## Testing

### Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | 3D Secure required |

### Test with Webhook

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

### Verify in Firestore

After a successful test payment, check:
- `subscriptions` collection for new document
- `transactions` collection for new document
- `users/{trainerId}.financial.totalEarnings` updated
- `users/{studentId}.programs.{programId}` created
