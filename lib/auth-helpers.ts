import { auth } from "@/auth"
import { Role } from "@prisma/client"
import { isMember as isMemberUtil } from "@/lib/client-utils"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}

// Re-export from client-utils for server-side use
export { isMemberUtil as isMember }

export async function isCurrentUserMember(): Promise<boolean> {
  const user = await getCurrentUser()
  return isMemberUtil(user)
}

