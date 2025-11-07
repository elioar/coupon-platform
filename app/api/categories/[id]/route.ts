import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { z } from "zod"

const updateCategorySchema = z.object({
  nameEn: z.string().min(2).max(50).optional(),
  nameEl: z.string().min(2).max(50).optional(),
  slug: z.string().min(2).max(50).optional(),
})

// PATCH - Update category (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({
      message: "Category updated successfully",
      category,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete category (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params

    // Check if category has coupons
    const categoryWithCoupons = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { coupons: true }
        }
      }
    })

    if (!categoryWithCoupons) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    if (categoryWithCoupons._count.coupons > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${categoryWithCoupons._count.coupons} active coupons` },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

