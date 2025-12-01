const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Get user ID from command line argument
    const userId = process.argv[2]
    
    if (!userId) {
      console.log('Usage: node scripts/check-membership-status.js <userId>')
      console.log('Or run without arguments to check all users with rewards')
      const usersWithRewards = await prisma.businessInvite.findMany({
        where: {
          rewardGranted: true,
          status: 'ACTIVE',
        },
        select: {
          inviterId: true,
          inviter: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        distinct: ['inviterId'],
      })
      
      if (usersWithRewards.length === 0) {
        console.log('No users with rewards found')
        process.exit(0)
      }
      
      console.log('\nUsers with rewards granted:')
      for (const invite of usersWithRewards) {
        console.log(`  - ${invite.inviter.email} (${invite.inviter.name}) - ID: ${invite.inviterId}`)
      }
      console.log('\nRun with a user ID to check their membership status')
      process.exit(0)
    }

    // Get user with invites
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        membershipExpiry: true,
        sentInvites: {
          where: {
            rewardGranted: true,
            status: 'ACTIVE',
          },
          include: {
            invitedBusiness: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      console.log('User not found')
      process.exit(1)
    }

    const now = new Date()
    const hasActiveMembership = user.membershipExpiry && new Date(user.membershipExpiry) > now

    console.log('\n=== User Membership Status ===')
    console.log(`Name: ${user.name}`)
    console.log(`Email: ${user.email}`)
    console.log(`User ID: ${user.id}`)
    console.log(`Membership Expiry: ${user.membershipExpiry ? new Date(user.membershipExpiry).toISOString() : 'NULL'}`)
    console.log(`Has Active Membership: ${hasActiveMembership}`)
    
    if (user.membershipExpiry) {
      const expiryDate = new Date(user.membershipExpiry)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`Days until expiry: ${daysUntilExpiry}`)
    }
    
    console.log(`\nRewards Granted: ${user.sentInvites.length}`)
    
    if (user.sentInvites.length > 0) {
      console.log('\n=== Active Invites ===')
      for (const invite of user.sentInvites) {
        console.log(`  - ${invite.invitedBusiness.name} (ID: ${invite.invitedBusiness.id})`)
      }
      
      if (!hasActiveMembership) {
        console.log('\n⚠️  ISSUE: User has rewards granted but NO active membership!')
        console.log('Expected expiry should be:', new Date(now.getTime() + (user.sentInvites.length * 30 * 24 * 60 * 60 * 1000)).toISOString())
      } else {
        console.log('\n✅ Membership is active')
      }
    } else {
      console.log('\nNo active invites with rewards granted')
    }

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })

