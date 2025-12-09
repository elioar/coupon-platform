"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import Button from "@/components/Button"
// Removed date-fns dependency

interface Coupon {
  id: string
  title: string
  description: string
  code: string | null
  couponType: "ONLINE_CODE" | "QR_CODE"
  discountPercentage: number
  expirationDate: string
  status: string
  imagePath?: string | null
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

interface SiteSettings {
  id: string
  useRealStats: boolean
  fakeTotalCoupons: number
  fakeActiveMembers: number
  fakeTotalBusinesses: number
  fakeTotalSavings: number
}

type SettingsNumberField = "fakeTotalCoupons" | "fakeActiveMembers" | "fakeTotalBusinesses" | "fakeTotalSavings"

interface Category {
  id: string
  nameEn: string
  nameEl: string
  slug: string
}

// Skeleton Components
function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mb-2 h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 sm:h-10" />
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminCouponsTableSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50">
            <tr>
              {[...Array(6)].map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                {[...Array(6)].map((_, j) => (
                  <td key={j} className="px-4 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const t = useTranslations("dashboard.admin")
  const tCommon = useTranslations("common")
  const tProfile = useTranslations("profile")
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const section = searchParams.get("section") || "overview"

  const [pendingCoupons, setPendingCoupons] = useState<Coupon[]>([])
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    useRealStats: true,
    fakeTotalCoupons: 0,
    fakeActiveMembers: 0,
    fakeTotalBusinesses: 0,
    fakeTotalSavings: 0,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingCoupons, setLoadingCoupons] = useState(false)
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
  
  // User profile modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  
  // Coupon management state
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const [viewingCouponId, setViewingCouponId] = useState<string | null>(null)
  const [viewingCouponData, setViewingCouponData] = useState<Coupon | null>(null)
  const [loadingCouponDetails, setLoadingCouponDetails] = useState(false)
  const [couponAnalytics, setCouponAnalytics] = useState<{
    views: number
    clicks: number
    redemptions: number
    saves?: number
  } | null>(null)
  const [couponForm, setCouponForm] = useState({
    title: "",
    description: "",
    code: "",
    categoryId: "",
    discountPercentage: 0,
    expirationDate: "",
    status: "PENDING" as "PENDING" | "APPROVED" | "REJECTED"
  })
  const [submittingCoupon, setSubmittingCoupon] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [businessFilter, setBusinessFilter] = useState<string>("ALL")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponsRes, usersRes, statsRes, categoriesRes, settingsRes] = await Promise.all([
          fetch('/api/admin/coupons/pending'),
          fetch('/api/admin/users'),
          fetch('/api/admin/stats'),
          fetch('/api/categories'),
          fetch('/api/admin/settings'),
        ])

        const couponsData = await couponsRes.json()
        const usersData = await usersRes.json()
        const statsData = await statsRes.json()
        const categoriesData = await categoriesRes.json()
        const settingsData = settingsRes.ok ? await settingsRes.json() : null

        setPendingCoupons(couponsData.coupons || [])
        setUsers(usersData.users || [])
        setStats(statsData.stats || null)
        setCategories(categoriesData.categories || [])
        if (settingsData?.settings) {
          setSettings(settingsData.settings)
          setSettingsForm({
            useRealStats: settingsData.settings.useRealStats ?? true,
            fakeTotalCoupons: settingsData.settings.fakeTotalCoupons ?? 0,
            fakeActiveMembers: settingsData.settings.fakeActiveMembers ?? 0,
            fakeTotalBusinesses: settingsData.settings.fakeTotalBusinesses ?? 0,
            fakeTotalSavings: settingsData.settings.fakeTotalSavings ?? 0,
          })
        }
      } catch (error) {
        // Error fetching data - handled silently
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch all coupons when coupons section is active
  useEffect(() => {
    if (section === "coupons") {
      fetchAllCoupons()
    }
  }, [section])

  const fetchAllCoupons = async () => {
    setLoadingCoupons(true)
    try {
      // Fetch coupons with all statuses for admin
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch('/api/coupons?status=PENDING'),
        fetch('/api/coupons?status=APPROVED'),
        fetch('/api/coupons?status=REJECTED'),
      ])
      
      const pendingData = await pendingRes.json()
      const approvedData = await approvedRes.json()
      const rejectedData = await rejectedRes.json()
      
      // Combine all coupons
      const allCouponsData = [
        ...(pendingData.coupons || []),
        ...(approvedData.coupons || []),
        ...(rejectedData.coupons || [])
      ]
      
      setAllCoupons(allCouponsData)
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load coupons' })
    } finally {
      setLoadingCoupons(false)
    }
  }

  const handleSettingsNumberChange = (field: SettingsNumberField, value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0
    setSettingsForm((prev) => ({
      ...prev,
      [field]: Math.max(0, Math.round(safeValue)),
    }))
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setSettingsMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }

