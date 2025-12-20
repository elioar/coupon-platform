import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import { z } from "zod"
import crypto from "crypto"

const resendSchema = z.object({
  email: z.string().email(),
  locale: z.string().optional().default("en"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, locale } = resendSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json(
        { message: "If an account exists with this email, a verification email has been sent." },
        { status: 200 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    })

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiry

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, token, locale)
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

