"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { motion } from "framer-motion"

export default function RegisterPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("auth.register")
  const tCommon = useTranslations("common")

  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    if (checks.length) strength++
    if (checks.lowercase) strength++
    if (checks.uppercase) strength++
    if (checks.number) strength++
    if (checks.special) strength++

    return { strength, checks }
  }

  const passwordStrength = checkPasswordStrength(formData.password)
  const strengthLevel = passwordStrength.strength
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
  const strengthColors = [
    "from-red-500 to-red-600",
    "from-orange-500 to-orange-600",
    "from-yellow-500 to-yellow-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-emerald-600",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "USER",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t("error"))
      } else {
        router.push(`/${locale}/login`)
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

          {/* Registration Card */}
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
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t("name")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm rounded-lg border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-green-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

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
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2 space-y-2">
                    {/* Animated Strength Line */}
                    <div className="relative">
                      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(strengthLevel / 5) * 100}%`,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            strengthLevel <= 2
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : strengthLevel === 3
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              : strengthLevel === 4
                              ? "bg-gradient-to-r from-blue-500 to-blue-600"
                              : "bg-gradient-to-r from-green-500 to-emerald-600"
                          }`}
                        >
                          <motion.div
                            animate={{
                              x: ["-100%", "100%"],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="h-full w-1/3 bg-white/30"
                          />
                        </motion.div>
                      </div>
                      <p className={`mt-1.5 text-[10px] sm:text-xs font-semibold ${
                        strengthLevel <= 2
                          ? "text-red-600 dark:text-red-400"
                          : strengthLevel === 3
                          ? "text-yellow-600 dark:text-yellow-400"
                          : strengthLevel === 4
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-green-600 dark:text-green-400"
                      }`}>
                        {formData.password ? strengthLabels[strengthLevel - 1] || "Very Weak" : ""}
                      </p>
                    </div>

                    {/* Password Requirements */}
                    <div className="mt-2 space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.length ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                        <motion.svg
                          animate={{ scale: passwordStrength.checks.length ? [1, 1.2, 1] : 1 }}
                          className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.length ? "text-green-500" : "text-zinc-400"}`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {passwordStrength.checks.length ? (
                            <path d="M5 13l4 4L19 7" />
                          ) : (
                            <path d="M6 18L18 6M6 6l12 12" />
                          )}
                        </motion.svg>
                        <span>{t("passwordCheckLength")}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.lowercase ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                        <motion.svg
                          animate={{ scale: passwordStrength.checks.lowercase ? [1, 1.2, 1] : 1 }}
                          className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.lowercase ? "text-green-500" : "text-zinc-400"}`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {passwordStrength.checks.lowercase ? (
                            <path d="M5 13l4 4L19 7" />
                          ) : (
                            <path d="M6 18L18 6M6 6l12 12" />
                          )}
                        </motion.svg>
                        <span>{t("passwordCheckLowercase")}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.uppercase ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                        <motion.svg
                          animate={{ scale: passwordStrength.checks.uppercase ? [1, 1.2, 1] : 1 }}
                          className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.uppercase ? "text-green-500" : "text-zinc-400"}`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {passwordStrength.checks.uppercase ? (
                            <path d="M5 13l4 4L19 7" />
                          ) : (
                            <path d="M6 18L18 6M6 6l12 12" />
                          )}
                        </motion.svg>
                        <span>{t("passwordCheckUppercase")}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.number ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                        <motion.svg
                          animate={{ scale: passwordStrength.checks.number ? [1, 1.2, 1] : 1 }}
                          className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.number ? "text-green-500" : "text-zinc-400"}`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {passwordStrength.checks.number ? (
                            <path d="M5 13l4 4L19 7" />
                          ) : (
                            <path d="M6 18L18 6M6 6l12 12" />
                          )}
                        </motion.svg>
                        <span>{t("passwordCheckNumber")}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.special ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                        <motion.svg
                          animate={{ scale: passwordStrength.checks.special ? [1, 1.2, 1] : 1 }}
                          className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.special ? "text-green-500" : "text-zinc-400"}`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {passwordStrength.checks.special ? (
                            <path d="M5 13l4 4L19 7" />
                          ) : (
                            <path d="M6 18L18 6M6 6l12 12" />
                          )}
                        </motion.svg>
                        <span>{t("passwordCheckSpecial")}</span>
                      </div>
                    </div>
                  </div>
                )}
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

            {/* Login Link */}
            <div className="text-center mb-3">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {t("hasAccount")}{" "}
                <Link
                  href={`/${locale}/login`}
                  className="font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                >
                  {t("loginLink")}
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
              By registering, you agree to our{" "}
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
