"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import Navigation from "@/components/Navigation"
import MembershipBadge from "@/components/MembershipBadge"
import CouponCard from "@/components/CouponCard"
import { isMember } from "@/lib/client-utils"

interface Coupon {
  id: string
  title: string
  description: string
  code: string
  imagePath: string | null
  discountPercentage: number
  expirationDate: string
  category: {
    id: string
    nameEn: string
    nameEl: string
  }
  business: {
    id: string
    name: string
  }
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const t = useTranslations("dashboard.user")
  const tCommon = useTranslations("common")
  const params = useParams()
  const locale = params.locale as string

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  const userIsMember = session?.user ? isMember(session.user) : false

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch('/api/coupons')
        const data = await response.json()
        setCoupons(data.coupons || [])
      } catch (error) {
        console.error("Error fetching coupons:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Welcome back, {session?.user.name}!
          </p>
        </div>

        {/* Membership Status */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("membershipStatus")}
          </h2>
          <MembershipBadge membershipExpiry={session?.user.membershipExpiry || null} />
        </div>

        {/* Available Coupons */}
        <div>
          <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("availableCoupons")}
          </h2>

          {loading ? (
            <div className="py-12 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">{tCommon("loading")}</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">No coupons available yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  isMember={userIsMember}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

