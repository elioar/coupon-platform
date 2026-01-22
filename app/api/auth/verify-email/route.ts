import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const verifySchema = z.object({
  token: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifySchema.parse(body)

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { User: true },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(verificationToken.expiresAt) < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      })
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      )
    }

    // Check if email is already verified
    if (verificationToken.User.emailVerified) {
      // Delete token since it's already used
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      })
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Update user email verification status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

