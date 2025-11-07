"use client"

import { useTranslations } from "next-intl"
import { format } from "date-fns"
import Image from "next/image"
import { useState } from "react"
import CouponModal from "./CouponModal"

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
}

export default function CouponCard({ coupon, isMember, locale }: CouponCardProps) {
  const t = useTranslations("coupons")
  const [modalOpen, setModalOpen] = useState(false)

  const categoryName = locale === "el" ? coupon.category.nameEl : coupon.category.nameEn

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {coupon.imagePath ? (
            <Image
              src={coupon.imagePath}
              alt={coupon.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl font-bold text-zinc-300 dark:text-zinc-700">
                {coupon.discountPercentage}%
              </span>
            </div>
          )}
          {/* Discount Badge */}
          <div className="absolute right-2 top-2 rounded-lg bg-violet-600 px-3 py-1 text-sm font-bold text-white shadow-lg">
            {coupon.discountPercentage}% {t("discount")}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
              {categoryName}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("expires")}: {format(new Date(coupon.expirationDate), "MMM dd, yyyy")}
            </span>
          </div>

          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {coupon.title}
          </h3>

          <p className="mb-4 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {coupon.description}
          </p>

          {/* Code Display */}
          <div className="mb-4">
            {isMember ? (
              <div className="rounded-lg border border-dashed border-violet-300 bg-violet-50 p-3 text-center dark:border-violet-700 dark:bg-violet-900/20">
                <code className="text-lg font-bold text-violet-700 dark:text-violet-300">
                  {coupon.code}
                </code>
              </div>
            ) : (
              <div className="relative rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                <div className="blur-sm">
                  <code className="text-lg font-bold text-zinc-400">XXXXXXXX</code>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    🔒 {t("becomeMember")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            {t("details")}
          </button>
        </div>
      </div>

      {modalOpen && (
        <CouponModal
          coupon={coupon}
          isMember={isMember}
          locale={locale}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

