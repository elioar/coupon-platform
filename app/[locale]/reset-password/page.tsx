"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { motion } from "framer-motion"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const t = useTranslations("auth.resetPassword")
  const tCommon = useTranslations("common")
  const tRegister = useTranslations("auth.register")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const passwordStrength = checkPasswordStrength(password)
  const strengthLevel = passwordStrength.strength
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setStatus("error")
      setMessage(t("error"))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    if (password !== confirmPassword) {
      setMessage(t("passwordMismatch"))
      return
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters")
      return
    }

    if (!token) {
      setStatus("error")
      setMessage(t("error"))
      return
    }

    setStatus("loading")

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(t("success"))
        setTimeout(() => {
          router.push(`/${locale}/login`)
        }, 2000)
      } else {
        setStatus("error")
        setMessage(data.error || t("error"))
      }
    } catch (error) {
      setStatus("error")
      setMessage(t("error"))
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-green-200/30 blur-3xl dark:bg-green-900/20" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />
      </div>

      <div className="relative h-full flex items-center justify-center px-4 py-4 sm:py-6">
        <div className="w-full max-w-md">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-2xl shadow-green-500/10 dark:border-zinc-800/80 dark:bg-zinc-900/80 p-4 sm:p-6"
          >
            {status === "success" ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">{message || t("success")}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("redirecting")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl border p-3 text-xs sm:text-sm ${
                      status === "error"
                        ? "border-red-200 bg-red-50/90 dark:bg-red-950/30 dark:border-red-800 text-red-800 dark:text-red-200"
                        : "border-green-200 bg-green-50/90 dark:bg-green-950/30 dark:border-green-800 text-green-800 dark:text-green-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <svg
                        className="h-4 w-4 flex-shrink-0 mt-0.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {status === "error" ? (
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path d="M5 13l4 4L19 7" />
                        )}
                      </svg>
                      <p>{message}</p>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 pr-10 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
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
                  {password && (
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
                          {password ? strengthLabels[strengthLevel - 1] || "Very Weak" : ""}
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
                          <span>{tRegister("passwordCheckLength")}</span>
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
                          <span>{tRegister("passwordCheckLowercase")}</span>
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
                          <span>{tRegister("passwordCheckUppercase")}</span>
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
                          <span>{tRegister("passwordCheckNumber")}</span>
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
                          <span>{tRegister("passwordCheckSpecial")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 pr-10 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? (
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

                <button
                  type="submit"
                  disabled={status === "loading" || !token}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? tCommon("loading") : t("submit")}
                </button>

                <div className="text-center">
                  <Link
                    href={`/${locale}/login`}
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

