"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"

interface DashboardHeaderProps {
  userName: string
  userEmail: string
  role: "USER" | "BUSINESS" | "ADMIN"
  locale: string
  isMobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
}

export default function DashboardHeader({
  userName,
  userEmail,
  role,
  locale,
  isMobileMenuOpen = false,
  onMobileMenuToggle,
}: DashboardHeaderProps) {
  const t = useTranslations("dashboard.header")
  const router = useRouter()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    setShowLogoutModal(false)
    setIsUserMenuOpen(false)
    await signOut({ redirect: false })
    router.push(`/${locale}`)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const getRoleBadgeColor = () => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/20 text-red-600 dark:text-red-400"
      case "BUSINESS":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400"
      default:
        return "bg-green-500/20 text-green-600 dark:text-green-400"
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:left-72">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
        {/* Left: Burger Menu + Logo/Brand (visible only on mobile) */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Burger Menu Button */}
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <svg
                className="h-5 w-5 text-white"
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
            <span className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">VibePeek</span>
          </Link>
        </div>

        {/* Center: Dashboard Title */}
        <div className="hidden items-center gap-2 lg:flex">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {role === "ADMIN" && "Admin Dashboard"}
            {role === "BUSINESS" && "Business Dashboard"}
            {role === "USER" && "My Dashboard"}
          </h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor()}`}>
            {role}
          </span>
        </div>

        {/* Right: Notifications & User Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications Button */}
          <button
            className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Notifications"
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
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification Badge */}
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-10 items-center gap-1.5 rounded-lg px-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white sm:gap-2"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-xs font-bold text-white sm:h-7 sm:w-7">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium text-gray-900 dark:text-white lg:block">
                {userName}
              </span>
              <svg
                className={`h-4 w-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-none">
                {/* User Info */}
                <div className="border-b border-gray-200 p-4 dark:border-zinc-800">
                  <p className="font-semibold text-gray-900 dark:text-white">{userName}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">{userEmail}</p>
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor()}`}>
                    {role}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <Link
                    href={`/${locale}/dashboard/${role.toLowerCase()}?section=settings`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>

                  <Link
                    href={`/${locale}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Visit Site
                  </Link>

                  <hr className="my-2 border-gray-200 dark:border-zinc-800" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      setShowLogoutModal(true)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
            <div className="relative border-b border-gray-200/50 bg-gradient-to-br from-green-50 via-green-50/50 to-white px-6 py-5 dark:border-zinc-800 dark:from-green-950/30 dark:via-green-950/20 dark:to-zinc-900">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 dark:from-green-600 dark:to-emerald-700">
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
    </header>
  )
}

