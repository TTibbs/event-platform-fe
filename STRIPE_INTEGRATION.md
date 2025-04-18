# Stripe Integration for Event Ticket Payments

This document outlines the implementation of Stripe payments in the Events Platform application, allowing users to purchase tickets for events.

## Frontend Implementation

The frontend implementation consists of the following components:

### 1. Stripe API Client (`src/api/stripe.ts`)

A dedicated API module for interacting with Stripe-related endpoints:

```typescript
// Key methods:
- createCheckoutSession(eventId, userId) - Creates a Stripe checkout session
- syncPaymentStatus(sessionId) - Syncs payment status after successful payment
```

These methods align with the backend routes:

- POST `/stripe/create-checkout-session` - Creates a checkout session (authenticated, requires eventId and userId)
- POST `/stripe/sync-payment/:sessionId` - Syncs payment status after successful payment (authenticated)
- POST `/stripe/webhook` - Webhook handler for Stripe events (handled by backend only)

### 2. Checkout Component (`src/components/payment/StripeTicketCheckout.tsx`)

A reusable React component for initiating the Stripe checkout flow:

```typescript
<StripeTicketCheckout event={event} buttonText="Buy Ticket" />
```

### 3. Payment Success Page (`src/pages/payment/PaymentSuccess.tsx`)

Handles the redirect after successful payment, syncing payment data with the backend and showing a success message.

## Backend Implementation Guide

For the backend team, you'll need to implement the following endpoints to support the Stripe integration:

### 1. Create Checkout Session Endpoint (`POST /stripe/create-checkout-session`)

