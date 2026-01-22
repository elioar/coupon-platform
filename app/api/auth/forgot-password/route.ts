import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { z } from "zod"
import crypto from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  locale: z.string().optional().default("en"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, locale } = forgotPasswordSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset email has been sent." },
        { status: 200 }
      )
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Generate new password reset token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

    // Create password reset token
    await prisma.passwordResetToken.create({
      data: {
        id: crypto.randomBytes(16).toString("hex"),
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, token, locale)
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json(
      { message: "Password reset email sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

