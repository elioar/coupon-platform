"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import Button from "@/components/Button"
import { useRouter } from "next/navigation"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AnimatePresence, motion } from 'framer-motion'

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
  createdAt: string
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
  
  // Debug: Log section to verify it's being read correctly
  useEffect(() => {
    console.log("Current section:", section)
  }, [section])

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForm) {
        setShowForm(false)
      }
    }
    if (showForm) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showForm])
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const [resubmittingCouponId, setResubmittingCouponId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formErrors, setFormErrors] = useState<{
    title?: string
    description?: string
    code?: string
    categoryId?: string
    discountPercentage?: string
    expirationDate?: string
  }>({})
  
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

  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")

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

  const validateForm = () => {
    const errors: typeof formErrors = {}

    if (!formData.title || formData.title.trim() === '') {
      errors.title = 'Title is required'
    } else if (formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters'
    }

    if (!formData.description || formData.description.trim() === '') {
      errors.description = 'Description is required'
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters'
    }

    if (!formData.code || formData.code.trim() === '') {
      errors.code = 'Coupon code is required'
    } else if (formData.code.trim().length < 2) {
      errors.code = 'Coupon code must be at least 2 characters'
    }

    if (!formData.categoryId || formData.categoryId === '') {
      errors.categoryId = 'Please select a category'
    }

    if (!formData.discountPercentage || formData.discountPercentage < 1) {
      errors.discountPercentage = 'Discount must be at least 1%'
    } else if (formData.discountPercentage > 100) {
      errors.discountPercentage = 'Discount cannot exceed 100%'
    }

    if (!formData.expirationDate) {
      errors.expirationDate = 'Expiration date is required'
    } else {
      const selectedDate = new Date(formData.expirationDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.expirationDate = 'Expiration date must be in the future'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setFormErrors({})

    // Validate form
    if (!validateForm()) {
      setSubmitting(false)
      setMessage({ type: 'error', text: 'Please fix the errors in the form before submitting.' })
      return
    }

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

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (section !== "insights" || !session?.user?.id) {
        setAnalyticsLoading(false)
        return
      }
      setAnalyticsLoading(true)
      try {
        const response = await fetch(`/api/business/analytics?period=${dateRange}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        } else {
          console.error("Failed to fetch analytics")
          setAnalytics(null)
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
        setAnalytics(null)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetchAnalytics()
  }, [section, dateRange, session?.user?.id])

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

  // Skeleton Loader Components
  const OverviewSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-gray-100 dark:bg-zinc-800 p-6">
            <div className="h-3 w-24 bg-gray-300 dark:bg-zinc-700 rounded mb-4"></div>
            <div className="h-8 w-16 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
            <div className="h-3 w-20 bg-gray-300 dark:bg-zinc-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="h-10 w-10 bg-gray-200 dark:bg-zinc-700 rounded-lg mb-4"></div>
            <div className="h-5 w-24 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Status Overview Skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="h-6 w-40 bg-gray-300 dark:bg-zinc-700 rounded mb-6"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Recent Coupons Skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="h-6 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-200 dark:border-zinc-800 last:border-0">
            <div className="h-12 w-12 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
              <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  )

  const InsightsSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="h-4 w-20 bg-gray-300 dark:bg-zinc-700 rounded mb-3"></div>
            <div className="h-8 w-24 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
            <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="h-6 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-6"></div>
          <div className="h-64 bg-gray-100 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="h-6 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-6"></div>
          <div className="h-64 bg-gray-100 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>

      {/* Top Coupons & Category Stats Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="h-6 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-zinc-800 last:border-0">
              <div className="h-4 w-32 bg-gray-300 dark:bg-zinc-700 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="h-6 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-zinc-800 last:border-0">
              <div className="h-4 w-24 bg-gray-300 dark:bg-zinc-700 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const CouponsListSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <div className="flex gap-4">
            <div className="h-20 w-20 bg-gray-200 dark:bg-zinc-700 rounded-lg flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-5 w-48 bg-gray-300 dark:bg-zinc-700 rounded mb-3"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
                <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-700 rounded"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-zinc-700 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const CouponsStatsSkeleton = () => (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-gray-100 dark:bg-zinc-800 p-6">
          <div className="h-3 w-16 bg-gray-300 dark:bg-zinc-700 rounded mb-4"></div>
          <div className="h-8 w-12 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
          <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        </div>
      ))}
    </div>
  )

  const renderSection = () => {
    switch (section) {
      case "overview":
        const recentCoupons = coupons.slice(0, 5).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0
        
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Welcome back, {session?.user.name?.split(' ')[0]}!
              </h1>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-zinc-400">
                  Here's what's happening with your coupons
                </p>
              </div>
              <Link
                href={`/${locale}/dashboard/business?section=coupons`}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
              >
                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Create Coupon
              </Link>
            </div>

            {loading ? (
              <OverviewSkeleton />
            ) : (
              <>
                {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-white p-6 transition hover:shadow-md dark:from-violet-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-200/50 blur-2xl dark:bg-violet-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">Total Coupons</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">{stats.total}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">All time</p>
                </div>
                </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-white p-6 transition hover:shadow-md dark:from-amber-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-200/50 blur-2xl dark:bg-amber-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">{t("pending")}</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{stats.pending}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Awaiting review</p>
                </div>
                </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">{t("approved")}</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">{stats.approved}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Active now</p>
              </div>
          </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 transition hover:shadow-md dark:from-blue-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-200/50 blur-2xl dark:bg-blue-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">Approval Rate</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{approvalRate}%</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Success rate</p>
            </div>
              </div>
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Quick Actions */}
                  <div className="lg:col-span-2">
                    <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                      <h2 className="mb-6 text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/${locale}/dashboard/business?section=coupons`}
                          className="group flex items-center gap-3 rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                            <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 4v16m8-8H4" />
                            </svg>
                  </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Create Coupon</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Add a new discount</p>
                  </div>
                        </Link>
                        <Link
                          href={`/${locale}/dashboard/business?section=insights`}
                          className="group flex items-center gap-3 rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                    </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">View Analytics</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">See performance metrics</p>
                    </div>
                        </Link>
                        <Link
                          href={`/${locale}/dashboard/business?section=profile`}
                          className="group flex items-center gap-3 rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                            <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                    </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Edit Profile</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Update business info</p>
                    </div>
                        </Link>
                        <Link
                          href={`/${locale}/dashboard/business?section=coupons`}
                          className="group flex items-center gap-3 rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                  </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Coupons</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">View all coupons</p>
                </div>
                        </Link>
              </div>
              </div>
          </div>

                  {/* Status Overview */}
                  <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                    <h2 className="mb-6 text-base font-semibold text-gray-900 dark:text-white">Status Overview</h2>
                    <div className="space-y-4">
            <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-zinc-400">Approved</span>
                          <span className="font-medium text-gray-900 dark:text-white">{stats.approved}</span>
            </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                          <div 
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                          ></div>
            </div>
          </div>
            <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-zinc-400">Pending</span>
                          <span className="font-medium text-gray-900 dark:text-white">{stats.pending}</span>
            </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                          <div 
                            className="h-full rounded-full bg-amber-500 transition-all"
                            style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                          ></div>
            </div>
          </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-zinc-400">Rejected</span>
                          <span className="font-medium text-gray-900 dark:text-white">{stats.rejected}</span>
                    </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                          <div 
                            className="h-full rounded-full bg-red-500 transition-all"
                            style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                          ></div>
                  </div>
                    </div>
                  </div>
                    </div>
                  </div>

                {/* Recent Coupons */}
                {recentCoupons.length > 0 && (
                  <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Coupons</h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Your latest coupon activity</p>
                    </div>
                    <Link
                      href={`/${locale}/dashboard/business?section=coupons`}
                        className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                      >
                        View all →
                    </Link>
                    </div>
                    <div className="space-y-2">
                      {recentCoupons.map((coupon) => (
                    <Link
                          key={coupon.id}
                          href={`/${locale}/dashboard/business?section=coupons`}
                          className="group flex items-center justify-between rounded-xl bg-gray-50/50 p-4 transition hover:bg-gray-100/50 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">{coupon.title}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                coupon.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                coupon.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {t(coupon.status.toLowerCase())}
                              </span>
                      </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                              {new Date(coupon.createdAt).toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{coupon.discountPercentage}% OFF</span>
                            <svg className="h-4 w-4 text-gray-400 transition group-hover:text-gray-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                      </div>
                    </Link>
                      ))}
                  </div>
                </div>
              )}
              </>
          )}
          </div>
        )

      case "profile":
        return (
            <div className="space-y-6">
              {/* Header */}
                <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Profile</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Manage your business information and contact details</p>
              </div>

            {/* Message */}
            {message && section === "profile" && (
              <div className={`rounded-2xl border p-4 shadow-sm ${
                  message.type === 'success' 
                  ? 'border-green-200/50 bg-gradient-to-br from-green-50 to-green-50/50 text-green-800 dark:border-green-800/50 dark:from-green-900/30 dark:to-green-900/20 dark:text-green-300'
                  : 'border-red-200/50 bg-gradient-to-br from-red-50 to-red-50/50 text-red-800 dark:border-red-800/50 dark:from-red-900/30 dark:to-red-900/20 dark:text-red-300'
                }`}>
                <div className="flex items-start gap-3">
                    {message.type === 'success' ? (
                    <div className="flex-shrink-0 rounded-full bg-green-100 p-1 dark:bg-green-900/50">
                      <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    ) : (
                    <div className="flex-shrink-0 rounded-full bg-red-100 p-1 dark:bg-red-900/50">
                      <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    )}
                  <p className="text-sm font-medium flex-1 leading-relaxed">{message.text}</p>
                  </div>
                </div>
              )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Basic Information */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-gray-200 bg-gradient-to-r from-violet-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-900">
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25 dark:from-violet-600 dark:to-violet-700">
                      <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Basic Information</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Essential business details</p>
                      </div>
                    </div>
                  </div>
                <div className="p-6 space-y-5">
                    <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Enter your business name"
                      className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                      />
                    </div>
                      <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Description</label>
                      <textarea
                        rows={4}
                        value={profileData.businessDescription}
                        onChange={(e) => setProfileData({ ...profileData, businessDescription: e.target.value })}
                      placeholder="Describe your business, services, and what makes you unique..."
                      className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800 resize-none" 
                      />
                    </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Category</label>
                        <select
                          value={profileData.businessCategories}
                          onChange={(e) => setProfileData({ ...profileData, businessCategories: e.target.value })}
                        className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 pr-10 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800 appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundSize: '1.5rem',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat'
                        }}
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                          <option key={category.id} value={category.id}>{locale === "el" ? category.nameEl : category.nameEn}</option>
                          ))}
                        </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Location</label>
                      <input 
                        type="text" 
                        value={profileData.businessLocation} 
                        onChange={(e) => setProfileData({ ...profileData, businessLocation: e.target.value })}
                        placeholder="e.g., Athens, Greece"
                        className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                      />
                    </div>
                  </div>
                </div>
                      </div>

              {/* Contact Information */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-blue-950/20 dark:to-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 dark:from-blue-600 dark:to-blue-700">
                      <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                      <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contact Information</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Phone, VAT, and location details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Phone / Mobile</label>
                        <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <svg className="h-5 w-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input 
                          type="tel" 
                          value={profileData.phone} 
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="+30 123 456 7890"
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">VAT Number</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <svg className="h-5 w-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                          value={profileData.businessVatNumber} 
                          onChange={(e) => setProfileData({ ...profileData, businessVatNumber: e.target.value })}
                          placeholder="EL123456789"
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Social Media & Website */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-pink-950/20 dark:to-zinc-900">
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/25 dark:from-pink-600 dark:to-pink-700">
                      <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Social Media & Website</h2>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Connect your online presence</p>
                      </div>
                    </div>
                  </div>
                <div className="p-6 space-y-5">
                    <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Website</label>
                      <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <svg className="h-5 w-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </div>
                        <input
                          type="url"
                          value={profileData.businessWebsite}
                          onChange={(e) => setProfileData({ ...profileData, businessWebsite: e.target.value })}
                        placeholder="https://www.example.com"
                        className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                        />
                      </div>
                    </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                      <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Instagram</label>
                        <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={profileData.businessInstagram}
                            onChange={(e) => setProfileData({ ...profileData, businessInstagram: e.target.value })}
                          placeholder="https://instagram.com/yourbusiness"
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                          />
                        </div>
                      </div>
                      <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Facebook</label>
                        <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={profileData.businessFacebook}
                            onChange={(e) => setProfileData({ ...profileData, businessFacebook: e.target.value })}
                          placeholder="https://facebook.com/yourbusiness"
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                          />
                        </div>
                      </div>
                      <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">TikTok</label>
                        <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <svg className="h-5 w-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.89 2.89 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={profileData.businessTikTok}
                            onChange={(e) => setProfileData({ ...profileData, businessTikTok: e.target.value })}
                          placeholder="https://tiktok.com/@yourbusiness"
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <button 
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:from-violet-700 hover:to-violet-800 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:from-violet-500 dark:to-violet-600 dark:hover:from-violet-600 dark:hover:to-violet-700"
                >
                    {saving ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                    </>
                    ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{tProfile("save")}</span>
                    </>
                    )}
                </button>
                </div>
              </form>
            </div>
        )

      case "insights":
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Analytics</h1>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-zinc-400">Track your coupon performance</p>
            </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="rounded-lg border-0 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:bg-zinc-800"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              </div>

            {analyticsLoading ? (
              <InsightsSkeleton />
            ) : analytics ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 transition hover:shadow-md dark:from-zinc-900/50 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gray-200/50 blur-2xl dark:bg-zinc-700/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400">Views</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {analytics.summary?.views?.toLocaleString() || 0}
                      </p>
                  </div>
                </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 transition hover:shadow-md dark:from-blue-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-200/50 blur-2xl dark:bg-blue-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">Clicks</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                        {analytics.summary?.clicks?.toLocaleString() || 0}
                      </p>
                    </div>
                    </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">Redemptions</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
                        {analytics.summary?.redemptions?.toLocaleString() || 0}
                      </p>
                  </div>
                </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-white p-6 transition hover:shadow-md dark:from-violet-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-200/50 blur-2xl dark:bg-violet-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">Conversion</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                        {analytics.summary?.overallConversion?.toFixed(1) || 0}%
                      </p>
                  </div>
                </div>
              </div>

                {/* Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Daily Activity Chart */}
                  <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Daily Activity</h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Views, clicks, and redemptions over time</p>
                    </div>
                    {analytics.dailyData && analytics.dailyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={analytics.dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-gray-400 dark:text-zinc-500"
                            tickFormatter={(value) => {
                              const date = new Date(value)
                              return `${date.getMonth() + 1}/${date.getDate()}`
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-gray-400 dark:text-zinc-500"
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                            iconType="line"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="views" 
                            stroke="#8b5cf6" 
                            strokeWidth={2.5} 
                            name="Views"
                            dot={false}
                            activeDot={{ r: 5, fill: '#8b5cf6' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="clicks" 
                            stroke="#3b82f6" 
                            strokeWidth={2.5} 
                            name="Clicks"
                            dot={false}
                            activeDot={{ r: 5, fill: '#3b82f6' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="redemptions" 
                            stroke="#10b981" 
                            strokeWidth={2.5} 
                            name="Redemptions"
                            dot={false}
                            activeDot={{ r: 5, fill: '#10b981' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-800/30">
                        <p className="text-sm text-gray-400 dark:text-zinc-500">No data available</p>
                    </div>
                    )}
                  </div>

                  {/* Top Performing Coupons */}
                  <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top Coupons</h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Best performing by engagement</p>
                    </div>
                    {analytics.topCoupons && analytics.topCoupons.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={analytics.topCoupons} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                          <XAxis 
                            dataKey="title" 
                            tick={{ fontSize: 10, fill: 'currentColor' }}
                            className="text-gray-400 dark:text-zinc-500"
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            interval={0}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: 'currentColor' }}
                            className="text-gray-400 dark:text-zinc-500"
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              padding: '12px'
                            }}
                            labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                          />
                          <Bar dataKey="views" fill="#8b5cf6" name="Views" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="redemptions" fill="#10b981" name="Redemptions" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[280px] items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-800/30">
                        <p className="text-sm text-gray-400 dark:text-zinc-500">No coupon data available</p>
                      </div>
                    )}
                    </div>
                  </div>

                {/* Conversion Rates */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50/50 to-white p-5 dark:from-blue-950/20 dark:to-zinc-800/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">Click Rate</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                      {analytics.summary?.clickThroughRate?.toFixed(1) || 0}%
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Clicks per view</p>
                    </div>
                  <div className="rounded-2xl bg-gradient-to-br from-green-50/50 to-white p-5 dark:from-green-950/20 dark:to-zinc-800/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">Redemption Rate</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                      {analytics.summary?.redemptionRate?.toFixed(1) || 0}%
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Redemptions per click</p>
                    </div>
                  <div className="rounded-2xl bg-gradient-to-br from-violet-50/50 to-white p-5 dark:from-violet-950/20 dark:to-zinc-800/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">Overall</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                      {analytics.summary?.overallConversion?.toFixed(1) || 0}%
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Redemptions per view</p>
                </div>
              </div>

                {/* Top Coupons Breakdown */}
                {analytics.topCoupons && analytics.topCoupons.length > 0 && (
                  <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top Performers</h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Detailed breakdown of your best coupons</p>
              </div>
                    <div className="space-y-2">
                      {analytics.topCoupons.slice(0, 5).map((coupon: any, index: number) => (
                        <div key={coupon.id || index} className="group flex items-center justify-between rounded-xl bg-gray-50/50 p-4 transition hover:bg-gray-100/50 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50">
                          <div className="flex-1 min-w-0">
                            <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">{coupon.title}</h4>
                            <div className="mt-1.5 flex gap-3 text-xs text-gray-500 dark:text-zinc-400">
                              <span>{coupon.views || 0} views</span>
                              <span>•</span>
                              <span>{coupon.clicks || 0} clicks</span>
                              <span>•</span>
                              <span>{coupon.redemptions || 0} redeemed</span>
            </div>
              </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                              {coupon.views > 0 ? ((coupon.redemptions / coupon.views) * 100).toFixed(1) : 0}%
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">conv.</p>
                    </div>
                  </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl bg-white p-12 dark:bg-zinc-900/50">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                    <svg className="h-8 w-8 text-gray-400 dark:text-zinc-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">No analytics data</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Analytics will appear once you have coupon activity</p>
                  </div>
                </div>
            )}
              </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Manage your account preferences and security</p>
            </div>

            {/* Business Profile Link */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-gray-200 bg-gradient-to-r from-violet-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25 dark:from-violet-600 dark:to-violet-700">
                    <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Business Profile</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Manage your business information</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <Link
                  href={`/${locale}/dashboard/business?section=profile`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:from-violet-700 hover:to-violet-800 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] dark:from-violet-500 dark:to-violet-600 dark:hover:from-violet-600 dark:hover:to-violet-700"
                >
                  <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Business Profile</span>
                </Link>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-blue-950/20 dark:to-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 dark:from-blue-600 dark:to-blue-700">
                    <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Control how you receive updates</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Coupon Status Updates</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Get notified when your coupons are approved or rejected</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-violet-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:bg-zinc-700 dark:peer-focus:ring-violet-800 dark:peer-checked:bg-violet-500"></div>
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 dark:bg-zinc-300"></span>
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Analytics Reports</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Weekly summary of your coupon performance</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-violet-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:bg-zinc-700 dark:peer-focus:ring-violet-800 dark:peer-checked:bg-violet-500"></div>
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 dark:bg-zinc-300"></span>
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Expiration Reminders</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Get notified before your coupons expire</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-violet-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:bg-zinc-700 dark:peer-focus:ring-violet-800 dark:peer-checked:bg-violet-500"></div>
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 dark:bg-zinc-300"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Data & Export */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-amber-950/20 dark:to-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 dark:from-amber-600 dark:to-amber-700">
                    <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Data & Export</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Download your business data</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <button
                  className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setMessage({ type: 'error', text: 'Data export feature coming soon.' })
                    setTimeout(() => setMessage(null), 5000)
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export Business Data (CSV)</span>
                  </div>
                </button>
                <button
                  className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setMessage({ type: 'error', text: 'Analytics export feature coming soon.' })
                    setTimeout(() => setMessage(null), 5000)
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Export Analytics Report (PDF)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="overflow-hidden rounded-2xl border-2 border-red-200 bg-white shadow-sm dark:border-red-800 dark:bg-zinc-900">
              <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-white px-6 py-4 dark:border-red-800 dark:from-red-950/20 dark:to-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/25 dark:from-red-600 dark:to-red-700">
                    <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-red-900 dark:text-red-300">Danger Zone</h2>
                    <p className="text-xs text-red-600 dark:text-red-400">Irreversible and destructive actions</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/10">
                  <p className="mb-3 text-sm font-semibold text-red-900 dark:text-red-300">Delete Account</p>
                  <p className="mb-4 text-xs text-red-700 dark:text-red-400">Once you delete your account, there is no going back. Please be certain.</p>
                  <button
                    className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => {
                      setMessage({ type: 'error', text: 'Account deletion feature coming soon. Please contact support for assistance.' })
                      setTimeout(() => setMessage(null), 5000)
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1] 
              }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {section === "coupons" && (
              <motion.div
                key="coupons-extra"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.1
                }}
              >
                {loading ? (
                  <CouponsStatsSkeleton />
                ) : (
                  <>
                    {/* Statistics Cards */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Total Coupons */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-white p-6 transition hover:shadow-md dark:from-violet-950/20 dark:to-zinc-800/30">
                  <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-200/50 blur-2xl dark:bg-violet-900/30"></div>
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">Total</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                      {stats.total}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">All coupons</p>
                  </div>
                  </div>

                  {/* Pending */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-white p-6 transition hover:shadow-md dark:from-amber-950/20 dark:to-zinc-800/30">
                  <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-200/50 blur-2xl dark:bg-amber-900/30"></div>
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">{t("pending")}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                      {stats.pending}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Awaiting review</p>
                </div>
              </div>

                  {/* Approved */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                  <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">{t("approved")}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
                      {stats.approved}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Active now</p>
                    </div>
                  </div>

                  {/* Rejected */}
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-white p-6 transition hover:shadow-md dark:from-red-950/20 dark:to-zinc-800/30">
                  <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-red-200/50 blur-2xl dark:bg-red-900/30"></div>
                  <div className="relative">
                    <p className="text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400">{t("rejected")}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                      {stats.rejected}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">Not approved</p>
                </div>
              </div>
            </div>
                  </>
                )}

            {/* Header with Create Button */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Coupons</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Manage your discount offers</p>
            </div>
              <button
              onClick={() => {
                  setShowForm(true)
                setEditingCouponId(null)
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
              >
                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                {t("createCoupon")}
              </button>
          </div>

            {/* Create Coupon Modal */}
            {showForm && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowForm(false)
                  }
                }}
              >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity dark:bg-black/80"></div>
                
                {/* Modal */}
                <div className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl flex flex-col bg-white shadow-2xl dark:bg-zinc-900 overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
                  {/* Header */}
                  <div className="relative flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-br from-violet-50 via-violet-50/50 to-white px-4 py-4 sm:px-6 sm:py-5 dark:border-zinc-800 dark:from-violet-950/30 dark:via-violet-950/20 dark:to-zinc-900">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25 dark:from-violet-600 dark:to-violet-700">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Create New Coupon</h3>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 truncate">Add a new discount offer to your business</p>
              </div>
                  </div>
                    <button
                      onClick={() => setShowForm(false)}
                      className="ml-2 flex-shrink-0 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 touch-manipulation"
                      aria-label="Close modal"
                    >
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                    </button>
              </div>

                  {/* Form Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {/* Error/Success Message */}
              {message && (
                      <div className={`mx-4 sm:mx-6 mt-4 sm:mt-6 rounded-2xl border p-4 shadow-sm ${
                  message.type === 'success' 
                          ? 'border-green-200/50 bg-gradient-to-br from-green-50 to-green-50/50 text-green-800 dark:border-green-800/50 dark:from-green-900/30 dark:to-green-900/20 dark:text-green-300'
                          : 'border-red-200/50 bg-gradient-to-br from-red-50 to-red-50/50 text-red-800 dark:border-red-800/50 dark:from-red-900/30 dark:to-red-900/20 dark:text-red-300'
                }`}>
                        <div className="flex items-start gap-3">
                    {message.type === 'success' ? (
                            <div className="flex-shrink-0 rounded-full bg-green-100 p-1 dark:bg-green-900/50">
                              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                    ) : (
                            <div className="flex-shrink-0 rounded-full bg-red-100 p-1 dark:bg-red-900/50">
                              <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                    )}
                          <p className="text-sm font-medium flex-1 leading-relaxed">{message.text}</p>
              </div>
            </div>
              )}

                    <form id="create-coupon-form" onSubmit={handleSubmit} className="p-4 sm:p-6">
                      {/* Basic Information Section */}
                      <div className="mb-6 sm:mb-8">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-zinc-700"></div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-2">Basic Information</h4>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-zinc-700"></div>
                      </div>
                        <div className="space-y-4 sm:space-y-5">
              <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {tCouponForm("title")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                              onChange={(e) => {
                                setFormData({ ...formData, title: e.target.value })
                                if (formErrors.title) {
                                  setFormErrors({ ...formErrors, title: undefined })
                                }
                              }}
                              placeholder="e.g., Summer Sale 2024"
                              className={`block w-full rounded-2xl border-0 px-4 py-3.5 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 touch-manipulation ${
                                formErrors.title 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                  : 'bg-gray-50/80 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.title && (
                              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formErrors.title}
                              </p>
                            )}
              </div>

              <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {tCouponForm("description")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                              rows={4}
                  value={formData.description}
                              onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value })
                                if (formErrors.description) {
                                  setFormErrors({ ...formErrors, description: undefined })
                                }
                              }}
                              placeholder="Describe your coupon offer in detail..."
                              className={`block w-full rounded-2xl border-0 px-4 py-3.5 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 resize-none touch-manipulation ${
                                formErrors.description 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                  : 'bg-gray-50/80 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.description && (
                              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                                {formErrors.description}
                              </p>
                            )}
                          </div>
                        </div>
              </div>

                      {/* Coupon Details Section */}
                      <div className="mb-6 sm:mb-8">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-zinc-700"></div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-2">Coupon Details</h4>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-zinc-700"></div>
                        </div>
                        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {tCouponForm("code")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                              onChange={(e) => {
                                setFormData({ ...formData, code: e.target.value })
                                if (formErrors.code) {
                                  setFormErrors({ ...formErrors, code: undefined })
                                }
                              }}
                              placeholder="SAVE20"
                              className={`block w-full rounded-2xl border-0 px-4 py-3.5 text-base font-semibold text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 touch-manipulation ${
                                formErrors.code 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                  : 'bg-gray-50/80 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.code && (
                              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formErrors.code}
                              </p>
                            )}
                </div>

                <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {tCouponForm("category")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                              onChange={(e) => {
                                setFormData({ ...formData, categoryId: e.target.value })
                                if (formErrors.categoryId) {
                                  setFormErrors({ ...formErrors, categoryId: undefined })
                                }
                              }}
                              className={`block w-full rounded-2xl border-0 px-4 py-3.5 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 touch-manipulation appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>')] bg-[length:1.5rem] bg-[right_0.75rem_center] bg-no-repeat ${
                                formErrors.categoryId 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                  : 'bg-gray-50/80 dark:bg-zinc-800/50'
                              }`}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {locale === "el" ? category.nameEl : category.nameEn}
                      </option>
                    ))}
                  </select>
                            {formErrors.categoryId && (
                              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formErrors.categoryId}
                              </p>
                            )}
              </div>

                <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {tCouponForm("discountPercentage")} <span className="text-red-500">*</span>
                  </label>
                        <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                                onChange={(e) => {
                                  setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })
                                  if (formErrors.discountPercentage) {
                                    setFormErrors({ ...formErrors, discountPercentage: undefined })
                                  }
                                }}
                                placeholder="20"
                                className={`block w-full rounded-2xl border-0 px-4 py-3.5 pr-12 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 touch-manipulation ${
                                  formErrors.discountPercentage 
                                    ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                    : 'bg-gray-50/80 dark:bg-zinc-800/50'
                                }`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-violet-600 dark:text-violet-400 pointer-events-none">%</span>
                        </div>
                            {formErrors.discountPercentage && (
                              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                                {formErrors.discountPercentage}
                              </p>
                            )}
                </div>

                <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {tCouponForm("expirationDate")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate}
                              onChange={(e) => {
                                setFormData({ ...formData, expirationDate: e.target.value })
                                if (formErrors.expirationDate) {
                                  setFormErrors({ ...formErrors, expirationDate: undefined })
                                }
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className={`block w-full rounded-2xl border-0 px-4 py-3.5 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:shadow-lg focus:shadow-violet-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 touch-manipulation ${
                                formErrors.expirationDate 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                  : 'bg-gray-50/80 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.expirationDate && (
                              <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                                {formErrors.expirationDate}
                              </p>
                            )}
                          </div>
                </div>
              </div>

                      {/* Image Upload Section */}
              <div>
                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-zinc-700"></div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-2">Image (Optional)</h4>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-zinc-700"></div>
                          </div>
                        <div className="space-y-3">
                          <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                              className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-2xl file:border-0 file:bg-gradient-to-r file:from-violet-500 file:to-violet-600 file:px-5 file:py-3 file:text-sm file:font-semibold file:text-white file:shadow-lg file:shadow-violet-500/25 transition hover:file:from-violet-600 hover:file:to-violet-700 active:file:scale-95 dark:text-zinc-100 touch-manipulation"
                />
                {uploadingImage && (
                              <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-violet-50/50 px-4 py-3 dark:bg-violet-900/20">
                                <svg className="h-5 w-5 animate-spin text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">{tCommon("loading")}...</span>
                      </div>
                    )}
                </div>
                {formData.imagePath && (
                            <div className="group rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:from-zinc-800/50 dark:to-zinc-800/30">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="relative flex-shrink-0">
                    <img
                      src={formData.imagePath}
                      alt="Preview"
                                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-zinc-700"
                                    />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Image uploaded</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Tap to preview</p>
                  </div>
                    </div>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, imagePath: "" })}
                                  className="flex-shrink-0 rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95 dark:hover:bg-red-900/20 dark:hover:text-red-400 touch-manipulation"
                                >
                                  <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                                </button>
              </div>
                  </div>
                )}
              </div>
                    </div>
            </form>
          </div>

                  {/* Footer with Actions */}
                  <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200/50 bg-gradient-to-b from-white via-white to-gray-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-5 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900/50 backdrop-blur-sm">
                    <p className="hidden text-xs font-medium text-gray-500 dark:text-zinc-400 sm:block">
                      <span className="text-red-500">*</span> Required fields
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:border-zinc-600 touch-manipulation sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        form="create-coupon-form"
                        disabled={submitting || uploadingImage}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:from-violet-700 hover:to-violet-800 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:from-violet-500 dark:to-violet-600 dark:hover:from-violet-600 dark:hover:to-violet-700 touch-manipulation sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7" />
                </svg>
                            <span>{tCouponForm("submit")}</span>
                          </>
              )}
                      </button>
            </div>
          </div>
                </div>
          </div>
        )}

            {/* Filter Tabs */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-1 p-1">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      filterStatus === status
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {status === "ALL" ? "All Coupons" : t(status.toLowerCase())}
                    {status !== "ALL" && (
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                        filterStatus === status
                          ? "bg-white/20"
                          : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                        {stats[status.toLowerCase() as keyof typeof stats]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

        {/* Edit Coupon Form */}
        {editingCouponId && (
              <div className="mb-6 rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Coupon</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Update your coupon details</p>
                </div>
                <form onSubmit={handleUpdateCoupon} className="space-y-5">
              <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                      {tCouponForm("title")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter coupon title"
                      className="block w-full rounded-lg border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800"
                />
              </div>

              <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                      {tCouponForm("description")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                      rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your coupon offer..."
                      className="block w-full rounded-lg border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                        {tCouponForm("code")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="SAVE20"
                        className="block w-full rounded-lg border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800"
                  />
                </div>

                <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                        {tCouponForm("category")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="block w-full rounded-lg border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800"
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
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                        {tCouponForm("discountPercentage")} <span className="text-red-500">*</span>
                  </label>
                      <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                          onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                          placeholder="20"
                          className="block w-full rounded-lg border-0 bg-gray-50 px-4 py-2.5 pr-8 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800"
                  />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-zinc-400">%</span>
                      </div>
                </div>

                <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                        {tCouponForm("expirationDate")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="block w-full rounded-lg border-0 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:bg-zinc-800"
                  />
                </div>
              </div>

              <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                      {tCouponForm("image")} <span className="text-xs text-gray-500 dark:text-zinc-400">(Optional)</span>
                </label>
                    <div className="space-y-3">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                        className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700 transition hover:file:bg-violet-200 dark:text-zinc-100 dark:file:bg-violet-900/30 dark:file:text-violet-300"
                />
                {uploadingImage && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>{tCommon("loading")}...</span>
                        </div>
                )}
                {formData.imagePath && (
                        <div className="mt-2 rounded-lg border border-gray-200 p-3 dark:border-zinc-800">
                    <img
                      src={formData.imagePath}
                      alt="Preview"
                            className="h-32 w-auto rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
              </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || uploadingImage}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-violet-500 dark:hover:bg-violet-600"
                    >
                      {submitting ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{tCommon("save")}</span>
                        </>
                      )}
                    </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons List */}
        {loading ? (
          <CouponsListSkeleton />
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

