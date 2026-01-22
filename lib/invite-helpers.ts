import { prisma } from "@/lib/prisma"
import { InviteStatus, CouponStatus } from "@prisma/client"

/**
 * Check if a business has at least one active (approved and not expired) coupon
 */
export async function hasActiveCoupon(businessId: string): Promise<boolean> {
  const activeCoupon = await prisma.coupon.findFirst({
    where: {
      businessId,
      status: CouponStatus.APPROVED,
      expirationDate: {
        gte: new Date(),
      },
    },
  })

  return !!activeCoupon
}

/**
 * Check and activate invites for a business that just became active
 * Grants 1 month of free membership to the inviter when business becomes active
 */
export async function checkAndActivateInvites(businessId: string): Promise<void> {
  // Find all invites for this business that are REGISTERED but not yet ACTIVE
  const invites = await prisma.businessInvite.findMany({
    where: {
      invitedBusinessId: businessId,
      status: InviteStatus.REGISTERED,
      rewardGranted: false,
    },
    include: {
      User_BusinessInvite_inviterIdToUser: {
        select: {
          id: true,
          membershipExpiry: true,
        },
      },
    },
  })

  // Check if business has at least one active coupon
  const hasActive = await hasActiveCoupon(businessId)

  if (!hasActive) {
    return // Business is not yet active
  }

  // Process each invite
  for (const invite of invites) {
    try {
      // Calculate new membership expiry (add 1 month = ~30 days)
      const now = new Date()
      let newExpiry: Date

      if (invite.User_BusinessInvite_inviterIdToUser.membershipExpiry && invite.User_BusinessInvite_inviterIdToUser.membershipExpiry > now) {
        // User already has active membership, add 1 month to existing expiry
        newExpiry = new Date(invite.User_BusinessInvite_inviterIdToUser.membershipExpiry)
        newExpiry.setMonth(newExpiry.getMonth() + 1)
      } else {
        // User has no active membership, set expiry to 1 month from now
        newExpiry = new Date()
        newExpiry.setMonth(newExpiry.getMonth() + 1)
      }

      // Use a transaction to ensure both updates succeed or both fail
      await prisma.$transaction(async (tx) => {
        // Update invite status to ACTIVE and mark reward as granted
        await tx.businessInvite.update({
          where: { id: invite.id },
          data: {
            status: InviteStatus.ACTIVE,
            rewardGranted: true,
          },
        })

        // Grant 1 month free membership to inviter
        await tx.user.update({
          where: { id: invite.inviterId },
          data: {
            membershipExpiry: newExpiry,
          },
        })
      })

    } catch (error) {
      console.error(`Error processing invite ${invite.id}:`, error)
      // Continue processing other invites even if one fails
    }
  }
}

/**
 * Fix rewards that were marked as granted but membership wasn't actually updated
 * This can happen if the membership update failed but the invite status was already updated
 */
export async function fixMissingMembershipRewards(userId?: string): Promise<number> {
  // If userId is provided, fix for that specific user
  if (userId) {
    // Get user's invites directly
    const userInvites = await prisma.businessInvite.findMany({
      where: {
        inviterId: userId,
        rewardGranted: true,
        status: InviteStatus.ACTIVE,
      },
      include: {
        User_BusinessInvite_inviterIdToUser: {
          select: {
            id: true,
            membershipExpiry: true,
          },
        },
      },
    })

    if (userInvites.length === 0) {
      return 0
    }

    const user = userInvites[0].User_BusinessInvite_inviterIdToUser
    const now = new Date()
    const hasActiveMembership = user.membershipExpiry && new Date(user.membershipExpiry) > now

    // Calculate rewards count
    const rewardsCount = userInvites.length

    try {
      // Calculate new expiry: 1 month from now per reward that was already granted
      const newExpiry = new Date()
      newExpiry.setMonth(newExpiry.getMonth() + rewardsCount)

      // Update user membership
      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipExpiry: newExpiry,
        },
      })

      return rewardsCount
    } catch (error) {
      console.error(`Error fixing membership for user ${userId}:`, error)
      throw error
    }
  }

  // Group invites by inviter to fix all users at once (for admin use)
  const now = new Date()
  
  const allActiveInvites = await prisma.businessInvite.findMany({
    where: {
      rewardGranted: true,
      status: InviteStatus.ACTIVE,
    },
    include: {
      User_BusinessInvite_inviterIdToUser: {
        select: {
          id: true,
          membershipExpiry: true,
        },
      },
      User_BusinessInvite_invitedBusinessIdToUser: {
        select: {
          id: true,
        },
      },
    },
  })


  // Group by inviter ID
  const invitesByUser = new Map<string, typeof allActiveInvites>()
  for (const invite of allActiveInvites) {
    const inviterId = invite.inviterId
    if (!invitesByUser.has(inviterId)) {
      invitesByUser.set(inviterId, [])
    }
    invitesByUser.get(inviterId)!.push(invite)
  }

  let totalFixedCount = 0

  // Process each user
  for (const [inviterUserId, invites] of invitesByUser.entries()) {
    const user = invites[0].User_BusinessInvite_inviterIdToUser
    const hasActiveMembership = user.membershipExpiry && new Date(user.membershipExpiry) > now


    if (hasActiveMembership) {
      continue // User already has active membership, skip
    }

    try {
      // If rewardGranted is true, the reward was already earned
      // Grant membership based on the number of invites marked as rewardGranted
      // We don't check if coupons are still active because the reward was already earned
      const rewardsCount = invites.length

      if (rewardsCount === 0) {
        continue
      }

      // Calculate new expiry: 1 month from now per reward that was already granted
      const newExpiry = new Date()
      newExpiry.setMonth(newExpiry.getMonth() + rewardsCount)

      // Use transaction to ensure update succeeds
      await prisma.user.update({
        where: { id: inviterUserId },
        data: {
          membershipExpiry: newExpiry,
        },
      })

      totalFixedCount = rewardsCount // Return months granted for this user
    } catch (error) {
      console.error(`Error fixing membership for user ${inviterUserId}:`, error)
    }
  }

  return totalFixedCount
}
