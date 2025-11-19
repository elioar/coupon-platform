"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import Button from "@/components/Button"
import { useRouter } from "next/navigation";

const formatExpirationDate = (dateString: string, locale: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date)
}


interface Coupon {
  id: string
  title: string
  description: string
  code: string
  discountPercentage: number
  expirationDate: string
  status: string
  imagePath: string | null
  category: {
    id: string
    nameEn: string
    nameEl: string
  }
}

interface Category {
  id: string
  nameEn: string
  nameEl: string
  slug: string
}

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED"

export default function BusinessDashboard() {
  const { data: session, update } = useSession()
  const t = useTranslations("dashboard.business")
  const tProfile = useTranslations("profile")
  const tCouponForm = useTranslations("couponForm")
  const tCommon = useTranslations("common")
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const section = searchParams.get("section") || "overview"

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const [resubmittingCouponId, setResubmittingCouponId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    categoryId: "",
    discountPercentage: 10,
    expirationDate: "",
    imagePath: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Profile data
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    businessVatNumber: "",
    businessDescription: "",
    businessCategories: "",
    businessLocation: "",
    businessWebsite: "",
    businessInstagram: "",
    businessFacebook: "",
    businessTikTok: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponsRes, categoriesRes] = await Promise.all([
          fetch(`/api/coupons?businessId=${session?.user.id}`),
          fetch('/api/categories'),
        ])

        const couponsData = await couponsRes.json()
        const categoriesData = await categoriesRes.json()

        setCoupons(couponsData.coupons || [])
        setCategories(categoriesData.categories || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user.id) {
      fetchData()
    }
  }, [session])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, imagePath: data.url })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expirationDate: new Date(formData.expirationDate).toISOString(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCoupons([data.coupon, ...coupons])
        setShowForm(false)
        setFormData({
          title: "",
          description: "",
          code: "",
          categoryId: "",
          discountPercentage: 10,
          expirationDate: "",
          imagePath: "",
        })
        setMessage({ type: 'success', text: 'Coupon created successfully! Waiting for admin approval.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create coupon' })
      }
    } catch (error) {
      console.error("Error creating coupon:", error)
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id)
    setFormData({
      title: coupon.title,
      description: coupon.description,
      code: coupon.code,
      categoryId: coupon.category.id,
      discountPercentage: coupon.discountPercentage,
      expirationDate: coupon.expirationDate.split('T')[0],
      imagePath: coupon.imagePath || "",
    })
    setShowForm(false)
  }

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCouponId) return

    setSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/coupons/${editingCouponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expirationDate: new Date(formData.expirationDate).toISOString(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCoupons(coupons.map(c => c.id === editingCouponId ? data.coupon : c))
        setEditingCouponId(null)
        setFormData({
          title: "",
          description: "",
          code: "",
          categoryId: "",
          discountPercentage: 10,
          expirationDate: "",
          imagePath: "",
        })
        setMessage({ type: 'success', text: 'Coupon updated successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update coupon' })
      }
    } catch (error) {
      console.error("Error updating coupon:", error)
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleDeleteCoupon = async (couponId: string) => {
    setDeletingCouponId(couponId)
    setMessage(null)

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setCoupons(coupons.filter(c => c.id !== couponId))
        setMessage({ type: 'success', text: 'Coupon deleted successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete coupon' })
      }
    } catch (error) {
      console.error("Error deleting coupon:", error)
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setDeletingCouponId(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleResubmitCoupon = async (couponId: string) => {
    setResubmittingCouponId(couponId)
    setMessage(null)

    try {
      // Update coupon status back to PENDING
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PENDING' }),
      })

      const data = await response.json()

      if (response.ok) {
        setCoupons(coupons.map(c => c.id === couponId ? { ...c, status: 'PENDING' } : c))
        setMessage({ type: 'success', text: 'Coupon resubmitted for approval!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to resubmit coupon' })
      }
    } catch (error) {
      console.error("Error resubmitting coupon:", error)
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setResubmittingCouponId(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const cancelEdit = () => {
    setEditingCouponId(null)
    setFormData({
      title: "",
      description: "",
      code: "",
      categoryId: "",
      discountPercentage: 10,
      expirationDate: "",
      imagePath: "",
    })
  }

  // Fetch profile for profile section
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session || section !== "profile") return

      try {
        const res = await fetch("/api/profile")
        if (!res.ok) throw new Error("Failed to load profile")

        const data = await res.json()
        const profile = data.profile
        
        const parseBusinessMeta = (raw: string | null) => {
          if (!raw) return { raw: "", vatNumber: "", city: "", postalCode: "" }
          try {
            const parsed = JSON.parse(raw)
            return {
              raw: parsed.raw ?? "",
              vatNumber: parsed.vatNumber ?? "",
              city: parsed.city ?? "",
              postalCode: parsed.postalCode ?? "",
            }
          } catch {
            return { raw: raw ?? "", vatNumber: "", city: "", postalCode: "" }
          }
        }

        const meta = parseBusinessMeta(profile.businessDescription ?? null)

        setProfileData({
          name: profile.name ?? "",
          phone: profile.phone ?? "",
          businessVatNumber: meta.vatNumber,
          businessDescription: meta.raw,
          businessCategories: profile.businessCategories[0] ?? "",
          businessLocation: profile.businessLocation ?? "",
          businessWebsite: profile.businessWebsite ?? "",
          businessInstagram: profile.businessInstagram ?? "",
          businessFacebook: profile.businessFacebook ?? "",
          businessTikTok: profile.businessTikTok ?? "",
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
      const categoriesArray = profileData.businessCategories
        ? [profileData.businessCategories.trim()]
        : []

      const payload = {
        name: profileData.name.trim(),
        phone: profileData.phone.trim() || null,
        businessDescription: JSON.stringify({
          raw: profileData.businessDescription.trim(),
          vatNumber: profileData.businessVatNumber.trim(),
        }),
        businessCategories: categoriesArray,
        businessLocation: profileData.businessLocation.trim() || null,
        businessWebsite: profileData.businessWebsite.trim() || null,
        businessInstagram: profileData.businessInstagram.trim() || null,
        businessFacebook: profileData.businessFacebook.trim() || null,
        businessTikTok: profileData.businessTikTok.trim() || null,
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to save")

      setMessage({ type: "success", text: tProfile("success") })
      await update({ name: profileData.name ?? "" })
    } catch (error) {
      console.error(error)
      setMessage({ type: "error", text: tProfile("error") })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const filteredCoupons = filterStatus === "ALL" 
    ? coupons 
    : coupons.filter(c => c.status === filterStatus)

  const stats = {
    total: coupons.length,
    pending: coupons.filter(c => c.status === 'PENDING').length,
    approved: coupons.filter(c => c.status === 'APPROVED').length,
    rejected: coupons.filter(c => c.status === 'REJECTED').length,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
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

            {!loading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Coupons</h3>
                  <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("pending")}</h3>
                  <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-500">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("approved")}</h3>
                  <p className="mt-2 text-4xl font-bold text-green-600 dark:text-green-500">{stats.approved}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("rejected")}</h3>
                  <p className="mt-2 text-4xl font-bold text-red-600 dark:text-red-500">{stats.rejected}</p>
                </div>
              </div>
            )}
          </div>
        )

      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Business Profile</h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">Manage your business information</p>
            </div>

            {message && section === "profile" && (
              <div className={`rounded-xl border p-4 ${
                message.type === 'success' 
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Business Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Business Name</label>
                    <input type="text" required value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                    <textarea rows={3} value={profileData.businessDescription} onChange={(e) => setProfileData({ ...profileData, businessDescription: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
                      <select value={profileData.businessCategories} onChange={(e) => setProfileData({ ...profileData, businessCategories: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{locale === "el" ? category.nameEl : category.nameEn}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Location</label>
                      <input type="text" value={profileData.businessLocation} onChange={(e) => setProfileData({ ...profileData, businessLocation: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Website</label>
                      <input type="url" value={profileData.businessWebsite} onChange={(e) => setProfileData({ ...profileData, businessWebsite: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Instagram</label>
                      <input type="url" value={profileData.businessInstagram} onChange={(e) => setProfileData({ ...profileData, businessInstagram: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-violet-600 px-6 py-2 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">
                  {saving ? tCommon("loading") : tProfile("save")}
                </button>
              </div>
            </form>
          </div>
        )

      case "insights":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Insights</h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">View your business performance</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">Analytics and insights coming soon...</p>
            </div>
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">Configure your business account</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-600 dark:text-zinc-400">Account settings coming soon...</p>
            </div>
          </div>
        )

      case "coupons":
      default:
        // ALL THE EXISTING COUPON MANAGEMENT CODE GOES HERE
        return null // We'll replace this with the actual content
    }
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <DashboardSidebar
        role="BUSINESS"
        locale={locale}
        userName={session?.user.name || "Business"}
        userEmail={session?.user.email || ""}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <DashboardHeader
        userName={session?.user.name || "Business"}
        userEmail={session?.user.email || ""}
        role="BUSINESS"
        locale={locale}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="ml-0 flex-1 overflow-x-hidden pt-16 lg:ml-72">
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
          {/* Overview Section - Just Stats */}
          {section === "overview" && (
            <div className="space-y-5 sm:space-y-6 md:space-y-8">
              {/* Stats Cards */}
              {!loading && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {/* Total Coupons */}
                  <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="absolute right-3 top-3 rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30 sm:right-4 sm:top-4">
                      <svg className="h-4 w-4 text-violet-600 dark:text-violet-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">Total Coupons</h3>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">{stats.total}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">All time</p>
                  </div>

                  {/* Pending */}
                  <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="absolute right-3 top-3 rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30 sm:right-4 sm:top-4">
                      <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">{t("pending")}</h3>
                    <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-500 sm:text-3xl md:text-4xl">{stats.pending}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Awaiting review</p>
                  </div>

                  {/* Approved */}
                  <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="absolute right-3 top-3 rounded-lg bg-green-100 p-2 dark:bg-green-900/30 sm:right-4 sm:top-4">
                      <svg className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">{t("approved")}</h3>
                    <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-500 sm:text-3xl md:text-4xl">{stats.approved}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Active now</p>
                  </div>

                  {/* Rejected */}
                  <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <div className="absolute right-3 top-3 rounded-lg bg-red-100 p-2 dark:bg-red-900/30 sm:right-4 sm:top-4">
                      <svg className="h-4 w-4 text-red-600 dark:text-red-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">{t("rejected")}</h3>
                    <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-500 sm:text-3xl md:text-4xl">{stats.rejected}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Not approved</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {!loading && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:text-lg">Quick Actions</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/${locale}/dashboard/business?section=coupons`}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                    >
                      <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
                        <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Create Coupon</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Add a new discount</p>
                      </div>
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/business?section=insights`}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                    >
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">View Insights</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Analytics & stats</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Section */}
          {section === "profile" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">Business Profile</h1>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">Manage your business information and online presence</p>
                </div>
                <div className="hidden rounded-full bg-violet-100 p-3 dark:bg-violet-900/30 sm:block sm:p-4">
                  <svg className="h-6 w-6 text-violet-600 dark:text-violet-400 sm:h-8 sm:w-8" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Success/Error Message */}
              {message && (
                <div className={`rounded-xl border p-4 ${
                  message.type === 'success' 
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.type === 'success' ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="font-medium">{message.text}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-5 sm:space-y-6">
                {/* Basic Information */}
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="border-b border-zinc-200 bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-4 dark:border-zinc-800 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                        <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                        <p className="text-sm text-violet-100">Essential business details</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4 sm:p-6 sm:space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        placeholder="Your Business Name"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="block w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="+30 123 456 7890"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          AFM (Tax ID) <span className="text-xs font-normal text-zinc-500">(optional)</span>
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={profileData.businessVatNumber}
                            onChange={(e) => setProfileData({ ...profileData, businessVatNumber: e.target.value })}
                            className="block w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="123456789"
                            maxLength={9}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        value={profileData.businessDescription}
                        onChange={(e) => setProfileData({ ...profileData, businessDescription: e.target.value })}
                        className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        placeholder="Tell customers what makes your business special..."
                        maxLength={500}
                      />
                      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {profileData.businessDescription.length}/500 characters
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Category
                        </label>
                        <select
                          value={profileData.businessCategories}
                          onChange={(e) => setProfileData({ ...profileData, businessCategories: e.target.value })}
                          className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {locale === "el" ? category.nameEl : category.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Location
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={profileData.businessLocation}
                            onChange={(e) => setProfileData({ ...profileData, businessLocation: e.target.value })}
                            className="block w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="City, Country"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Online Presence & Social Media */}
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="border-b border-zinc-200 bg-gradient-to-r from-blue-500 to-cyan-600 px-5 py-4 dark:border-zinc-800 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                        <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Online Presence</h2>
                        <p className="text-sm text-blue-100">Connect your website and social media</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4 sm:p-6 sm:space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Website
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <svg className="h-5 w-5 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </div>
                        <input
                          type="url"
                          value={profileData.businessWebsite}
                          onChange={(e) => setProfileData({ ...profileData, businessWebsite: e.target.value })}
                          className="block w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Instagram
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={profileData.businessInstagram}
                            onChange={(e) => setProfileData({ ...profileData, businessInstagram: e.target.value })}
                            className="block w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="instagram.com/..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Facebook
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={profileData.businessFacebook}
                            onChange={(e) => setProfileData({ ...profileData, businessFacebook: e.target.value })}
                            className="block w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="facebook.com/..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          TikTok
                        </label>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-zinc-800 dark:text-zinc-200" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={profileData.businessTikTok}
                            onChange={(e) => setProfileData({ ...profileData, businessTikTok: e.target.value })}
                            className="block w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="tiktok.com/@..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-r from-violet-50 to-purple-50 p-5 dark:border-zinc-800 dark:from-violet-900/20 dark:to-purple-900/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-violet-100 p-1.5 dark:bg-violet-900/30">
                      <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        Ready to save your changes?
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                        Make sure all information is accurate before saving
                      </p>
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full min-w-[140px] sm:w-auto">
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{tProfile("save")}</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Insights Section */}
          {section === "insights" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Insights</h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">View your business performance</p>
              </div>

              {/* Performance Metrics */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Coupons</p>
                      <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats.total}</p>
                    </div>
                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Approved</p>
                      <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-500">{stats.approved}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Pending Review</p>
                      <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-500">{stats.pending}</p>
                      <p className="mt-1 text-xs text-zinc-500">Awaiting approval</p>
                    </div>
                    <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                      <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Coupon Status Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Approved</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                        {stats.approved} ({stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pending</span>
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-500">
                        {stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div 
                        className="h-full bg-amber-500" 
                        style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rejected</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-500">
                        {stats.rejected} ({stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div 
                        className="h-full bg-red-500" 
                        style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Tips to Improve Performance
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Create compelling coupon titles and descriptions to attract more users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Upload high-quality images to make your coupons stand out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Offer competitive discount percentages to increase engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Keep your business profile updated with accurate information</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {section === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">Configure your business account</p>
              </div>

              {/* Account Information */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{session?.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Account Type</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Business Account</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Business Name</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{session?.user.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Notifications</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Receive updates about your coupons</p>
                    </div>
                    <div className="text-sm text-zinc-500">Coming soon</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Coupon Approval Alerts</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Get notified when coupons are approved/rejected</p>
                    </div>
                    <div className="text-sm text-zinc-500">Coming soon</div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                <h3 className="mb-4 text-lg font-semibold text-red-900 dark:text-red-100">Danger Zone</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Delete Account</p>
                      <p className="text-xs text-red-700 dark:text-red-300">Permanently delete your business account and all data</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => alert("Account deletion feature coming soon. Please contact support.")}
                      className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coupons Section - Default, shows all existing coupon management */}
          {section === "coupons" && (
            <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                Welcome back, {session?.user.name}!
              </p>
            </div>
            <Button 
              onClick={() => {
                setShowForm(!showForm)
                setEditingCouponId(null)
                setFormData({
                  title: "",
                  description: "",
                  code: "",
                  categoryId: "",
                  discountPercentage: 10,
                  expirationDate: "",
                  imagePath: "",
                })
              }}
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                {showForm ? tCommon("cancel") : t("createCoupon")}
              </div>
            </Button>
          </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 rounded-xl border p-4 ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Statistics Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Coupons */}
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="absolute right-4 top-4 rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Coupons
                </h3>
                <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.total}
                </p>
              </div>

              {/* Pending */}
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="absolute right-4 top-4 rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("pending")}
                </h3>
                <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-500">
                  {stats.pending}
                </p>
              </div>

              {/* Approved */}
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="absolute right-4 top-4 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("approved")}
                </h3>
                <p className="mt-2 text-4xl font-bold text-green-600 dark:text-green-500">
                  {stats.approved}
                </p>
              </div>

              {/* Rejected */}
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="absolute right-4 top-4 rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("rejected")}
                </h3>
                <p className="mt-2 text-4xl font-bold text-red-600 dark:text-red-500">
                  {stats.rejected}
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-1 p-1">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      filterStatus === status
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {status === "ALL" ? "All Coupons" : t(status.toLowerCase())}
                    {status !== "ALL" && (
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                        filterStatus === status
                          ? "bg-white/20"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                        {stats[status.toLowerCase() as keyof typeof stats]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Create Coupon Form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-900/10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {t("createCoupon")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tCouponForm("title")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tCouponForm("description")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("code")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("category")}
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {locale === "el" ? category.nameEl : category.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("discountPercentage")}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("expirationDate")}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tCouponForm("image")} (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="mt-1 block w-full text-sm text-zinc-900 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100 dark:text-zinc-100 dark:file:bg-violet-900/30 dark:file:text-violet-300"
                />
                {uploadingImage && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {tCommon("loading")}...
                  </p>
                )}
                {formData.imagePath && (
                  <div className="mt-2">
                    <img
                      src={formData.imagePath}
                      alt="Preview"
                      className="h-32 w-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={submitting || uploadingImage}>
                {submitting ? tCommon("loading") : tCouponForm("submit")}
              </Button>
            </form>
          </div>
        )}

        {/* Edit Coupon Form */}
        {editingCouponId && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800 dark:bg-amber-900/10">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Edit Coupon
            </h2>
            <form onSubmit={handleUpdateCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tCouponForm("title")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tCouponForm("description")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("code")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("category")}
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {locale === "el" ? category.nameEl : category.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("discountPercentage")}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tCouponForm("expirationDate")}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tCouponForm("image")} (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="mt-1 block w-full text-sm text-zinc-900 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-100 dark:text-zinc-100 dark:file:bg-amber-900/30 dark:file:text-amber-300"
                />
                {uploadingImage && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {tCommon("loading")}...
                  </p>
                )}
                {formData.imagePath && (
                  <div className="mt-2">
                    <img
                      src={formData.imagePath}
                      alt="Preview"
                      className="h-32 w-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || uploadingImage}>
                  {submitting ? tCommon("loading") : tCommon("save")}
                </Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  {tCommon("cancel")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="text-zinc-600 dark:text-zinc-400">{tCommon("loading")}</p>
            </div>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-16 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg className="h-8 w-8 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {filterStatus === "ALL" ? "No coupons yet" : `No ${filterStatus.toLowerCase()} coupons`}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {filterStatus === "ALL" && "Create your first coupon to get started!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`rounded-xl border bg-white p-6 shadow-sm transition dark:bg-zinc-900 ${
                  editingCouponId === coupon.id
                    ? 'border-amber-300 ring-2 ring-amber-200 dark:border-amber-700 dark:ring-amber-900/30'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex gap-6">
                  {/* Image */}
                  {coupon.imagePath && (
                    <div className="hidden sm:block">
                      <img
                        src={coupon.imagePath}
                        alt={coupon.title}
                        className="h-32 w-48 rounded-lg object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            {coupon.title}
                          </h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(coupon.status)}`}>
                            {t(coupon.status.toLowerCase())}
                          </span>
                        </div>
                        <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
                          {coupon.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                            <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Code: <strong>{coupon.code}</strong>
                          </span>
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                            {coupon.discountPercentage}% OFF
                          </span>
                          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                            <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Expires: {formatExpirationDate(coupon.expirationDate, locale)}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {locale === "el" ? coupon.category.nameEl : coupon.category.nameEn}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        {(coupon.status === "PENDING" || coupon.status === "APPROVED") && (
                          <button
                            onClick={() => handleEditCoupon(coupon)}
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            title="Edit coupon"
                          >
                            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}

                        {coupon.status === "REJECTED" && (
                          <>
                            <button
                              onClick={() => handleEditCoupon(coupon)}
                              className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              title="Edit and resubmit"
                            >
                              <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleResubmitCoupon(coupon.id)}
                              disabled={resubmittingCouponId === coupon.id}
                              className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/30"
                              title="Resubmit for approval"
                            >
                              {resubmittingCouponId === coupon.id ? (
                                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${coupon.title}"?`)) {
                              handleDeleteCoupon(coupon.id)
                            }
                          }}
                          disabled={deletingCouponId === coupon.id}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Delete coupon"
                        >
                          {deletingCouponId === coupon.id ? (
                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

