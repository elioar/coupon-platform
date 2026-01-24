import OpenAI from "openai"
import * as cheerio from "cheerio"
import { z } from "zod"

// Initialize OpenAI lazily to avoid build-time errors when env vars are not set
let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not defined in environment variables")
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

const VALID_CATEGORIES = [
  "Food & Dining",
  "Fashion",
  "Electronics",
  "Beauty & Health",
  "Travel",
  "Home & Garden",
  "Sports & Fitness",
  "Entertainment",
  "Other",
]

const BAD_PATTERNS = [
  /facebook\.com|instagram\.com|tiktok\.com|youtube\.com|twitter\.com|x\.com/i,
  /share|login|register|cart|checkout|wishlist|account|profile|settings/i,
  /^mailto:/i,
  /^tel:/i,
  /newsletter|subscribe|signup|sign-up|email-list/i,
]

export interface ExtractedDeal {
  title: string
  summary: string
  category: string
  expiresAt?: string | null
  expiresEvidence?: string | null // Optional: snippet from page text that justifies the expiry date
  sourceUrl: string
  dealUrl?: string | null // Direct link to the specific offer/deal page
  merchant?: string // Name of the store/merchant offering the deal (e.g., "Kotsovolos", "Amazon", "Lagonika")
  imageUrl?: string
  location?: string | null // Location (city, address, or empty string for online-only deals)
  // New fields:
  priceValue?: string | null
  priceType?: "EUR" | "PERCENT" | "ONE_PLUS_ONE" | "TWO_PLUS_ONE" | "FREE" | null
  origin?: "GR" | "INTERNATIONAL" | null
  startsAt?: string | null // ISO 8601 date
  startsEvidence?: string | null // Evidence snippet for start date
  extraInfo?: string | null
  redeemSteps?: string | null
}

// Zod schema for validating extracted deals
const ExtractedDealSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string(),
  expiresAt: z.string().nullable().optional(),
  expiresEvidence: z.string().nullable().optional(),
  sourceUrl: z.string().url(),
  dealUrl: z.string().url().nullable().optional(),
  merchant: z.string().optional(),
})

/**
 * Normalizes and validates expiration date
 * Returns ISO string or null if invalid/unsafe
 */
function normalizeExpires(expiresAt: string | null | undefined, expiresEvidence?: string | null): string | null {
  // If no expiry provided, return null
  if (!expiresAt || expiresAt.trim() === '' || expiresAt.toLowerCase() === 'null') {
    console.log("[AI-EXTRACTION] No expiresAt provided or was null")
    return null
  }

  // Reject common "unknown" patterns
  const unknownPatterns = [
    /unknown/i,
    /μέχρι εξαντλήσεως/i,
    /μέχρι εξάντλησης/i,
    /until stock lasts/i,
    /while supplies last/i,
    /unlimited/i,
    /no expiration/i,
  ]
  
  if (unknownPatterns.some(pattern => pattern.test(expiresAt))) {
    console.log("[AI-EXTRACTION] ExpiresAt matches 'unknown' pattern:", expiresAt)
    return null
  }

  // Try to parse as Date
  let parsedDate: Date
  try {
    parsedDate = new Date(expiresAt)
    if (isNaN(parsedDate.getTime())) {
      console.log("[AI-EXTRACTION] Failed to parse expiresAt as Date:", expiresAt)
      return null
    }
  } catch (error) {
    console.log("[AI-EXTRACTION] Error parsing expiresAt:", expiresAt, error)
    return null
  }

  // Reject dates in the past (more than 1 day ago)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  if (parsedDate < yesterday) {
    console.log("[AI-EXTRACTION] ExpiresAt is in the past:", expiresAt, "parsed as:", parsedDate.toISOString())
    return null
  }

  // If no evidence provided and date seems suspicious, log warning
  if (!expiresEvidence) {
    console.log("[AI-EXTRACTION] Warning: expiresAt provided without expiresEvidence:", expiresAt)
  }

  return parsedDate.toISOString()
}

/**
 * Normalizes and validates start date
 * Returns ISO string or null if invalid/unsafe
 */
function normalizeStarts(startsAt: string | null | undefined, startsEvidence?: string | null): string | null {
  // If no start date provided, return null
  if (!startsAt || startsAt.trim() === '' || startsAt.toLowerCase() === 'null') {
    console.log("[AI-EXTRACTION] No startsAt provided or was null")
    return null
  }

  // Reject common "unknown" patterns
  const unknownPatterns = [
    /unknown/i,
    /not specified/i,
    /unlimited/i,
    /ongoing/i,
  ]
  
  if (unknownPatterns.some(pattern => pattern.test(startsAt))) {
    console.log("[AI-EXTRACTION] StartsAt matches 'unknown' pattern:", startsAt)
    return null
  }

  // Try to parse as Date
  let parsedDate: Date
  try {
    parsedDate = new Date(startsAt)
    if (isNaN(parsedDate.getTime())) {
      console.log("[AI-EXTRACTION] Failed to parse startsAt as Date:", startsAt)
      return null
    }
  } catch (error) {
    console.log("[AI-EXTRACTION] Error parsing startsAt:", startsAt, error)
    return null
  }

  // Reject dates too far in the future (more than 1 year)
  const now = new Date()
  const oneYearFromNow = new Date(now)
  oneYearFromNow.setFullYear(now.getFullYear() + 1)

  if (parsedDate > oneYearFromNow) {
    console.log("[AI-EXTRACTION] StartsAt is too far in the future (>1 year):", startsAt, "parsed as:", parsedDate.toISOString())
    return null
  }

  // If no evidence provided and date seems suspicious, log warning
  if (!startsEvidence) {
    console.log("[AI-EXTRACTION] Warning: startsAt provided without startsEvidence:", startsAt)
  }

  return parsedDate.toISOString()
}

