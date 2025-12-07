import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { stripe, MEMBERSHIP_PRICE } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables." },
        { status: 503 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'VibePeek Annual Membership',
              description: 'Unlock unlimited access to all coupon codes for one year',
            },
            unit_amount: MEMBERSHIP_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/en/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/en/membership?canceled=true`,
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      metadata: {
        userId: user.id,
        type: 'membership',
      },
      // Enable automatic tax if configured
      automatic_tax: {
        enabled: false,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

