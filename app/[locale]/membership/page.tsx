"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import Navigation from "@/components/Navigation"
import MembershipBadge from "@/components/MembershipBadge"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function MembershipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("membership")
  const tCommon = useTranslations("common")

  const [loading, setLoading] = useState(false)
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")

  const handleSubscribe = async () => {
    if (!session) {
      router.push(`/${locale}/login?callbackUrl=/${locale}/membership`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("No checkout URL returned")
        setLoading(false)
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {success && (
          <div className="mb-8 rounded-xl border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
            <p className="text-center font-semibold text-green-700 dark:text-green-400">
              🎉 {t("active")}! Thank you for subscribing.
            </p>
          </div>
        )}

        {canceled && (
          <div className="mb-8 rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
            <p className="text-center text-yellow-700 dark:text-yellow-400">
              Payment was canceled. You can try again anytime.
            </p>
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        {session && (
          <div className="mb-8">
            <MembershipBadge membershipExpiry={session.user.membershipExpiry} />
          </div>
        )}

        {/* Pricing Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <p className="text-6xl font-bold text-violet-600">{t("price")}</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Billed annually
            </p>
          </div>

          <div className="my-8 border-t border-zinc-200 dark:border-zinc-800" />

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t("benefits.title")}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {t("benefits.unlimited")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {t("benefits.exclusive")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {t("benefits.early")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {t("benefits.support")}
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          {!session ? (
            <Link
              href={`/${locale}/login?callbackUrl=/${locale}/membership`}
              className="block w-full rounded-lg bg-violet-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-violet-700"
            >
              {t("cta")}
            </Link>
          ) : session.user.membershipExpiry &&
            new Date(session.user.membershipExpiry) > new Date() ? (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? tCommon("loading") : t("renew")}
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? tCommon("loading") : t("cta")}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

