import { prisma } from "../lib/prisma"
import { Role } from "@prisma/client"

// Deletes every user whose role is NOT ADMIN. Because of the onDelete: Cascade
// relations in schema.prisma, all data owned by those users (coupons, community
// deals, comments, votes, redemptions, accounts, invites, tokens) is removed too.
//
//   Dry run (default): npx tsx prisma/clean-db.ts
//   Execute:           npx tsx prisma/clean-db.ts --yes
async function main() {
  const execute = process.argv.includes("--yes")

  const byRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } })
  const total = await prisma.user.count()
  const toDelete = await prisma.user.count({ where: { role: { not: Role.ADMIN } } })

  // Cascade impact preview (data owned by the users that will be deleted)
  const nonAdminWhere = { User: { role: { not: Role.ADMIN } } }
  const [coupons, deals, comments, votes, redemptions, accounts] = await Promise.all([
    prisma.coupon.count({ where: nonAdminWhere }),
    prisma.communityDeal.count({ where: nonAdminWhere }),
    prisma.communityDealComment.count({ where: nonAdminWhere }),
    prisma.communityDealVote.count({ where: nonAdminWhere }),
    prisma.couponRedemption.count({ where: nonAdminWhere }),
    prisma.account.count({ where: { user: { role: { not: Role.ADMIN } } } }),
  ])

  console.log("=== Users by role ===")
  for (const r of byRole) console.log(`  ${r.role.padEnd(9)} ${r._count._all}`)
  console.log(`  ${"TOTAL".padEnd(9)} ${total}`)
  console.log("")
  console.log(`Will KEEP   : ${total - toDelete} admin user(s)`)
  console.log(`Will DELETE : ${toDelete} non-admin user(s) + cascaded data:`)
  console.log(`    coupons           ${coupons}`)
  console.log(`    community deals    ${deals}`)
  console.log(`    deal comments      ${comments}`)
  console.log(`    deal votes         ${votes}`)
  console.log(`    coupon redemptions ${redemptions}`)
  console.log(`    linked accounts    ${accounts}`)

  if (!execute) {
    console.log("\n*** DRY RUN — nothing was deleted. Re-run with --yes to execute. ***")
    return
  }

  const result = await prisma.user.deleteMany({ where: { role: { not: Role.ADMIN } } })
  console.log(`\n*** DELETED ${result.count} non-admin user(s) and all cascaded data. ***`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
