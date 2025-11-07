import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    async jwt({ token, user, trigger }) {
      // On sign in, store user data in token
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        
        // Fetch membership expiry on login
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { membershipExpiry: true },
        })
        
        token.membershipExpiry = dbUser?.membershipExpiry?.toISOString() || null
      }
      
      // Only refetch on explicit update trigger (not on every request)
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, membershipExpiry: true },
        })
        
        if (dbUser) {
          token.role = dbUser.role
          token.membershipExpiry = dbUser.membershipExpiry?.toISOString() || null
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.membershipExpiry = token.membershipExpiry as string | null
      }
      return session
    },
  },
})

