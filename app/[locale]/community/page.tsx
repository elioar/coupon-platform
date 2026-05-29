"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Navigation from "@/components/Navigation"
import CommunityDealCard from "@/components/CommunityDealCard"
import SkeletonCommunityDealCard from "@/components/SkeletonCommunityDealCard"
import { EditDealModal } from "@/components/EditDealModal"
import CommunityDealModal from "@/components/CommunityDealModal"

interface CommunityDeal {
  id: string
  title: string
  description: string
  category: string
  location: string | null
  latitude?: number | null
  longitude?: number | null
  imageUrl: string
  couponCode: string | null
  createdAt: string
  expiresAt: string | null
  startsAt?: string | null
  link?: string | null
  priceValue?: string | null
  priceType?: "EUR" | "PERCENT" | "ONE_PLUS_ONE" | "TWO_PLUS_ONE" | "FREE" | "OTHER" | null
  merchantName?: string | null
  origin?: "GR" | "INTERNATIONAL" | null
  extraInfo?: string | null
  redeemSteps?: string | null
  commentsCount: number
  upvotesCount: number
  downvotesCount: number
  myVote: "UP" | "DOWN" | null
  user: {
    id: string
    name: string
    email: string
  }
}

export default function CommunityPage() {
  const { data: session } = useSession()
  const t = useTranslations("community")
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

  const [deals, setDeals] = useState<CommunityDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ONLINE" | "IN_STORE">(
    () => (searchParams.get("type") as "ALL" | "ONLINE" | "IN_STORE") || "ALL"
  )
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<CommunityDeal | null>(null)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(getInitialPage)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearMeEnabled, setNearMeEnabled] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [geolocationSupported, setGeolocationSupported] = useState(false)
  const [locationDescription, setLocationDescription] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const itemsPerPage = 9

  const categories = [
    "Food & Dining",
    "Fashion",
    "Electronics",
    "Beauty & Health",
    "Travel",
    "Home & Garden",
    "Sports & Fitness",
    "Entertainment",
    "Other",
  ]

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGeolocationSupported(true)
    }
  }, [])

  const updateUrlParams = (updates: { category?: string | null; q?: string; page?: number; type?: string | null }) => {
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

    if ("type" in updates) {
      const typeValue = updates.type
      if (typeValue && typeValue !== "ALL") {
        paramsCopy.set("type", typeValue)
      } else {
        paramsCopy.delete("type")
      }
    }

    const queryString = paramsCopy.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams({ page })
  }

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    updateUrlParams({ category, page: 1 })
  }

  const handleTypeChange = (type: "ALL" | "ONLINE" | "IN_STORE") => {
    setTypeFilter(type)
    setCurrentPage(1)
    updateUrlParams({ type, page: 1 })
  }

  useEffect(() => {
    const categoryParam = searchParams.get("category")
    const queryParam = searchParams.get("q") ?? ""
    const pageParam = searchParams.get("page")
    const typeParam = (searchParams.get("type") as "ALL" | "ONLINE" | "IN_STORE") || "ALL"
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1
    const normalizedPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage

    setSelectedCategory(categoryParam ?? null)
    setSearchQuery(queryParam)
    setTypeFilter(typeParam)
    setCurrentPage(normalizedPage)
  }, [searchParams])

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
  }, [nearMeEnabled, geolocationSupported])

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
      } catch {
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

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const url = new URL("/api/community-deals", window.location.origin)
      if (selectedCategory) {
        url.searchParams.set("category", selectedCategory)
      }

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        setDeals(data.deals || [])
      }
    } catch (error) {
      console.error("Error fetching deals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [selectedCategory])

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    fetchDeals()
  }

  const handleCreateDeal = async (formData: any) => {
    setCreating(true)
    try {
      const response = await fetch("/api/community-deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          imageUrl: formData.imageUrl,
          couponCode: formData.couponCode || null,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
          link: formData.link?.trim() || null,
          priceValue: formData.priceValue?.trim() || null,
          priceType: formData.priceType || null,
          merchantName: formData.merchantName?.trim() || null,
          origin: formData.origin || "GR",
          startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
          extraInfo: formData.extraInfo?.trim() || null,
          redeemSteps: formData.redeemSteps?.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || "Failed to create deal"
        const errorDetails = errorData.details ? ` Details: ${JSON.stringify(errorData.details)}` : ""
        console.error("Validation error details:", errorData.details)
        throw new Error(errorMessage + errorDetails)
      }

      handleCreateSuccess()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create deal"
      console.error("Error creating deal:", errorMessage)
      throw error
    } finally {
      setCreating(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    const response = await fetch("/api/upload/community", {
      method: "POST",
      body: uploadFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Upload failed")
    }

    const data = await response.json()
    return data.url
  }

  const handleViewDeal = (deal: CommunityDeal) => {
    setSelectedDeal(deal)
  }

  const handleVote = useCallback(async (dealId: string, vote: "UP" | "DOWN") => {
    if (!session) return
    try {
      const res = await fetch(`/api/community-deals/${dealId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: vote }),
      })
      if (!res.ok) return
      const data = await res.json()
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId
            ? {
                ...d,
                upvotesCount: data.upvotesCount ?? d.upvotesCount,
                downvotesCount: data.downvotesCount ?? d.downvotesCount,
                myVote: data.myVote ?? null,
              }
            : d
        )
      )
      setSelectedDeal((prev) =>
        prev && prev.id === dealId
          ? {
              ...prev,
              upvotesCount: data.upvotesCount ?? prev.upvotesCount,
              downvotesCount: data.downvotesCount ?? prev.downvotesCount,
              myVote: data.myVote ?? null,
            }
          : prev
      )
    } catch (e) {
      console.error("Error voting:", e)
    }
  }, [session])

  const handleVoteStateChange = useCallback((
    dealId: string,
    payload: { upvotesCount: number; downvotesCount: number; myVote: "UP" | "DOWN" | null }
  ) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              upvotesCount: payload.upvotesCount,
              downvotesCount: payload.downvotesCount,
              myVote: payload.myVote,
            }
          : d
      )
    )
    setSelectedDeal((prev) =>
      prev && prev.id === dealId
        ? {
            ...prev,
            upvotesCount: payload.upvotesCount,
            downvotesCount: payload.downvotesCount,
            myVote: payload.myVote,
          }
        : prev
    )
  }, [])

  const handleCommentsCountChange = useCallback((dealId: string, nextCount: number) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, commentsCount: nextCount } : d))
    )
    setSelectedDeal((prev) =>
      prev && prev.id === dealId ? { ...prev, commentsCount: nextCount } : prev
    )
  }, [])

  const filteredDeals = deals.filter((deal) => {
    if (selectedCategory && deal.category !== selectedCategory) {
      return false
    }
    if (typeFilter === "ONLINE" && !!deal.location) {
      return false
    }
    if (typeFilter === "IN_STORE" && !deal.location) {
      return false
    }
    return true
  })

  const searchedDeals = filteredDeals.filter((deal) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return (
      deal.title.toLowerCase().includes(query) ||
      deal.description.toLowerCase().includes(query) ||
      (deal.location && deal.location.toLowerCase().includes(query)) ||
      deal.category.toLowerCase().includes(query) ||
      deal.user.name.toLowerCase().includes(query)
    )
  })

  const dealsWithDistance = searchedDeals.map((deal) => {
    if (
      userLocation &&
      typeof deal.latitude === "number" &&
      typeof deal.longitude === "number" &&
      !isNaN(deal.latitude) &&
      !isNaN(deal.longitude)
    ) {
      const distanceKm = calculateDistanceInKm(
        userLocation.lat,
        userLocation.lng,
        deal.latitude,
        deal.longitude
      )
      return { ...deal, distanceKm }
    }
    return { ...deal, distanceKm: null as number | null }
  })

  const sortedDeals =
    nearMeEnabled && userLocation
      ? (() => {
          const withDistance = dealsWithDistance.filter(
            (d) => typeof d.distanceKm === "number" && d.distanceKm != null
          )
          return withDistance.sort((a, b) => (a.distanceKm! - b.distanceKm!))
        })()
      : dealsWithDistance

  const totalPages = Math.ceil(sortedDeals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDeals = sortedDeals.slice(startIndex, endIndex)

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-green-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>
          {session && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-green-500/20 transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-500/30"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              {t("createDeal")}
            </button>
          )}
        </motion.div>

        {/* Search + Near Me (same UX as Coupons page) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <div className="mb-2">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="h-4.5 w-4.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tCommon("search")}
                className="w-full rounded-2xl border border-zinc-300 bg-transparent py-3 pl-12 pr-16 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-12 flex items-center pr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={handleNearMeClick}
                disabled={locationLoading || (!geolocationSupported && !nearMeEnabled)}
                className={`absolute inset-y-0 right-2 my-1 flex w-10 items-center justify-center rounded-2xl text-sm font-semibold transition ${
                  nearMeEnabled
                    ? "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
                } ${locationLoading ? "opacity-70" : ""}`}
                aria-pressed={nearMeEnabled}
              >
                {locationLoading ? (
                  <svg className="h-4.5 w-4.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                )}
                <span className="sr-only">
                  {nearMeEnabled ? t("nearMeDisable") : t("nearMeEnable")}
                </span>
              </button>
            </div>
          </div>

          {(locationError || locationDescription) && (
            <div className="mt-2 text-xs font-medium">
              {locationError ? (
                <span className="text-red-600 dark:text-red-400">{locationError}</span>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">{locationDescription}</span>
              )}
            </div>
          )}
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-green-500 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tCommon("all")}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-green-500 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white/50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50 sm:shrink-0">
            <button
              onClick={() => handleTypeChange("ALL")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === "ALL"
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {t("typeAll")}
            </button>
            <button
              onClick={() => handleTypeChange("ONLINE")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === "ONLINE"
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {t("typeOnline")}
            </button>
            <button
              onClick={() => handleTypeChange("IN_STORE")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === "IN_STORE"
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {t("typeInStore")}
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 9 }).map((_, index) => (
              <SkeletonCommunityDealCard key={index} />
            ))}
          </motion.div>
        )}

        {/* Deals Grid */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {sortedDeals.length > 0 ? (
              <>
                <motion.div
                  key={`deals-page-${currentPage}`}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    transition: { duration: 0.2 }
                  }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <AnimatePresence mode="popLayout">
                    {paginatedDeals.map((deal, index) => (
                      <motion.div
                        key={deal.id}
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
                        <CommunityDealCard
                          deal={deal}
                          locale={locale}
                          onViewClick={() => handleViewDeal(deal)}
                          canInteract={!!session}
                          onVote={handleVote}
                          userLocation={userLocation}
                          nearMeEnabled={nearMeEnabled}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
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
              </>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("noDeals")}
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {t("noDealsDescription")}
                </p>
                {session && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600"
                  >
                    {t("createDeal")}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Create Deal Modal */}
      <EditDealModal
        deal={null}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateDeal}
        onImageUpload={handleImageUpload}
        locale={locale}
        onSuccess={handleCreateSuccess}
        saving={creating}
      />

      {/* View Deal Modal */}
      <CommunityDealModal
        deal={selectedDeal}
        locale={locale}
        onClose={() => setSelectedDeal(null)}
        canInteract={!!session}
        onVoteStateChange={handleVoteStateChange}
        onCommentsCountChange={handleCommentsCountChange}
      />
    </div>
  )
}
