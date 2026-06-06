"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("auth.login")
  const tCommon = useTranslations("common")

  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail")
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

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
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email)
        } else {
          localStorage.removeItem("rememberedEmail")
        }
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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-green-200/30 blur-3xl dark:bg-green-900/20" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />
      </div>

      <div className="relative h-full flex items-center justify-center px-4 py-4 sm:py-6">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4 sm:mb-5"
          >
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-200">
                {tCommon("appName")}
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-1 sm:mb-2">
              {t("title")}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-2xl shadow-green-500/10 dark:border-zinc-800/80 dark:bg-zinc-900/80 p-4 sm:p-6 max-h-[calc(100vh-12rem)] overflow-y-auto"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-xl border border-red-200 bg-red-50/90 dark:bg-red-950/30 dark:border-red-800 p-3 text-xs sm:text-sm text-red-800 dark:text-red-200"
              >
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t("email")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm rounded-lg border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-green-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t("password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm rounded-lg border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-green-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password Links */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-4 w-4 rounded border-2 border-zinc-300 bg-white transition-all peer-checked:border-green-500 peer-checked:bg-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:peer-checked:border-green-500 dark:peer-checked:bg-green-500 group-hover:border-green-400 dark:group-hover:border-zinc-600 focus-within:ring-2 focus-within:ring-green-500/20" />
                    <svg
                      className="absolute h-2.5 w-2.5 text-white scale-0 transition-transform peer-checked:scale-100 pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{t("rememberMe")}</span>
                </label>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs sm:text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {tCommon("loading")}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t("submit")}
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center">
              <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
              <span className="px-3 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">or</span>
              <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
            </div>

            {/* Google Sign-In Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => signIn("google", { callbackUrl: `/${locale}` })}
              className="flex items-center justify-center gap-3 w-full rounded-lg border-2 border-zinc-200 bg-white px-4 py-2.5 sm:py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/80 dark:hover:border-zinc-600 mb-4"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </motion.button>

            {/* Register Link */}
            <div className="text-center mb-3">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {t("noAccount")}{" "}
                <Link
                  href={`/${locale}/register`}
                  className="font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                >
                  {t("registerLink")}
                </Link>
              </p>
            </div>

            {/* Business Registration Link */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-[10px] sm:text-xs text-center text-zinc-500 dark:text-zinc-400 mb-2">
                Are you a business owner?
              </p>
              <Link
                href={`/${locale}/register/business`}
                className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-700 transition-all hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300"
              >
                <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Register Your Business
              </Link>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-3 text-center"
          >
            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              By logging in, you agree to our{" "}
              <Link href={`/${locale}/terms`} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                Terms
              </Link>
              {" "}and{" "}
              <Link href={`/${locale}/privacy`} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                Privacy
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
