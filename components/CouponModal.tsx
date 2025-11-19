"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"
import { useState, useEffect } from "react"
import Link from "next/link"
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
  }
}

interface CouponModalProps {
  coupon: Coupon
  isMember: boolean
  locale: string
  onClose: () => void
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

export default function CouponModal({ coupon, isMember, locale, onClose }: CouponModalProps) {
  const t = useTranslations("coupons")
  const tMembership = useTranslations("membership")
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)

  const categoryName = locale === "el" ? coupon.category.nameEl : coupon.category.nameEn

  // Track view when modal opens
  useEffect(() => {
    trackCouponEvent(coupon.id, "VIEW", session?.user?.id)
  }, [coupon.id, session?.user?.id])

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const copyCode = () => {
    if (isMember) {
      navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      trackCouponEvent(coupon.id, "CLICK", session?.user?.id)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 backdrop-blur-sm p-2 text-zinc-600 shadow-lg transition hover:bg-white hover:scale-110 hover:text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Close modal"
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
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        {coupon.imagePath ? (
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
            <Image
              src={coupon.imagePath}
              alt={coupon.title}
              fill
              className="object-cover"
              priority
            />
            {/* Discount Badge */}
            <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
              {coupon.discountPercentage}% {t("discount")}
            </div>
          </div>
        ) : (
          <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20">
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {coupon.discountPercentage}%
                </div>
                <div className="mt-1 text-xs font-semibold text-green-600 dark:text-green-400">{t("discount")}</div>
              </div>
            </div>
            {/* Discount Badge */}
            <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
              {coupon.discountPercentage}% {t("discount")}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {categoryName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatExpirationDate(coupon.expirationDate, locale)}</span>
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {coupon.title}
          </h2>

          {coupon.business && (
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              by {coupon.business.name}
            </p>
          )}

          <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {coupon.description}
          </p>

          {/* Code Section */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/50">
            <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("code")}
            </h3>

            {isMember ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-green-300 bg-white p-4 dark:border-green-700 dark:bg-zinc-900">
                <code className="text-xl font-bold tracking-wider text-green-700 dark:text-green-300">
                  {coupon.code}
                </code>
                <button
                  onClick={copyCode}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95"
                >
                  {copied ? t("copiedCode") : t("copyCode")}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4 rounded-lg border-2 border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="blur-sm">
                    <code className="text-xl font-bold tracking-wider text-zinc-400">XXXXXXXX</code>
                  </div>
                </div>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("becomeMember")}
                </p>
                <Link
                  href={`/${locale}/membership`}
                  className="inline-block rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 hover:scale-105"
                >
                  {tMembership("cta")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

