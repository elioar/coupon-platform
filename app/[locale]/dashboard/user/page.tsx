"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import CouponCard from "@/components/CouponCard"
import { isMember } from "@/lib/client-utils"

interface Coupon {
  id: string
  title: string
  description: string
  code: string | null
  couponType: "ONLINE_CODE" | "QR_CODE"
  imagePath: string | null
  discountPercentage: number
  expirationDate: string
  category: {
    id: string
    nameEn: string
    nameEl: string
  }
  business: {
    id: string
    name: string
  }
}

interface ProfileResponse {
  profile: {
    name: string
    email: string
    emailVerified: boolean
    address: string | null
    birthDate: string | null
    phone: string | null
    about: string | null
  }
}

type MessageState =
  | {
      type: "success" | "error"
      text: string
    }
  | null

export default function UserDashboard() {
  const { data: session, update, status } = useSession()
  const [refreshKey, setRefreshKey] = useState(0)
  const t = useTranslations("dashboard.user")
  const tProfile = useTranslations("profile")
  const tCommon = useTranslations("common")
  const tNav = useTranslations("nav")
  const tMembership = useTranslations("membership")
  const tRefer = useTranslations("dashboard.user.referBusiness")
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  
  const section = searchParams.get("section") || "overview"

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [loadingRedemptions, setLoadingRedemptions] = useState(true)
  const [savedCoupons, setSavedCoupons] = useState<string[]>([])
  const [profileData, setProfileData] = useState({
    name: "",
    address: "",
    birthDate: "",
    phone: "",
    about: "",
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)
  const [invites, setInvites] = useState<any[]>([])
  const [inviteStats, setInviteStats] = useState<any>(null)
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const lastRefreshedSection = useRef<string | null>(null)
  const [dbMembershipExpiry, setDbMembershipExpiry] = useState<string | null>(null)
  const [dbHasActiveMembership, setDbHasActiveMembership] = useState<boolean>(false)
  const [emailVerified, setEmailVerified] = useState<boolean>(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Recalculate membership status - use DB data if available, otherwise use session
  const userIsMember = dbHasActiveMembership || (session?.user ? isMember(session.user) : false)

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

  const passwordStrength = checkPasswordStrength(passwordData.newPassword)
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
  const strengthColors = [
    "from-red-500 to-red-600",
    "from-orange-500 to-orange-600",
    "from-yellow-500 to-yellow-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-emerald-600",
  ]

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({
        type: "error",
        text: locale === "el" ? "Οι κωδικοί δεν ταιριάζουν" : "Passwords do not match",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: locale === "el" ? "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες" : "Password must be at least 8 characters",
      })
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: locale === "el" ? "Ο κωδικός άλλαξε επιτυχώς" : "Password changed successfully",
        })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setTimeout(() => {
          setShowPasswordModal(false)
        }, 1500)
      } else {
        setMessage({
          type: "error",
          text: data.error || (locale === "el" ? "Αποτυχία αλλαγής κωδικού" : "Failed to change password"),
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: locale === "el" ? "Αποτυχία αλλαγής κωδικού" : "Failed to change password",
      })
    } finally {
      setChangingPassword(false)
    }
  }
  
  // Fetch email verification status
  useEffect(() => {
    const fetchEmailVerification = async () => {
      if (!session?.user?.id) return
      
      try {
        const res = await fetch("/api/profile")
        if (res.ok) {
          const data = await res.json()
          setEmailVerified(data.profile.emailVerified ?? false)
        }
      } catch (error) {
        // Silent fail
      }
    }
    
    fetchEmailVerification()
  }, [session?.user?.id])
  
  // Fetch membership status directly from database (bypasses session cache)
  const fetchMembershipStatus = async () => {
    try {
      const response = await fetch("/api/membership/status", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setDbMembershipExpiry(data.membershipExpiry)
        setDbHasActiveMembership(data.hasActiveMembership)
      }
    } catch (error) {
      // Silently fail
    }
  }
  
  // Fetch membership status when component mounts or section changes to membership
  useEffect(() => {
    if (section === "membership" || section === "referBusiness") {
      fetchMembershipStatus()
    }
  }, [section])
  
  // Force re-evaluation when refreshKey changes (after membership update)
  useEffect(() => {
    if (refreshKey > 0) {
      // Re-fetch membership status from DB after update
      setTimeout(() => {
        fetchMembershipStatus()
      }, 600)
    }
  }, [refreshKey])

  // Get invite link
  const inviteLink = session?.user?.id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/register/business?invite=${session.user.id}`
    : ""

  // Skeleton Loader Component
  const UserCouponsSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <div className="h-48 bg-gray-200 dark:bg-zinc-700"></div>
          <div className="p-6">
            <div className="h-5 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-3"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded mb-4"></div>
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
              <div className="h-9 w-24 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Fetch coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch('/api/coupons')
        const data = await response.json()
        setCoupons(data.coupons || [])
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [])

  // Fetch redemptions
  useEffect(() => {
    const fetchRedemptions = async () => {
      if (!session?.user?.id) {
        setLoadingRedemptions(false)
        return
      }
      
      try {
        const response = await fetch('/api/user/redemptions')
        if (response.ok) {
          const data = await response.json()
          setRedemptions(data.redemptions || [])
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoadingRedemptions(false)
      }
    }

    fetchRedemptions()
  }, [session?.user?.id])

  // Load saved coupons from localStorage
  useEffect(() => {
    const loadSavedCoupons = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('savedCoupons')
        if (saved) {
          try {
            setSavedCoupons(JSON.parse(saved))
          } catch (e) {
            setSavedCoupons([])
          }
        }
      }
    }

    loadSavedCoupons()

    // Listen for changes to saved coupons
    if (typeof window !== 'undefined') {
      window.addEventListener('savedCouponsChanged', loadSavedCoupons)
      return () => {
        window.removeEventListener('savedCouponsChanged', loadSavedCoupons)
      }
    }
  }, [])

  // Fetch profile and email verification status
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return

      try {
        const res = await fetch("/api/profile")
        if (!res.ok) throw new Error("Failed to load profile")

        const data = (await res.json()) as ProfileResponse
        const profile = data.profile
        setEmailVerified(profile.emailVerified ?? false)
        
        if (section === "profile") {
          setProfileData({
            name: profile.name ?? "",
            address: profile.address ?? "",
            birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
            phone: profile.phone ?? "",
            about: profile.about ?? "",
          })
        }
      } catch (error) {
        if (section === "profile") {
          setMessage({ type: "error", text: tProfile("error") })
        }
      }
    }

    fetchProfile()
  }, [session, section, tProfile])

  // Automatically claim rewards when viewing membership section (removed from referBusiness to avoid auto-reload)
  useEffect(() => {
    const autoClaimRewards = async () => {
      if (!session || lastRefreshedSection.current === section) {
        return
      }

      // Only auto-claim on membership section, not referBusiness (to avoid reloads)
      if (section === "membership") {
        lastRefreshedSection.current = section
        
        try {
          // Automatically check and claim rewards
          const response = await fetch("/api/invites/check-membership", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.fixed && data.fixedCount > 0) {
              // Wait for database update to complete
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Refresh membership status directly from database (bypasses session cache)
              await fetchMembershipStatus()
              
              // Also try to refresh session (but DB check is primary)
              await update()
              
              // Force component re-render by updating refresh key
              setRefreshKey(prev => prev + 1)
            }
          }
        } catch (error) {
          // Silently handle errors
        }
      }
    }
    
    autoClaimRewards()
  }, [section, session, update])

  // Fetch invites for referBusiness section (also auto-claims rewards)
  useEffect(() => {
    const fetchInvites = async () => {
      if (!session || section !== "referBusiness") {
        setLoadingInvites(false)
        return
      }

      try {
        const response = await fetch("/api/invites")
        if (response.ok) {
          const data = await response.json()
          setInvites(data.invites || [])
          setInviteStats(data.stats || {})
          
          // If rewards were granted, refresh membership status after auto-fix
          if (data.stats?.rewardsGranted > 0) {
            // The API already auto-fixed, now refresh membership status from DB
            setTimeout(async () => {
              await fetchMembershipStatus()
              await update()
              // Force component re-render
              setRefreshKey(prev => prev + 1)
            }, 500)
          }
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoadingInvites(false)
      }
    }

    fetchInvites()
  }, [session, section, update])

  // Fetch invite stats for membership section (to check for earned rewards)
  useEffect(() => {
    const fetchInviteStats = async () => {
      if (!session || section !== "membership" || inviteStats !== null) {
        return
      }

      try {
        const response = await fetch("/api/invites")
        if (response.ok) {
          const data = await response.json()
          setInviteStats(data.stats || {})
        }
      } catch (error) {
        // Error handled silently
      }
    }

    fetchInviteStats()
  }, [session, section, inviteStats])

  const handleCopyLink = async () => {
    if (!inviteLink || typeof window === "undefined") return

    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
        return
      }

      // Fallback to older method
      const textArea = document.createElement("textarea")
      textArea.value = inviteLink
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand("copy")
        if (successful) {
          setLinkCopied(true)
          setTimeout(() => setLinkCopied(false), 2000)
        } else {
          throw new Error("Copy command failed")
        }
      } finally {
        document.body.removeChild(textArea)
      }
      } catch (err) {
        // Failed to copy - silently fail
      }
  }

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        name: profileData.name.trim(),
        address: profileData.address.trim() || null,
        birthDate: profileData.birthDate || null,
        phone: profileData.phone.trim() || null,
        about: profileData.about.trim() || null,
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save")

      const result = (await response.json()) as ProfileResponse
      const profile = result.profile

      setProfileData({
        name: profile.name ?? "",
        address: profile.address ?? "",
        birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
        phone: profile.phone ?? "",
        about: profile.about ?? "",
      })

      setMessage({ type: "success", text: tProfile("success") })
      await update({ name: profile.name ?? "" })
    } catch (error) {
      setMessage({ type: "error", text: tProfile("error") })
    } finally {
      setSaving(false)
    }
  }

  const renderSection = () => {
    // Helper function for date formatting
    const formatDate = (dateString: string | null) => {
      if (!dateString) return null
      const date = new Date(dateString)
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date)
    }

    // Get saved coupons (used in multiple sections)
    const savedCouponObjects = coupons.filter(c => savedCoupons.includes(c.id))

    switch (section) {
      case "overview":
        return (
          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                  {t("welcomeBack", { name: session?.user.name?.split(' ')[0] || "User" })}
                </h1>
                <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("activityDescription")}
                </p>
              </div>
              <a
                href={`/${locale}/coupons`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-5 py-2.5 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-700 hover:to-violet-800 hover:shadow-xl hover:shadow-violet-500/40 sm:px-6 sm:py-3"
              >
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {tNav("coupons")}
              </a>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Saved Coupons Card */}
              <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-900 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
                    <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("savedCoupons")}</h3>
                </div>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{savedCouponObjects.length}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{t("bookmarkedDeals")}</p>
              </div>

              {/* Redemptions Card */}
              <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm dark:border-zinc-800 dark:from-green-950/20 dark:to-zinc-900 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("redemptions")}</h3>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{redemptions.length}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{t("codesCopied")}</p>
              </div>

              {/* Membership Expiry Card */}
              <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm dark:border-zinc-800 dark:from-amber-950/20 dark:to-zinc-900 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("membership")}</h3>
                </div>
                {session?.user.membershipExpiry ? (
                  <>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatDate(session.user.membershipExpiry)}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{t("expiresOn")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-zinc-400 dark:text-zinc-500">{t("notActive")}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{t("noMembership")}</p>
                  </>
                )}
              </div>

            </div>

            {/* Last Redemptions Section */}
            {redemptions.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
                  {t("lastRedemptions")}
                </h2>
                <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {redemptions.slice(0, 5).map((redemption) => (
                      <div key={redemption.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                        <div className="flex items-center gap-4">
                          {redemption.imagePath ? (
                            <img 
                              src={redemption.imagePath} 
                              alt={redemption.couponTitle}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                {redemption.discountPercentage}%
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                              {redemption.couponTitle}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {t("code")}: <span className="font-mono font-semibold text-green-600 dark:text-green-400">{redemption.couponCode}</span>
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                              {formatDate(redemption.redeemedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Saved Coupons Section */}
            {savedCouponObjects.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
                  {t("savedCoupons")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedCouponObjects.slice(0, 6).map((coupon) => (
                    <CouponCard
                      key={coupon.id}
                      coupon={coupon}
                      isMember={userIsMember}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )

      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                {tProfile("title")}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                {tProfile("subtitle")}
              </p>
            </div>

            {message && (
              <div
                className={`rounded-xl border p-4 ${
                  message.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Email Verification Status */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {session?.user.email}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {emailVerified 
                        ? (locale === "el" ? "Το email σας είναι επαληθευμένο" : "Your email is verified")
                        : (locale === "el" ? "Το email σας δεν είναι επαληθευμένο" : "Your email is not verified")
                      }
                    </p>
                  </div>
                </div>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locale === "el" ? "Επαληθευμένο" : "Verified"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!session?.user?.email) return
                      try {
                        const response = await fetch("/api/auth/resend-verification", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: session.user.email, locale }),
                        })
                        if (response.ok) {
                          setMessage({ 
                            type: "success", 
                            text: locale === "el" ? "Το email επαλήθευσης στάλθηκε! Ελέγξτε το inbox σας." : "Verification email sent! Please check your inbox." 
                          })
                          setTimeout(async () => {
                            try {
                              const res = await fetch("/api/profile")
                              if (res.ok) {
                                const data = await res.json()
                                setEmailVerified(data.profile.emailVerified ?? false)
                                if (data.profile.emailVerified) {
                                  await update()
                                }
                              }
                            } catch (error) {
                              // Silent fail
                            }
                          }, 2000)
                        } else {
                          setMessage({ 
                            type: "error", 
                            text: locale === "el" ? "Αποτυχία αποστολής email επαλήθευσης." : "Failed to send verification email." 
                          })
                        }
                      } catch (error) {
                        setMessage({ 
                          type: "error", 
                          text: locale === "el" ? "Αποτυχία αποστολής email επαλήθευσης." : "Failed to send verification email." 
                        })
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {locale === "el" ? "Αποστολή Email Επαλήθευσης" : "Send Verification Email"}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
                  {tProfile("personalInfo")}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {tProfile("name")}
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {tProfile("phone")}
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {tProfile("address")}
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {tProfile("birthDate")}
                    </label>
                    <input
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) =>
                        setProfileData({ ...profileData, birthDate: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tProfile("about")}
                  </label>
                  <textarea
                    rows={3}
                    value={profileData.about}
                    onChange={(e) =>
                      setProfileData({ ...profileData, about: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    placeholder={tProfile("aboutPlaceholder")}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-violet-600 px-6 py-2 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? tCommon("loading") : tProfile("save")}
                </button>
              </div>
            </form>

            {/* Password Change Button */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
                    {locale === "el" ? "Ασφάλεια" : "Security"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {locale === "el" ? "Αλλάξτε τον κωδικό πρόσβασής σας" : "Change your account password"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  {locale === "el" ? "Αλλαγή Κωδικού" : "Change Password"}
                </button>
              </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowPasswordModal(false)
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    })
                  }
                }}
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 overflow-hidden">
                  <div className="border-b border-zinc-200 bg-gradient-to-br from-violet-50 to-white px-6 py-5 dark:border-zinc-800 dark:from-violet-950/30 dark:to-zinc-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                          {locale === "el" ? "Αλλαγή Κωδικού" : "Change Password"}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {locale === "el" ? "Εισάγετε τον τρέχοντα και τον νέο κωδικό" : "Enter your current and new password"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordModal(false)
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          })
                        }}
                        className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                    {/* Current Password */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {locale === "el" ? "Τρέχων Κωδικός" : "Current Password"}
                        </label>
                        <Link
                          href={`/${locale}/forgot-password`}
                          className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                        >
                          {locale === "el" ? "Ξέχασα τον κωδικό μου" : "Forgot password?"}
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          required
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          {showCurrentPassword ? (
                            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {locale === "el" ? "Νέος Κωδικός" : "New Password"}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        {showNewPassword ? (
                          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div
                              className={`h-full bg-gradient-to-r ${strengthColors[passwordStrength.strength] || strengthColors[0]}`}
                              style={{ width: `${((passwordStrength.strength + 1) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {strengthLabels[passwordStrength.strength] || strengthLabels[0]}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.length ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                            <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              {passwordStrength.checks.length ? (
                                <path d="M5 13l4 4L19 7" />
                              ) : (
                                <path d="M6 18L18 6M6 6l12 12" />
                              )}
                            </svg>
                            {locale === "el" ? "Τουλάχιστον 8 χαρακτήρες" : "At least 8 characters"}
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.lowercase ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                            <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              {passwordStrength.checks.lowercase ? (
                                <path d="M5 13l4 4L19 7" />
                              ) : (
                                <path d="M6 18L18 6M6 6l12 12" />
                              )}
                            </svg>
                            {locale === "el" ? "Μικρά γράμματα" : "Lowercase letters"}
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.uppercase ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                            <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              {passwordStrength.checks.uppercase ? (
                                <path d="M5 13l4 4L19 7" />
                              ) : (
                                <path d="M6 18L18 6M6 6l12 12" />
                              )}
                            </svg>
                            {locale === "el" ? "Κεφαλαία γράμματα" : "Uppercase letters"}
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.number ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                            <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              {passwordStrength.checks.number ? (
                                <path d="M5 13l4 4L19 7" />
                              ) : (
                                <path d="M6 18L18 6M6 6l12 12" />
                              )}
                            </svg>
                            {locale === "el" ? "Αριθμοί" : "Numbers"}
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.special ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                            <svg className="h-3.5 w-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              {passwordStrength.checks.special ? (
                                <path d="M5 13l4 4L19 7" />
                              ) : (
                                <path d="M6 18L18 6M6 6l12 12" />
                              )}
                            </svg>
                            {locale === "el" ? "Ειδικοί χαρακτήρες" : "Special characters"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {locale === "el" ? "Επιβεβαίωση Κωδικού" : "Confirm Password"}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {locale === "el" ? "Οι κωδικοί δεν ταιριάζουν" : "Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false)
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        })
                      }}
                      className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {locale === "el" ? "Ακύρωση" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      {changingPassword ? tCommon("loading") : (locale === "el" ? "Αλλαγή Κωδικού" : "Change Password")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            )}
          </div>
        )

      case "saved":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                {t("savedCoupons")}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                {t("savedCouponsDescription")}
              </p>
            </div>

            {loading ? (
              <UserCouponsSkeleton />
            ) : savedCouponObjects.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                  <svg className="h-8 w-8 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("noSavedCoupons")}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {t("noSavedCouponsDescription")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {savedCouponObjects.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    isMember={userIsMember}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>
        )

      case "membership": {
        // Use DB membership data if available (more up-to-date), otherwise fall back to session
        const membershipExpiry = dbMembershipExpiry || session?.user.membershipExpiry || null
        const isActiveMember = dbHasActiveMembership || (membershipExpiry && new Date(membershipExpiry) > new Date())

        const daysUntilExpiry = membershipExpiry && isActiveMember
          ? Math.ceil((new Date(membershipExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null

        return (
          <div className="space-y-3">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t("membership")}
            </h1>

            {isActiveMember ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                  <div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {tMembership("activeMember")}
                    </span>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {tMembership("expiresOn")} {formatDate(membershipExpiry)}
                      {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                        <span className="ml-1.5">
                          {daysUntilExpiry === 1 
                            ? `(${tMembership("expiresTomorrow")})`
                            : `(${tMembership("expiresInDays", { days: daysUntilExpiry })})`
                          }
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {tMembership("active")}
                  </span>
                </div>

                {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                  <a
                    href={`/${locale}/membership`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                  >
                    {tMembership("renew")}
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                  <div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {tMembership("notMember")}
                    </span>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {tMembership("upgradeToUnlock")}
                    </p>
                  </div>
                </div>
                <a
                  href={`/${locale}/membership`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                >
                  {tMembership("upgradeToPremium")}
                </a>
              </div>
            )}
          </div>
        )
      }

      case "referBusiness": {
        const getStatusLabel = (status: string) => {
          switch (status) {
            case "PENDING":
              return tRefer("statusPending")
            case "REGISTERED":
              return tRefer("statusRegistered")
            case "ACTIVE":
              return tRefer("statusActive")
            default:
              return status
          }
        }

        const getStatusColor = (status: string) => {
          switch (status) {
            case "PENDING":
              return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            case "REGISTERED":
              return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            case "ACTIVE":
              return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            default:
              return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
          }
        }

        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                {tRefer("title")}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                {tRefer("subtitle")}
              </p>
            </div>

            {/* Invite Link Card */}
            <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-900">
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {tRefer("inviteLink")}
              </h2>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                {tRefer("description")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 break-all">
                  {inviteLink || tCommon("loading")}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                >
                  {linkCopied ? (
                    <>
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {tRefer("linkCopied")}
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {tRefer("copyLink")}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            {inviteStats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {tRefer("stats.total")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {inviteStats.total || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {tRefer("stats.pending")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {inviteStats.pending || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {tRefer("stats.registered")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {inviteStats.registered || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {tRefer("stats.active")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                    {inviteStats.active || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Rewards Card */}
            {inviteStats && inviteStats.rewardsGranted > 0 && (
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm dark:border-green-800 dark:from-green-950/20 dark:to-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {tRefer("freeMonthsEarned")}
                    </h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {inviteStats.rewardsGranted} {inviteStats.rewardsGranted === 1 ? "month" : "months"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {tRefer("freeMonthsDescription")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Invited Businesses List */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {tRefer("invitedBusinesses")}
                </h2>
              </div>
              {loadingInvites ? (
                <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
                  {tCommon("loading")}
                </div>
              ) : invites.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                    <svg className="h-8 w-8 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {tRefer("noInvites")}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {tRefer("noInvitesDescription")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {invites.map((invite) => {
                    const status = invite.status
                    const isPending = status === "PENDING"
                    const isRegistered = status === "REGISTERED"
                    const isActive = status === "ACTIVE"
                    
                    return (
                      <div key={invite.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                                {invite.invitedBusiness?.name || "Unknown Business"}
                              </h3>
                              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {tRefer("invitedOn")}: {new Date(invite.createdAt).toLocaleDateString(locale, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(invite.status)}`}>
                                {getStatusLabel(invite.status)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress Steps */}
                          <div className="mt-4">
                            <div className="flex items-center gap-2">
                              {/* Step 1: Invite Sent */}
                              <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                  isPending || isRegistered || isActive
                                    ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                                    : "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                                }`}>
                                  {isPending || isRegistered || isActive ? (
                                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">1</span>
                                  )}
                                </div>
                                <span className={`text-xs font-medium ${
                                  isPending || isRegistered || isActive
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-zinc-500 dark:text-zinc-400"
                                }`}>
                                  Invite Sent
                                </span>
                              </div>
                              
                              {/* Line */}
                              <div className={`h-0.5 flex-1 ${
                                isRegistered || isActive
                                  ? "bg-green-500"
                                  : "bg-zinc-300 dark:bg-zinc-700"
                              }`} />
                              
                              {/* Step 2: Registered */}
                              <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                  isRegistered || isActive
                                    ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                                    : "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                                }`}>
                                  {isRegistered || isActive ? (
                                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">2</span>
                                  )}
                                </div>
                                <span className={`text-xs font-medium ${
                                  isRegistered || isActive
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-zinc-500 dark:text-zinc-400"
                                }`}>
                                  Registered
                                </span>
                              </div>
                              
                              {/* Line */}
                              <div className={`h-0.5 flex-1 ${
                                isActive
                                  ? "bg-green-500"
                                  : "bg-zinc-300 dark:bg-zinc-700"
                              }`} />
                              
                              {/* Step 3: Active Coupon */}
                              <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                  isActive
                                    ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                                    : "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                                }`}>
                                  {isActive ? (
                                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">3</span>
                                  )}
                                </div>
                                <span className={`text-xs font-medium ${
                                  isActive
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-zinc-500 dark:text-zinc-400"
                                }`}>
                                  Active Coupon
                                </span>
                              </div>
                              
                              {/* Reward indicator */}
                              {isActive && (
                                <div className="ml-2 flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 dark:bg-green-900/30">
                                  <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">+1 Month</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      }

      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                Settings
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Configure your account settings
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">
                Account settings coming soon...
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <DashboardSidebar
        role="USER"
        locale={locale}
        userName={session?.user.name || "User"}
        userEmail={session?.user.email || ""}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <DashboardHeader
        userName={session?.user.name || "User"}
        userEmail={session?.user.email || ""}
        role="USER"
        locale={locale}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        emailVerified={emailVerified}
      />

      <main className="ml-0 flex-1 overflow-x-hidden pt-16 lg:ml-72">
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
