import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { z } from "zod"

const createCategorySchema = z.object({
  nameEn: z.string().min(2).max(50),
  nameEl: z.string().min(2).max(50),
  slug: z.string().min(2).max(50),
})

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        nameEn: 'asc',
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    const category = await prisma.category.create({
      data: validatedData,
    })

    return NextResponse.json(
      { message: "Category created successfully", category },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

