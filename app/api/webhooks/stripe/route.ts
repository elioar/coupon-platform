import { NextRequest, NextResponse } from "next/server"
import { stripe, MEMBERSHIP_DURATION_DAYS } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Extract user ID from metadata
        const userId = session.metadata?.userId || session.client_reference_id

        if (!userId) {
          console.error("No user ID found in checkout session")
          return NextResponse.json(
            { error: "No user ID found" },
            { status: 400 }
          )
        }

        // Calculate membership expiry date (1 year from now)
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + MEMBERSHIP_DURATION_DAYS)

        // Update user's membership expiry
        await prisma.user.update({
          where: { id: userId },
          data: {
            membershipExpiry: expiryDate,
          },
        })

        console.log(`Membership activated for user ${userId} until ${expiryDate}`)
        break
      }

      case "payment_intent.succeeded": {
        console.log("Payment succeeded:", event.data.object.id)
        break
      }

      case "payment_intent.payment_failed": {
        console.log("Payment failed:", event.data.object.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling webhook:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

