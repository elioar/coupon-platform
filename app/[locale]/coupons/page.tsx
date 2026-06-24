"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
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
  code: string | null
  couponType: "ONLINE_CODE" | "QR_CODE"
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
    businessLocation?: string | null
    businessLatitude?: number | null
    businessLongitude?: number | null
  }
  distanceKm?: number | null
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getInitialPage = () => {
    const pageParam = searchParams.get("page")
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1
    return Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage
  }

  const [allCoupons, setAllCoupons] = useState<Coupon[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => searchParams.get("category"))
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get("q") ?? "")
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ONLINE" | "IN_STORE">("ALL")
  const [loading, setLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [currentPage, setCurrentPage] = useState(getInitialPage)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearMeEnabled, setNearMeEnabled] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [geolocationSupported, setGeolocationSupported] = useState(false)
  const [locationDescription, setLocationDescription] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const itemsPerPage = 9

  const userIsMember = session?.user ? isMember(session.user) : false

  const updateUrlParams = (updates: { category?: string | null; q?: string; page?: number }) => {
    const paramsCopy = new URLSearchParams(searchParams.toString())

    if ("category" in updates) {
      const categoryValue = updates.category
      if (categoryValue) {
        paramsCopy.set("category", categoryValue)
      } else {
        paramsCopy.delete("category")
      }
    }

    if ("q" in updates) {
      const queryValue = updates.q ?? ""
      if (queryValue.length > 0) {
        paramsCopy.set("q", queryValue)
      } else {
        paramsCopy.delete("q")
      }
    }

    if ("page" in updates) {
      const pageValue = updates.page ?? 1
      if (pageValue > 1) {
        paramsCopy.set("page", pageValue.toString())
      } else {
        paramsCopy.delete("page")
      }
    }

    const queryString = paramsCopy.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  useEffect(() => {
    const categoryParam = searchParams.get("category")
    const queryParam = searchParams.get("q") ?? ""
    const pageParam = searchParams.get("page")
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1
    const normalizedPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage

    setSelectedCategory(categoryParam ?? null)
    setSearchQuery(queryParam)
    setCurrentPage(normalizedPage)
  }, [searchParams])

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGeolocationSupported(true)
    }
  }, [])

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
    updateUrlParams({ category: categoryId, page: 1 })
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    updateUrlParams({ q: query, page: 1 })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams({ page })
  }

  const calculateDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180
    const R = 6371 // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleNearMeClick = () => {
    if (nearMeEnabled) {
      setNearMeEnabled(false)
      setLocationError(null)
      setLocationDescription(null)
      return
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocationError(t("nearMeInsecure"))
      return
    }

    if (!geolocationSupported) {
      setLocationError(t("nearMeUnsupported"))
      return
    }

    setLocationError(null)
    setNearMeEnabled(true)
  }

  useEffect(() => {
    if (!nearMeEnabled) {
      setLocationDescription(null)
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      setLocationLoading(false)
      return
    }

    if (!geolocationSupported) {
      setLocationError(t("nearMeUnsupported"))
      setNearMeEnabled(false)
      return
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocationError(t("nearMeInsecure"))
      setNearMeEnabled(false)
      return
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(t("nearMeUnsupported"))
      setNearMeEnabled(false)
      return
    }

    setLocationLoading(true)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(coords)
        setLocationLoading(false)
        setLocationError(null)
      },
      (error) => {
        // Geolocation error - handled silently
        const reason = (() => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              return t("nearMePermissionDenied")
            case error.POSITION_UNAVAILABLE:
              return t("nearMePositionUnavailable")
            case error.TIMEOUT:
              return t("nearMeTimeout")
            default:
              return t("nearMeDenied")
          }
        })()
        setLocationError(reason)
        setLocationLoading(false)
        setNearMeEnabled(false)
        setLocationDescription(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      }
    )

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [nearMeEnabled, geolocationSupported, t])

  useEffect(() => {
    let cancelled = false

    const resolveCityName = async () => {
      if (!nearMeEnabled || !userLocation) {
        return
      }

      setLocationDescription(t("nearMeResolvingCity"))

      try {
        const url = new URL("https://nominatim.openstreetmap.org/reverse")
        url.searchParams.set("format", "jsonv2")
        url.searchParams.set("lat", userLocation.lat.toString())
        url.searchParams.set("lon", userLocation.lng.toString())
        url.searchParams.set("zoom", "10")
        url.searchParams.set("addressdetails", "1")

        const response = await fetch(url.toString(), {
          headers: {
            "Accept-Language": locale,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to reverse geocode location")
        }

        const data = await response.json()
        const address = data.address ?? {}
        const resolvedCity =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          address.state_district ||
          address.state ||
          null

        if (!cancelled) {
          const label = resolvedCity ?? t("nearMeUnknownCity")
          setLocationDescription(t("nearMeCurrentLocation", { city: label }))
        }
      } catch (error) {
        // Reverse geocoding failed - handled silently
        if (!cancelled) {
          setLocationDescription(t("nearMeCurrentLocation", { city: t("nearMeUnknownCity") }))
        }
      }
    }

    resolveCityName()

    return () => {
      cancelled = true
    }
  }, [nearMeEnabled, userLocation, locale, t])

  const handleTypeFilterChange = (type: "ALL" | "ONLINE" | "IN_STORE") => {
    setTypeFilter(type)
    setCurrentPage(1)
  }

  // Filter coupons based on search query, category, and type
  const filteredCoupons = allCoupons.filter((coupon) => {
    // Type filter
    if (typeFilter === "ONLINE" && coupon.couponType !== "ONLINE_CODE") return false
    if (typeFilter === "IN_STORE" && coupon.couponType !== "QR_CODE") return false

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

  // Calculate distance for coupons with Google Maps coordinates
  const couponsWithDistance = filteredCoupons.map((coupon) => {
    // Only calculate distance if we have user location AND business has Google Maps coordinates
    if (
      userLocation && 
      coupon.business?.businessLatitude != null && 
      coupon.business?.businessLongitude != null &&
      typeof coupon.business.businessLatitude === "number" && 
      typeof coupon.business.businessLongitude === "number" &&
      !isNaN(coupon.business.businessLatitude) &&
      !isNaN(coupon.business.businessLongitude)
    ) {
      const distanceKm = calculateDistanceInKm(
        userLocation.lat,
        userLocation.lng,
        coupon.business.businessLatitude,
        coupon.business.businessLongitude
      )
      return { ...coupon, distanceKm }
    }
    return { ...coupon, distanceKm: null }
  })

  const hasDistanceCoupons = couponsWithDistance.some((coupon) => typeof coupon.distanceKm === "number")

  // When "Near Me" is enabled, show only coupons with valid Google Maps coordinates, sorted by distance
  const sortedCoupons =
    nearMeEnabled && userLocation
      ? (() => {
          const withDistance = couponsWithDistance.filter(
            (coupon) => typeof coupon.distanceKm === "number" && coupon.distanceKm != null
          )
          
          // Near Me Filter applied
          return withDistance.sort((a, b) => (a.distanceKm! - b.distanceKm!))
        })()
      : couponsWithDistance

  const totalPages = Math.ceil(sortedCoupons.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCoupons = sortedCoupons.slice(startIndex, endIndex)
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
        // Error fetching data - handled silently
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
            onSelectCategory={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            locale={locale}
            nearMeEnabled={nearMeEnabled}
            locationLoading={locationLoading}
            geolocationSupported={geolocationSupported}
            onNearMeClick={handleNearMeClick}
            typeFilter={typeFilter}
            onTypeFilterChange={handleTypeFilterChange}
          />
        </motion.div>

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mb-6 rounded-2xl border border-zinc-200/60 bg-white/90 px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100"
          >
            {sortedCoupons.length > 0 ? (
              <span className="flex items-center justify-between gap-4">
                <span className="text-base font-bold text-green-600 dark:text-green-400">
                  {sortedCoupons.length.toLocaleString(locale)}
                </span>
                <span className="flex-1 text-left text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {sortedCoupons.length === 1 ? t("exclusiveDeal") : t("exclusiveDeals")}
                </span>
                {totalPages > 1 && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {t("page")} {currentPage}/{totalPages}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t("noCouponsFound")}
              </span>
            )}
          </motion.div>
        )}

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
          ) : sortedCoupons.length === 0 ? (
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
                {nearMeEnabled ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                )}
              </svg>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {nearMeEnabled 
                ? t("noCouponsNearMe") || "No coupons found near you"
                : searchQuery || selectedCategory 
                  ? t("noCouponsFound") 
                  : t("noCoupons")
              }
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-zinc-600 dark:text-zinc-400"
            >
              {nearMeEnabled
                ? t("noCouponsNearMeDescription") || "Businesses need to set their location using Google Maps to appear in 'Near Me' results."
                : searchQuery || selectedCategory 
                  ? t("tryDifferentSearch") 
                  : t("checkBackSoon")
              }
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
        {!loading && sortedCoupons.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                    onClick={() => handlePageChange(pageNum)}
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
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
