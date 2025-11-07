"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import Navigation from "@/components/Navigation"
import Button from "@/components/Button"
import { format } from "date-fns"

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
  const { data: session } = useSession()
  const t = useTranslations("dashboard.business")
  const tCouponForm = useTranslations("couponForm")
  const tCommon = useTranslations("common")
  const params = useParams()
  const locale = params.locale as string

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

  return (
    <div className="min-h-screen bg-white dark:from-zinc-950 dark:via-zinc-950 dark:to-blue-950/20 dark:bg-gradient-to-br">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
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
                            Expires: {format(new Date(coupon.expirationDate), "MMM dd, yyyy")}
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
      </main>
    </div>
  )
}