export interface ExtractionResult {
  isDeal: boolean
  deal?: ExtractedDeal
  deals?: ExtractedDeal[] // For multiple deals
  error?: string
  extractedImageUrl?: string // Image extracted from HTML
}

interface ExtractedPageInfo {
  text: string
  links: Array<{ text: string; url: string }>
  merchant: string | null
  pageTitle: string
}

/**
 * Extracts merchant name from URL
 */
function extractMerchantFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Common Greek store mappings
    const merchantMap: Record<string, string> = {
      "plaisio.gr": "Plaisio",
      "www.plaisio.gr": "Plaisio",
      "kotsovolos.gr": "Kotsovolos",
      "www.kotsovolos.gr": "Kotsovolos",
      "public.gr": "Public",
      "www.public.gr": "Public",
      "mediamarkt.gr": "MediaMarkt",
      "www.mediamarkt.gr": "MediaMarkt",
      "skroutz.gr": "Skroutz",
      "www.skroutz.gr": "Skroutz",
      "lagonika.gr": "Lagonika",
      "www.lagonika.gr": "Lagonika",
      "happydeals.gr": "HappyDeals",
      "www.happydeals.gr": "HappyDeals",
      "amazon.gr": "Amazon",
      "www.amazon.gr": "Amazon",
    }
    
    // Check exact match
    if (merchantMap[hostname]) {
      return merchantMap[hostname]
    }
    
    // Extract from subdomain or domain name
    const parts = hostname.split(".")
    if (parts.length >= 2) {
      const domain = parts[parts.length - 2]
      // Capitalize first letter
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Checks if a URL matches bad patterns (social media, login, cart, etc.)
 */
function isBadUrl(url: string): boolean {
  if (!url || url.trim() === '') return true
  
  // Skip anchors and javascript
  if (url.startsWith('#') || url.startsWith('javascript:')) return true
  
  return BAD_PATTERNS.some((pattern) => pattern.test(url))
}

/**
 * Extracts URL candidates from HTML (links, buttons, data attributes, meta tags)
 */
export function extractUrlCandidates(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html)
  const base = new URL(pageUrl)

  const raw: string[] = []

  // a[href]
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")
    if (href) raw.push(href.trim())
  })

  // data-href / data-url
  $("[data-href],[data-url]").each((_, el) => {
    const v = ($(el).attr("data-href") || $(el).attr("data-url") || "").trim()
    if (v) raw.push(v)
  })

  // button onclick (extract URLs from onclick handlers)
  $("button[onclick], *[onclick]").each((_, el) => {
    const on = ($(el).attr("onclick") || "").trim()
    // Match http/https URLs in onclick
    const urlMatch = on.match(/https?:\/\/[^\s'"]+/i)
    if (urlMatch?.[0]) {
      raw.push(urlMatch[0])
    }
    // Match quoted strings that might be URLs
    const quotedMatch = on.match(/['"](https?:\/\/[^'"]+)['"]/i)
    if (quotedMatch?.[1]) {
      raw.push(quotedMatch[1])
    }
    // Match window.location assignments
    const locationMatch = on.match(/window\.location\s*[=:]\s*['"]([^'"]+)['"]/i)
    if (locationMatch?.[1]) {
      raw.push(locationMatch[1])
    }
  })

  // canonical link
  const canonical = $('link[rel="canonical"]').attr("href")
  if (canonical) raw.push(canonical.trim())

  // og:url meta tag
  const ogUrl = $('meta[property="og:url"]').attr("content")
  if (ogUrl) raw.push(ogUrl.trim())

  // Normalize and filter URLs
  const normalized = raw
    .map((u) => {
      try {
        // Resolve relative URLs to absolute
        return new URL(u, base).toString()
      } catch {
        return null
      }
    })
    .filter((u): u is string => !!u)
    .map((u) => {
      // Remove hash fragments
      try {
        const url = new URL(u)
        url.hash = ''
        return url.toString()
      } catch {
        return u.split("#")[0]
      }
    })
    .filter((u) => !isBadUrl(u))
    .filter((u) => {
      // Only keep http/https URLs
      return u.startsWith('http://') || u.startsWith('https://')
    })

  // Deduplicate
  const unique = Array.from(new Set(normalized))
  
  // Limit to 60 candidates
  return unique.slice(0, 60)
}

/**
 * Extracts clean text content from HTML, including links from buttons and merchant info
 */
function extractTextFromHtml(html: string, baseUrl: string): ExtractedPageInfo {
  const $ = cheerio.load(html)
  
  // Remove script and style elements
  $("script, style, noscript, iframe").remove()
  
  // Get page title
  const pageTitle = $("title").text().trim() || ""
  
  // Extract merchant from page title
  let merchantFromTitle: string | null = null
  const merchantKeywords = ["Plaisio", "Kotsovolos", "Public", "MediaMarkt", "Skroutz", "Lagonika", "HappyDeals", "Amazon"]
  for (const keyword of merchantKeywords) {
    if (pageTitle.toLowerCase().includes(keyword.toLowerCase())) {
      merchantFromTitle = keyword
      break
    }
  }
  
  // Extract links from buttons and important links
  const extractedLinks: Array<{ text: string; url: string }> = []
  
  // Look for buttons and links with deal-related text
  $("a, button, [onclick]").each((_, element) => {
    const $el = $(element)
    const text = $el.text().trim()
    let url = $el.attr("href") || $el.attr("onclick")?.match(/['"](https?:\/\/[^'"]+)['"]/)?.[1] || ""
    
    // Skip if no URL
    if (!url) return
    
    // Resolve relative URLs
    if (url && !url.startsWith("http") && !url.startsWith("//")) {
      try {
        url = new URL(url, baseUrl).toString()
      } catch {
        // Skip invalid URLs
        return
      }
    }
    
    // Look for deal-related button text (Greek and English)
    const dealKeywords = [
      "ΔΕΣ ΤΗΝ ΠΡΟΣΦΟΡΑ", "Δες την προσφορά", "δες την προσφορά", "δες την προσφορά",
      "See Offer", "View Deal", "View Offer", "Shop Now", "Buy Now", "Get Deal",
      "View Details", "Learn More", "Redeem", "Claim", "Shop", "Buy",
      "Παραγγελία", "παραγγελία", "Προσθήκη στο καλάθι", "Καλάθι",
      "Order", "Add to Cart", "Cart", "Checkout"
    ]
    
    const lowerText = text.toLowerCase()
    if (text && url && dealKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      extractedLinks.push({ text, url })
    }
  })
  
  // Also look for merchant name in content
  let merchantFromContent: string | null = null
  const bodyText = $("body").text()
  for (const keyword of merchantKeywords) {
    if (bodyText.toLowerCase().includes(keyword.toLowerCase())) {
      merchantFromContent = keyword
      break
    }
  }
  
  // Get text from main content areas
  const text = $("body").text()
  
  // Build enriched text with extracted information
  let enrichedText = `Page Title: ${pageTitle}\n\n`
  enrichedText += `${text}\n`
  
  // Add extracted links
  if (extractedLinks.length > 0) {
    enrichedText += "\n\n[IMPORTANT BUTTONS/LINKS FOUND - USE THESE URLs FOR dealUrl]\n"
    extractedLinks.forEach(link => {
      enrichedText += `Button/Link Text: "${link.text}" → URL: ${link.url}\n`
    })
  }
  
  // Add merchant hints
  const merchants = [merchantFromTitle, merchantFromContent, extractMerchantFromUrl(baseUrl)].filter(Boolean)
  if (merchants.length > 0) {
    enrichedText += `\n\n[MERCHANT HINTS - The store/merchant appears to be: ${merchants[0]}]\n`
  }
  
  // Clean up whitespace
  const cleanedText = enrichedText
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim()
    .slice(0, 8000) // Limit to 8000 chars for API
  
  // Determine best merchant
  const merchant = merchantFromTitle || merchantFromContent || extractMerchantFromUrl(baseUrl) || null
  
  return { 
    text: cleanedText, 
    links: extractedLinks,
    merchant,
    pageTitle
  }
}

/**
 * Validates URL format and prevents SSRF attacks
 */
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false
    }
    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.20.") ||
      hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") ||
      hostname.startsWith("172.23.") ||
      hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") ||
      hostname.startsWith("172.26.") ||
      hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") ||
      hostname.startsWith("172.29.") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.")
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Extracts deal information from a URL using AI
 */
