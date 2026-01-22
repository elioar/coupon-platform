import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import crypto from "crypto"

// POST - Seed fake community deals with votes and comments
export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    // Get all users (we'll use them for deals, votes, and comments)
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ["USER", "BUSINESS"],
        },
      },
      take: 20, // Use up to 20 users
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No users found. Please create some users first." },
        { status: 400 }
      )
    }

    // Generate a unique seed group ID for this batch
    const seedGroupId = `seed-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Sample deal data
    const fakeDeals = [
      {
        title: "50% Off Pizza at Tony's",
        description: "Amazing pizza deal! Get 50% off on all pizzas. Valid for dine-in and takeout. Don't miss out!",
        category: "Food & Dining",
        location: "Tony's Pizza, Tsimiski 45, Thessaloniki, Greece",
        latitude: 40.6401,
        longitude: 22.9444,
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
        couponCode: "PIZZA50",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: "Free Coffee with Any Purchase",
        description: "Buy anything and get a free coffee! Perfect for your morning routine.",
        category: "Food & Dining",
        location: "Coffee House, Aristotelous Square, Thessaloniki, Greece",
        latitude: 40.6328,
        longitude: 22.9444,
        imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
        couponCode: null,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        title: "30% Off All Electronics",
        description: "Huge sale on electronics! TVs, laptops, phones, and more. Limited stock!",
        category: "Electronics",
        location: "Tech Store, Mitropoleos 15, Thessaloniki, Greece",
        latitude: 40.6389,
        longitude: 22.9444,
        imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800",
        couponCode: "TECH30",
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
      {
        title: "Buy 2 Get 1 Free - Fashion",
        description: "Amazing fashion deal! Buy 2 items and get 1 free. All brands included.",
        category: "Fashion",
        location: "Fashion Boutique, Egnatia 78, Thessaloniki, Greece",
        latitude: 40.6401,
        longitude: 22.9444,
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
        couponCode: "FASHION2+1",
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      },
      {
        title: "Spa Day - 40% Off",
        description: "Relax and unwind! Get 40% off on all spa treatments. Book your appointment now!",
        category: "Beauty & Health",
        location: "Luxury Spa, Nikis Avenue 12, Thessaloniki, Greece",
        latitude: 40.6250,
        longitude: 22.9500,
        imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
        couponCode: "SPA40",
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
      {
        title: "Gym Membership - 20% Off",
        description: "Start your fitness journey! Get 20% off on monthly gym membership. First month free!",
        category: "Sports & Fitness",
        location: "Fitness Center, Agiou Dimitriou 85, Thessaloniki, Greece",
        latitude: 40.6450,
        longitude: 22.9400,
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
        couponCode: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        title: "Movie Tickets - 2 for 1",
        description: "Perfect date night! Buy one movie ticket and get one free. All movies included.",
        category: "Entertainment",
        location: "Cinema Complex, Tsimiski 120, Thessaloniki, Greece",
        latitude: 40.6389,
        longitude: 22.9444,
        imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
        couponCode: "MOVIE2+1",
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      },
      {
        title: "Home Decor Sale - Up to 50% Off",
        description: "Transform your home! Massive sale on furniture, decorations, and more.",
        category: "Home & Garden",
        location: "Home Store, Egnatia 200, Thessaloniki, Greece",
        latitude: 40.6500,
        longitude: 22.9350,
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
        couponCode: "HOME50",
        expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      },
      {
        title: "Travel Package - Early Bird Discount",
        description: "Book your next vacation! Get 25% off on all travel packages. Limited time offer!",
        category: "Travel",
        location: "Travel Agency, Aristotelous Square 5, Thessaloniki, Greece",
        latitude: 40.6328,
        longitude: 22.9444,
        imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
        couponCode: "TRAVEL25",
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      },
      {
        title: "Beauty Products - Buy 1 Get 1",
        description: "Stock up on your favorite beauty products! Buy one get one free on selected items.",
        category: "Beauty & Health",
        location: "Beauty Shop, Mitropoleos 25, Thessaloniki, Greece",
        latitude: 40.6389,
        longitude: 22.9444,
        imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
        couponCode: null,
        expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      },
    ]

    const createdDeals = []
    const sampleComments = [
      "Great deal! Thanks for sharing!",
      "Just used this, it works perfectly!",
      "Amazing offer, definitely worth it!",
      "Has anyone tried this? Is it legit?",
      "Perfect timing, I needed this!",
      "Thanks for the tip!",
      "Works great, highly recommend!",
      "Is this still valid?",
      "Just redeemed, thanks!",
      "Great find!",
      "Does this work online?",
      "Perfect for my needs!",
      "Thanks for sharing this deal!",
      "Is there a minimum purchase?",
      "Great value for money!",
    ]

    // Create deals with votes and comments
    for (const dealData of fakeDeals) {
      // Pick a random user as the deal creator
      const creator = users[Math.floor(Math.random() * users.length)]

      // Create the deal
      const deal = await prisma.communityDeal.create({
        data: {
          id: crypto.randomBytes(16).toString("hex"),
          title: dealData.title,
          description: dealData.description,
          category: dealData.category,
          location: dealData.location,
          latitude: dealData.latitude,
          longitude: dealData.longitude,
          imageUrl: dealData.imageUrl,
          couponCode: dealData.couponCode,
          userId: creator.id,
          expiresAt: dealData.expiresAt,
          status: "APPROVED",
          seedGroupId: seedGroupId,
        },
      })

      createdDeals.push(deal)

      // Add votes (mix of upvotes and downvotes)
      const numVotes = Math.floor(Math.random() * 15) + 5 // 5-20 votes per deal
      const voters = users
        .filter((u) => u.id !== creator.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, numVotes)

      for (const voter of voters) {
        // 80% upvote, 20% downvote
        const isUpvote = Math.random() > 0.2
        await prisma.communityDealVote.create({
          data: {
            id: crypto.randomBytes(16).toString("hex"),
            dealId: deal.id,
            userId: voter.id,
            value: isUpvote ? 1 : -1,
            updatedAt: new Date(),
          },
        })
      }

      // Add comments
      const numComments = Math.floor(Math.random() * 8) + 3 // 3-10 comments per deal
      const commenters = users
        .filter((u) => u.id !== creator.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, numComments)

      for (const commenter of commenters) {
        const commentText =
          sampleComments[Math.floor(Math.random() * sampleComments.length)]
        await prisma.communityDealComment.create({
          data: {
            id: crypto.randomBytes(16).toString("hex"),
            dealId: deal.id,
            userId: commenter.id,
            text: commentText,
            createdAt: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ), // Random time in last 7 days
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdDeals.length} fake community deals with votes and comments`,
      dealsCreated: createdDeals.length,
      seedGroupId: seedGroupId,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error seeding community deals:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

