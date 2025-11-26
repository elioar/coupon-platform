"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
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
  const { data: session, update } = useSession()
  const t = useTranslations("dashboard.user")
  const tProfile = useTranslations("profile")
  const tCommon = useTranslations("common")
  const tNav = useTranslations("nav")
  const tMembership = useTranslations("membership")
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

  const userIsMember = session?.user ? isMember(session.user) : false

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
        console.error("Error fetching coupons:", error)
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
        console.error("Error fetching redemptions:", error)
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

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session || section !== "profile") return

      try {
        const res = await fetch("/api/profile")
        if (!res.ok) throw new Error("Failed to load profile")

        const data = (await res.json()) as ProfileResponse
        const profile = data.profile
        setProfileData({
          name: profile.name ?? "",
          address: profile.address ?? "",
          birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
          phone: profile.phone ?? "",
          about: profile.about ?? "",
        })
      } catch (error) {
        console.error(error)
        setMessage({ type: "error", text: tProfile("error") })
      }
    }

    fetchProfile()
  }, [session, section, tProfile])

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
      console.error(error)
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

      case "membership":
        const membershipExpiry = session?.user.membershipExpiry || null
        const isActiveMember = membershipExpiry && new Date(membershipExpiry) > new Date()

        const daysUntilExpiry = membershipExpiry && isActiveMember
          ? Math.ceil((new Date(membershipExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null

        return (
          <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                {t("membership")}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                {tMembership("manageMembership")}
              </p>
            </div>

            {/* Membership Status Card */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-violet-50 via-white to-violet-50/50 p-8 shadow-lg dark:border-zinc-800 dark:from-violet-950/20 dark:via-zinc-900 dark:to-violet-950/10 sm:p-10">
              {/* Decorative Background Elements */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-900/20" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl dark:bg-violet-900/10" />
              
              <div className="relative z-10">
                {isActiveMember ? (
                  <div className="space-y-6">
                    {/* Active Status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30">
                          <svg
                            className="h-8 w-8 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                            {tMembership("activeMember")}
                          </h2>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {tMembership("premiumAccess")}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full bg-green-100 px-4 py-1.5 dark:bg-green-900/30">
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                          {tMembership("active")}
                        </span>
                      </div>
                    </div>

                    {/* Expiry Info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="mb-2 flex items-center gap-2">
                          <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {tMembership("expiresOn")}
                          </h3>
                        </div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                          {formatDate(membershipExpiry)}
                        </p>
                        {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                            {daysUntilExpiry === 1 
                              ? tMembership("expiresTomorrow")
                              : tMembership("expiresInDays", { days: daysUntilExpiry })
                            }
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border border-zinc-200 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="mb-2 flex items-center gap-2">
                          <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {tMembership("benefits.title")}
                          </h3>
                        </div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                          {tMembership("unlimitedAccess")}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                          {tMembership("allFeaturesUnlocked")}
                        </p>
                      </div>
                    </div>

                    {/* Renew Button */}
                    {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                      <a
                        href={`/${locale}/membership`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-700 hover:to-violet-800 hover:shadow-xl hover:shadow-violet-500/40 sm:w-auto"
                      >
                        <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {tMembership("renew")}
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    {/* Inactive Status */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700">
                      <svg
                        className="h-10 w-10 text-zinc-600 dark:text-zinc-400"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                        {tMembership("notMember")}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {tMembership("upgradeToUnlock")}
                      </p>
                    </div>

                    {/* Upgrade CTA */}
                    <a
                      href={`/${locale}/membership`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-700 hover:to-violet-800 hover:shadow-xl hover:shadow-violet-500/40 sm:w-auto"
                    >
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {tMembership("upgradeToPremium")}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Benefits Section - Only show if member */}
            {isActiveMember && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
                <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50 sm:text-xl">
                  {tMembership("benefits.title")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: "unlimited", text: tMembership("benefits.unlimited") },
                    { icon: "exclusive", text: tMembership("benefits.exclusive") },
                    { icon: "early", text: tMembership("benefits.early") },
                    { icon: "support", text: tMembership("benefits.support") },
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {benefit.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

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
      />

      <main className="ml-0 flex-1 overflow-x-hidden pt-16 lg:ml-72">
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
