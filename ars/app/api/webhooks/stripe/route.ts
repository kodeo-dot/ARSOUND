import { NextResponse } from "next/server"

/**
 * Stripe Webhook Handler
 *
 * TODO: Complete this integration when ready to accept payments
 *
 * Setup Instructions:
 * 1. Install Stripe: npm install stripe
 * 2. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to environment variables
 * 3. Configure webhook in Stripe dashboard to point to: your-domain.com/api/webhooks/stripe
 * 4. Listen for events: checkout.session.completed, invoice.paid, customer.subscription.deleted
 *
 * How it works:
 * - User completes payment on Stripe → Stripe sends webhook
 * - We verify the webhook signature for security
 * - We extract user_id and plan_type from metadata
 * - We call updateUserPlan() to activate the subscription in our database
 */
export async function POST(req: Request) {
  try {
    // Uncomment when ready to integrate Stripe:

    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // const body = await req.text()
    // const signature = headers().get("stripe-signature")!

    // let event
    // try {
    //   event = stripe.webhooks.constructEvent(
    //     body,
    //     signature,
    //     process.env.STRIPE_WEBHOOK_SECRET!
    //   )
    // } catch (err: any) {
    //   console.error(`[v0] Webhook signature verification failed: ${err.message}`)
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    // }

    // Handle the event
    // switch (event.type) {
    //   case 'checkout.session.completed':
    //     const session = event.data.object
    //     const userId = session.metadata?.user_id
    //     const planType = session.metadata?.plan_type

    //     if (userId && planType) {
    //       // Calculate expiration (30 days from now for monthly plans)
    //       const expiresAt = new Date()
    //       expiresAt.setDate(expiresAt.getDate() + 30)

    //       await updateUserPlan(userId, planType as any, expiresAt)
    //       console.log(`[v0] Plan activated for user ${userId}: ${planType}`)
    //     }
    //     break

    //   case 'customer.subscription.deleted':
    //     const subscription = event.data.object
    //     const cancelUserId = subscription.metadata?.user_id

    //     if (cancelUserId) {
    //       // Downgrade to free plan
    //       await updateUserPlan(cancelUserId, 'free', null)
    //       console.log(`[v0] Subscription cancelled, user ${cancelUserId} downgraded to free`)
    //     }
    //     break
    // }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
