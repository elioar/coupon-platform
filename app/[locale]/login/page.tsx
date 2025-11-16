"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("auth.login")
  const tCommon = useTranslations("common")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError(t("error"))
      } else {
        router.push(`/${locale}`)
        router.refresh()
      }
    } catch (err) {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 dark:bg-zinc-950">
      {/* Modern geometric background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-zinc-950 dark:via-emerald-950 dark:to-green-950"></div>
        
        {/* Large geometric shapes */}
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 blur-3xl dark:from-green-600/10 dark:to-emerald-600/10"></div>
        <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-gradient-to-br from-teal-400/20 to-green-400/20 blur-3xl dark:from-teal-600/10 dark:to-green-600/10"></div>
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-300/15 to-green-300/15 blur-3xl dark:from-emerald-700/10 dark:to-green-700/10"></div>
        
        {/* Pattern overlay - dots */}
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgb(34, 197, 94) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        ></div>
        
        {/* Diagonal lines pattern */}
        <div 
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgb(34, 197, 94) 10px,
              rgb(34, 197, 94) 11px
            )`
          }}
        ></div>
        
        {/* Floating shopping icons */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-10 top-20"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 backdrop-blur-sm shadow-lg ring-2 ring-green-200/50 dark:ring-green-800/50"
          >
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{
            y: [0, -25, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="absolute right-20 top-40"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-green-400/20 backdrop-blur-sm shadow-lg ring-2 ring-emerald-200/50 dark:ring-emerald-800/50"
          >
            <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{
            y: [0, -18, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-32 left-1/4"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 3 }}
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm shadow-lg ring-2 ring-green-300/50 dark:ring-green-700/50"
          >
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Sparkle icons */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: 0.5,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 right-1/3"
        >
          <svg className="h-6 w-6 text-green-400/60 dark:text-green-500/40" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 1,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/3 left-1/3"
        >
          <svg className="h-5 w-5 text-emerald-400/60 dark:text-emerald-500/40" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 1, 0.6],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: 1.5,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 right-1/5"
        >
          <svg className="h-4 w-4 text-teal-400/60 dark:text-teal-500/40" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </motion.div>
        
        {/* Decorative circles */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-1/4 top-1/4 h-32 w-32 rounded-full border-4 border-green-300/30 dark:border-green-700/30"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: 1,
            ease: "easeInOut",
          }}
          className="absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full border-4 border-emerald-300/30 dark:border-emerald-700/30"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: 2,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-1/3 h-16 w-16 rounded-full border-4 border-teal-300/30 dark:border-teal-700/30"
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left side - Welcome content with coupon theme - Hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="hidden flex-col justify-center space-y-6 lg:flex lg:pr-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3, type: "spring" }}
                className="inline-block"
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg"
                >
                  <motion.svg
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941a2.305 2.305 0 01-1.676-.662C6.602 13.765 6 12.99 6 12c0-.99.602-1.765 1.324-2.246A4.535 4.535 0 009 9.092V7.151c.22.071.412.164.567.267C9.93 7.66 10 7.886 10 8c0 .114-.07.34-.433.582A2.305 2.305 0 019 8.849v1.698a4.535 4.535 0 001.676-.662C11.398 9.765 12 8.99 12 8c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 009 5.092V4.151a2.305 2.305 0 011.676.662C11.398 5.235 12 6.01 12 7c0 .99-.602 1.765-1.324 2.246-.48.32-1.054.545-1.676.662v1.941a2.305 2.305 0 001.676-.662C11.398 10.765 12 9.99 12 9c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 009 5.092V3.151z" clipRule="evenodd" />
                  </motion.svg>
                  {t("saveMoreBadge")}
                </motion.span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 lg:text-5xl"
              >
                {t("welcomeTitle")}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-lg font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("welcomeDescription")}
              </motion.p>
            </motion.div>

            {/* Features with savings theme */}
            <div className="space-y-4">
              {[
                {
                  key: "feature1",
                  title: t("feature1Title"),
                  description: t("feature1Description"),
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  gradient: "from-green-400 to-emerald-500",
                  blur: "bg-green-200/50 dark:bg-green-900/50",
                },
                {
                  key: "feature2",
                  title: t("feature2Title"),
                  description: t("feature2Description"),
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  gradient: "from-emerald-400 to-green-500",
                  blur: "bg-emerald-200/50 dark:bg-emerald-900/50",
                },
                {
                  key: "feature3",
                  title: t("feature3Title"),
                  description: t("feature3Description"),
                  icon: (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ),
                  gradient: "from-green-500 to-emerald-600",
                  blur: "bg-green-200/50 dark:bg-green-900/50",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-xl bg-white/80 p-4 shadow-md backdrop-blur-sm transition-all hover:shadow-lg dark:bg-zinc-800/80"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                    className={`absolute -right-4 -top-4 h-16 w-16 rounded-full ${feature.blur} blur-xl`}
                  />
                  <div className="relative flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md`}
                    >
                      {feature.icon}
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">
                        {feature.title}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Login form - Full width on mobile */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {/* Simple minimal card with animation */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900 sm:p-8"
              >
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-6 text-center sm:mb-8"
                >
                  <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("title")}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {t("subtitle")}
                  </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {t("email")}
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                      placeholder="you@example.com"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        {t("password")}
                      </label>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          href={`/${locale}/forgot-password`}
                          className="text-sm text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          {t("forgotPassword")}
                        </Link>
                      </motion.div>
                    </div>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 placeholder-zinc-400 transition-colors focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                      placeholder="••••••••"
                    />
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="relative w-full overflow-hidden rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-zinc-900"
                  >
                    <motion.span
                      animate={{
                        x: loading ? "0%" : ["-100%", "100%"],
                      }}
                      transition={{
                        duration: loading ? 0 : 3,
                        repeat: loading ? 0 : Infinity,
                        repeatDelay: loading ? 0 : 2,
                        ease: "linear",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.svg
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </motion.svg>
                          {tCommon("loading")}
                        </span>
                      ) : (
                        t("submit")
                      )}
                    </span>
                  </motion.button>
                </form>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="mt-6 text-center"
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("noAccount")}{" "}
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block"
                    >
                      <Link
                        href={`/${locale}/register`}
                        className="font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        {t("registerLink")}
                      </Link>
                    </motion.span>
                  </p>
                </motion.div>
              </motion.div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

