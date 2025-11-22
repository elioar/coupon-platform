"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"
import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { trackCouponEvent } from "@/lib/analytics"

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
  business?: {
    id: string
    name: string
    email?: string
    businessLocation?: string | null
    businessLatitude?: number | null
    businessLongitude?: number | null
  }
  distanceKm?: number | null
}

interface CouponCardProps {
  coupon: Coupon
  isMember: boolean
  locale: string
  onDetailsClick?: () => void   // ⬅️ add ?
}

const formatExpirationDate = (dateString: string, locale: string) => {
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

export default function CouponCard({ coupon, isMember, locale, onDetailsClick }: CouponCardProps) {
  const t = useTranslations("coupons")
  const { data: session } = useSession()
  const [isHovered, setIsHovered] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const hasTrackedView = useRef(false)

  // Check if coupon is saved on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedCoupons')
      if (saved) {
        try {
          const savedCoupons = JSON.parse(saved)
          setIsSaved(savedCoupons.includes(coupon.id))
        } catch (e) {
          setIsSaved(false)
        }
      }
    }
  }, [coupon.id])

  // Toggle save/unsave coupon
  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the card click
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedCoupons')
      let savedCoupons: string[] = []
      
      if (saved) {
        try {
          savedCoupons = JSON.parse(saved)
        } catch (e) {
          savedCoupons = []
        }
      }

      if (isSaved) {
        // Remove from saved
        savedCoupons = savedCoupons.filter(id => id !== coupon.id)
        setIsSaved(false)
      } else {
        // Add to saved
        savedCoupons.push(coupon.id)
        setIsSaved(true)
        // Track SAVE event when user saves a coupon
        trackCouponEvent(coupon.id, "SAVE", session?.user?.id)
      }

      localStorage.setItem('savedCoupons', JSON.stringify(savedCoupons))
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('savedCouponsChanged'))
    }
  }

  // Track view when component mounts (only once per component instance)
  useEffect(() => {
    // Prevent duplicate tracking from React Strict Mode or remounts
    if (hasTrackedView.current) return
    
    // Check sessionStorage to prevent duplicate views within 5 seconds
    const storageKey = `coupon_view_${coupon.id}`
    const lastViewTime = sessionStorage.getItem(storageKey)
    const now = Date.now()
    
    // Only track if we haven't tracked this coupon in the last 5 seconds
    if (!lastViewTime || (now - parseInt(lastViewTime)) > 5000) {
      hasTrackedView.current = true
      sessionStorage.setItem(storageKey, now.toString())
      trackCouponEvent(coupon.id, "VIEW", session?.user?.id)
    }
  }, [coupon.id, session?.user?.id])

  const categoryName = locale === "el" ? coupon.category.nameEl : coupon.category.nameEn
  const numberFormatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const locationText = coupon.business?.businessLocation || null

  const distanceLabel = (() => {
    if (typeof coupon.distanceKm !== "number") {
      return null
    }
    if (coupon.distanceKm >= 1) {
      return t("distanceAwayKm", { distance: numberFormatter.format(coupon.distanceKm) })
    }
    const meters = Math.round(coupon.distanceKm * 1000)
    return t("distanceAwayMeters", { distance: integerFormatter.format(meters) })
  })()

  return (
    <>
      <div 
        className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20 dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:hover:shadow-green-500/10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5"></div>
        
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
          {coupon.imagePath ? (
            <Image
              src={coupon.imagePath}
              alt={coupon.title}
              fill
              className={`object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10">
              <div className="text-center">
                <span className="text-6xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {coupon.discountPercentage}%
                </span>
                <div className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400">OFF</div>
              </div>
            </div>
          )}
          
          {/* Gradient overlay on image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          
          {/* Discount Badge */}
          <div className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-sm animate-pulse-subtle">
            <span className="drop-shadow-md">{coupon.discountPercentage}% {t("discount")}</span>
          </div>
          
          {/* Category Badge */}
          <div className="absolute left-3 top-3 z-10 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-green-700 shadow-lg dark:bg-zinc-900/90 dark:text-green-300">
            {categoryName}
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6">
          {/* Expiration Date */}
          <div className="mb-3 flex items-center justify-end">
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatExpirationDate(coupon.expirationDate, locale)}
            </div>
          </div>

          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="flex-1 text-xl font-bold text-zinc-900 transition-colors group-hover:text-green-600 dark:text-zinc-50 dark:group-hover:text-green-400">
              {coupon.title}
            </h3>
            <button
              onClick={toggleSave}
              className="flex-shrink-0 rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-violet-600 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-violet-400"
              aria-label={isSaved ? t("unsaveCoupon") : t("saveCoupon")}
              title={isSaved ? t("unsaveCoupon") : t("saveCoupon")}
            >
              {isSaved ? (
                <svg className="h-5 w-5 fill-violet-600 text-violet-600 dark:fill-violet-400 dark:text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
          </div>

          {coupon.business && (
            <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              by {coupon.business.name}
            </p>
          )}

          {(locationText || distanceLabel) && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {t("locationLabel")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 1118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{locationText ?? t("locationUnknown")}</span>
                </div>
                {distanceLabel && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm dark:bg-green-900/20 dark:text-green-300">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M12 20h.01M21 12a9 9 0 11-9-9" />
                    </svg>
                    <span>{distanceLabel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {coupon.description}
          </p>

          <button
            onClick={() => {
              trackCouponEvent(coupon.id, "CLICK", session?.user?.id)
              onDetailsClick?.()
            }} 
            className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-green-500/50 active:scale-95"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {t("getCoupon")}
              <svg 
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-1000 group-hover:opacity-100 group-hover:animate-shine"></div>
      </div>
    </>
  )
}

