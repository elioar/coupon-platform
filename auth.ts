import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import type { Adapter } from "next-auth/adapters"

const userProfileSelection = {
  role: true,
  membershipExpiry: true,
  name: true,
  address: true,
  birthDate: true,
  phone: true,
  about: true,
  businessDescription: true,
  businessCategories: true,
  businessLocation: true,
  businessWebsite: true,
  businessInstagram: true,
  businessFacebook: true,
  businessTikTok: true,
  businessLatitude: true,
  businessLongitude: true,
} as const

const sanitizeBusinessDescription = (value: string | null) => {
  if (!value) return null
  if (value.length <= 500) return value
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed.logoUrl === "string" && parsed.logoUrl.length > 120) {
      parsed.logoUrl = ""
    }
    return JSON.stringify(parsed)
  } catch {
    return value.slice(0, 500)
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Ensure the same secret is used across app, middleware, and API routes
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // Allow operation behind proxies / on Vercel with custom domains
  trustHost: true,
  /**
   * Explicit cookie domain so apex/www share the same session cookie.
   * Set COOKIE_DOMAIN=".vibepeek.com" (including the leading dot) in prod.
   */
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        domain: process.env.COOKIE_DOMAIN || undefined,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        domain: process.env.COOKIE_DOMAIN || undefined,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        domain: process.env.COOKIE_DOMAIN || undefined,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const hydrateTokenFromDb = async (userId: string) => {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: userProfileSelection,
        })

        if (dbUser) {
          token.role = dbUser.role
          token.membershipExpiry = dbUser.membershipExpiry?.toISOString() ?? null
          token.name = dbUser.name
          token.address = dbUser.address ?? null
          token.birthDate = dbUser.birthDate?.toISOString() ?? null
          token.phone = dbUser.phone ?? null
          token.about = dbUser.about ?? null
          token.businessDescription = sanitizeBusinessDescription(dbUser.businessDescription ?? null)
          token.businessCategories = dbUser.businessCategories ?? []
          token.businessLocation = dbUser.businessLocation ?? null
          token.businessWebsite = dbUser.businessWebsite ?? null
          token.businessInstagram = dbUser.businessInstagram ?? null
          token.businessFacebook = dbUser.businessFacebook ?? null
          token.businessTikTok = dbUser.businessTikTok ?? null
          token.businessLatitude = dbUser.businessLatitude ?? null
          token.businessLongitude = dbUser.businessLongitude ?? null
        }
      }

      if (user && user.id) {
        token.id = user.id
        token.email = user.email
        await hydrateTokenFromDb(user.id)
      }

      if (trigger === "update" && token.id) {
        // When session is explicitly updated, always refresh from database
        // This ensures membershipExpiry and other fields are up-to-date
        // Add a small delay to ensure database write has completed
        await new Promise(resolve => setTimeout(resolve, 100))
        await hydrateTokenFromDb(token.id as string)
        
        // If session provided name, use it (but still refresh from DB for other fields)
        if (session?.name) {
          token.name = session.name
        }
      }
      
      // Also refresh from DB periodically (every 5 minutes) to catch external updates
      // This helps when membership is updated via invite rewards
      if (token.id && !token.lastRefreshed) {
        token.lastRefreshed = Date.now()
      }
      
      if (token.id && token.lastRefreshed && (Date.now() - (token.lastRefreshed as number)) > 300000) {
        // Refresh every 5 minutes to catch any external updates
        await hydrateTokenFromDb(token.id as string)
        token.lastRefreshed = Date.now()
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.membershipExpiry = (token.membershipExpiry as string | null) ?? null
        session.user.name = (token.name as string) ?? session.user.name
        session.user.address = (token.address as string | null) ?? null
        session.user.birthDate = token.birthDate
          ? new Date(token.birthDate as string)
          : null
        session.user.phone = (token.phone as string | null) ?? null
        session.user.businessDescription = (token.businessDescription as string | null) ?? null
        session.user.about = (token.about as string | null) ?? null
        session.user.businessCategories = (token.businessCategories as string[]) ?? []
        session.user.businessLocation = (token.businessLocation as string | null) ?? null
        session.user.businessWebsite = (token.businessWebsite as string | null) ?? null
        session.user.businessInstagram = (token.businessInstagram as string | null) ?? null
        session.user.businessFacebook = (token.businessFacebook as string | null) ?? null
        session.user.businessTikTok = (token.businessTikTok as string | null) ?? null
        session.user.businessLatitude = (token.businessLatitude as number | null) ?? null
        session.user.businessLongitude = (token.businessLongitude as number | null) ?? null
      }
      return session
    },
  },
})

