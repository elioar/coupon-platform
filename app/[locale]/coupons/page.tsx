"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import Navigation from "@/components/Navigation"
import CouponCard from "@/components/CouponCard"
import CategoryFilter from "@/components/CategoryFilter"
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

interface Category {
  id: string
  nameEn: string
  nameEl: string
  slug: string
}

export default function CouponsPage() {
  const { data: session } = useSession()
  const t = useTranslations("coupons")
  const tCommon = useTranslations("common")
  const params = useParams()
  const locale = params.locale as string

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const userIsMember = session?.user ? isMember(session.user) : false

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponsRes, categoriesRes] = await Promise.all([
          fetch(`/api/coupons${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`),
          fetch('/api/categories'),
        ])

        const couponsData = await couponsRes.json()
        const categoriesData = await categoriesRes.json()

        setCoupons(couponsData.coupons || [])
        setCategories(categoriesData.categories || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCategory])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          locale={locale}
        />

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">{tCommon("loading")}</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">{t("noCoupons")}</p>
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
      </main>
    </div>
  )
}