```javascript
// Required environment variables in .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

// Example implementation (Node.js with Express)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Make sure this endpoint is protected with authentication middleware
app.post('/api/stripe/create-checkout-session', authenticateUser, async (req, res) => {
  const { eventId } = req.body;
  // The user ID comes from the authenticated session
  const userId = req.user.id;

  try {
    // Get event details from database
    const event = await db.events.findById(eventId);

    // Create or get Stripe customer for this user
    let stripeCustomerId = await db.users.getStripeCustomerId(userId);
    if (!stripeCustomerId) {
      const user = await db.users.findById(userId);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      stripeCustomerId = customer.id;
      await db.users.saveStripeCustomerId(userId, stripeCustomerId);
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Ticket for ${event.title}`,
              description: event.description || 'Event ticket',
            },
            unit_amount: Math.round(event.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/events/${eventId}`,
      metadata: {
        eventId,
        userId
      }
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ message: error.message });
  }
});
```

### 2. Sync Payment Status Endpoint (`POST /stripe/sync-payment/:sessionId`)

```javascript
// Make sure this endpoint is protected with authentication middleware
app.post(
  "/api/stripe/sync-payment/:sessionId",
  authenticateUser,
  async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id; // From authenticated session

    try {
      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify the session belongs to this user for security
      if (session.metadata.userId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to payment session",
        });
      }

      // Check if payment was successful
      if (session.payment_status === "paid") {
        const { eventId } = session.metadata;

        // Create a payment record
        const payment = await db.payments.create({
          user_id: userId,
          event_id: eventId,
          stripe_session_id: sessionId,
          stripe_payment_intent_id: session.payment_intent,
          amount: session.amount_total / 100, // Convert from cents
          currency: session.currency,
          status: "completed",
          payment_method_type: session.payment_method_types[0] || "card",
        });

        // Create a ticket record in the database
        const ticket = await db.tickets.create({
          event_id: eventId,
          user_id: userId,
          paid: true,
          payment_id: payment.id,
          registration_id: await db.registrations.getOrCreate(eventId, userId),
          status: "active",
          ticket_code: generateUniqueTicketCode(),
        });

        // Return the created ticket
        return res.json({ success: true, ticket });
      }

      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    } catch (error) {
      console.error("Error syncing payment:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);
```

### 3. Stripe Webhook Handler

```javascript
// This endpoint should NOT have authentication as it's called by Stripe
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }), // Raw body parser for signature verification
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle specific events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // Process the successful payment - create ticket, etc.
        await processSuccessfulPayment(session);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        // Handle failed payment
        await handleFailedPayment(paymentIntent);
        break;
      }
      // Handle other event types as needed
    }

    return res.json({ received: true });
  }
);
```

## Database Schema Requirements

Implementing Stripe payments requires specific database schema changes to properly track payment information and maintain relationships between users, tickets, and payments.

### 1. Update Users Table

Add a column to store the Stripe customer ID for each user:

```sql
ALTER TABLE users
ADD COLUMN stripe_customer_id VARCHAR(255);
```

This allows you to:

- Associate your application users with Stripe customers
- Quickly retrieve customer payment methods
- Enable recurring payments and subscriptions in the future
- Maintain payment preferences across multiple transactions

### 2. Create Payments Table

Create a dedicated table to track all payment transactions:

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  ticket_id INTEGER REFERENCES tickets(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  stripe_session_id VARCHAR(255) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method_type VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_ticket_id ON payments(ticket_id);
CREATE INDEX idx_payments_event_id ON payments(event_id);
CREATE INDEX idx_payments_stripe_session_id ON payments(stripe_session_id);
```

This table serves several important purposes:

- Creates an audit trail of all payment attempts
- Links payments to users, events, and tickets
- Stores Stripe session and payment intent IDs for reconciliation
- Enables financial reporting and revenue tracking
- Provides data for refund processing

### 3. Update Tickets Table

Ensure the tickets table has the necessary fields to track payment status:

```sql
-- If you need to add a payment_id column to link to payments table
ALTER TABLE tickets
ADD COLUMN payment_id INTEGER REFERENCES payments(id);

-- If you need to ensure the paid field exists
ALTER TABLE tickets
ADD COLUMN paid BOOLEAN DEFAULT FALSE;
```

These changes create a clear relationship between tickets and their associated payments, enabling:

- Quick verification of ticket payment status
- Ability to link back to payment details for customer support
- Support for ticket transfers, refunds, or cancellations

### 4. Database Schema Diagram

```
┌───────────────┐     ┌────────────────┐     ┌──────────────┐
│               │     │                │     │              │
│     users     │     │    payments    │     │    tickets   │
│               │     │                │     │              │
├───────────────┤     ├────────────────┤     ├──────────────┤
│ id            │     │ id             │     │ id           │
│ email         │     │ user_id        │────▶│ event_id     │
│ username      │     │ ticket_id      │◀────│ user_id      │
│ ...           │     │ event_id       │     │ registration_id
│ stripe_       │◀────│ stripe_        │     │ paid         │
│ customer_id   │     │ session_id     │     │ payment_id   │
└───────────────┘     │ stripe_        │     │ ticket_code  │
                      │ payment_intent_id     │ status      │
                      │ amount         │     │ ...          │
                      │ currency       │     └──────────────┘
                      │ status         │
                      │ payment_method_type
                      │ created_at     │
                      │ updated_at     │
                      └────────────────┘
```

### 5. Implementation Considerations

When implementing these database changes:

- Add database migrations to apply these changes in a controlled manner
- Consider adding indexes on frequently queried columns
- Implement database transactions when creating payments and tickets to ensure data consistency
- Set up proper cascading delete rules if appropriate for your business logic
- Consider adding additional fields to support future features (e.g., subscription_id for recurring events)

## Testing in Development

When testing in development:

1. Use Stripe test mode and test cards:

   - Test successful payment: 4242 4242 4242 4242
   - Test authentication required: 4000 0025 0000 3155
   - Test payment declined: 4000 0000 0000 9995

2. Use Stripe CLI to forward webhooks to your local environment:

   ```
   stripe listen --forward-to localhost:9090/api/stripe/webhook
   ```

3. Ensure test mode is enabled in all Stripe API calls.

## Production Considerations

1. Keep Stripe Secret Key secure - never expose it in frontend code
2. Create separate test and production API keys
3. Set up proper error handling and logging for payment failures
4. Implement idempotency to prevent duplicate charges
5. Consider saving user payment methods for faster checkout (requires additional PCI compliance)
6. Set up proper webhook signature verification
7. Add monitoring for payment events

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Testing Stripe](https://stripe.com/docs/testing)
