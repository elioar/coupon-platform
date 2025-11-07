import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient()
  
  // Only use Accelerate if PRISMA_ACCELERATE_URL is provided
  if (process.env.PRISMA_ACCELERATE_URL) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient
  }
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

