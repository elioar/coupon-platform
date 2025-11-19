"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import DashboardSidebar from "@/components/DashboardSidebar"
import Navigation from "@/components/Navigation"
import MembershipBadge from "@/components/MembershipBadge"
import CouponCard from "@/components/CouponCard"
import { isMember } from "@/lib/client-utils"

interface Coupon {
  id: string
  title: string
  description: string
  code: string
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
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  
  const section = searchParams.get("section") || "overview"

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
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
    switch (section) {
      case "overview":
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                {t("title")}
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Welcome back, {session?.user.name}!
              </p>
            </div>

            {/* Membership Status */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("membershipStatus")}
              </h2>
              <MembershipBadge membershipExpiry={session?.user.membershipExpiry || null} />
            </div>

            {/* Available Coupons */}
            <div>
              <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("availableCoupons")}
              </h2>

              {loading ? (
                <div className="py-12 text-center">
                  <p className="text-zinc-600 dark:text-zinc-400">{tCommon("loading")}</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-zinc-600 dark:text-zinc-400">No coupons available yet.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                  {coupons.slice(0, 6).map((coupon) => (
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
          </div>
        )

      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                {tProfile("title")}
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
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
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {tProfile("personalInfo")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
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

      case "membership":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                Membership
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Manage your membership and subscription
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <MembershipBadge membershipExpiry={session?.user.membershipExpiry || null} />
              {!userIsMember && (
                <div className="mt-6">
                  <a
                    href={`/${locale}/membership`}
                    className="inline-flex rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
                  >
                    Upgrade to Premium
                  </a>
                </div>
              )}
            </div>
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navigation />
      <DashboardSidebar
        role="USER"
        locale={locale}
        userName={session?.user.name || "User"}
        userEmail={session?.user.email || ""}
      />

      <main className="ml-0 pt-20 lg:ml-72">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}

