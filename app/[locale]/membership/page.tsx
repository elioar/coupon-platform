"use client"

import { useState, useMemo } from "react"
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
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
    }
  }

  const yearlyPrice = 5
  const yearlyPricePerMonth = yearlyPrice / 12

  const isMember = session?.user?.membershipExpiry && new Date(session.user.membershipExpiry) > new Date()
  
  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!session?.user?.membershipExpiry) return 0
    const expiry = new Date(session.user.membershipExpiry)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [session?.user?.membershipExpiry])

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

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

  // Active Member Design
  if (isMember && session?.user?.membershipExpiry) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-zinc-900 dark:to-teal-950">
        <Navigation />

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mb-6 rounded-xl border-2 border-green-400 bg-gradient-to-r from-green-100 to-emerald-100 p-4 shadow-xl dark:border-green-600 dark:from-green-900/40 dark:to-emerald-900/40 sm:mb-8 sm:p-5"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl"
                >
                  🎉
                </motion.div>
                <p className="text-center text-sm font-bold text-green-800 dark:text-green-300 sm:text-base">
                  {t("congratulations")} {t("thankYou")}
                </p>
              </div>
            </motion.div>
          )}

          {/* Hero Section - Active Member */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-8 text-center sm:mb-10"
          >
            <motion.div
              variants={badgeVariants}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-2xl sm:px-6 sm:py-2.5 sm:text-base"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("membershipActive")}
            </motion.div>
            
            <motion.h1
              variants={itemVariants}
              className="mb-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-3xl font-extrabold text-transparent dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 sm:mb-6 sm:text-5xl lg:text-6xl"
            >
              {t("congratulations")}
            </motion.h1>
            
            <motion.p
              variants={itemVariants}
              className="mx-auto max-w-2xl text-base font-semibold text-emerald-700 dark:text-emerald-300 sm:text-lg lg:text-xl"
            >
              {t("youAreMember")}
            </motion.p>
            
            <motion.p
              variants={itemVariants}
              className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-300 sm:text-base"
            >
              {t("enjoyBenefits")}
            </motion.p>
          </motion.div>

          {/* Membership Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-white via-emerald-50/50 to-green-50 p-6 shadow-2xl dark:border-emerald-700 dark:from-zinc-900 dark:via-emerald-950/30 dark:to-green-950/30 sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50 sm:text-xl">
                  {t("membershipDetails")}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t("premiumAccess")}
                </p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg sm:h-16 sm:w-16"
              >
                <svg
                  className="h-8 w-8 text-white sm:h-9 sm:w-9"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("validUntil")}
                </span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {formatDate(session.user.membershipExpiry)}
                </span>
              </div>
              
              <div className="flex items-center justify-between rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("unlimitedAccess")}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                  {daysRemaining > 0 ? t("daysRemaining", { days: daysRemaining }) : t("expiresTomorrow")}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/${locale}/coupons`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-700 hover:to-green-700 hover:shadow-xl sm:py-3.5 sm:text-base"
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
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t("viewCoupons")}
              </Link>
            </div>
          </motion.div>

          {/* Active Benefits Grid */}
          <div className="mx-auto mb-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "✓", title: t("benefits.unlimited"), color: "from-emerald-500 to-green-500" },
              { icon: "⭐", title: t("benefits.exclusive"), color: "from-amber-500 to-orange-500" },
              { icon: "⚡", title: t("benefits.early"), color: "from-blue-500 to-cyan-500" },
              { icon: "💬", title: t("benefits.support"), color: "from-purple-500 to-pink-500" },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={featureCardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.05, y: -5 }}
                className="group rounded-xl border-2 border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-emerald-300 hover:shadow-xl dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:hover:border-emerald-600 sm:p-6"
              >
                <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${benefit.color} text-2xl shadow-lg sm:h-14 sm:w-14 sm:text-2xl`}>
                  {benefit.icon}
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 sm:text-base">
                  {benefit.title.split(" ")[0]}
                </h4>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
                  {benefit.title.split(" ").slice(1).join(" ")}
                </p>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // Non-Member Design (Original)
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

        {/* Annual Plan Card */}
        <div className="mx-auto w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative overflow-hidden rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-xl transition-all duration-300 dark:border-green-700 dark:from-green-950/30 dark:to-emerald-950/30 sm:p-5"
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
                onClick={handleSubscribe}
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

