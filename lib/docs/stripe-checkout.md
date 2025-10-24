// lib/docs/stripe-checkout.md
/*
Minimal Stripe Checkout (serverless):
- POST /api/checkout → stripe.checkout.sessions.create({ mode:"payment", line_items:[{price: PRICE_ID, quantity:1}], success_url, cancel_url })
- Use localStorage flag to hide ads for premium users.
*/