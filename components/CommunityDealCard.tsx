"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"
import React, { useState } from "react"
import { motion } from "framer-motion"

interface CommunityDeal {
  id: string
  title: string
  description: string
  category: string
  location: string
  imageUrl: string
  couponCode: string | null
  createdAt: string
  expiresAt: string
  commentsCount: number
  upvotesCount: number
  downvotesCount: number
  myVote: "UP" | "DOWN" | null
  distanceKm?: number | null
  user: {
    id: string
    name: string
    email: string
  }
}

interface CommunityDealCardProps {
  deal: CommunityDeal
  locale: string
  onViewClick?: () => void
  canInteract?: boolean
  onVote?: (dealId: string, vote: "UP" | "DOWN") => Promise<void> | void
  userLocation?: { lat: number; lng: number } | null
  nearMeEnabled?: boolean
}

const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date)
}

const formatLocation = (location: string) => {
  const words = location.trim().split(/\s+/)
  return words.slice(0, 2).join(" ")
}

export default function CommunityDealCard({
  deal,
  locale,
  onViewClick,
  canInteract = false,
  onVote,
  userLocation,
  nearMeEnabled = false,
}: CommunityDealCardProps) {
  const t = useTranslations("community")
  const [isHovered, setIsHovered] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const distanceLabel = (() => {
    // Use distanceKm from deal if available, otherwise calculate it
    let distanceKm = deal.distanceKm
    
    if (distanceKm == null && nearMeEnabled && userLocation && typeof deal.latitude === "number" && typeof deal.longitude === "number") {
      // Calculate distance if not provided
      const toRad = (value: number) => (value * Math.PI) / 180
      const R = 6371 // km
      const dLat = toRad(deal.latitude - userLocation.lat)
      const dLon = toRad(deal.longitude - userLocation.lng)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(deal.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      distanceKm = R * c
    }
    
    if (typeof distanceKm !== "number") return null
    if (Number.isNaN(distanceKm)) return null
    const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
    const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
    if (distanceKm >= 1) {
      return t("distanceAwayKm", { distance: numberFormatter.format(distanceKm) })
    }
    const meters = Math.round(distanceKm * 1000)
    return t("distanceAwayMeters", { distance: integerFormatter.format(meters) })
  })()

  const handleVote = async (e: React.MouseEvent, vote: "UP" | "DOWN") => {
    e.stopPropagation()
    if (!canInteract) return
    if (!onVote || isVoting) return
    try {
      setIsVoting(true)
      await onVote(deal.id, vote)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:border-green-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-green-700"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          className={`object-cover transition-transform duration-300 ${
            isHovered ? "scale-105" : "scale-100"
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Category Badge */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-300">
            {deal.category}
          </span>
        </div>
        {/* Coupon Code Badge */}
        {deal.couponCode && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <svg
                className="h-3 w-3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {t("hasCode")}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {deal.title}
        </h3>

        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <svg
            className="h-4 w-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">
            {formatLocation(deal.location)}
            {distanceLabel ? (
              <span className="ml-2 text-xs font-semibold text-zinc-500 dark:text-zinc-500">
                • {distanceLabel}
              </span>
            ) : null}
          </span>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
          <svg
            className="h-4 w-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>
            {t("postedBy")} {deal.user.name}
          </span>
        </div>

        <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
          {formatDate(deal.createdAt, locale)}
        </div>

        {/* Voting and Comments */}
        <div className="mb-3 flex items-center gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {/* Upvote */}
          <button
            onClick={(e) => handleVote(e, "UP")}
            disabled={!canInteract || isVoting}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
              deal.myVote === "UP"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            } ${(!canInteract || isVoting) ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>{deal.upvotesCount}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={(e) => handleVote(e, "DOWN")}
            disabled={!canInteract || isVoting}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
              deal.myVote === "DOWN"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            } ${(!canInteract || isVoting) ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{deal.downvotesCount}</span>
          </button>

          {/* Comments */}
          <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            <svg
              className="h-4 w-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{deal.commentsCount}</span>
          </div>
        </div>

        {/* View Button */}
        <button
          onClick={onViewClick}
          className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-md"
        >
          {t("view")}
        </button>
      </div>
    </motion.div>
  )
}

