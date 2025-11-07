// Client-safe utility functions
// These functions don't import any server-side dependencies like Prisma or auth

export function isMember(user: { membershipExpiry: string | null } | null): boolean {
  if (!user?.membershipExpiry) return false
  return new Date(user.membershipExpiry) > new Date()
}

