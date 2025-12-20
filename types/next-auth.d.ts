import { Role } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      emailVerified: boolean
      membershipExpiry: string | null
      address?: string | null
      birthDate?: string | Date | null
      phone?: string | null
      about?: string | null
      businessDescription?: string | null
      businessCategories?: string[]
      businessLocation?: string | null
      businessWebsite?: string | null
      businessInstagram?: string | null
      businessFacebook?: string | null
      businessTikTok?: string | null
      businessLatitude?: number | null
      businessLongitude?: number | null
    }
  }

  interface User {
    role: Role
    emailVerified?: boolean
    address?: string | null
    birthDate?: Date | null
    phone?: string | null
    about?: string | null
    businessDescription?: string | null
    businessCategories?: string[]
    businessLocation?: string | null
    businessWebsite?: string | null
    businessInstagram?: string | null
    businessFacebook?: string | null
    businessTikTok?: string | null
    businessLatitude?: number | null
    businessLongitude?: number | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    emailVerified: boolean
    membershipExpiry: string | null
    address?: string | null
    birthDate?: string | null
    phone?: string | null
    about?: string | null
    businessDescription?: string | null
    businessCategories?: string[]
    businessLocation?: string | null
    businessWebsite?: string | null
    businessInstagram?: string | null
    businessFacebook?: string | null
    businessTikTok?: string | null
    businessLatitude?: number | null
    businessLongitude?: number | null
  }
}

