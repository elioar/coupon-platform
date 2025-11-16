"use client"

import { useTranslations } from "next-intl"
import { format } from "date-fns"
import Image from "next/image"
import { useState } from "react"

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
  }
}

interface CouponCardProps {
  coupon: Coupon
  isMember: boolean
  locale: string
  onDetailsClick?: () => void   // ⬅️ add ?
}

export default function CouponCard({ coupon, isMember, locale, onDetailsClick }: CouponCardProps) {
  const t = useTranslations("coupons")
  const [isHovered, setIsHovered] = useState(false)

  const categoryName = locale === "el" ? coupon.category.nameEl : coupon.category.nameEn

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
              {format(new Date(coupon.expirationDate), "MMM dd, yyyy")}
            </div>
          </div>

          <h3 className="mb-3 text-xl font-bold text-zinc-900 transition-colors group-hover:text-green-600 dark:text-zinc-50 dark:group-hover:text-green-400">
            {coupon.title}
          </h3>

          {coupon.business && (
            <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              by {coupon.business.name}
            </p>
          )}

          <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {coupon.description}
          </p>

          <button
            onClick={() => onDetailsClick?.()} 
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

