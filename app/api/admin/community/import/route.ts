import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { extractDealFromUrl } from "@/lib/ai-extraction"
import { z } from "zod"
import { DealSourceType, CommunityDealStatus, DealPriceType, DealOrigin } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const importDealSchema = z.object({
  url: z.string().url(),
})

/**
 * Get or create system user for AI imports
 */
async function getOrCreateSystemUser() {
  const systemEmail = "ai-import@system.local"
  
  let systemUser = await prisma.user.findUnique({
    where: { email: systemEmail },
  })

  if (!systemUser) {
    // Create system user with a random password (won't be used for login)
    const randomPassword = await bcrypt.hash(
      `system-${Date.now()}-${Math.random()}`,
      10
    )
    
    systemUser = await prisma.user.create({
      data: {
        id: crypto.randomBytes(16).toString("hex"),
        email: systemEmail,
        password: randomPassword,
        name: "AI Import Bot",
        role: "USER",
        emailVerified: true,
        updatedAt: new Date(),
      },
    })
  }

  return systemUser
}

// POST - Import deal from URL
export async function POST(request: NextRequest) {
  try {
    console.log("[IMPORT] Starting import process...")
    const admin = await requireRole(["ADMIN"])
    console.log("[IMPORT] Admin authenticated:", admin.email)

    const body = await request.json()
    console.log("[IMPORT] Request body received:", { url: body.url })
    
    const validation = importDealSchema.safeParse(body)
    
    if (!validation.success) {
      console.log("[IMPORT] Validation failed:", validation.error.issues)
      return NextResponse.json(
        { error: "Invalid URL format", issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { url } = validation.data
    console.log("[IMPORT] Valid URL:", url)

    // Extract deal information using AI
    console.log("[IMPORT] Starting AI extraction...")
    const extractionResult = await extractDealFromUrl(url)
    console.log("[IMPORT] Extraction result:", {
      isDeal: extractionResult.isDeal,
      dealsCount: extractionResult.deals?.length || (extractionResult.deal ? 1 : 0),
      error: extractionResult.error,
      extractedImageUrl: extractionResult.extractedImageUrl,
    })

    if (!extractionResult.isDeal) {
      console.log("[IMPORT] Extraction failed:", extractionResult.error)
      return NextResponse.json(
        { error: extractionResult.error || "Failed to extract deal information" },
        { status: 400 }
      )
    }

    // Get deals array (multiple deals) or single deal (backward compatibility)
    const dealsToImport = extractionResult.deals || (extractionResult.deal ? [extractionResult.deal] : [])
    console.log("[IMPORT] Deals to import:", dealsToImport.length)

    if (dealsToImport.length === 0) {
      console.log("[IMPORT] No deals found to import")
      return NextResponse.json(
        { error: "No deals found to import" },
        { status: 400 }
      )
    }

    // Get or create system user
    console.log("[IMPORT] Getting or creating system user...")
    const systemUser = await getOrCreateSystemUser()
    console.log("[IMPORT] System user:", systemUser.id)

    // Default image URL (fallback if no image is found)
    const defaultImageUrl =
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"

    // Check for existing deals to avoid duplicates
    // Check all approved/pending/active deals (not just same sourceUrl) to catch duplicates from different sources
    console.log("[IMPORT] Checking for existing deals to avoid duplicates...")
    const existingDeals = await prisma.communityDeal.findMany({
      where: {
        status: {
          in: [CommunityDealStatus.PENDING, CommunityDealStatus.APPROVED],
        },
      },
      select: {
        title: true,
        description: true,
        link: true,
        sourceUrl: true,
      },
    })
    console.log("[IMPORT] Found existing deals in database:", existingDeals.length)

    // Helper function to normalize strings for comparison
    const normalizeString = (str: string | null | undefined): string => {
      if (!str) return ""
      return str.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s]/g, "")
    }

    // Helper function to extract meaningful tokens from a title
    const extractTokens = (str: string): Set<string> => {
      const normalized = normalizeString(str)
      // Split by spaces and filter out very short words (less than 2 chars) and common words
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'το', 'της', 'των', 'τον', 'τα', 'οι', 'οι', 'η', 'ο'])
      return new Set(
        normalized
          .split(/\s+/)
          .filter(token => token.length >= 2 && !stopWords.has(token))
      )
    }

    // Helper function to calculate similarity between two titles (0-1 scale)
    const calculateTitleSimilarity = (title1: string, title2: string): number => {
      const tokens1 = extractTokens(title1)
      const tokens2 = extractTokens(title2)
      
      if (tokens1.size === 0 || tokens2.size === 0) return 0
      
      // Count common tokens
      let commonTokens = 0
      tokens1.forEach(token => {
        if (tokens2.has(token)) {
          commonTokens++
        }
      })
      
      // Calculate Jaccard similarity (intersection over union)
      const unionSize = new Set([...tokens1, ...tokens2]).size
      const similarity = commonTokens / unionSize
      
      return similarity
    }

    // Helper function to normalize URLs for comparison (remove tracking params, trailing slashes)
    const normalizeUrl = (url: string | null | undefined): string => {
      if (!url) return ""
      try {
        const urlObj = new URL(url)
        // Remove common tracking parameters
        urlObj.searchParams.delete("utm_source")
        urlObj.searchParams.delete("utm_medium")
        urlObj.searchParams.delete("utm_campaign")
        urlObj.searchParams.delete("ref")
        urlObj.searchParams.delete("affiliate")
        urlObj.searchParams.delete("source")
        // Remove trailing slash
        return urlObj.toString().replace(/\/$/, "")
      } catch {
        return url.toLowerCase().trim().replace(/\/$/, "")
      }
    }

    // Helper function to check if a deal is similar to existing ones
    const isDuplicate = (deal: { title: string; summary?: string; description?: string; dealUrl?: string | null }) => {
      // Safety check: if deal data is missing, don't consider it a duplicate
      if (!deal || !deal.title) {
        console.log("[IMPORT] Deal missing title, skipping duplicate check")
        return false
      }

      // Use summary if available (from ExtractedDeal), otherwise use description
      const dealDescription = deal.summary || deal.description || ""
      if (!dealDescription) {
        console.log("[IMPORT] Deal missing description/summary, will only check by title and URL")
      }

      const normalizedDealTitle = normalizeString(deal.title)
      const normalizedDealDesc = normalizeString(dealDescription)
      const normalizedDealUrl = normalizeUrl(deal.dealUrl)

      console.log(`[IMPORT] Checking deal for duplicates: "${normalizedDealTitle}" URL: ${normalizedDealUrl || "none"}`)

      return existingDeals.some((existing) => {
        // Safety check for existing deals
        if (!existing || !existing.title || !existing.description) {
          return false
        }

        try {
          // Primary check: Compare link/URL if both exist (most reliable)
          if (normalizedDealUrl && existing.link) {
            const normalizedExistingUrl = normalizeUrl(existing.link)
            if (normalizedDealUrl && normalizedExistingUrl && normalizedDealUrl === normalizedExistingUrl) {
              console.log("[IMPORT] ✓ Duplicate found by URL match:", normalizedDealUrl.substring(0, 80))
              return true
            }
          }

          // Secondary check: Exact title match (very reliable)
          const normalizedExistingTitle = normalizeString(existing.title)
          if (normalizedDealTitle && normalizedExistingTitle && normalizedDealTitle === normalizedExistingTitle) {
            console.log("[IMPORT] ✓ Duplicate found by exact title match:", normalizedDealTitle.substring(0, 60))
            return true
          }

          // Tertiary check: Fuzzy title similarity (for titles that are slightly different but refer to same product)
          const titleSimilarity = calculateTitleSimilarity(deal.title, existing.title)
          // If similarity is high (>70%), consider it a duplicate
          if (titleSimilarity > 0.7) {
            console.log(`[IMPORT] ✓ Duplicate found by title similarity (${Math.round(titleSimilarity * 100)}%):`, 
              `"${normalizedDealTitle.substring(0, 50)}" vs "${normalizedExistingTitle.substring(0, 50)}"`)
            return true
          }

          // Quaternary check: Title + description match (for cases where title alone might vary slightly)
          const normalizedExistingDesc = normalizeString(existing.description)
          if (
            normalizedDealTitle &&
            normalizedExistingTitle &&
            normalizedDealDesc &&
            normalizedExistingDesc &&
            normalizedDealDesc.length > 30 && // Only check if description is substantial
            normalizedDealTitle === normalizedExistingTitle &&
            normalizedDealDesc === normalizedExistingDesc
          ) {
            console.log("[IMPORT] ✓ Duplicate found by title + description match")
            return true
          }
        } catch (error) {
          console.error("[IMPORT] Error in duplicate check:", error)
          return false
        }

        return false
      })
    }

    // Filter out duplicate deals
    const uniqueDeals = dealsToImport.filter((deal) => !isDuplicate(deal))
    console.log("[IMPORT] Unique deals after filtering:", uniqueDeals.length, "out of", dealsToImport.length)

    // Note: If all deals are duplicates, we continue with empty array instead of returning error
    // This allows the system to continue processing and return a success response with 0 deals
    if (uniqueDeals.length === 0) {
      console.log("[IMPORT] All deals are duplicates - will return success with 0 deals")
    }

    // Create all unique deals
    console.log("[IMPORT] Creating", uniqueDeals.length, "deals...")
    const createdDealsResults = await Promise.all(
      uniqueDeals.map(async (extractedDeal, index) => {
        // Validate deal data before creating
        if (!extractedDeal.title || !extractedDeal.summary || !extractedDeal.category) {
          console.error(`[IMPORT] Deal ${index + 1} missing required fields:`, {
            hasTitle: !!extractedDeal.title,
            hasSummary: !!extractedDeal.summary,
            hasCategory: !!extractedDeal.category,
            deal: extractedDeal,
          })
          throw new Error(`Deal ${index + 1} is missing required fields (title, summary, or category)`)
        }

        console.log(`[IMPORT] Creating deal ${index + 1}/${uniqueDeals.length}:`, extractedDeal.title)
        // Parse expiration date if provided, otherwise leave as null
        // normalizeExpires already validated and normalized expiresAt, so if it's null/undefined, keep it null
        let expiresAt: Date | null = null
        if (extractedDeal.expiresAt) {
          const parsedExpiresAt = new Date(extractedDeal.expiresAt)
          // Additional safety check (should already be validated by normalizeExpires, but double-check)
          if (!isNaN(parsedExpiresAt.getTime()) && parsedExpiresAt > new Date()) {
            expiresAt = parsedExpiresAt
            console.log(`[IMPORT] Deal ${index + 1}: Using extracted expiration date:`, expiresAt.toISOString())
            if (extractedDeal.expiresEvidence) {
              console.log(`[IMPORT] Deal ${index + 1}: ExpiresEvidence:`, extractedDeal.expiresEvidence)
            }
          } else {
            console.log(`[IMPORT] Deal ${index + 1}: Invalid or past expiration date, setting to null`)
            expiresAt = null
          }
        } else {
          console.log(`[IMPORT] Deal ${index + 1}: No expiration date provided, setting to null`)
          expiresAt = null
        }

        // Always use default placeholder image (no image extraction)
        const imageUrl = defaultImageUrl
        console.log(`[IMPORT] Deal ${index + 1} using default placeholder image`)

        // Use dealUrl from AI extraction (the specific deal page URL from urlCandidates)
        // If AI didn't find a dealUrl, fallback to sourceUrl
        const sourceUrl = extractedDeal.sourceUrl // The page where the deal was imported from
        const dealUrl = extractedDeal.dealUrl || sourceUrl // Use AI-extracted dealUrl, fallback to sourceUrl
        console.log(`[IMPORT] Deal ${index + 1} dealUrl:`, dealUrl)
        console.log(`[IMPORT] Deal ${index + 1} sourceUrl:`, sourceUrl)
        
        // Extract merchant name
        const merchantName = extractedDeal.merchant?.trim() || null
        console.log(`[IMPORT] Deal ${index + 1} merchant:`, merchantName)
        
        // Description should NOT include merchant name in brackets (merchantName is separate field)
        const description = extractedDeal.summary

        // Normalize and validate start date (similar to expiresAt)
        let startsAt: Date | null = null
        if (extractedDeal.startsAt) {
          try {
            const parsedStartsAt = new Date(extractedDeal.startsAt)
            if (!isNaN(parsedStartsAt.getTime())) {
              // Reject dates too far in the future (more than 1 year)
              const now = new Date()
              const oneYearFromNow = new Date(now)
              oneYearFromNow.setFullYear(now.getFullYear() + 1)
              
              if (parsedStartsAt <= oneYearFromNow) {
                startsAt = parsedStartsAt
                console.log(`[IMPORT] Deal ${index + 1}: Using extracted start date:`, startsAt.toISOString())
                if (extractedDeal.startsEvidence) {
                  console.log(`[IMPORT] Deal ${index + 1}: StartsEvidence:`, extractedDeal.startsEvidence)
                }
              } else {
                console.log(`[IMPORT] Deal ${index + 1}: Start date too far in future, ignoring`)
              }
            }
          } catch (error) {
            console.log(`[IMPORT] Deal ${index + 1}: Invalid start date, ignoring`)
          }
        }

        // Convert priceType string to enum if provided
        let priceType: DealPriceType | null = null
        if (extractedDeal.priceType) {
          const validPriceTypes: Record<string, DealPriceType> = {
            EUR: DealPriceType.EUR,
            PERCENT: DealPriceType.PERCENT,
            ONE_PLUS_ONE: DealPriceType.ONE_PLUS_ONE,
            TWO_PLUS_ONE: DealPriceType.TWO_PLUS_ONE,
            FREE: DealPriceType.FREE,
          }
          priceType = validPriceTypes[extractedDeal.priceType] || null
          if (!priceType) {
            console.warn(`[IMPORT] Deal ${index + 1}: Invalid priceType "${extractedDeal.priceType}", setting to null`)
          }
        }

        // Convert origin string to enum if provided, default to GR
        let origin: DealOrigin = DealOrigin.GR
        if (extractedDeal.origin === "INTERNATIONAL") {
          origin = DealOrigin.INTERNATIONAL
        } else if (extractedDeal.origin === "GR") {
          origin = DealOrigin.GR
        }

        // Create the deal as PENDING
        try {
          // Final duplicate check right before creation (double-check safety)
          const normalizedTitle = normalizeString(extractedDeal.title)
          const normalizedUrl = normalizeUrl(dealUrl)
          
          // Build OR conditions for duplicate check
          const orConditions: any[] = [
            // Check by exact title match (case-insensitive)
            {
              title: {
                equals: extractedDeal.title,
                mode: 'insensitive' as const,
              },
            },
          ]
          
          // Add URL check if we have a dealUrl
          if (normalizedUrl) {
            orConditions.push({
              link: {
                not: null,
              },
            })
          }
          
          const existingDuplicate = await prisma.communityDeal.findFirst({
            where: {
              status: {
                in: [CommunityDealStatus.PENDING, CommunityDealStatus.APPROVED],
              },
              OR: orConditions,
            },
            select: {
              id: true,
              title: true,
              link: true,
            },
          })

          // Additional check: if we found a potential match, verify it's really a duplicate
          if (existingDuplicate) {
            const existingNormalizedTitle = normalizeString(existingDuplicate.title)
            const existingNormalizedUrl = existingDuplicate.link ? normalizeUrl(existingDuplicate.link) : ""
            
            // Check if it's really a duplicate (including fuzzy title match)
            const exactTitleMatch = normalizedTitle && existingNormalizedTitle && normalizedTitle === existingNormalizedTitle
            const fuzzyTitleMatch = calculateTitleSimilarity(extractedDeal.title, existingDuplicate.title) > 0.7
            const urlMatch = normalizedUrl && existingNormalizedUrl && normalizedUrl === existingNormalizedUrl
            
            const isReallyDuplicate = urlMatch || exactTitleMatch || fuzzyTitleMatch
            
            if (isReallyDuplicate) {
              console.log(`[IMPORT] Deal ${index + 1} skipped - duplicate found in final check:`, existingDuplicate.title)
              return null // Skip this deal
            }
          }

          // Generate unique ID for the deal
          const dealId = crypto.randomBytes(16).toString("hex")
          
          // Handle location: use extracted location, or empty string for online-only deals
          const location = extractedDeal.location?.trim() || ""

          const deal = await prisma.communityDeal.create({
            data: {
              id: dealId,
              title: extractedDeal.title,
              description: description,
              category: extractedDeal.category,
              location: location, // Use extracted location (empty string for online-only deals)
              latitude: null,
              longitude: null,
              imageUrl: imageUrl,
              couponCode: null,
              userId: systemUser.id,
              expiresAt: expiresAt,
              status: CommunityDealStatus.PENDING, // AI imports start as PENDING until admin approves
              sourceUrl: sourceUrl, // The page URL where the deal was imported from
              sourceType: DealSourceType.AI,
              link: dealUrl, // Direct link to the offer (dealUrl)
              merchantName: merchantName, // Store/merchant name (separate from location)
              priceValue: extractedDeal.priceValue || null,
              priceType: priceType,
              origin: origin,
              startsAt: startsAt,
              extraInfo: extractedDeal.extraInfo || null,
              redeemSteps: extractedDeal.redeemSteps || null,
            },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
        console.log(`[IMPORT] Deal ${index + 1} created successfully:`, deal.id)
        const dealWithUser = {
          ...deal,
          user: deal.User,
          User: undefined,
        }
        return dealWithUser
        } catch (createError) {
          console.error(`[IMPORT] Error creating deal ${index + 1}:`, createError)
          throw createError
        }
      })
    )

    // Filter out null values (skipped duplicates from final check)
    const createdDeals = createdDealsResults.filter((deal): deal is NonNullable<typeof deal> => deal !== null)
    const finalSkippedCount = dealsToImport.length - createdDeals.length
    
    console.log("[IMPORT] Import completed successfully:", {
      created: createdDeals.length,
      skipped: finalSkippedCount,
    })

    return NextResponse.json(
      {
        deals: createdDeals,
        deal: createdDeals[0] || null, // First deal for backward compatibility
        count: createdDeals.length,
        skipped: finalSkippedCount,
        message: finalSkippedCount > 0 
          ? `${createdDeals.length} deals imported, ${finalSkippedCount} duplicates skipped`
          : `${createdDeals.length} deals imported successfully`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[IMPORT] Error in import route:", error)
    console.error("[IMPORT] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[IMPORT] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    })

    if (error instanceof Error && error.message === "Unauthorized") {
      console.log("[IMPORT] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      console.log("[IMPORT] Forbidden access attempt")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
