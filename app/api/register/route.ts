import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { Role, InviteStatus } from "@prisma/client"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.literal("USER"),
})

const businessSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.literal("BUSINESS"),
  phone: z.string().min(5),
  vatNumber: z.string().min(8),
  categoryId: z.string().min(1),
  address: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  description: z.string().optional().or(z.literal("")),
  website: z.union([z.string().url(), z.literal("")]).optional(),
  instagram: z.union([z.string().url(), z.literal("")]).optional(),
  facebook: z.union([z.string().url(), z.literal("")]).optional(),
  tiktok: z.union([z.string().url(), z.literal("")]).optional(),
  logoUrl: z.string().optional().nullable(),
  businessLatitude: z.number().optional().nullable(),
  businessLongitude: z.number().optional().nullable(),
  inviterId: z.string().optional(),
})

const registerSchema = z.discriminatedUnion("role", [userSchema, businessSchema])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const baseUserData = {
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      role: validatedData.role as Role,
    }

    const user = await prisma.user.create({
      data:
        validatedData.role === "BUSINESS"
          ? {
              ...baseUserData,
              phone: validatedData.phone,
              businessLocation: validatedData.address,
              businessLatitude: validatedData.businessLatitude ?? null,
              businessLongitude: validatedData.businessLongitude ?? null,
              businessCategories: [validatedData.categoryId],
              businessWebsite: validatedData.website || null,
              businessInstagram: validatedData.instagram || null,
              businessFacebook: validatedData.facebook || null,
              businessTikTok: validatedData.tiktok || null,
              businessDescription: JSON.stringify({
                raw: validatedData.description || "",
                vatNumber: validatedData.vatNumber,
                city: validatedData.city ?? "",
                postalCode: validatedData.postalCode ?? "",
                logoUrl:
                  validatedData.logoUrl && validatedData.logoUrl.length <= 120
                    ? validatedData.logoUrl
                    : "",
              }),
            }
          : baseUserData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // Handle invite if provided and this is a business registration
    if (validatedData.role === "BUSINESS" && validatedData.inviterId) {
      try {
        // Verify inviter exists
        const inviter = await prisma.user.findUnique({
          where: { id: validatedData.inviterId },
        })

        if (inviter) {
          // Create invite record with REGISTERED status
          await prisma.businessInvite.create({
            data: {
              inviterId: validatedData.inviterId,
              invitedBusinessId: user.id,
              status: InviteStatus.REGISTERED,
            },
          })
        }
      } catch (error) {
        // Log error but don't fail registration if invite handling fails
        console.error("Error creating invite record:", error)
      }
    }

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
