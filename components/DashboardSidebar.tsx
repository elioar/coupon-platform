"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "@/components/ThemeProvider"

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

interface DashboardSidebarProps {
  role: "USER" | "BUSINESS" | "ADMIN"
  locale: string
  userName: string
  userEmail: string
  isMobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}

export default function DashboardSidebar({
  role,
  locale,
  userName,
  userEmail,
  isMobileMenuOpen: externalIsOpen,
  onMobileMenuClose,
}: DashboardSidebarProps) {
  const t = useTranslations("dashboard.sidebar")
  const tNav = useTranslations("nav")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const isMobileMenuOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsMobileMenuOpen = onMobileMenuClose ? onMobileMenuClose : setInternalIsOpen

  const switchLocale = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, "")
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  const toggleTheme = () => {
    // Always set explicit theme (never "system")
    // Use resolvedTheme to determine current appearance, then toggle to opposite
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }

  const handleLogout = async () => {
    setShowLogoutModal(false)
    await signOut({ redirect: false })
    router.push(`/${locale}`)
  }

  // Define menu items based on role
  const getMenuItems = (): MenuItem[] => {
    // Overview item - common to all roles
    const overviewItem: MenuItem = {
      id: "overview",
      label: t("overview"),
      icon: (
        <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: `/${locale}/dashboard/${role.toLowerCase()}?section=overview`,
    }

    // Profile item - only for USER and BUSINESS
    const profileItem: MenuItem = {
      id: "profile",
      label: t("profile"),
      icon: (
        <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: `/${locale}/dashboard/${role.toLowerCase()}?section=profile`,
    }

    const commonItems: MenuItem[] = [overviewItem, profileItem]

    if (role === "USER") {
      return [
        ...commonItems,
        {
          id: "membership",
          label: t("membership"),
          icon: (
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          ),
          href: `/${locale}/dashboard/${role.toLowerCase()}?section=membership`,
        },
        {
          id: "settings",
          label: t("settings"),
          icon: (
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          href: `/${locale}/dashboard/${role.toLowerCase()}?section=settings`,
        },
        {
          id: "logout",
          label: t("logout"),
          icon: (
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ),
          onClick: handleLogout,
        },
      ]
    }

    if (role === "BUSINESS") {
      return [
        ...commonItems,
        {
          id: "coupons",
          label: t("coupons"),
          icon: (
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
          href: `/${locale}/dashboard/${role.toLowerCase()}?section=coupons`,
        },
        {
          id: "insights",
          label: t("insights"),
          icon: (
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          href: `/${locale}/dashboard/${role.toLowerCase()}?section=insights`,
        },
        {
          id: "settings",
          label: t("settings"),
          icon: (
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          href: `/${locale}/dashboard/${role.toLowerCase()}?section=settings`,
        },
        {
          id: "logout",
          label: t("logout"),
          icon: (
            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ),
          onClick: handleLogout,
        },
      ]
    }

    // ADMIN
    return [
      overviewItem,
      {
        id: "coupons",
        label: t("coupons"),
        icon: (
          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
        href: `/${locale}/dashboard/${role.toLowerCase()}?section=coupons`,
      },
      {
        id: "users",
        label: t("users"),
        icon: (
          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        href: `/${locale}/dashboard/${role.toLowerCase()}?section=users`,
      },
      {
        id: "categories",
        label: t("categories"),
        icon: (
          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
        href: `/${locale}/dashboard/${role.toLowerCase()}?section=categories`,
      },
      {
        id: "settings",
        label: t("settings"),
        icon: (
          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        href: `/${locale}/dashboard/${role.toLowerCase()}?section=settings`,
      },
      {
        id: "logout",
        label: t("logout"),
        icon: (
          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        ),
        onClick: handleLogout,
      },
    ]
  }

  const menuItems = getMenuItems()

  // Get current section from URL query parameter
  const currentSection = searchParams.get("section") || "overview"

  const isActive = (itemId: string) => {
    // For overview, also check if no section is specified (defaults to overview)
    if (itemId === "overview" && !searchParams.get("section")) {
      return true
    }
    return currentSection === itemId
  }

  const closeMobileMenu = () => {
    if (typeof setIsMobileMenuOpen === 'function') {
      setIsMobileMenuOpen(false)
    }
  }

  // Handle Escape key to close logout modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLogoutModal) {
        setShowLogoutModal(false)
      }
    }

    if (showLogoutModal) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showLogoutModal])

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand Header */}
          <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">CouponHub</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActiveLink = isActive(item.id)
                
                if (item.onClick) {
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          closeMobileMenu()
                          if (item.id === "logout") {
                            setShowLogoutModal(true)
                          } else {
                            item.onClick?.()
                          }
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    </li>
                  )
                }

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href || "#"}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                        isActiveLink
                          ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-lg shadow-violet-500/50 dark:from-violet-500 dark:to-violet-600"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                      }`}
                    >
                      <span className={isActiveLink ? "opacity-100" : "opacity-70"}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Language & Theme Switcher */}
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-zinc-800">
              {/* Language Switcher */}
              <div>
                <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                  {tNav("language")}
                </p>
                <div className="grid grid-cols-2 gap-2 px-4">
                  <button
                    onClick={() => {
                      switchLocale("en")
                      closeMobileMenu()
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                      locale === "en"
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15 15 0 010 20M8 2a15 15 0 000 20M2 12h20" />
                    </svg>
                    <span>EN</span>
                  </button>
                  <button
                    onClick={() => {
                      switchLocale("el")
                      closeMobileMenu()
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                      locale === "el"
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15 15 0 010 20M8 2a15 15 0 000 20M2 12h20" />
                    </svg>
                    <span>EL</span>
                  </button>
                </div>
              </div>

              {/* Theme Toggle */}
              <div>
                <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                  {tNav("theme")}
                </p>
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  {resolvedTheme === "dark" ? (
                    <>
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>{tNav("light")}</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span>{tNav("dark")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </nav>

          {/* Footer - User Info */}
          <div className="border-t border-gray-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLogoutModal(false)
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity dark:bg-black/80"></div>
          
          {/* Modal */}
          <div 
            className="relative z-10 w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 overflow-hidden"
            style={{ animation: 'scaleIn 0.2s ease-out' }}
          >
            {/* Header */}
            <div className="relative border-b border-gray-200/50 bg-gradient-to-br from-violet-50 via-violet-50/50 to-white px-6 py-5 dark:border-zinc-800 dark:from-violet-950/30 dark:via-violet-950/20 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25 dark:from-violet-600 dark:to-violet-700">
                  <svg className="h-6 w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Are you sure?</h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">Choose an action to continue</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                Are you sure you want to log out? You'll need to sign in again to access your account.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-gray-200/50 bg-gray-50/50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <button
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.98] dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 touch-manipulation"
              >
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>

              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

