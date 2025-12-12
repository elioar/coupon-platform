"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Navigation from "@/components/Navigation"
import CommunityDealCard from "@/components/CommunityDealCard"
import CreateDealModal from "@/components/CreateDealModal"
import CommunityDealModal from "@/components/CommunityDealModal"

interface CommunityDeal {
  id: string
  title: string
  description: string
  category: string
  location: string
  latitude?: number | null
  longitude?: number | null
  imageUrl: string
  couponCode: string | null
  createdAt: string
  expiresAt: string
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

  const [deals, setDeals] = useState<CommunityDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<CommunityDeal | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearMeEnabled, setNearMeEnabled] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [geolocationSupported, setGeolocationSupported] = useState(false)
  const [locationDescription, setLocationDescription] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

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
    fetchDeals()
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

  const filteredDeals = selectedCategory
    ? deals.filter((deal) => deal.category === selectedCategory)
    : deals

  const searchedDeals = filteredDeals.filter((deal) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return (
      deal.title.toLowerCase().includes(query) ||
      deal.description.toLowerCase().includes(query) ||
      deal.location.toLowerCase().includes(query) ||
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
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
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
                onClick={() => setSelectedCategory(category)}
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
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-600 dark:text-zinc-400">{tCommon("loading")}</div>
          </div>
        )}

        {/* Deals Grid */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {sortedDeals.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedDeals.map((deal) => (
                  <CommunityDealCard
                    key={deal.id}
                    deal={deal}
                    locale={locale}
                    onViewClick={() => handleViewDeal(deal)}
                    canInteract={!!session}
                    onVote={handleVote}
                  />
                ))}
              </div>
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
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        locale={locale}
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

