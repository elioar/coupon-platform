"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
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
  business?: {
    id: string
    name: string
    email: string
  }
  category: {
    nameEn: string
    nameEl: string
  }
}

interface User {
  id: string
  email: string
  name: string
  role: string
  membershipExpiry: string | null
  createdAt: string
  _count: {
    coupons: number
  }
}

interface Stats {
  totalCoupons: number
  pendingCoupons: number
  approvedCoupons: number
  totalUsers: number
  totalBusinesses: number
  activeMembers: number
}

interface Category {
  id: string
  nameEn: string
  nameEl: string
  slug: string
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const t = useTranslations("dashboard.admin")
  const tCommon = useTranslations("common")

  const [pendingCoupons, setPendingCoupons] = useState<Coupon[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"coupons" | "users" | "categories">("coupons")
  const [processingCoupon, setProcessingCoupon] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    nameEn: "",
    nameEl: "",
    slug: ""
  })
  const [submittingCategory, setSubmittingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponsRes, usersRes, statsRes, categoriesRes] = await Promise.all([
          fetch('/api/admin/coupons/pending'),
          fetch('/api/admin/users'),
          fetch('/api/admin/stats'),
          fetch('/api/categories'),
        ])

        const couponsData = await couponsRes.json()
        const usersData = await usersRes.json()
        const statsData = await statsRes.json()
        const categoriesData = await categoriesRes.json()

        setPendingCoupons(couponsData.coupons || [])
        setUsers(usersData.users || [])
        setStats(statsData.stats || null)
        setCategories(categoriesData.categories || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleApproval = async (couponId: string, status: "APPROVED" | "REJECTED") => {
    setProcessingCoupon(couponId)
    setMessage(null)
    
    try {
      const response = await fetch(`/api/coupons/${couponId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (response.ok) {
        setPendingCoupons(pendingCoupons.filter((c) => c.id !== couponId))
        setMessage({ 
          type: 'success', 
          text: `Coupon ${status.toLowerCase()} successfully!` 
        })
        
        // Refresh stats
        const statsRes = await fetch('/api/admin/stats')
        const statsData = await statsRes.json()
        setStats(statsData.stats || null)
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to update coupon status' 
        })
      }
    } catch (error) {
      console.error("Error approving coupon:", error)
      setMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      })
    } finally {
      setProcessingCoupon(null)
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingCategory(true)
    setMessage(null)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      })

      const data = await response.json()

      if (response.ok) {
        setCategories([...categories, data.category])
        setCategoryForm({ nameEn: "", nameEl: "", slug: "" })
        setShowCategoryForm(false)
        setMessage({ 
          type: 'success', 
          text: 'Category created successfully!' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to create category' 
        })
      }
    } catch (error) {
      console.error("Error creating category:", error)
      setMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      })
    } finally {
      setSubmittingCategory(false)
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setCategoryForm({
      nameEn: category.nameEn,
      nameEl: category.nameEl,
      slug: category.slug
    })
    setShowCategoryForm(false)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategoryId) return

    setSubmittingCategory(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/categories/${editingCategoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      })

      const data = await response.json()

      if (response.ok) {
        setCategories(categories.map(cat => 
          cat.id === editingCategoryId ? data.category : cat
        ))
        setCategoryForm({ nameEn: "", nameEl: "", slug: "" })
        setEditingCategoryId(null)
        setMessage({ 
          type: 'success', 
          text: 'Category updated successfully!' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to update category' 
        })
      }
    } catch (error) {
      console.error("Error updating category:", error)
      setMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      })
    } finally {
      setSubmittingCategory(false)
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    setDeletingCategoryId(categoryId)
    setMessage(null)

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryId))
        setMessage({ 
          type: 'success', 
          text: 'Category deleted successfully!' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to delete category' 
        })
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      setMessage({ 
        type: 'error', 
        text: 'An error occurred. Please try again.' 
      })
    } finally {
      setDeletingCategoryId(null)
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const cancelEdit = () => {
    setEditingCategoryId(null)
    setCategoryForm({ nameEn: "", nameEl: "", slug: "" })
  }

  return (
    <div className="min-h-screen bg-white dark:from-zinc-950 dark:via-zinc-950 dark:to-violet-950/20 dark:bg-gradient-to-br">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Welcome back, {session?.user.name}!
          </p>
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"></div>
              <p className="text-zinc-600 dark:text-zinc-400">{tCommon("loading")}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Cards - At the Top */}
            {stats && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total Coupons */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute right-4 top-4 rounded-full bg-violet-100 p-3 dark:bg-violet-900/30">
                    <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t("totalCoupons")}
                  </h3>
                  <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {stats.totalCoupons}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {stats.approvedCoupons} approved • {stats.pendingCoupons} pending
                  </p>
                </div>

                {/* Pending Coupons */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute right-4 top-4 rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                    <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t("pendingCoupons")}
                  </h3>
                  <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-500">
                    {stats.pendingCoupons}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Awaiting review
                  </p>
                </div>

                {/* Active Members */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute right-4 top-4 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t("activeMembers")}
                  </h3>
                  <p className="mt-2 text-4xl font-bold text-green-600 dark:text-green-500">
                    {stats.activeMembers}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Active subscriptions
                  </p>
                </div>

                {/* Total Users */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute right-4 top-4 rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                    <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Total Users
                  </h3>
                  <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {stats.totalUsers}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Registered users
                  </p>
                </div>

                {/* Total Businesses */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute right-4 top-4 rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t("totalBusinesses")}
                  </h3>
                  <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {stats.totalBusinesses}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Business accounts
                  </p>
                </div>

                {/* Total Categories */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="absolute right-4 top-4 rounded-full bg-pink-100 p-3 dark:bg-pink-900/30">
                    <svg className="h-6 w-6 text-pink-600 dark:text-pink-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Categories
                  </h3>
                  <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {categories.length}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Active categories
                  </p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-1 p-1">
                <button
                  onClick={() => setActiveTab("coupons")}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeTab === "coupons"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {t("pendingCoupons")}
                    {pendingCoupons.length > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        {pendingCoupons.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeTab === "users"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {t("allUsers")}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("categories")}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeTab === "categories"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Categories
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {/* Pending Coupons Tab */}
              {activeTab === "coupons" && (
                <div className="p-6">
                  {pendingCoupons.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <svg className="h-8 w-8 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        All caught up!
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        No pending coupons to review
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-violet-200 hover:bg-violet-50/50 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-violet-800 dark:hover:bg-violet-900/10"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-3 flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                    {coupon.title}
                                  </h3>
                                  {coupon.business && (
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                      By <strong>{coupon.business.name}</strong> ({coupon.business.email})
                                    </p>
                                  )}
                                </div>
                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                                  {coupon.discountPercentage}% OFF
                                </span>
                              </div>
                              
                              <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
                                {coupon.description}
                              </p>
                              
                              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                  <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  <strong>{coupon.code}</strong>
                                </span>
                                <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                  <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Expires: {format(new Date(coupon.expirationDate), "MMM dd, yyyy")}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproval(coupon.id, "APPROVED")}
                                  disabled={processingCoupon === coupon.id}
                                >
                                  {processingCoupon === coupon.id ? tCommon("loading") : (
                                    <div className="flex items-center gap-1">
                                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M5 13l4 4L19 7" />
                                      </svg>
                                      {t("approve")}
                                    </div>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleApproval(coupon.id, "REJECTED")}
                                  disabled={processingCoupon === coupon.id}
                                >
                                  {processingCoupon === coupon.id ? tCommon("loading") : (
                                    <div className="flex items-center gap-1">
                                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      {t("reject")}
                                    </div>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Member Until
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {users.map((user) => (
                        <tr key={user.id} className="transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              user.role === 'ADMIN' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : user.role === 'BUSINESS'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {user.membershipExpiry ? (
                              <span className="flex items-center gap-1">
                                <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {format(new Date(user.membershipExpiry), "MMM dd, yyyy")}
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === "categories" && (
                <div className="p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        Manage Categories
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Add, edit, and manage coupon categories for your platform
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setShowCategoryForm(!showCategoryForm)
                        setEditingCategoryId(null)
                        setCategoryForm({ nameEn: "", nameEl: "", slug: "" })
                      }}
                      size="sm"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                        Add Category
                      </div>
                    </Button>
                  </div>

                  {/* Add Category Form */}
                  {showCategoryForm && (
                    <form onSubmit={handleCreateCategory} className="mb-6 rounded-xl border border-violet-200 bg-violet-50/50 p-6 dark:border-violet-800 dark:bg-violet-900/10">
                      <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        Create New Category
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            English Name
                          </label>
                          <input
                            type="text"
                            value={categoryForm.nameEn}
                            onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                            required
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g., Electronics"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Greek Name
                          </label>
                          <input
                            type="text"
                            value={categoryForm.nameEl}
                            onChange={(e) => setCategoryForm({ ...categoryForm, nameEl: e.target.value })}
                            required
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g., Ηλεκτρονικά"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Slug (URL)
                          </label>
                          <input
                            type="text"
                            value={categoryForm.slug}
                            onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                            required
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g., electronics"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button type="submit" size="sm" disabled={submittingCategory}>
                          {submittingCategory ? tCommon("loading") : tCommon("create")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setShowCategoryForm(false)
                            setCategoryForm({ nameEn: "", nameEl: "", slug: "" })
                          }}
                        >
                          {tCommon("cancel")}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Edit Category Form */}
                  {editingCategoryId && (
                    <form onSubmit={handleUpdateCategory} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-900/10">
                      <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        Edit Category
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            English Name
                          </label>
                          <input
                            type="text"
                            value={categoryForm.nameEn}
                            onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                            required
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g., Electronics"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Greek Name
                          </label>
                          <input
                            type="text"
                            value={categoryForm.nameEl}
                            onChange={(e) => setCategoryForm({ ...categoryForm, nameEl: e.target.value })}
                            required
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g., Ηλεκτρονικά"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Slug (URL)
                          </label>
                          <input
                            type="text"
                            value={categoryForm.slug}
                            onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                            required
                            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            placeholder="e.g., electronics"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button type="submit" size="sm" disabled={submittingCategory}>
                          {submittingCategory ? tCommon("loading") : tCommon("save")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={cancelEdit}
                        >
                          {tCommon("cancel")}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Categories List */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={`rounded-xl border bg-zinc-50/50 p-4 transition ${
                          editingCategoryId === category.id
                            ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20'
                            : 'border-zinc-200 hover:border-violet-200 hover:bg-violet-50/30 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-violet-800 dark:hover:bg-violet-900/10'
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                            <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              title="Edit category"
                            >
                              <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${category.nameEn}"?`)) {
                                  handleDeleteCategory(category.id)
                                }
                              }}
                              disabled={deletingCategoryId === category.id}
                              className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                              title="Delete category"
                            >
                              {deletingCategoryId === category.id ? (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {category.nameEn}
                        </h4>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {category.nameEl}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                          /{category.slug}
                        </p>
                      </div>
                    ))}
                  </div>

                  {categories.length === 0 && !showCategoryForm && (
                    <div className="py-16 text-center">
                      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <svg className="h-8 w-8 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        No categories yet
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        Create your first category to get started
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