export async function extractDealFromUrl(url: string): Promise<ExtractionResult> {
  console.log("[AI-EXTRACTION] Starting extraction for URL:", url)
  
  // Validate URL
  if (!validateUrl(url)) {
    console.log("[AI-EXTRACTION] URL validation failed")
    return {
      isDeal: false,
      error: "Invalid URL format or security restrictions",
    }
  }

  try {
    let html: string
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      console.log("[AI-EXTRACTION] Fetching HTML from URL...")
      // Fetch HTML from URL with comprehensive headers to avoid blocking
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
          "Referer": new URL(url).origin,
        },
        signal: controller.signal,
        next: { revalidate: 0 }, // Don't cache
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Provide more helpful error messages
        if (response.status === 403) {
          return {
            isDeal: false,
            error: "The website blocked access to this URL. This may be due to anti-bot protection. Please try a different URL or contact support.",
          }
        }
        if (response.status === 404) {
          return {
            isDeal: false,
            error: "The URL was not found (404). Please check the URL and try again.",
          }
        }
        return {
          isDeal: false,
          error: `Failed to fetch URL: ${response.status} ${response.statusText}. The website may be blocking automated requests.`,
        }
      }

      html = await response.text()
      console.log("[AI-EXTRACTION] HTML fetched, length:", html.length)
      if (timeoutId) clearTimeout(timeoutId)
    } catch (fetchError: any) {
      if (timeoutId) clearTimeout(timeoutId)
      console.error("[AI-EXTRACTION] Fetch error:", fetchError.name, fetchError.message)
      if (fetchError.name === 'AbortError') {
        return {
          isDeal: false,
          error: "Request timed out. The website took too long to respond.",
        }
      }
      throw fetchError
    }

    console.log("[AI-EXTRACTION] Extracting text and info from HTML...")
    const pageInfo = extractTextFromHtml(html, url)
    const textContent = pageInfo.text
    const extractedLinks = pageInfo.links
    const extractedMerchant = pageInfo.merchant
    
    // Extract URL candidates (all potential links from HTML)
    const urlCandidates = extractUrlCandidates(html, url)
    console.log("[AI-EXTRACTION] Text content extracted, length:", textContent.length)
    console.log("[AI-EXTRACTION] Found links from buttons:", extractedLinks.length, extractedLinks.map(l => `${l.text} → ${l.url}`))
    console.log("[AI-EXTRACTION] Extracted URL candidates:", urlCandidates.length, urlCandidates.slice(0, 10))
    console.log("[AI-EXTRACTION] Extracted merchant:", extractedMerchant || "None")
    
    // Skip image extraction - use default placeholder
    const extractedImageUrl = null

    if (!textContent || textContent.length < 50) {
      console.log("[AI-EXTRACTION] Insufficient text content:", textContent.length)
      return {
        isDeal: false,
        error: "Could not extract sufficient text content from the page",
      }
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log("[AI-EXTRACTION] OpenAI API key not configured")
      return {
        isDeal: false,
        error: "OpenAI API key is not configured",
      }
    }

    // Send to OpenAI for extraction
    console.log("[AI-EXTRACTION] Sending to OpenAI API...")
    console.log("[AI-EXTRACTION] URL candidates count:", urlCandidates.length)
    console.log("[AI-EXTRACTION] Text content length:", textContent.length)
    
    // Get OpenAI client (lazy initialization)
    const openai = getOpenAIClient()
    
    let completion
    // Try gpt-5-mini first, fallback to gpt-4o-mini if not available
    const modelsToTry = ["gpt-5-mini", "gpt-4o-mini"]
    let lastError: any = null
    
    for (const modelName of modelsToTry) {
      try {
        console.log("[AI-EXTRACTION] Trying model:", modelName)
        
        completion = await openai.chat.completions.create({
          model: modelName,
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting deals, offers, coupons, and discounts from web pages. 
Your task is to identify and extract promotional offers, deals, coupons, sales, discounts, or special promotions from the provided content.

SEARCH THOROUGHLY: Examine the entire page content carefully. Look in product listings, deal cards, banners, featured sections, sidebars, and all areas where deals might appear. Don't miss deals that may be formatted differently or in less obvious locations.

CRITICAL EXTRACTION RULES:

1. MERCHANT NAME (OPTIONAL - ONLY IF CLEAR):
   - Extract the STORE/BRAND/MERCHANT name where the deal/coupon is actually valid (e.g., "Plaisio", "Kotsovolos", "Amazon", "AB Basilopoulos", "Intersport")
   - CRITICAL: This is the NAME OF THE BUSINESS/STORE offering the deal, NOT the name of the website/blog/page that mentions or imports the deal
   - DO NOT use the source URL domain name or the page/blog name as the merchant name
   - Look in: product/store mentions, coupon codes, deal descriptions, content headers, product pages
   - If merchant hints are provided in [MERCHANT HINTS], only use them if they clearly refer to the store/brand offering the deal
   - Common Greek stores: Plaisio, Kotsovolos, Public, MediaMarkt, Skroutz, Lagonika, HappyDeals, AB Basilopoulos, Intersport
   - Examples:
     * If deal page says "Amazon discount code" → merchant = "Amazon"
     * If deal page says "Kotsovolos offers" → merchant = "Kotsovolos"
     * If deal page says "Plaisio.gr promotion" → merchant = "Plaisio"
     * If deal page is from a deals blog mentioning "Save at AB Basilopoulos" → merchant = "AB Basilopoulos" (NOT the blog name)
     * If page is "deals-blog.gr" showing "Amazon coupon" → merchant = "Amazon" (NOT "deals-blog")
     * If page is "example-deals.com" with unclear store name → merchant = null (empty)
   - IF the merchant name is unclear, ambiguous, or might be the page name → USE null (leave empty)
   - BETTER TO LEAVE EMPTY than to guess or use the wrong name (page/blog name)

2. DEAL URL (CRITICAL - MUST FOLLOW RULES):
   - CRITICAL: The dealUrl is DIFFERENT from sourceUrl!
     * sourceUrl = The page where the deal was FOUND/IMPORTED from (e.g., deals blog, deals website)
     * dealUrl = The DIRECT link to the ACTUAL PRODUCT/OFFER page where the deal can be redeemed
   - The dealUrl MUST be one of the URLs from the urlCandidates list provided below
   - DO NOT invent or construct URLs - ONLY select from the urlCandidates list
   - DO NOT use the sourceUrl as dealUrl - they are DIFFERENT fields!
   - If no suitable URL exists in urlCandidates, use null (NOT the sourceUrl)
   - Choose the most "direct" link that leads to the product/deal page on the STORE'S website
   - Avoid share/tracking/social media links (already filtered out)
   - Prefer product/offer pages over category pages
   - Example: 
     * sourceUrl = "https://lagonika.gr/deals" (the deals blog)
     * dealUrl = "https://store.com/products/deal123" (the actual product page) OR null if not in candidates

3. TITLE & SUMMARY:
   - Title: concise, catchy, max 200 chars, in GREEK
   - Summary: include ONLY discount, product details, and conditions, max 500 chars, in GREEK
   - DO NOT include: source mentions (like "ανακοινώθηκε στο..."), "δείτε τη σελίδα", merchant names in brackets [Merchant], or promotional texts about where it was found
   - Keep summary clean and focused on the deal itself
   - Translate everything to Greek if not already

4. CATEGORY:
   - Must exactly match one of: ${VALID_CATEGORIES.join(", ")}
   - Keep category name in English as specified

5. EXPIRY DATE (CRITICAL - STRICT RULES):
   - ONLY include expiresAt if there is an EXPLICIT, CLEAR date mentioned in the page text
   - Examples of VALID expiry mentions: "12/02/2026", "έως 12 Ιανουαρίου 2026", "valid until January 12, 2026", "expires 2026-01-12"
   - DO NOT include expiresAt for: "μόνο σήμερα", "μέχρι εξαντλήσεως", "limited time", vague phrases, or if no date is mentioned
   - If you include expiresAt, ALSO provide expiresEvidence: a 5-15 word snippet from the page text that shows where you found the expiry date
   - Format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) or null
   - If no explicit date is found, use null (NOT a random date or guess)

6. PRICE INFORMATION:
   - Extract priceValue: the actual price or discount value (e.g., "50", "20%", "Buy 1 Get 1", "Free shipping", "€30")
   - Extract priceType based on the discount structure:
     * EUR: Fixed amount discount (e.g., "€50 off", "Save €20", "€10 discount")
     * PERCENT: Percentage discount (e.g., "20% off", "50% discount", "30% reduction")
     * ONE_PLUS_ONE: Buy 1 Get 1 free offers (e.g., "Buy 1 Get 1", "1+1", "2 for 1")
     * TWO_PLUS_ONE: Buy 2 Get 1 free offers (e.g., "Buy 2 Get 1", "2+1", "3 for 2")
     * FREE: Free items or services (e.g., "Free shipping", "Free gift", "Free delivery")
   - Only include priceValue and priceType if explicitly mentioned in the deal
   - If price information is not clear, use null for both fields

7. DEAL START DATE (CRITICAL - STRICT RULES):
   - ONLY include startsAt if there is an EXPLICIT, CLEAR start date mentioned in the page text
   - Examples of VALID start mentions: "Starting 12/02/2026", "Από 12 Ιανουαρίου 2026", "valid from January 12, 2026", "starts 2026-01-12"
   - DO NOT include startsAt for vague phrases like "coming soon", "available now", or if no date is mentioned
   - If you include startsAt, ALSO provide startsEvidence: a 5-15 word snippet from the page text that shows where you found the start date
   - Format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) or null
   - If no explicit start date is found, use null (NOT a random date or guess)

8. DEAL ORIGIN:
   - Set origin to "GR" if the deal is from a Greek store/website (e.g., .gr domain, Greek merchant names like Kotsovolos, Plaisio, Public)
   - Set to "INTERNATIONAL" if the deal is from an international store (e.g., Amazon, eBay, international brands)
   - If unclear, use null (will default to GR in code)

9. ADDITIONAL INFORMATION:
   - extraInfo: Extract any additional conditions, terms, or important notes about the deal (e.g., "Minimum purchase €50", "Valid only online", "Excludes sale items")
   - Keep concise (max 500 chars), translate to Greek
   - redeemSteps: Extract step-by-step instructions on how to redeem the deal if available (e.g., "Enter code at checkout", "Click here and apply coupon", "Show this code at store")
   - Keep concise (max 1000 chars), translate to Greek
   - Only include if the information is explicitly provided on the page

Return JSON with this structure:
{
    "deals": [
      {
      "title": "string (Greek, max 200 chars)",
      "summary": "string (Greek, max 500 chars)",
      "category": "string (exact match from valid categories)",
      "expiresAt": "string (ISO 8601) or null - ONLY if explicit date found",
      "expiresEvidence": "string (5-15 words snippet from page text) or null - required if expiresAt is provided",
      "sourceUrl": "string (the current page URL - automatically set, DO NOT change this)",
      "dealUrl": "string (DIRECT link to product/offer page from urlCandidates) or null - DO NOT use sourceUrl here!",
      "merchant": "string or null - store/merchant/brand name where deal is valid (e.g., Amazon, Skroutz, Kotsovolos, Plaisio, AB Basilopoulos, Intersport), MUST be null if unclear or if it might be the page/blog name",
      "location": "string or empty string '' or null - physical location (city/address) for in-store deals, empty string '' for online-only deals",
      "priceValue": "string or null - price/discount value (e.g., '50', '20%', 'Buy 1 Get 1', 'Free shipping')",
      "priceType": "string or null - one of: EUR, PERCENT, ONE_PLUS_ONE, TWO_PLUS_ONE, FREE",
      "origin": "string or null - 'GR' for Greek stores, 'INTERNATIONAL' for international stores",
      "startsAt": "string (ISO 8601) or null - ONLY if explicit start date found",
      "startsEvidence": "string (5-15 words snippet from page text) or null - required if startsAt is provided",
      "extraInfo": "string or null - additional conditions/terms (max 500 chars, in Greek)",
      "redeemSteps": "string or null - step-by-step redemption instructions (max 1000 chars, in Greek)"
    }
  ]
}

If NO deals found: { "isDeal": false }`,
        },
        {
          role: "user",
          content: `Extract all deals/offers/coupons from this webpage.

IMPORTANT: Extract MAXIMUM 5 deals. If there are more than 5 deals on the page, extract only the first 5 most relevant/important ones.

SEARCH THOROUGHLY:
- Look through ALL sections of the page: product listings, deal cards, banners, featured items, special offers
- Check for product names, prices, discounts, promotions mentioned anywhere on the page
- Don't miss deals that might be in different sections (sidebar, footer, related products, etc.)
- Look for patterns like: product name + price, discount percentage, special offers, limited time deals
- If you find fewer deals than expected, search more carefully - deals might be formatted differently or in less obvious locations
- Check for recurring deal patterns throughout the content

Webpage content:
${textContent}

Source URL: ${url}
NOTE: This is the sourceUrl (automatically set - DO NOT use this as dealUrl!)

${extractedMerchant ? `IMPORTANT: The merchant appears to be "${extractedMerchant}" - use this as the merchant name.` : ''}

URL CANDIDATES (MUST SELECT dealUrl FROM THIS LIST ONLY):
CRITICAL: The dealUrl must be DIFFERENT from the sourceUrl above!
- sourceUrl (${url}) = the page you are extracting from (automatically set, ignore it)
- dealUrl = a link from the candidates below that goes to the STORE/PRODUCT page (NOT the source page)
${urlCandidates.length > 0 
  ? urlCandidates.map((candidate, idx) => `${idx + 1}. ${candidate}`).join('\n')
  : 'No URL candidates found - use null for dealUrl if no suitable link exists'
}

CRITICAL RULE FOR dealUrl:
- ABSOLUTELY CRITICAL: dealUrl MUST BE DIFFERENT from sourceUrl!
  * sourceUrl = "${url}" (the current page URL - this is ALREADY SET automatically, you cannot change it)
  * dealUrl = MUST be a DIFFERENT URL from the urlCandidates list that leads to the STORE/PRODUCT page
- NEVER use the sourceUrl (${url}) as dealUrl - they are COMPLETELY DIFFERENT!
- The dealUrl field MUST be EXACTLY one of the URLs from the urlCandidates list above
- If you don't find a suitable URL in the candidates list, set dealUrl to null (NOT the sourceUrl!)
- DO NOT invent, construct, or guess URLs
- DO NOT use "${url}" as dealUrl under any circumstances
- If the sourceUrl appears in urlCandidates, IGNORE it - it should NOT be used as dealUrl
- Choose the most direct link to the product/deal page from the candidates that goes to the STORE/MERCHANT website
- If there are no suitable store/product links in candidates, set dealUrl to null (leave it empty - admin will add it manually)

Extract up to 5 deals (maximum) with their merchant names and deal URLs (selecting ONLY from urlCandidates above).
Make sure to search the ENTIRE page content carefully to find all available deals.`,
        },
      ],
      response_format: { type: "json_object" },
      // gpt-5-mini uses max_completion_tokens, gpt-4o-mini uses max_tokens
      ...(modelName.startsWith("gpt-5") 
        ? { max_completion_tokens: 5000, reasoning_effort: "low" } 
        : { max_tokens: 5000 }
      ),
        })
        console.log("[AI-EXTRACTION] OpenAI API call completed successfully with model:", modelName)
        break // Success, exit the loop
      } catch (apiError: any) {
        console.error(`[AI-EXTRACTION] Model ${modelName} failed:`, apiError?.message)
        lastError = apiError
        
        // If it's a model_not_found error, try the next model
        if (apiError?.code === 'model_not_found' || apiError?.message?.includes('model')) {
          console.log(`[AI-EXTRACTION] Model ${modelName} not found, trying next model...`)
          continue // Try next model
        }
        
        // For other errors (API key, rate limit, etc.), don't retry
        console.error("[AI-EXTRACTION] OpenAI API error:", apiError)
        console.error("[AI-EXTRACTION] Error type:", apiError?.constructor?.name)
        console.error("[AI-EXTRACTION] Error code:", apiError?.code)
        console.error("[AI-EXTRACTION] Error status:", apiError?.status)
        
        if (apiError?.status === 401 || apiError?.code === 'invalid_api_key') {
          return {
            isDeal: false,
            error: "OpenAI API key is invalid or expired. Please check your API key.",
          }
        }
        
        if (apiError?.status === 429 || apiError?.code === 'rate_limit_exceeded') {
          return {
            isDeal: false,
            error: "OpenAI API rate limit exceeded. Please try again later.",
          }
        }
        
        return {
          isDeal: false,
          error: `OpenAI API error: ${apiError?.message || 'Unknown error'}`,
        }
      }
    }
    
    // If we tried all models and none worked
    if (!completion) {
      console.error("[AI-EXTRACTION] All models failed. Last error:", lastError)
      return {
        isDeal: false,
        error: `All models failed. Last error: ${lastError?.message || 'Unknown error'}. Tried: ${modelsToTry.join(', ')}`,
      }
    }

    console.log("[AI-EXTRACTION] Completion object:", {
      hasChoices: !!completion?.choices,
      choicesCount: completion?.choices?.length || 0,
      firstChoice: completion?.choices?.[0] ? {
        hasMessage: !!completion.choices[0].message,
        messageRole: completion.choices[0].message?.role,
        contentLength: completion.choices[0].message?.content?.length || 0,
      } : null,
    })

    const responseText = completion?.choices?.[0]?.message?.content
    console.log("[AI-EXTRACTION] OpenAI response received, length:", responseText?.length || 0)
    
    // Debug logging: log top candidates and text snippet for failed extractions
    if (urlCandidates.length > 0) {
      console.log("[AI-EXTRACTION] Top 10 URL candidates:", urlCandidates.slice(0, 10).join(", "))
    }
    console.log("[AI-EXTRACTION] Text snippet sent to AI (first 1KB):", textContent.substring(0, 1024))
    
    if (!responseText) {
      console.error("[AI-EXTRACTION] No response content from AI")
      console.error("[AI-EXTRACTION] Full completion object:", JSON.stringify(completion, null, 2))
      return {
        isDeal: false,
        error: "No response content from AI. The API call succeeded but returned empty content.",
      }
    }

    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(responseText)
      console.log("[AI-EXTRACTION] Response parsed successfully, isDeal:", parsedResponse.isDeal !== false, "deals count:", parsedResponse.deals?.length || 0)
    } catch (parseError: any) {
      console.error("[AI-EXTRACTION] Failed to parse JSON:", parseError?.message || parseError)
      console.error("[AI-EXTRACTION] Response length:", responseText.length)
      console.error("[AI-EXTRACTION] Response text (last 500 chars):", responseText.substring(Math.max(0, responseText.length - 500)))
      
      // Check if response appears truncated (ends abruptly in JSON)
      if (responseText.length > 9000 && !responseText.trim().endsWith('}')) {
        console.error("[AI-EXTRACTION] Response appears truncated - may have exceeded token limit")
        return {
          isDeal: false,
          error: "AI response was truncated. The page may have too many deals. Please try a more specific URL.",
        }
      }
      
      // Try to find where JSON breaks and attempt partial recovery
      const lastBrace = responseText.lastIndexOf('}')
      if (lastBrace > responseText.length / 2) {
        try {
          // Try to close the JSON structure
          let truncated = responseText.substring(0, lastBrace + 1)
          // Check if deals array is incomplete
          if (!truncated.includes(']')) {
            // Try to add closing brackets
            const dealsStart = truncated.indexOf('"deals":')
            if (dealsStart > 0) {
              truncated = truncated.substring(0, dealsStart) + '"deals": []}'
            }
          }
          parsedResponse = JSON.parse(truncated)
          console.warn("[AI-EXTRACTION] Attempted to recover from truncated JSON, parsed deals:", parsedResponse.deals?.length || 0)
          // Continue with partial response
        } catch (e) {
          console.error("[AI-EXTRACTION] Could not recover from truncated JSON:", e)
          return {
            isDeal: false,
            error: "Failed to parse AI response: Invalid or truncated JSON format. The AI may have returned incomplete data.",
          }
        }
      } else {
      return {
        isDeal: false,
          error: "Failed to parse AI response: Invalid JSON format.",
        }
      }
    }

    // Check if it's not a deal
    if (parsedResponse.isDeal === false) {
      return {
        isDeal: false,
        error: "The page does not contain a valid deal or offer",
      }
    }

    // Validate and normalize deals
    const deals: any[] = parsedResponse.deals || []
    // Limit to maximum 5 deals
    if (deals.length > 5) {
      console.log(`[AI-EXTRACTION] Found ${deals.length} deals, limiting to first 5`)
    }
    const dealsToProcess = deals.slice(0, 5)
    const validatedDeals: ExtractedDeal[] = []

    for (const dealData of dealsToProcess) {
      // Validate required fields
      if (!dealData.title || !dealData.summary || !dealData.category) {
        console.warn("[AI-EXTRACTION] Skipping deal with missing required fields:", dealData)
        continue
      }

      // Validate category
      if (!VALID_CATEGORIES.includes(dealData.category)) {
        console.warn(`[AI-EXTRACTION] Invalid category "${dealData.category}", using "Other"`)
        dealData.category = "Other"
      }

      // Normalize and validate expiration date
      const normalizedExpiresAt = normalizeExpires(dealData.expiresAt, dealData.expiresEvidence)
      if (dealData.expiresAt && !normalizedExpiresAt) {
        console.log(`[AI-EXTRACTION] Deal "${dealData.title.substring(0, 50)}": expiresAt was rejected during normalization`)
        console.log(`[AI-EXTRACTION] Original expiresAt:`, dealData.expiresAt)
        console.log(`[AI-EXTRACTION] ExpiresEvidence:`, dealData.expiresEvidence || "none")
      }

      // Normalize and validate start date
      const normalizedStartsAt = normalizeStarts(dealData.startsAt, dealData.startsEvidence)
      if (dealData.startsAt && !normalizedStartsAt) {
        console.log(`[AI-EXTRACTION] Deal "${dealData.title.substring(0, 50)}": startsAt was rejected during normalization`)
        console.log(`[AI-EXTRACTION] Original startsAt:`, dealData.startsAt)
        console.log(`[AI-EXTRACTION] StartsEvidence:`, dealData.startsEvidence || "none")
      }

      // Validate priceType
      const validPriceTypes = ["EUR", "PERCENT", "ONE_PLUS_ONE", "TWO_PLUS_ONE", "FREE", null]
      let priceType: "EUR" | "PERCENT" | "ONE_PLUS_ONE" | "TWO_PLUS_ONE" | "FREE" | null = null
      if (dealData.priceType) {
        if (validPriceTypes.includes(dealData.priceType)) {
          priceType = dealData.priceType as any
        } else {
          console.warn(`[AI-EXTRACTION] Invalid priceType "${dealData.priceType}", setting to null`)
          priceType = null
        }
      }

      // Validate origin
      let origin: "GR" | "INTERNATIONAL" | null = null
      if (dealData.origin === "GR" || dealData.origin === "INTERNATIONAL") {
        origin = dealData.origin
      } else if (dealData.origin) {
        console.warn(`[AI-EXTRACTION] Invalid origin "${dealData.origin}", setting to null`)
        origin = null
      }

      // Validate merchant: don't use if it matches the source URL domain (likely a deals blog/page name)
      let merchant: string | undefined = undefined
      if (dealData.merchant || extractedMerchant) {
        const candidateMerchant = (dealData.merchant || extractedMerchant || "").trim()
        
        // Extract domain from source URL to check if merchant matches it
        try {
          const sourceDomain = new URL(url).hostname.toLowerCase().replace(/^www\./, "")
          const merchantLower = candidateMerchant.toLowerCase()
          
          // Check if merchant name is too similar to the source domain
          // This prevents using "deals-blog" as merchant when importing from deals-blog.gr
          const domainParts = sourceDomain.split(".")
          const mainDomain = domainParts.length > 1 ? domainParts[domainParts.length - 2] : sourceDomain
          
          // If merchant name matches or is very similar to domain, reject it
          if (merchantLower === sourceDomain || 
              merchantLower === mainDomain ||
              merchantLower.includes(sourceDomain) ||
              sourceDomain.includes(merchantLower)) {
            console.warn(`[AI-EXTRACTION] Rejecting merchant "${candidateMerchant}" because it matches source domain "${sourceDomain}"`)
            merchant = undefined
          } else {
            merchant = candidateMerchant || undefined
          }
        } catch (error) {
          // If URL parsing fails, use the merchant as-is but log a warning
          console.warn(`[AI-EXTRACTION] Could not validate merchant against URL, using as-is:`, candidateMerchant)
          merchant = candidateMerchant || undefined
        }
      }

      // Validate dealUrl - must be in urlCandidates or null
      let dealUrl: string | null = null
      if (dealData.dealUrl) {
        // Check if dealUrl is EXACTLY the same as sourceUrl (not just contains it)
        const normalizedSourceUrl = url.toLowerCase().trim().replace(/\/$/, '')
        const normalizedDealUrl = dealData.dealUrl.toLowerCase().trim().replace(/\/$/, '')
        
        // Only reject if they are EXACTLY the same (not if dealUrl contains sourceUrl - that's normal!)
        if (normalizedDealUrl === normalizedSourceUrl) {
          console.warn(`[AI-EXTRACTION] AI returned dealUrl that is exactly the same as sourceUrl. Rejecting it. Source: ${url}, DealUrl: ${dealData.dealUrl}`)
          dealUrl = null
        } else if (urlCandidates.includes(dealData.dealUrl)) {
          dealUrl = dealData.dealUrl
          console.log(`[AI-EXTRACTION] Using dealUrl from candidates: ${dealUrl}`)
        } else {
          console.warn(`[AI-EXTRACTION] AI returned dealUrl "${dealData.dealUrl}" which is not in candidates list. Setting to null.`)
          dealUrl = null
        }
      }

      // Validate extraInfo and redeemSteps lengths
      const extraInfo = dealData.extraInfo ? dealData.extraInfo.trim().slice(0, 500) : null
      const redeemSteps = dealData.redeemSteps ? dealData.redeemSteps.trim().slice(0, 1000) : null
      const priceValue = dealData.priceValue ? dealData.priceValue.trim() : null
      
      // Normalize location: empty string for online-only, or physical location if provided
      const location = dealData.location?.trim() || ""

      validatedDeals.push({
        title: dealData.title.trim().slice(0, 200),
        summary: dealData.summary.trim().slice(0, 500),
        category: dealData.category,
        expiresAt: normalizedExpiresAt,
        expiresEvidence: dealData.expiresEvidence || null,
        sourceUrl: url,
        dealUrl: dealUrl,
        location: location,
        merchant: merchant || undefined,
        imageUrl: undefined,
        priceValue: priceValue,
        priceType: priceType,
        origin: origin,
        startsAt: normalizedStartsAt,
        startsEvidence: dealData.startsEvidence || null,
        extraInfo: extraInfo,
        redeemSteps: redeemSteps,
      })
    }

    if (validatedDeals.length === 0) {
      return {
        isDeal: false,
        error: "No valid deals could be extracted",
      }
    }

    // Return single deal for backward compatibility, or multiple deals
    if (validatedDeals.length === 1) {
      return {
        isDeal: true,
        deal: validatedDeals[0],
        deals: validatedDeals,
        extractedImageUrl: extractedImageUrl || undefined,
      }
    }

    return {
      isDeal: true,
      deals: validatedDeals,
      deal: validatedDeals[0], // First deal for backward compatibility
      extractedImageUrl: extractedImageUrl || undefined,
    }
  } catch (error: any) {
    console.error("[AI-EXTRACTION] Error extracting deal from URL:", error)
    return {
      isDeal: false,
      error: error.message || "Failed to extract deal information",
    }
  }
}
