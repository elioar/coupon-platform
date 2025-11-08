"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/components/ThemeProvider"

export default function Navigation() {
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const locale = (params.locale as string) || "en"
  const { data: session } = useSession()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  const switchLocale = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "")
    return `/${newLocale}${pathWithoutLocale}`
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: `/${locale}` })
  }

  const getDashboardLabel = () => {
    if (!session) return t("dashboard")
    switch (session.user.role) {
      case "ADMIN":
        return "Admin Dashboard"
      case "BUSINESS":
        return "Business Dashboard"
      case "USER":
        return "User Dashboard"
      default:
        return t("dashboard")
    }
  }

  const getDashboardUrl = () => {
    if (!session) return `/${locale}/login`
    return `/${locale}/dashboard/${session.user.role.toLowerCase()}`
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLanguageDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href={`/${locale}`} className="group flex items-center gap-2.5 transition-transform hover:scale-105">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-md shadow-green-500/20 transition-shadow group-hover:shadow-lg group-hover:shadow-green-500/30">
                <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-xl font-bold text-transparent dark:from-zinc-50 dark:via-zinc-100 dark:to-zinc-200">
                {tCommon("appName")}
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden items-center gap-2 md:flex"
          >
            <Link
              href={`/${locale}/coupons`}
              className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-green-50 hover:text-green-600 dark:text-zinc-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
            >
              <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {t("coupons")}
            </Link>
            
            <Link
              href={`/${locale}/membership`}
              className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-green-50 hover:text-green-600 dark:text-zinc-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
            >
              <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {t("membership")}
            </Link>

            {session && (
              <Link
                href={getDashboardUrl()}
                className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-green-50 hover:text-green-600 dark:text-zinc-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
              >
                <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {getDashboardLabel()}
              </Link>
            )}

            <div className="mx-2 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const newTheme = resolvedTheme === "dark" ? "light" : "dark"
                setTheme(newTheme)
              }}
              className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-green-300 hover:bg-green-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-green-700 dark:hover:bg-green-900/20"
              aria-label="Toggle theme"
              title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            >
              {resolvedTheme === "dark" ? (
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </motion.button>

            {/* Language Switcher Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-green-300 hover:bg-green-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-green-700 dark:hover:bg-green-900/20"
              >
                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="uppercase">{locale}</span>
                <svg className={`h-3.5 w-3.5 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              <AnimatePresence>
                {languageDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 z-50 mt-2 w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <Link
                      href={switchLocale("en")}
                      onClick={() => setLanguageDropdownOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        locale === "en"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          : "text-zinc-700 hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-green-900/20"
                      }`}
                    >
                    <span className="text-lg">🇬🇧</span>
                    <span>English</span>
                    {locale === "en" && (
                      <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                    <Link
                      href={switchLocale("el")}
                      onClick={() => setLanguageDropdownOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        locale === "el"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          : "text-zinc-700 hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-green-900/20"
                      }`}
                    >
                      <span className="text-lg">🇬🇷</span>
                      <span>Ελληνικά</span>
                      {locale === "el" && (
                        <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown or Auth Buttons */}
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 shadow-sm transition-all hover:border-green-300 hover:bg-green-50 hover:shadow dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-green-700 dark:hover:bg-green-900/20"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-sm font-bold text-white shadow-sm">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {session.user.name}
                  </span>
                  <svg
                    className={`h-4 w-4 text-zinc-400 transition-transform ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-base font-bold text-white shadow-md">
                            {session.user.name.charAt(0).toUpperCase()}
                          </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {session.user.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          session.user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : session.user.role === 'BUSINESS'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                          {session.user.role}
                        </span>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={getDashboardUrl()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {getDashboardLabel()}
                      </Link>
                      {session.user.role === "USER" && (
                        <Link
                          href={`/${locale}/membership`}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          {t("membership")}
                        </Link>
                      )}
                      <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false)
                          handleSignOut()
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t("logout")}
                      </button>
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-2"
              >
                {/* Add Your Coupon Button for Unregistered Users */}
                <Link
                  href={`/${locale}/register?type=business`}
                  className="group flex items-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition-all hover:border-green-300 hover:bg-green-100 hover:shadow dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 dark:hover:border-green-700 dark:hover:bg-green-900/30"
                >
                  <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your Coupon
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:text-green-600 dark:text-zinc-300 dark:hover:text-green-400"
                >
                  {t("login")}
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`/${locale}/register`}
                    className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:shadow-green-500/30"
                  >
                    {t("register")}
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6 text-zinc-700 dark:text-zinc-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </nav>

      {mobileMenuOpen && (
        <>
          {/* Mobile Sidebar Overlay */}
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div
            className={`fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] transform bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-zinc-900 md:hidden flex flex-col ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900 flex-shrink-0">
              <Link
                href={`/${locale}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                  <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {tCommon("appName")}
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close menu"
              >
                <svg
                  className="h-5 w-5 text-zinc-700 dark:text-zinc-300"
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
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {/* User Profile Section */}
              {session ? (
                <div className="mb-3 rounded-xl border border-zinc-200 bg-gradient-to-br from-green-50 to-emerald-50 p-2.5 dark:border-zinc-800 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-sm font-bold text-white shadow-md flex-shrink-0">
                      {session.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                        {session.user.email}
                      </p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          session.user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : session.user.role === 'BUSINESS'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          <span className="h-1 w-1 rounded-full bg-current"></span>
                          {session.user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Navigation Links */}
              <nav className="space-y-0.5">
                <Link
                  href={`/${locale}/coupons`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-green-50 hover:text-green-600 dark:text-zinc-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 transition-colors group-hover:bg-green-200 dark:bg-green-900/30 dark:group-hover:bg-green-900/50 flex-shrink-0">
                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span>{t("coupons")}</span>
                </Link>
                
                <Link
                  href={`/${locale}/membership`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-green-50 hover:text-green-600 dark:text-zinc-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 transition-colors group-hover:bg-amber-200 dark:bg-amber-900/30 dark:group-hover:bg-amber-900/50 flex-shrink-0">
                    <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <span>{t("membership")}</span>
                </Link>

                {session ? (
                  <>
                    <Link
                      href={getDashboardUrl()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-green-50 hover:text-green-600 dark:text-zinc-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50 flex-shrink-0">
                        <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <span>{getDashboardLabel()}</span>
                    </Link>

                    {session.user.role === "USER" && (
                      <Link
                        href={`/${locale}/membership`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-green-50 hover:text-green-600 dark:text-zinc-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 transition-colors group-hover:bg-green-200 dark:bg-green-900/30 dark:group-hover:bg-green-900/50 flex-shrink-0">
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <span>{t("membership")}</span>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/register?type=business`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center gap-2.5 rounded-lg border-2 border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition-all hover:border-green-300 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 dark:hover:border-green-700 dark:hover:bg-green-900/30"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-200 dark:bg-green-900/30 flex-shrink-0">
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-xs">Add Your Coupon</span>
                    </Link>
                  </>
                )}
              </nav>

              {/* Divider */}
              <div className="my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

              {/* Theme & Language Switcher - Compact Grid */}
              <div className="mb-3 grid grid-cols-2 gap-2">
                {/* Theme Switcher */}
                <div>
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Theme
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setTheme("light")
                        setMobileMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                        theme === "light"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "text-zinc-700 hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-green-900/20"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-xs">Light</span>
                    </button>
                    <button
                      onClick={() => {
                        setTheme("dark")
                        setMobileMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                        theme === "dark"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "text-zinc-700 hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-green-900/20"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="text-xs">Dark</span>
                    </button>
                  </div>
                </div>

                {/* Language Switcher */}
                <div>
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Language
                  </p>
                  <div className="space-y-1">
                    <Link
                      href={switchLocale("en")}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                        locale === "en"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "text-zinc-700 hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-green-900/20"
                      }`}
                    >
                      <span className="text-base">🇬🇧</span>
                      <span className="text-xs">EN</span>
                    </Link>
                    <Link
                      href={switchLocale("el")}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                        locale === "el"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "text-zinc-700 hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-green-900/20"
                      }`}
                    >
                      <span className="text-base">🇬🇷</span>
                      <span className="text-xs">EL</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Auth Buttons / Logout */}
              {session ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/30"
                >
                  <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{t("logout")}</span>
                </button>
              ) : (
                <div className="space-y-1.5">
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
                  >
                    {t("register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

