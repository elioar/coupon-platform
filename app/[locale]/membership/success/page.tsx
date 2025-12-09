"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import Navigation from "@/components/Navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"

export default function MembershipSuccessPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("membership")
  const tCommon = useTranslations("common")

  const [countdown, setCountdown] = useState(5)
  const sessionId = searchParams.get("session_id")

  // Auto-redirect to membership page after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push(`/${locale}/membership`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, locale])

  // Confetti animation variants
  const confettiVariants = {
    initial: { y: -100, rotate: 0, opacity: 1 },
    animate: (i: number) => ({
      y: typeof window !== 'undefined' ? window.innerHeight + 100 : 800,
      rotate: 360 * (i % 2 === 0 ? 1 : -1),
      opacity: [1, 1, 0],
      x: Math.sin(i) * 200,
      transition: {
        duration: 3 + Math.random() * 2,
        delay: i * 0.1,
        repeat: Infinity,
        ease: "easeOut",
      },
    }),
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  const colors = ["bg-emerald-500", "bg-green-500", "bg-teal-500", "bg-lime-500", "bg-yellow-500"]

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-zinc-900 dark:to-teal-950">
      <Navigation />

      {/* Animated Confetti Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={confettiVariants}
            initial="initial"
            animate="animate"
            className={`absolute h-4 w-4 rounded-full ${colors[i % colors.length]}`}
            style={{
              left: `${(i * 2) % 100}%`,
              top: "-100px",
            }}
          />
        ))}
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full text-center"
        >
          {/* Success Icon with Animation */}
          <motion.div
            variants={itemVariants}
            className="mb-8 flex justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.3,
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
                className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-2xl sm:h-40 sm:w-40"
              >
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-16 w-16 text-white sm:h-20 sm:w-20"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                  />
                </motion.svg>
              </motion.div>
              
              {/* Pulsing rings */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-4 border-emerald-400"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.8, 0.4, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={itemVariants}
            className="mb-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-4xl font-extrabold text-transparent dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 sm:text-5xl lg:text-6xl"
          >
            🎉 {t("congratulations")}!
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="mb-2 text-xl font-bold text-emerald-700 dark:text-emerald-300 sm:text-2xl lg:text-3xl"
          >
            {t("youAreMember")}
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-8 max-w-2xl text-base text-zinc-600 dark:text-zinc-300 sm:text-lg"
          >
            {t("thankYou")}
            <br />
            {t("enjoyBenefits")}
          </motion.p>

          {/* Membership Status Card */}
          {session?.user?.membershipExpiry && (
            <motion.div
              variants={itemVariants}
              className="mx-auto mb-8 w-full max-w-md overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-white via-emerald-50/50 to-green-50 p-6 shadow-2xl dark:border-emerald-700 dark:from-zinc-900 dark:via-emerald-950/30 dark:to-green-950/30 sm:p-8"
            >
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                  <svg
                    className="h-7 w-7 text-white"
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
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {t("membershipActive")}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(session.user.membershipExpiry).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href={`/${locale}/coupons`}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-8 py-4 text-base font-bold text-white shadow-2xl transition-all hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 hover:shadow-3xl sm:px-10 sm:py-4 sm:text-lg"
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
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
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
              </span>
            </Link>

            <Link
              href={`/${locale}/membership`}
              className="rounded-xl border-2 border-emerald-600 bg-transparent px-8 py-4 text-base font-semibold text-emerald-700 transition-all hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 sm:px-10 sm:py-4 sm:text-lg"
            >
              {tCommon("view")} {t("membershipDetails")}
            </Link>
          </motion.div>

          {/* Auto-redirect notice */}
          <motion.p
            variants={itemVariants}
            className="mt-8 text-sm text-zinc-500 dark:text-zinc-400"
          >
            {tCommon("redirectingIn")} {countdown} {tCommon("seconds")}...
          </motion.p>

          {/* Benefits Preview */}
          <motion.div
            variants={itemVariants}
            className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { icon: "✓", label: t("benefits.unlimited").split(" ")[0] },
              { icon: "⭐", label: t("benefits.exclusive").split(" ")[0] },
              { icon: "⚡", label: t("benefits.early").split(" ")[0] },
              { icon: "💬", label: t("benefits.support").split(" ")[0] },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="rounded-lg border border-emerald-200 bg-white/60 p-4 text-center dark:border-emerald-800 dark:bg-zinc-800/60"
              >
                <div className="mb-2 text-2xl">{benefit.icon}</div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 sm:text-sm">
                  {benefit.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

