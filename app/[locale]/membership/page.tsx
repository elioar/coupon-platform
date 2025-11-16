"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import Navigation from "@/components/Navigation"
import MembershipBadge from "@/components/MembershipBadge"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function MembershipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("membership")
  const tCommon = useTranslations("common")

  const [loading, setLoading] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")
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
        body: JSON.stringify({ billingPeriod }),
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

  const monthlyPrice = 1.5
  const yearlyPrice = 10
  const monthlyPricePerMonth = monthlyPrice
  const yearlyPricePerMonth = yearlyPrice / 12
  const savings = ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100

  const isMember = session?.user?.membershipExpiry && new Date(session.user.membershipExpiry) > new Date()

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0, y: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
  }

  const benefitItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  }

  const featureCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.15,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navigation />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-4 rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-3 shadow-lg dark:border-green-700 dark:from-green-900/20 dark:to-emerald-900/20 sm:mb-5 sm:p-4"
          >
            <p className="text-center text-xs font-semibold text-green-700 dark:text-green-400 sm:text-sm">
              🎉 {t("active")}! {t("thankYou")}
            </p>
          </motion.div>
        )}

        {canceled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-4 rounded-lg border border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 p-3 shadow-lg dark:border-yellow-700 dark:from-yellow-900/20 dark:to-amber-900/20 sm:mb-5 sm:p-4"
          >
            <p className="text-center text-xs text-yellow-700 dark:text-yellow-400 sm:text-sm">
              {t("paymentCanceled")}
            </p>
          </motion.div>
        )}

        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-6 text-center sm:mb-8 lg:mb-6"
        >
          <motion.div
            variants={badgeVariants}
            className="mb-3 inline-block rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg sm:px-4 sm:py-1.5 sm:text-sm"
          >
            {t("bestValue")}
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-2xl font-extrabold text-transparent dark:from-green-400 dark:to-emerald-400 sm:mb-4 sm:text-4xl lg:text-5xl"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-sm text-zinc-600 dark:text-zinc-300 sm:text-base lg:text-lg"
          >
            {t("subtitle")}
          </motion.p>
        </motion.div>

        {session && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6 flex justify-center sm:mb-8 lg:mb-6"
          >
            <MembershipBadge membershipExpiry={session.user.membershipExpiry} />
          </motion.div>
        )}

        {/* Side-by-Side Pricing Cards */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Monthly Plan Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onClick={() => setBillingPeriod("monthly")}
            className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 bg-white p-4 shadow-lg transition-all duration-300 dark:bg-zinc-900 sm:p-5 ${
              billingPeriod === "monthly"
                ? "border-green-500 shadow-xl shadow-green-500/20 lg:scale-[1.02]"
                : "border-zinc-200 dark:border-zinc-800 hover:border-green-300 dark:hover:border-green-700"
            }`}
          >
            {/* Plan Header */}
            <div className="mb-4 text-center">
              <h3 className="mb-2 text-base font-bold text-zinc-900 dark:text-zinc-50 sm:text-lg">
                {t("monthly")}
              </h3>
              <div className="mb-2 flex items-baseline justify-center gap-1">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
                  €{monthlyPrice}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">/{t("month")}</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                {t("billedMonthly")}
            </p>
          </div>

            {/* Benefits */}
            <ul className="mb-4 space-y-2">
              {[
                t("benefits.unlimited"),
                t("benefits.exclusive"),
                t("benefits.early"),
                t("benefits.support"),
              ].map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg
                      className="h-3 w-3 text-green-600 dark:text-green-400"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs leading-tight text-zinc-700 dark:text-zinc-300 sm:text-sm">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            {/* CTA Button */}
            {!session ? (
              <Link
                href={`/${locale}/login?callbackUrl=/${locale}/membership`}
                className="block w-full rounded-lg border-2 border-green-500 bg-green-500 px-4 py-2 text-center text-xs font-semibold text-white transition-all hover:bg-green-600 hover:shadow-lg sm:px-5 sm:py-2.5 sm:text-sm"
              >
                {t("cta")}
              </Link>
            ) : (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  setBillingPeriod("monthly")
                  handleSubscribe()
                }}
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg border-2 border-green-500 bg-green-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-green-600 hover:shadow-lg disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                {!loading && (
                  <motion.div
                    className="absolute inset-0 -z-0"
                    animate={{
                      x: ["-200%", "200%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "linear",
                    }}
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    }}
                  />
                )}
                <span className="relative z-10">
                  {loading ? tCommon("loading") : t("cta")}
                </span>
              </motion.button>
            )}
          </motion.div>

          {/* Yearly Plan Card - Featured */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => setBillingPeriod("yearly")}
            className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-xl transition-all duration-300 dark:from-green-950/30 dark:to-emerald-950/30 sm:p-5 ${
              billingPeriod === "yearly"
                ? "border-green-500 shadow-2xl shadow-green-500/30 lg:scale-[1.02] ring-2 ring-green-500/20"
                : "border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600"
            }`}
          >
            {/* Popular Badge */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -right-5 top-3 rotate-45 bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-0.5 text-[9px] font-bold text-white shadow-lg sm:px-10 sm:py-1 sm:text-[10px]"
            >
              {t("mostPopular")}
            </motion.div>

            {/* Savings Badge */}
            <div className="mb-3 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="inline-block rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-white shadow-md sm:px-3 sm:text-sm"
              >
                {Math.round(savings)}% {t("save")}
              </motion.div>
            </div>

            {/* Plan Header */}
            <div className="mb-4 text-center">
              <h3 className="mb-2 text-base font-bold text-zinc-900 dark:text-zinc-50 sm:text-lg">
                {t("yearly")}
              </h3>
              <div className="mb-2 flex items-baseline justify-center gap-1">
                <span className="text-2xl font-extrabold text-green-600 dark:text-green-400 sm:text-3xl lg:text-4xl">
                  €{yearlyPrice}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">/{t("year")}</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                {t("just")} €{yearlyPricePerMonth.toFixed(2)} {t("perMonth")} • {t("billedAnnually")}
              </p>
            </div>

          {/* Benefits */}
            <ul className="mb-4 space-y-2">
              {[
                t("benefits.unlimited"),
                t("benefits.exclusive"),
                t("benefits.early"),
                t("benefits.support"),
              ].map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg
                      className="h-3 w-3 text-green-600 dark:text-green-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                  </div>
                  <span className="text-xs font-medium leading-tight text-zinc-700 dark:text-zinc-300 sm:text-sm">
                    {benefit}
                  </span>
                </motion.li>
              ))}
            </ul>

            {/* CTA Button */}
            {!session ? (
              <Link
                href={`/${locale}/login?callbackUrl=/${locale}/membership`}
                className="group relative block w-full overflow-hidden rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-xl sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <motion.div
                  className="absolute inset-0 -z-0"
                  animate={{
                    x: ["-200%", "200%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "linear",
                  }}
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  }}
                />
                <span className="relative z-10">{t("cta")}</span>
              </Link>
            ) : (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  setBillingPeriod("yearly")
                  handleSubscribe()
                }}
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-xl disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-sm"
              >
                {!loading && (
                  <motion.div
                    className="absolute inset-0 -z-0"
                    animate={{
                      x: ["-200%", "200%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "linear",
                    }}
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    }}
                  />
                )}
                <span className="relative z-10">
                  {loading ? tCommon("loading") : t("cta")}
                </span>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-4 text-center sm:mt-8 lg:mt-6 lg:gap-6"
        >
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            <svg
              className="h-4 w-4 flex-shrink-0 text-green-500 sm:h-5 sm:w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{t("trust.securePayment")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            <svg
              className="h-4 w-4 flex-shrink-0 text-blue-500 sm:h-5 sm:w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t("trust.cancelAnytime")}</span>
          </div>
        </motion.div>

        {/* Feature Cards Section */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 lg:mt-8">
            {/* Feature Card 1 */}
            <motion.div
              custom={0}
              variants={featureCardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, y: -5 }}
              className="rounded-lg border border-zinc-200 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 sm:h-10 sm:w-10"
              >
                <svg
                  className="h-4 w-4 text-white sm:h-5 sm:w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <h4 className="mb-2 text-xs font-bold text-zinc-900 dark:text-zinc-50 sm:text-sm">
                {t("features.saveMoney.title")}
              </h4>
              <p className="text-xs leading-tight text-zinc-600 dark:text-zinc-400 sm:text-sm">
                {t("features.saveMoney.description")}
              </p>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div
              custom={1}
              variants={featureCardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, y: -5 }}
              className="rounded-lg border border-zinc-200 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 sm:h-10 sm:w-10"
              >
                <svg
                  className="h-4 w-4 text-white sm:h-5 sm:w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>
              <h4 className="mb-2 text-xs font-bold text-zinc-900 dark:text-zinc-50 sm:text-sm">
                {t("features.instantAccess.title")}
              </h4>
              <p className="text-xs leading-tight text-zinc-600 dark:text-zinc-400 sm:text-sm">
                {t("features.instantAccess.description")}
              </p>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div
              custom={2}
              variants={featureCardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05, y: -5 }}
              className="rounded-lg border border-zinc-200 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 sm:h-10 sm:w-10"
              >
                <svg
                  className="h-4 w-4 text-white sm:h-5 sm:w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </motion.div>
              <h4 className="mb-2 text-xs font-bold text-zinc-900 dark:text-zinc-50 sm:text-sm">
                {t("features.secure.title")}
              </h4>
              <p className="text-xs leading-tight text-zinc-600 dark:text-zinc-400 sm:text-sm">
                {t("features.secure.description")}
              </p>
            </motion.div>
        </div>
      </main>
    </div>
  )
}

