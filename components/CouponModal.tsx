"use client"

import { useTranslations } from "next-intl"
import { format } from "date-fns"
import Image from "next/image"
import { useState } from "react"
import Link from "next/link"

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

interface CouponModalProps {
  coupon: Coupon
  isMember: boolean
  locale: string
  onClose: () => void
}

export default function CouponModal({ coupon, isMember, locale, onClose }: CouponModalProps) {
  const t = useTranslations("coupons")
  const tMembership = useTranslations("membership")
  const [copied, setCopied] = useState(false)

  const categoryName = locale === "el" ? coupon.category.nameEl : coupon.category.nameEn

  const copyCode = () => {
    if (isMember) {
      navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-zinc-700 transition hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
        {coupon.imagePath && (
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={coupon.imagePath}
              alt={coupon.title}
              fill
              className="object-cover"
            />
            {/* Discount Badge */}
            <div className="absolute right-4 top-4 rounded-lg bg-violet-600 px-4 py-2 text-lg font-bold text-white shadow-lg">
              {coupon.discountPercentage}% {t("discount")}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {categoryName}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("expires")}: {format(new Date(coupon.expirationDate), "MMM dd, yyyy")}
            </span>
          </div>

          <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {coupon.title}
          </h2>

          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            By {coupon.business.name}
          </p>

          <p className="mb-6 text-zinc-700 dark:text-zinc-300">
            {coupon.description}
          </p>

          {/* Code Section */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/50">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              {t("code")}
            </h3>

            {isMember ? (
              <>
                <div className="mb-4 flex items-center justify-between rounded-lg border-2 border-dashed border-violet-300 bg-white p-4 dark:border-violet-700 dark:bg-zinc-900">
                  <code className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {coupon.code}
                  </code>
                  <button
                    onClick={copyCode}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    {copied ? t("copiedCode") : t("copyCode")}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4 rounded-lg border-2 border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="blur-sm">
                    <code className="text-2xl font-bold text-zinc-400">XXXXXXXX</code>
                  </div>
                </div>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("becomeMember")}
                </p>
                <Link
                  href={`/${locale}/membership`}
                  className="inline-block rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
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