      if (data.settings) {
        setSettings(data.settings)
        setSettingsForm({
          useRealStats: data.settings.useRealStats ?? true,
          fakeTotalCoupons: data.settings.fakeTotalCoupons ?? 0,
          fakeActiveMembers: data.settings.fakeActiveMembers ?? 0,
          fakeTotalBusinesses: data.settings.fakeTotalBusinesses ?? 0,
          fakeTotalSavings: data.settings.fakeTotalSavings ?? 0,
        })
      }

      setSettingsMessage({ type: 'success', text: 'Settings updated successfully' })
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to update settings'
      setSettingsMessage({ type: 'error', text: messageText })
    } finally {
      setSavingSettings(false)
      setTimeout(() => setSettingsMessage(null), 5000)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    setLoadingProfile(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch user profile: ${response.status}`)
      }
      const data = await response.json()
      setSelectedUserProfile(data.user)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load user profile"
      setMessage({ type: "error", text: errorMessage })
      // Close modal on error
      setTimeout(() => {
        setSelectedUserId(null)
        setSelectedUserProfile(null)
      }, 3000)
    } finally {
      setLoadingProfile(false)
    }
  }

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

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id)
    // Get category ID from coupon if available
    const categoryId = (coupon.category as any)?.id || ""
    setCouponForm({
      title: coupon.title,
      description: coupon.description,
      code: coupon.code || "",
      categoryId: categoryId,
      discountPercentage: coupon.discountPercentage,
      expirationDate: coupon.expirationDate ? new Date(coupon.expirationDate).toISOString().slice(0, 16) : "",
      status: coupon.status as "PENDING" | "APPROVED" | "REJECTED"
    })
  }

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCouponId) return

    setSubmittingCoupon(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/coupons/${editingCouponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...couponForm,
          expirationDate: couponForm.expirationDate ? new Date(couponForm.expirationDate).toISOString() : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAllCoupons(allCoupons.map(c => c.id === editingCouponId ? data.coupon : c))
        setCouponForm({
          title: "",
          description: "",
          code: "",
          categoryId: "",
          discountPercentage: 0,
          expirationDate: "",
          status: "PENDING"
        })
        setEditingCouponId(null)
        setMessage({ type: 'success', text: t("couponUpdated") })
        // Refresh stats
        const statsRes = await fetch('/api/admin/stats')
        const statsData = await statsRes.json()
        setStats(statsData.stats || null)
        // Refresh coupons list
        fetchAllCoupons()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update coupon' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setSubmittingCoupon(false)
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
        setAllCoupons(allCoupons.filter(c => c.id !== couponId))
        setMessage({ type: 'success', text: t("couponDeleted") })
        // Refresh stats
        const statsRes = await fetch('/api/admin/stats')
        const statsData = await statsRes.json()
        setStats(statsData.stats || null)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete coupon' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setDeletingCouponId(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleViewCoupon = async (couponId: string) => {
    setViewingCouponId(couponId)
    setLoadingCouponDetails(true)
    try {
      // Fetch coupon details and analytics in parallel
      const [couponResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/coupons/${couponId}`),
        fetch(`/api/admin/coupons/${couponId}/analytics`)
      ])
      
      const couponData = await couponResponse.json()
      if (couponResponse.ok) {
        setViewingCouponData(couponData.coupon || couponData)
      } else {
        setMessage({ type: 'error', text: 'Failed to load coupon details' })
        setViewingCouponId(null)
        setLoadingCouponDetails(false)
        return
      }

      // Handle analytics
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setCouponAnalytics(analyticsData)
      } else {
        // If analytics endpoint doesn't exist, set defaults
        setCouponAnalytics({ views: 0, clicks: 0, redemptions: 0, saves: 0 })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading coupon details' })
      setViewingCouponId(null)
    } finally {
      setLoadingCouponDetails(false)
    }
  }

  const closeCouponModal = () => {
    setViewingCouponId(null)
    setViewingCouponData(null)
    setCouponAnalytics(null)
  }

  // Handle Escape key to close coupon modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingCouponId) {
        closeCouponModal()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [viewingCouponId])

  const cancelCouponEdit = () => {
    setEditingCouponId(null)
    setCouponForm({
      title: "",
      description: "",
      code: "",
      categoryId: "",
      discountPercentage: 0,
      expirationDate: "",
      status: "PENDING"
    })
  }

  // Get unique businesses from coupons
  const uniqueBusinesses = Array.from(
    new Map(allCoupons.map(c => [c.business?.id, c.business])).values()
  ).filter(Boolean)

  // Filter coupons based on search and filters
  const filteredCoupons = allCoupons.filter((coupon) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        coupon.title.toLowerCase().includes(query) ||
        (coupon.code && coupon.code.toLowerCase().includes(query)) ||
        coupon.description.toLowerCase().includes(query) ||
        coupon.business?.name.toLowerCase().includes(query) ||
        coupon.business?.email.toLowerCase().includes(query)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== "ALL" && coupon.status !== statusFilter) {
      return false
    }

    // Category filter
    if (categoryFilter !== "ALL") {
      const couponCategoryId = (coupon.category as any)?.id
      if (couponCategoryId !== categoryFilter) {
        return false
      }
    }

    // Business filter
    if (businessFilter !== "ALL" && coupon.business?.id !== businessFilter) {
      return false
    }

    return true
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, categoryFilter, businessFilter])

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <DashboardSidebar
        role="ADMIN"
        locale={locale}
        userName={session?.user.name || "Admin"}
        userEmail={session?.user.email || ""}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      <DashboardHeader
        userName={session?.user.name || "Admin"}
        userEmail={session?.user.email || ""}
        role="ADMIN"
        locale={locale}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="ml-0 flex-1 overflow-x-hidden pt-16 lg:ml-72">
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
          
          {/* Users Section */}
          {section === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">{t("userManagement")}</h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">{t("manageAllUsers")}</p>
              </div>

              {/* Stats Cards */}
              {stats && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">{t("totalUsers")}</h3>
                    <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">{stats.totalUsers}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">{t("businesses")}</h3>
                    <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-500 sm:text-4xl">{stats.totalBusinesses}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                    <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">{t("activeMembers")}</h3>
                    <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-500 sm:text-4xl">{stats.activeMembers}</p>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">
                          {t("name")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">
                          {t("email")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">
                          {t("role")}
                        </th>
                        <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 md:table-cell">
                          {t("membershipExpiry")}
                        </th>
                        <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 lg:table-cell">
                          {t("memberSince")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {users.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => {
                            setSelectedUserId(user.id)
                            fetchUserProfile(user.id)
                          }}
                          className="cursor-pointer transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        >
                          <td className="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 sm:h-10 sm:w-10 sm:text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 sm:text-sm">
                            <div className="max-w-[150px] truncate sm:max-w-none">{user.email}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 ${
                              user.role === 'ADMIN' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : user.role === 'BUSINESS'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 sm:text-sm md:table-cell">
                            {user.membershipExpiry ? (
                              <span className="flex items-center gap-1">
                                <svg className="h-3 w-3 text-green-600 dark:text-green-400 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {new Date(user.membershipExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 sm:text-sm lg:table-cell">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Coupons Section */}
          {section === "coupons" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">{t("couponManagement")}</h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">{t("couponManagementDescription")}</p>
              </div>

              {/* Search and Filters */}
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("search")}</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Filters Row */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Status Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("status")}</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PENDING" | "APPROVED" | "REJECTED")}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="ALL">{t("allStatuses")}</option>
                        <option value="PENDING">{t("pending")}</option>
                        <option value="APPROVED">{t("approved")}</option>
                        <option value="REJECTED">{t("reject")}</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("category")}</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="ALL">{t("allCategories")}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {locale === "el" ? category.nameEl : category.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Business Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("business")}</label>
                      <select
                        value={businessFilter}
                        onChange={(e) => setBusinessFilter(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="ALL">{t("allBusinesses")}</option>
                        {uniqueBusinesses.map((business) => (
                          <option key={business?.id} value={business?.id}>
                            {business?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Results Count and Clear Filters */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t("showingResults")} <span className="font-semibold text-zinc-900 dark:text-zinc-50">{startIndex + 1}</span>-<span className="font-semibold text-zinc-900 dark:text-zinc-50">{Math.min(endIndex, filteredCoupons.length)}</span> {t("of")} <span className="font-semibold text-zinc-900 dark:text-zinc-50">{filteredCoupons.length}</span> {t("coupons")}
                    </p>
                    {(searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL" || businessFilter !== "ALL") && (
                      <button
                        onClick={() => {
                          setSearchQuery("")
                          setStatusFilter("ALL")
                          setCategoryFilter("ALL")
                          setBusinessFilter("ALL")
                        }}
                        className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                      >
                        {t("clearFilters")}
                      </button>
                    )}
                  </div>
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


              {/* Coupons Table */}
              {loadingCoupons ? (
                <AdminCouponsTableSkeleton />
              ) : allCoupons.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <svg className="h-8 w-8 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("noCouponsFound")}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">{t("noCouponsYet")}</p>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <svg className="h-8 w-8 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("noCouponsMatch")}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">{t("adjustFilters")}</p>
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("ALL")
                      setCategoryFilter("ALL")
                      setBusinessFilter("ALL")
                    }}
                    className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                  >
                    {t("clearAllFilters")}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-800/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">{t("tableTitle")}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">{t("tableBusiness")}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">{t("tableCode")}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">{t("tableDiscount")}</th>
                          <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 md:table-cell">{t("tableStatus")}</th>
                          <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 lg:table-cell">{t("tableExpires")}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">{t("tableActions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {paginatedCoupons.map((coupon) => (
                          <tr 
                            key={coupon.id} 
                            className="cursor-pointer transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                            onClick={() => handleViewCoupon(coupon.id)}
                          >
                            <td className="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">{coupon.title}</div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4">
                              {coupon.business?.name || "—"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 sm:px-6 sm:py-4">
                              {coupon.code || "—"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 sm:px-6 sm:py-4">
                              <span className="font-semibold text-violet-600 dark:text-violet-400">{coupon.discountPercentage}%</span>
                            </td>
                            <td className="hidden whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4 md:table-cell">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                coupon.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : coupon.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              }`}>
                                {coupon.status}
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 sm:px-6 sm:py-4 lg:table-cell">
                              {new Date(coupon.expirationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium sm:px-6 sm:py-4">
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleViewCoupon(coupon.id)}
                                  className="rounded-lg p-1.5 text-violet-600 transition-colors hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/30"
                                  title="View details"
                                >
                                  <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleEditCoupon(coupon)}
                                  className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                  title="Edit coupon"
                                >
                                  <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${coupon.title}"?`)) {
                                      handleDeleteCoupon(coupon.id)
                                    }
                                  }}
                                  disabled={deletingCouponId === coupon.id}
                                  className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                  title="Delete coupon"
                                >
                                  {deletingCouponId === coupon.id ? (
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30 sm:px-6">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          {t("previous")}
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="relative ml-3 inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          {t("next")}
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">
                            {t("showingPage")} <span className="font-medium">{startIndex + 1}</span> {t("to")} <span className="font-medium">{Math.min(endIndex, filteredCoupons.length)}</span> {t("of")} <span className="font-medium">{filteredCoupons.length}</span> {t("results")}
                          </p>
                        </div>
                        <div>
                          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-zinc-700 dark:hover:bg-zinc-700"
                            >
                              <span className="sr-only">{t("previous")}</span>
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                      currentPage === page
                                        ? "z-10 bg-violet-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                                        : "text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-700"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                )
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                  <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-300 dark:text-zinc-300 dark:ring-zinc-700">
                                    ...
                                  </span>
                                )
                              }
                              return null
                            })}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-zinc-700 dark:hover:bg-zinc-700"
                            >
                              <span className="sr-only">{t("next")}</span>
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Categories Section */}
          {section === "categories" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">{t("categories")}</h1>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">{t("addEditCategories")}</p>
                </div>
                <Button
                  onClick={() => {
                    setShowCategoryForm(!showCategoryForm)
                    setEditingCategoryId(null)
                    setCategoryForm({ nameEn: "", nameEl: "", slug: "" })
                  }}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="whitespace-nowrap">{t("addCategory")}</span>
                  </div>
                </Button>
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

              {/* Add Category Form */}
              {showCategoryForm && (
                <form onSubmit={handleCreateCategory} className="rounded-xl border border-violet-200 bg-violet-50/50 p-6 dark:border-violet-800 dark:bg-violet-900/10">
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("createCategory")}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("englishName")}
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
                        {t("greekName")}
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
                        {t("slug")}
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
                    <Button type="submit" disabled={submittingCategory}>
                      {submittingCategory ? tCommon("loading") : tCommon("create")}
                    </Button>
                    <Button
                      type="button"
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
                <form onSubmit={handleUpdateCategory} className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-900/10">
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("updateCategory")}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("englishName")}
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
                        {t("greekName")}
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
                        {t("slug")}
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
                    <Button type="submit" disabled={submittingCategory}>
                      {submittingCategory ? tCommon("loading") : tCommon("save")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelEdit}
                    >
                      {tCommon("cancel")}
                    </Button>
                  </div>
                </form>
              )}

              {/* Categories List */}
              {categories.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`rounded-xl border bg-white p-4 transition ${
                        editingCategoryId === category.id
                          ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20'
                          : 'border-zinc-200 hover:border-violet-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800'
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
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
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

          {/* Settings Section */}
          {section === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">Platform Settings</h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">Configure platform-wide settings</p>
              </div>

              {/* Admin Information */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Admin Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{session?.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</p>
                      <p className="text-sm text-red-600 dark:text-red-400">Administrator</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Statistics */}
              {stats && (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Platform Overview</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("totalUsers")}</p>
                      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalUsers}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("totalCoupons")}</p>
                      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalCoupons}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("categories")}</p>
                      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{categories.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Home Page Stats Control */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Home page stats</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Choose whether the public home page shows real platform numbers or custom values.
                    </p>
                  </div>
                  <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${
                    settingsForm.useRealStats
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                    {settingsForm.useRealStats ? 'Real data' : 'Custom data'}
                  </span>
                </div>

                {settingsMessage && (
                  <div className={`mt-4 rounded-lg border p-3 text-sm ${
                    settingsMessage.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300'
                      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {settingsMessage.text}
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Use real platform data</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Live counts from approved coupons, active members, and businesses.</p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={settingsForm.useRealStats}
                      disabled={savingSettings}
                      onClick={() => setSettingsForm((prev) => ({ ...prev, useRealStats: !prev.useRealStats }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        settingsForm.useRealStats ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'
                      } ${savingSettings ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          settingsForm.useRealStats ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Custom total coupons</label>
                    <input
                      type="number"
                      min="0"
                      value={settingsForm.fakeTotalCoupons}
                      onChange={(e) => handleSettingsNumberChange("fakeTotalCoupons", Number(e.target.value))}
                      disabled={savingSettings}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Shown as coupons on the home page.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Custom active members</label>
                    <input
                      type="number"
                      min="0"
                      value={settingsForm.fakeActiveMembers}
                      onChange={(e) => handleSettingsNumberChange("fakeActiveMembers", Number(e.target.value))}
                      disabled={savingSettings}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Use this when sharing projected growth numbers.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Custom businesses</label>
                    <input
                      type="number"
                      min="0"
                      value={settingsForm.fakeTotalBusinesses}
                      onChange={(e) => handleSettingsNumberChange("fakeTotalBusinesses", Number(e.target.value))}
                      disabled={savingSettings}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Displayed as partnered businesses.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Custom savings (K€)</label>
                    <input
                      type="number"
                      min="0"
                      value={settingsForm.fakeTotalSavings}
                      onChange={(e) => handleSettingsNumberChange("fakeTotalSavings", Number(e.target.value))}
                      disabled={savingSettings}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Shown as €XK+ in the savings card.</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (settings) {
                        setSettingsForm({
                          useRealStats: settings.useRealStats ?? true,
                          fakeTotalCoupons: settings.fakeTotalCoupons ?? 0,
                          fakeActiveMembers: settings.fakeActiveMembers ?? 0,
                          fakeTotalBusinesses: settings.fakeTotalBusinesses ?? 0,
                          fakeTotalSavings: settings.fakeTotalSavings ?? 0,
                        })
                      }
                    }}
                    disabled={savingSettings || !settings}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Reset to saved
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingSettings ? 'Saving...' : 'Save settings'}
                  </button>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Advanced Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Notifications</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Receive platform alerts and updates</p>
                    </div>
                    <div className="text-sm text-zinc-500">Coming soon</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Auto-Approval</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Automatically approve coupons from verified businesses</p>
                    </div>
                    <div className="text-sm text-zinc-500">Coming soon</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Maintenance Mode</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Temporarily disable the platform for maintenance</p>
                    </div>
                    <div className="text-sm text-zinc-500">Coming soon</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Section - Default */}
          {section === "overview" && (
            <>

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
          <AdminOverviewSkeleton />
        ) : (
          <>
            {/* Statistics Cards - At the Top */}
            {stats && (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:mb-8">
                {/* Total Coupons */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="absolute right-3 top-3 rounded-lg bg-green-100 p-2 dark:bg-green-900/30 sm:right-4 sm:top-4">
                    <svg className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">
                    {t("totalCoupons")}
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                    {stats.totalCoupons}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                    <span className="hidden sm:inline">{stats.approvedCoupons} {t("approved")} • {stats.pendingCoupons} {t("pending")}</span>
                    <span className="sm:hidden">{stats.approvedCoupons} {t("app")} • {stats.pendingCoupons} {t("pend")}</span>
                  </p>
                </div>

                {/* Pending Coupons */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="absolute right-3 top-3 rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30 sm:right-4 sm:top-4">
                    <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">
                    {t("pendingCoupons")}
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-500 sm:text-3xl md:text-4xl">
                    {stats.pendingCoupons}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                    {t("awaiting")}
                  </p>
                </div>

                {/* Active Members */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="absolute right-3 top-3 rounded-lg bg-green-100 p-2 dark:bg-green-900/30 sm:right-4 sm:top-4">
                    <svg className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">
                    {t("activeMembers")}
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-500 sm:text-3xl md:text-4xl">
                    {stats.activeMembers}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                    Active subscriptions
                  </p>
                </div>

                {/* Total Users */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="absolute right-3 top-3 rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30 sm:right-4 sm:top-4">
                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">
                    {t("totalUsers")}
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                    {stats.totalUsers}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                    {t("registered")}
                  </p>
                </div>

                {/* Total Businesses */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="absolute right-3 top-3 rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30 sm:right-4 sm:top-4">
                    <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">
                    {t("totalBusinesses")}
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                    {stats.totalBusinesses}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                    Business accounts
                  </p>
                </div>

                {/* Total Categories */}
                <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div className="absolute right-3 top-3 rounded-lg bg-pink-100 p-2 dark:bg-pink-900/30 sm:right-4 sm:top-4">
                    <svg className="h-4 w-4 text-pink-600 dark:text-pink-400 sm:h-5 sm:w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm">
                    Categories
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                    {categories.length}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                    Active categories
                  </p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:mb-6">
              <div className="flex gap-1 p-1">
                <button
                  onClick={() => setActiveTab("coupons")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                    activeTab === "coupons"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="hidden sm:inline">{t("pendingCoupons")}</span>
                    <span className="sm:hidden">Coupons</span>
                    {pendingCoupons.length > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 sm:px-2">
                        {pendingCoupons.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                    activeTab === "users"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="hidden sm:inline">{t("allUsers")}</span>
                    <span className="sm:hidden">Users</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("categories")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:py-3 sm:text-sm ${
                    activeTab === "categories"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="hidden sm:inline">Categories</span>
                    <span className="sm:hidden">Cats</span>
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
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {pendingCoupons.map((coupon) => (
                        <div
                          key={coupon.id}
                          className="group flex h-[480px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                        >
                          {/* Header with badges - fixed height */}
                          <div className="flex h-20 flex-shrink-0 items-start justify-between border-b border-zinc-100 p-5 dark:border-zinc-800">
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600" />
                                Pending
                              </span>
                              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                {coupon.discountPercentage}% OFF
                              </span>
                            </div>
                            {coupon.imagePath && (
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <img 
                                  src={coupon.imagePath} 
                                  alt={coupon.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Content - scrollable area */}
                          <div className="flex-1 space-y-4 overflow-y-auto p-5">
                            <div>
                              <h3 className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                                {coupon.title}
                              </h3>
                              {coupon.business && (
                                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                                  by <span className="font-semibold text-zinc-900 dark:text-zinc-100">{coupon.business.name}</span>
                                </p>
                              )}
                              {coupon.category?.nameEn && (
                                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                  {coupon.category.nameEn}
                                </p>
                              )}
                            </div>

                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {coupon.description}
                            </p>

                            {/* Info grid */}
                            <div className="space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-zinc-500 dark:text-zinc-400">Code</span>
                                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                                  {coupon.code || "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-zinc-500 dark:text-zinc-400">Type</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {coupon.couponType === "QR_CODE" ? "QR Code" : "Online"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-zinc-500 dark:text-zinc-400">Expires</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {new Date(coupon.expirationDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons - fixed at bottom, always visible */}
                          <div className="flex-shrink-0 border-t border-zinc-100 p-4 dark:border-zinc-800">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproval(coupon.id, "APPROVED")}
                                disabled={processingCoupon === coupon.id}
                                className="group/btn flex-1 rounded-xl bg-green-600 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processingCoupon === coupon.id ? (
                                  <span className="text-sm">{tCommon("loading")}</span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm">{t("approve")}</span>
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => handleApproval(coupon.id, "REJECTED")}
                                disabled={processingCoupon === coupon.id}
                                className="group/btn flex-1 rounded-xl border-2 border-red-200 bg-white py-2.5 font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/30"
                              >
                                {processingCoupon === coupon.id ? (
                                  <span className="text-sm">{tCommon("loading")}</span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="text-sm">{t("reject")}</span>
                                  </div>
                                )}
                              </button>
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
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
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
                                {new Date(user.membershipExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
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
            </>
          )}
        </div>
      </main>

      {/* Edit Coupon Modal */}
      {editingCouponId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={cancelCouponEdit}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-zinc-200 bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{t("editCoupon")}</h2>
                <button
                  onClick={cancelCouponEdit}
                  className="rounded-lg p-2 text-white transition hover:bg-white/20"
                >
                  <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpdateCoupon} className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("title")}</label>
                  <input
                    type="text"
                    value={couponForm.title}
                    onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("code")}</label>
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("description")}</label>
                  <textarea
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("discountPercentage")}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={couponForm.discountPercentage}
                    onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("expirationDate")}</label>
                  <input
                    type="datetime-local"
                    value={couponForm.expirationDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expirationDate: e.target.value })}
                    required
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("category")}</label>
                  <select
                    value={couponForm.categoryId}
                    onChange={(e) => setCouponForm({ ...couponForm, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">{t("selectCategory")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {locale === "el" ? category.nameEl : category.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("status")}</label>
                  <select
                    value={couponForm.status}
                    onChange={(e) => setCouponForm({ ...couponForm, status: e.target.value as "PENDING" | "APPROVED" | "REJECTED" })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="PENDING">{t("pending")}</option>
                    <option value="APPROVED">{t("approved")}</option>
                    <option value="REJECTED">{t("reject")}</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelCouponEdit}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={submittingCoupon}>
                  {submittingCoupon ? tCommon("loading") : tCommon("save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Details Modal */}
      {viewingCouponId && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={closeCouponModal}
        >
          <div 
            className="relative w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl border-t sm:border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingCouponDetails ? (
              <div className="flex items-center justify-center p-12">
                <svg className="h-8 w-8 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : viewingCouponData ? (
              <>
                {/* Modal Header - Sticky on Mobile */}
                <div className="sticky top-0 z-10 border-b border-zinc-200 bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t("couponDetails")}</h2>
                    <button
                      onClick={closeCouponModal}
                      className="rounded-lg p-2 text-white transition hover:bg-white/20"
                    >
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Content - Responsive Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  {/* Left Column - Image & Analytics */}
                  <div className="lg:col-span-1 lg:border-r border-b lg:border-b-0 border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Coupon Image */}
                    {viewingCouponData.imagePath ? (
                      <div className="overflow-hidden rounded-xl">
                        <img 
                          src={viewingCouponData.imagePath} 
                          alt={viewingCouponData.title}
                          className="h-40 sm:h-48 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 sm:h-48 w-full items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20">
                        <svg className="h-12 w-12 sm:h-16 sm:w-16 text-violet-400 dark:text-violet-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    )}

                    {/* Analytics Section */}
                    {couponAnalytics && (
                      <div className="space-y-3">
                        <h3 className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Analytics</h3>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-2.5 sm:p-3 dark:border-zinc-800 dark:from-blue-950/20 dark:to-zinc-900">
                            <div className="mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                              <div className="rounded bg-blue-100 p-1 dark:bg-blue-900/30">
                                <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </div>
                              <span className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("views")}</span>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{couponAnalytics.views}</p>
                          </div>

                          <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-violet-50 to-white p-2.5 sm:p-3 dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-900">
                            <div className="mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                              <div className="rounded bg-violet-100 p-1 dark:bg-violet-900/30">
                                <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                              </div>
                              <span className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("clicks")}</span>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-violet-600 dark:text-violet-400">{couponAnalytics.clicks}</p>
                          </div>

                          <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-green-50 to-white p-2.5 sm:p-3 dark:border-zinc-800 dark:from-green-950/20 dark:to-zinc-900">
                            <div className="mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                              <div className="rounded bg-green-100 p-1 dark:bg-green-900/30">
                                <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("redemptions")}</span>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{couponAnalytics.redemptions}</p>
                          </div>

                          <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-amber-50 to-white p-2.5 sm:p-3 dark:border-zinc-800 dark:from-amber-950/20 dark:to-zinc-900">
                            <div className="mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                              <div className="rounded bg-amber-100 p-1 dark:bg-amber-900/30">
                                <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </div>
                              <span className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("saves")}</span>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">{couponAnalytics.saves || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Details */}
                  <div className="lg:col-span-2 p-4 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Title & Status */}
                    <div>
                      <div className="mb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 pr-2">{viewingCouponData.title}</h3>
                        <span className={`shrink-0 self-start sm:self-auto inline-flex rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold ${
                          viewingCouponData.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : viewingCouponData.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {viewingCouponData.status}
                        </span>
                      </div>
                      {viewingCouponData.description && (
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2">{viewingCouponData.description}</p>
                      )}
                    </div>

                    {/* Key Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("code")}</span>
                        <p className="mt-1 font-mono text-sm font-bold text-violet-600 dark:text-violet-400 break-all">{viewingCouponData.code}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("discountPercentage")}</span>
                        <p className="mt-1 text-base sm:text-lg font-bold text-violet-600 dark:text-violet-400">{viewingCouponData.discountPercentage}%</p>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("expirationDate")}</span>
                        <p className="mt-1 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {new Date(viewingCouponData.expirationDate).toLocaleDateString(locale, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("category")}</span>
                        <p className="mt-1 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {locale === "el" ? viewingCouponData.category?.nameEl : viewingCouponData.category?.nameEn}
                        </p>
                      </div>
                    </div>

                    {/* Business Information */}
                    {viewingCouponData.business && (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <h4 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("businessInformation")}</h4>
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">{t("businessName")}</span>
                            <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-50 break-words">{viewingCouponData.business.name}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">{t("businessEmail")}</span>
                            <p className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-50 break-all">{viewingCouponData.business.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          closeCouponModal()
                          handleEditCoupon(viewingCouponData)
                        }}
                        className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2.5 sm:py-2.5 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-700 hover:to-violet-800 hover:shadow-xl hover:shadow-violet-500/40"
                      >
                        {t("editCoupon")}
                      </button>
                      <button
                        onClick={closeCouponModal}
                        className="w-full sm:w-auto rounded-xl border border-zinc-300 bg-white px-4 py-2.5 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        {tCommon("close")}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setSelectedUserId(null)
            setSelectedUserProfile(null)
          }}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingProfile ? (
              <div className="flex items-center justify-center p-12">
                <svg className="h-8 w-8 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : selectedUserProfile ? (
              <>
                {/* Header */}
                <div className="sticky top-0 z-10 border-b border-zinc-200 bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white backdrop-blur-sm">
                        {selectedUserProfile.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedUserProfile.name}</h2>
                        <p className="text-sm text-violet-100">{selectedUserProfile.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUserId(null)
                        setSelectedUserProfile(null)
                      }}
                      className="rounded-lg p-2 text-white transition hover:bg-white/20"
                    >
                      <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/30">
                    <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("basicInformation")}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Role</p>
                        <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          selectedUserProfile.role === 'ADMIN' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : selectedUserProfile.role === 'BUSINESS'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {selectedUserProfile.role}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("memberSinceLabel")}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {new Date(selectedUserProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      {selectedUserProfile.membershipExpiry && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("membershipExpiry")}</p>
                          <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                            {new Date(selectedUserProfile.membershipExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {selectedUserProfile.phone && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("phone")}</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{selectedUserProfile.phone}</p>
                        </div>
                      )}
                      {selectedUserProfile.birthDate && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("birthDate")}</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {new Date(selectedUserProfile.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {selectedUserProfile.address && (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("address")}</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{selectedUserProfile.address}</p>
                        </div>
                      )}
                      {selectedUserProfile._count?.coupons !== undefined && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("totalCouponsUser")}</p>
                          <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">{selectedUserProfile._count.coupons}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About / Description */}
                  {(selectedUserProfile.about || selectedUserProfile.businessDescription) && (() => {
                    // Parse business description to extract only the raw text
                    let descriptionText = ''
                    let vatNumber = ''
                    
                    if (selectedUserProfile.role === 'BUSINESS' && selectedUserProfile.businessDescription) {
                      try {
                        const parsed = JSON.parse(selectedUserProfile.businessDescription)
                        descriptionText = parsed.raw || ''
                        vatNumber = parsed.vatNumber || ''
                      } catch {
                        descriptionText = selectedUserProfile.businessDescription
                      }
                    } else {
                      descriptionText = selectedUserProfile.about || ''
                    }
                    
                    // Only show section if there's actual description text
                    if (!descriptionText.trim()) return null
                    
                    return (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/30">
                        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {selectedUserProfile.role === 'BUSINESS' ? tProfile("businessDescription") : t("about")}
                        </h3>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                          {descriptionText}
                        </p>
                      </div>
                    )
                  })()}

                  {/* Business Information */}
                  {selectedUserProfile.role === 'BUSINESS' && (() => {
                    // Parse business description to extract VAT and other metadata
                    let vatNumber = ''
                    let city = ''
                    let postalCode = ''
                    
                    if (selectedUserProfile.businessDescription) {
                      try {
                        const parsed = JSON.parse(selectedUserProfile.businessDescription)
                        vatNumber = parsed.vatNumber || ''
                        city = parsed.city || ''
                        postalCode = parsed.postalCode || ''
                      } catch {
                        // Not JSON, ignore
                      }
                    }
                    
                    // Only show if there's at least one business detail
                    const hasDetails = selectedUserProfile.businessLocation || 
                                      selectedUserProfile.businessWebsite || 
                                      (selectedUserProfile.businessCategories && selectedUserProfile.businessCategories.length > 0) ||
                                      vatNumber || city || postalCode
                    
                    if (!hasDetails) return null
                    
                    return (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/30">
                        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("businessDetails")}</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {vatNumber && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("afmTaxId")}</p>
                              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{vatNumber}</p>
                            </div>
                          )}
                          {selectedUserProfile.businessLocation && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("location")}</p>
                              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{selectedUserProfile.businessLocation}</p>
                            </div>
                          )}
                          {city && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("city")}</p>
                              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{city}</p>
                            </div>
                          )}
                          {postalCode && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("postalCode")}</p>
                              <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{postalCode}</p>
                            </div>
                          )}
                          {selectedUserProfile.businessWebsite && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("website")}</p>
                              <a 
                                href={selectedUserProfile.businessWebsite} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-1 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
                              >
                                {selectedUserProfile.businessWebsite}
                              </a>
                            </div>
                          )}
                          {selectedUserProfile.businessCategories && selectedUserProfile.businessCategories.length > 0 && (
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Categories</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {selectedUserProfile.businessCategories.map((cat: any) => (
                                  <span key={cat.id || cat} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                    {typeof cat === 'object' ? (locale === 'el' ? cat.nameEl : cat.nameEn) : cat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Social Media */}
                  {(selectedUserProfile.businessInstagram || selectedUserProfile.businessFacebook || selectedUserProfile.businessTikTok) && (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/30">
                      <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("socialMedia")}</h3>
                      <div className="flex flex-wrap gap-3">
                        {selectedUserProfile.businessInstagram && (
                          <a 
                            href={selectedUserProfile.businessInstagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-pink-100 px-4 py-2 text-sm font-medium text-pink-700 transition hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.509-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z"/>
                            </svg>
                            Instagram
                          </a>
                        )}
                        {selectedUserProfile.businessFacebook && (
                          <a 
                            href={selectedUserProfile.businessFacebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                          </a>
                        )}
                        {selectedUserProfile.businessTikTok && (
                          <a 
                            href={selectedUserProfile.businessTikTok} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                            TikTok
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

