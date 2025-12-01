const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Get user ID from command line argument
    const userId = process.argv[2]
    
    if (!userId) {
      console.log('Usage: node scripts/check-user-membership.js <userId>')
      process.exit(1)
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
          include: {
            invitedBusiness: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      console.log('User not found')
      process.exit(1)
    }

    console.log('\n=== User Info ===')
    console.log(`Name: ${user.name}`)
    console.log(`Email: ${user.email}`)
    console.log(`Membership Expiry: ${user.membershipExpiry || 'NULL'}`)
    console.log(`Is Active: ${user.membershipExpiry ? new Date(user.membershipExpiry) > new Date() : false}`)
    
    console.log('\n=== Invites ===')
    for (const invite of user.sentInvites) {
      console.log(`\nInvite ID: ${invite.id}`)
      console.log(`  Business: ${invite.invitedBusiness.name}`)
      console.log(`  Status: ${invite.status}`)
      console.log(`  Reward Granted: ${invite.rewardGranted}`)
      console.log(`  Created: ${invite.createdAt}`)
    }

    // Check if there are any invites that should have granted rewards
    const activeInvites = user.sentInvites.filter(i => i.rewardGranted && i.status === 'ACTIVE')
    console.log(`\n=== Summary ===`)
    console.log(`Total Invites: ${user.sentInvites.length}`)
    console.log(`Active Invites with Rewards: ${activeInvites.length}`)
    
    if (activeInvites.length > 0 && !user.membershipExpiry) {
      console.log('\n⚠️  ISSUE FOUND: You have active invites with rewards granted, but no membership expiry date!')
      console.log('This means the reward granting process might have failed.')
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

