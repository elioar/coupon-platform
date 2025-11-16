"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Navigation from "@/components/Navigation"
import CouponCard from "@/components/CouponCard"
import SkeletonCouponCard from "@/components/SkeletonCouponCard"
import CategoryFilter from "@/components/CategoryFilter"
import CouponModal from "@/components/CouponModal"
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

  const [allCoupons, setAllCoupons] = useState<Coupon[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  const userIsMember = session?.user ? isMember(session.user) : false

  // Filter coupons based on search query and category
  const filteredCoupons = allCoupons.filter((coupon) => {
    // Category filter
    if (selectedCategory && coupon.category.id !== selectedCategory) {
      return false
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const categoryName = locale === "el" ? coupon.category.nameEl.toLowerCase() : coupon.category.nameEn.toLowerCase()
      const businessName = coupon.business?.name.toLowerCase() || ""
      
      return (
        coupon.title.toLowerCase().includes(query) ||
        coupon.description.toLowerCase().includes(query) ||
        businessName.includes(query) ||
        categoryName.includes(query)
      )
    }

    return true
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponsRes, categoriesRes] = await Promise.all([
          fetch('/api/coupons'),
          fetch('/api/categories'),
        ])

        const couponsData = await couponsRes.json()
        const categoriesData = await categoriesRes.json()

        setAllCoupons(couponsData.coupons || [])
        setCategories(categoriesData.categories || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-green-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Simple Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl"
            >
              {t("title")}
            </motion.h1>
            <AnimatePresence mode="wait">
              {!loading && filteredCoupons.length > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  key={`${filteredCoupons.length}-${currentPage}`}
                  className="mt-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {filteredCoupons.length} {filteredCoupons.length === 1 ? t('exclusiveDeal') : t('exclusiveDeals')} {t('waitingForYou')}
                  {totalPages > 1 && (
                    <span className="ml-2">
                      ({t('page')} {currentPage} {t('of')} {totalPages})
                    </span>
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            locale={locale}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ 
                opacity: 0,
                transition: { duration: 0.2, staggerChildren: 0.02 }
              }}
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[...Array(9)].map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                      delay: index * 0.08,
                    },
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.98,
                    y: 10,
                    transition: {
                      duration: 0.15,
                    },
                  }}
                >
                  <SkeletonCouponCard />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredCoupons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm p-16 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
            >
              <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {searchQuery || selectedCategory ? t("noCouponsFound") : t("noCoupons")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-zinc-600 dark:text-zinc-400"
            >
              {searchQuery || selectedCategory ? t("tryDifferentSearch") : t("checkBackSoon")}
            </motion.p>
          </motion.div>
          ) : (
            <motion.div
              key={`coupons-page-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                transition: { duration: 0.2 }
              }}
              exit={{ opacity: 0 }}
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              layout
            >
              <AnimatePresence mode="popLayout">
                {paginatedCoupons.map((coupon, index) => (
                  <motion.div
                    key={coupon.id}
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 120,
                        damping: 22,
                        delay: Math.min(index * 0.04, 0.25),
                      },
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.92, 
                      y: -10,
                      transition: {
                        duration: 0.15,
                      },
                    }}
                    whileHover={{
                      y: -8,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      },
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                  >
                    <CouponCard
                      coupon={coupon}
                      isMember={userIsMember}
                      locale={locale}
                      onDetailsClick={() => setSelectedCoupon(coupon)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Controls */}
        {!loading && filteredCoupons.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-md transition-all hover:bg-zinc-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }

                const isActive = currentPage === pageNum

                return (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-10 w-10 rounded-lg border font-semibold transition-all ${
                      isActive
                        ? "border-green-600 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                        : "border-zinc-200 bg-white text-zinc-700 shadow-md hover:bg-zinc-50 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                )
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-md transition-all hover:bg-zinc-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:hover:bg-zinc-900"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </main>

      {/* Full-page Modal */}
      {selectedCoupon && (
        <CouponModal
          coupon={selectedCoupon}
          isMember={userIsMember}
          locale={locale}
          onClose={() => setSelectedCoupon(null)}
        />
      )}
    </div>
  )
}

