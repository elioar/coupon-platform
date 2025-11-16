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

export const { handlers, signIn, signOut, auth } = NextAuth({
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
          token.businessDescription = dbUser.businessDescription ?? null
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
        // When session is explicitly updated, prefer provided values to avoid extra query
        if (session?.name) {
          token.name = session.name
        }
        await hydrateTokenFromDb(token.id as string)
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
        session.user.about = (token.about as string | null) ?? null
        session.user.businessDescription = (token.businessDescription as string | null) ?? null
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

