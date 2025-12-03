"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import Button from "@/components/Button"
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete"
import { useRouter } from "next/navigation"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AnimatePresence, motion } from 'framer-motion'
import QRScanner from "@/components/QRScanner"

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

const formatDiscount = (coupon: {
  discountType?: "PERCENT" | "FIXED" | "BOGO_1_1" | "BOGO_2_1"
  discountPercentage?: number | null
  discountAmount?: number | null
}) => {
  const discountType = coupon.discountType || "PERCENT"
  
  switch (discountType) {
    case "PERCENT":
      return `${coupon.discountPercentage || 0}%`
    case "FIXED":
      return `-€${(coupon.discountAmount || 0).toFixed(2)}`
    case "BOGO_1_1":
      return "1+1"
    case "BOGO_2_1":
      return "2+1"
    default:
      return `${coupon.discountPercentage || 0}%`
  }
}

const formatDiscountLabel = (coupon: {
  discountType?: "PERCENT" | "FIXED" | "BOGO_1_1" | "BOGO_2_1"
  discountPercentage?: number | null
  discountAmount?: number | null
}) => {
  const discountType = coupon.discountType || "PERCENT"
  
  switch (discountType) {
    case "PERCENT":
      return `${coupon.discountPercentage || 0}% OFF`
    case "FIXED":
      return `-€${(coupon.discountAmount || 0).toFixed(2)}`
    case "BOGO_1_1":
      return "Buy 1 Get 1"
    case "BOGO_2_1":
      return "Buy 2 Get 1"
    default:
      return `${coupon.discountPercentage || 0}% OFF`
  }
}

interface Coupon {
  id: string
  title: string
  description: string
  code: string | null
  couponType: "ONLINE_CODE" | "QR_CODE"
  discountType?: "PERCENT" | "FIXED" | "BOGO_1_1" | "BOGO_2_1"
  discountPercentage: number | null
  discountAmount: number | null
  expirationDate: string
  status: string
  imagePath: string | null
  usageLimitType?: "SINGLE_USE" | "MULTIPLE_USE" | "UNLIMITED"
  maxUsesPerUser?: number | null
  hasTimeRestrictions?: boolean
  validDays?: number[]
  validStartHour?: number | null
  validEndHour?: number | null
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
  const tRefer = useTranslations("dashboard.business.referBusiness")
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const section = searchParams.get("section") || "overview"
  

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTypeSelection, setShowTypeSelection] = useState(false)

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) {
        setShowForm(false)
        } else if (showTypeSelection) {
          setShowTypeSelection(false)
      }
    }
    }
    if (showForm || showTypeSelection) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showForm, showTypeSelection])
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const [resubmittingCouponId, setResubmittingCouponId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [invites, setInvites] = useState<any[]>([])
  const [inviteStats, setInviteStats] = useState<any>(null)
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)
  const lastRefreshedSection = useRef<string | null>(null)

  // Get invite link
  const inviteLink = session?.user?.id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/register/business?invite=${session.user.id}`
    : ""
  const [formErrors, setFormErrors] = useState<{
    title?: string
    description?: string
    code?: string
    categoryId?: string
    discountPercentage?: string
    discountAmount?: string
    expirationDate?: string
    maxUsesPerUser?: string
    validDays?: string
    validStartHour?: string
    validEndHour?: string
  }>({})
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    couponType: "ONLINE_CODE" as "ONLINE_CODE" | "QR_CODE",
    categoryId: "",
    discountType: "PERCENT" as "PERCENT" | "FIXED" | "BOGO_1_1" | "BOGO_2_1",
    discountPercentage: 10 as number | undefined,
    discountAmount: undefined as number | undefined,
    expirationDate: "",
    imagePath: "",
    usageLimitType: "SINGLE_USE" as "SINGLE_USE" | "MULTIPLE_USE" | "UNLIMITED",
    maxUsesPerUser: undefined as number | undefined,
    hasTimeRestrictions: false,
    validDays: [] as number[],
    validStartHour: undefined as number | undefined,
    validEndHour: undefined as number | undefined,
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
    businessLatitude: null as number | null,
    businessLongitude: null as number | null,
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
  const [overviewStats, setOverviewStats] = useState({
    views: 0,
    redemptions: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponsRes, categoriesRes, analyticsRes] = await Promise.all([
          fetch(`/api/coupons?businessId=${session?.user.id}`),
          fetch('/api/categories'),
          fetch('/api/business/analytics?period=365d'),
        ])

        // Check if responses are OK before parsing JSON
        if (!couponsRes.ok) {
          throw new Error(`Failed to fetch coupons: ${couponsRes.status}`)
        }
        if (!categoriesRes.ok) {
          throw new Error(`Failed to fetch categories: ${categoriesRes.status}`)
        }
        if (!analyticsRes.ok) {
          // Analytics is optional, so we'll continue even if it fails
        }

        const couponsData = await couponsRes.json()
        const categoriesData = await categoriesRes.json()
        let analyticsData = null
        if (analyticsRes.ok) {
          analyticsData = await analyticsRes.json()
        }

        setCoupons(couponsData.coupons || [])
        setCategories(categoriesData.categories || [])
        
        // Set overview stats (all-time views and redemptions)
        if (analyticsData.summary) {
          setOverviewStats({
            views: analyticsData.summary.views || 0,
            redemptions: analyticsData.summary.redemptions || 0
          })
        }
      } catch (error) {
        // Error handled by state
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
        setFormData(prev => ({ ...prev, imagePath: data.url }))
      }
      } catch (error) {
        // Error handled by state
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

    // Code is only required for ONLINE_CODE type
    if (formData.couponType === 'ONLINE_CODE') {
    if (!formData.code || formData.code.trim() === '') {
        errors.code = 'Coupon code is required for online coupons'
    } else if (formData.code.trim().length < 2) {
      errors.code = 'Coupon code must be at least 2 characters'
      }
    }

    if (!formData.categoryId || formData.categoryId === '') {
      errors.categoryId = 'Please select a category'
    }

    // Validate discount based on type
    if (formData.discountType === "PERCENT") {
      if (!formData.discountPercentage || formData.discountPercentage < 1) {
        errors.discountPercentage = 'Discount must be at least 1%'
      } else if (formData.discountPercentage > 100) {
        errors.discountPercentage = 'Discount cannot exceed 100%'
      }
    } else if (formData.discountType === "FIXED") {
      if (!formData.discountAmount || formData.discountAmount <= 0) {
        errors.discountAmount = 'Discount amount must be greater than 0'
      }
    }
    // BOGO types don't need validation

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

    // Validate usage limits
    if (formData.usageLimitType === 'MULTIPLE_USE') {
      if (!formData.maxUsesPerUser || formData.maxUsesPerUser < 1) {
        errors.maxUsesPerUser = tCouponForm('validationErrorMaxUsesRequired')
      }
    }

    // Validate time restrictions (only for QR_CODE)
    if (formData.couponType === 'QR_CODE' && formData.hasTimeRestrictions) {
      if (!formData.validDays || formData.validDays.length === 0) {
        errors.validDays = tCouponForm('validationErrorValidDaysRequired')
      }
      if (formData.validStartHour === undefined || formData.validEndHour === undefined) {
        errors.validStartHour = tCouponForm('validationErrorTimeRangeRequired')
      } else {
        if (formData.validStartHour < 0 || formData.validStartHour > 23 || 
            formData.validEndHour < 0 || formData.validEndHour > 23) {
          errors.validStartHour = tCouponForm('validationErrorHoursRange')
        } else if (formData.validStartHour >= formData.validEndHour) {
          errors.validStartHour = tCouponForm('validationErrorTimeRangeInvalid')
        }
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If editing, use the update handler instead
    if (editingCouponId) {
      handleUpdateCoupon(e)
      return
    }
    
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
          couponType: "ONLINE_CODE",
          categoryId: "",
          discountType: "PERCENT",
          discountPercentage: 10,
          discountAmount: undefined,
          expirationDate: "",
          imagePath: "",
          usageLimitType: "SINGLE_USE",
          maxUsesPerUser: undefined,
          hasTimeRestrictions: false,
          validDays: [],
          validStartHour: undefined,
          validEndHour: undefined,
        })
        setMessage({ type: 'success', text: 'Coupon created successfully! Waiting for admin approval.' })
      } else {
        const errorMessage = data.error || data.details?.[0]?.message || 'Failed to create coupon'
        setMessage({ type: 'error', text: errorMessage })
      }
    } catch (error) {
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
      code: coupon.code || "",
      couponType: coupon.couponType || "ONLINE_CODE",
      categoryId: coupon.category.id,
      discountType: coupon.discountType || "PERCENT",
      discountPercentage: coupon.discountPercentage || undefined,
      discountAmount: coupon.discountAmount || undefined,
      expirationDate: coupon.expirationDate.split('T')[0],
      imagePath: coupon.imagePath || "",
      usageLimitType: coupon.usageLimitType || "SINGLE_USE",
      maxUsesPerUser: coupon.maxUsesPerUser || undefined,
      hasTimeRestrictions: coupon.hasTimeRestrictions || false,
      validDays: coupon.validDays || [],
      validStartHour: coupon.validStartHour || undefined,
      validEndHour: coupon.validEndHour || undefined,
    })
    setShowForm(true) // Open the modal for editing
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
        setShowForm(false) // Close the modal after successful update
        setFormData({
          title: "",
          description: "",
          code: "",
          couponType: "ONLINE_CODE",
          categoryId: "",
          discountType: "PERCENT",
          discountPercentage: 10,
          discountAmount: undefined,
          expirationDate: "",
          imagePath: "",
          usageLimitType: "SINGLE_USE",
          maxUsesPerUser: undefined,
          hasTimeRestrictions: false,
          validDays: [],
          validStartHour: undefined,
          validEndHour: undefined,
        })
        setMessage({ type: 'success', text: 'Coupon updated successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update coupon' })
      }
      } catch (error) {
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
        setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setResubmittingCouponId(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleQRScan = async (token: string): Promise<{ success: boolean; message?: string; error?: string; isAlreadyRedeemed?: boolean }> => {
    try {
      const response = await fetch(`/api/coupons/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionToken: token })
      })

      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        // If response is not JSON, create error object
        const errorMessage = response.statusText || "Unknown error"
        setMessage({ 
          type: "error", 
          text: `✗ ${errorMessage}` 
        })
        setTimeout(() => setMessage(null), 5000)
        return {
          success: false,
          error: errorMessage,
          message: `HTTP ${response.status}: ${errorMessage}`
        }
      }

      // Check if response is successful (200) and valid
      if (response.ok && result.valid === true) {
        const messageText = `✓ ${result.message || "Coupon redeemed successfully"}\n\n${t("user") || "User"}: ${result.user?.name || "N/A"}`
        setMessage({ 
          type: "success", 
          text: messageText
        })
        setTimeout(() => setMessage(null), 5000)
        
        return {
          success: true,
          message: result.message || "Coupon redeemed successfully"
        }
      } else {
        // Handle error response - check if already redeemed
        const errorMsg = result.message || result.error || "Invalid coupon"
        const errorLower = errorMsg.toLowerCase()
        const isAlreadyRedeemed = 
          errorLower.includes("already") || 
          errorLower.includes("redeemed") ||
          errorLower.includes("γίνει redeem") ||
          errorLower.includes("ήδη") ||
          result.redeemedAt !== undefined ||
          (result.error && result.error.toLowerCase().includes("already"))
        
        const messageText = isAlreadyRedeemed 
          ? `⚠ Already Redeemed\n\nThis coupon was used before.` 
          : `✗ ${errorMsg}`
        
        setMessage({ 
          type: "error", 
          text: messageText
        })
        setTimeout(() => setMessage(null), 5000)
        
        return {
          success: false,
          error: errorMsg,
          message: errorMsg,
          isAlreadyRedeemed
        }
      }
    } catch (error) {
      const errorMessage = t("qrScanError") || "Error validating QR code"
      setMessage({ 
        type: "error", 
        text: `✗ ${errorMessage}` 
      })
      setTimeout(() => setMessage(null), 5000)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const cancelEdit = () => {
    setEditingCouponId(null)
    setShowForm(false) // Close the modal
    setFormData({
      title: "",
      description: "",
      code: "",
      couponType: "ONLINE_CODE",
      categoryId: "",
      discountType: "PERCENT",
      discountPercentage: 10,
      discountAmount: undefined,
      expirationDate: "",
      imagePath: "",
      usageLimitType: "SINGLE_USE",
      maxUsesPerUser: undefined,
      hasTimeRestrictions: false,
      validDays: [],
      validStartHour: undefined,
      validEndHour: undefined,
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
          businessLatitude: profile.businessLatitude ?? null,
          businessLongitude: profile.businessLongitude ?? null,
          businessWebsite: profile.businessWebsite ?? "",
          businessInstagram: profile.businessInstagram ?? "",
          businessFacebook: profile.businessFacebook ?? "",
          businessTikTok: profile.businessTikTok ?? "",
        })
      } catch (error) {
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
          setAnalytics(null)
        }
      } catch (error) {
        setAnalytics(null)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetchAnalytics()
  }, [section, dateRange, session?.user?.id])

  // Fetch invites
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
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoadingInvites(false)
      }
    }

    fetchInvites()
  }, [session, section])

  // Refresh session when viewing referBusiness section to get latest membership data
  useEffect(() => {
    if (session && section === "referBusiness" && lastRefreshedSection.current !== section) {
      lastRefreshedSection.current = section
      update().catch(() => {
        // Silently fail - session might already be up to date
      })
    }
  }, [section, session, update])

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
        businessLatitude: profileData.businessLatitude,
        businessLongitude: profileData.businessLongitude,
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
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-gray-100 dark:bg-zinc-800 p-6">
            <div className="h-3 w-24 bg-gray-300 dark:bg-zinc-700 rounded mb-4"></div>
            <div className="h-8 w-16 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
            <div className="h-3 w-20 bg-gray-300 dark:bg-zinc-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <div className="h-10 w-10 bg-gray-200 dark:bg-zinc-700 rounded-lg mb-4"></div>
            <div className="h-5 w-24 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Recent Coupons Skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="h-6 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-4"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-200 dark:border-zinc-800 last:border-0">
            <div className="h-16 w-16 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-300 dark:bg-zinc-700 rounded mb-2"></div>
              <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="h-5 w-5 bg-gray-200 dark:bg-zinc-700 rounded"></div>
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
    <div className="mb-8 grid gap-4 sm:grid-cols-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
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
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  {t("scanQRButton") || "Scan QR"}
                </button>
                <button
                  onClick={() => {
                    setShowTypeSelection(true)
                    setEditingCouponId(null)
                  }}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition-all duration-200 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] dark:from-green-500 dark:to-green-600 dark:shadow-green-500/20 dark:hover:from-green-600 dark:hover:to-green-700"
                >
                  <svg className="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                  {t("createCoupon")}
                </button>
              </div>
            </div>

            {loading ? (
              <OverviewSkeleton />
            ) : (
              <>
                {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">{t("stats.totalCoupons")}</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">{stats.total}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{t("stats.allTime")}</p>
                </div>
                </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 transition hover:shadow-md dark:from-blue-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-200/50 blur-2xl dark:bg-blue-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">{t("stats.views")}</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{overviewStats.views.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{t("stats.totalViews")}</p>
                </div>
                </div>
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">{t("stats.redemptions")}</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">{overviewStats.redemptions.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{t("stats.totalRedemptions")}</p>
            </div>
              </div>
                </div>

                  {/* Quick Actions */}
                    <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                  <h2 className="mb-6 text-base font-semibold text-gray-900 dark:text-white">{t("quickActions")}</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                      onClick={() => {
                        setShowTypeSelection(true)
                        setEditingCouponId(null)
                      }}
                      className="group w-full flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100/50 p-4 text-left transition-all hover:from-green-100 hover:to-green-200/50 hover:shadow-md hover:shadow-green-500/10 active:scale-[0.98] dark:from-green-900/30 dark:to-green-900/20 dark:hover:from-green-900/40 dark:hover:to-green-900/30"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md group-hover:scale-110 transition-transform">
                        <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 4v16m8-8H4" />
                            </svg>
                  </div>
                          <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t("createCoupon")}</p>
                        <p className="text-xs text-gray-600 dark:text-zinc-400">Add a new discount</p>
                  </div>
                    </button>
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
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="group flex items-center gap-3 rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100 dark:bg-zinc-800/30 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t("scanQRButton") || "Scan QR Code"}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">{t("scanQRDescription") || "Redeem customer coupons"}</p>
                  </div>
                    </button>
                </div>
                </div>

                {/* Recent Coupons */}
                {coupons.length > 0 && (
                  <div className="rounded-2xl bg-white p-6 dark:bg-zinc-900/50">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Coupons</h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Your latest coupon activity</p>
                      </div>
                      <Link
                        href={`/${locale}/dashboard/business?section=coupons`}
                        className="text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        View all →
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {coupons
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 3)
                        .map((coupon) => (
                          <Link
                            key={coupon.id}
                            href={`/${locale}/dashboard/business?section=coupons`}
                            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-green-300 hover:bg-green-50/50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-800/30 dark:hover:border-green-700 dark:hover:bg-green-900/20"
                          >
                            {/* Image */}
                            {coupon.imagePath ? (
                              <div className="flex-shrink-0">
                                <img
                                  src={coupon.imagePath}
                                  alt={coupon.title}
                                  className="h-16 w-16 rounded-lg object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
                                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                  {coupon.title}
                                </h3>
                                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  coupon.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  coupon.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {t(coupon.status.toLowerCase())}
                                </span>
                              </div>
                              <p className="truncate text-xs text-gray-600 dark:text-zinc-400 mb-2">
                                {coupon.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                {coupon.couponType === "ONLINE_CODE" && coupon.code && (
                                  <span className="text-gray-500 dark:text-zinc-500">
                                    Code: <span className="font-medium text-gray-700 dark:text-zinc-300">{coupon.code}</span>
                                  </span>
                                )}
                                {coupon.couponType === "QR_CODE" && (
                                  <span className="text-gray-500 dark:text-zinc-500">
                                    QR Code
                                  </span>
                                )}
                                <span className="text-gray-400 dark:text-zinc-600">•</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {formatDiscountLabel(coupon)}
                                </span>
                                <span className="text-gray-400 dark:text-zinc-600">•</span>
                                <span className="text-gray-500 dark:text-zinc-500">
                                  {formatExpirationDate(coupon.expirationDate, locale)}
                                </span>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-gray-400 transition group-hover:text-green-600 dark:text-zinc-500 dark:group-hover:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className={`animate-in slide-in-from-top-2 fade-in duration-300 rounded-xl border-2 p-4 shadow-lg ${
                  message.type === 'success' 
                  ? 'border-green-300/50 bg-gradient-to-br from-green-50 via-green-50/80 to-emerald-50 text-green-900 dark:border-green-700/50 dark:from-green-900/40 dark:via-green-900/30 dark:to-emerald-900/40 dark:text-green-200 shadow-green-500/10'
                  : 'border-red-300/50 bg-gradient-to-br from-red-50 via-red-50/80 to-rose-50 text-red-900 dark:border-red-700/50 dark:from-red-900/40 dark:via-red-900/30 dark:to-rose-900/40 dark:text-red-200 shadow-red-500/10'
                }`}>
                <div className="flex items-start gap-3">
                    {message.type === 'success' ? (
                    <div className="flex-shrink-0 rounded-full bg-green-500 p-2 shadow-md shadow-green-500/30 animate-in zoom-in duration-300">
                      <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    ) : (
                    <div className="flex-shrink-0 rounded-full bg-red-500 p-2 shadow-md shadow-red-500/30 animate-in zoom-in duration-300">
                      <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-relaxed whitespace-pre-line break-words">{message.text}</p>
                  </div>
                  </div>
                </div>
              )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Basic Information */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-green-950/20 dark:to-zinc-900">
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25 dark:from-green-600 dark:to-green-700">
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
                      className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
                      />
                    </div>
                      <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Description</label>
                      <textarea
                        rows={4}
                        value={profileData.businessDescription}
                        onChange={(e) => setProfileData({ ...profileData, businessDescription: e.target.value })}
                      placeholder="Describe your business, services, and what makes you unique..."
                      className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800 resize-none" 
                      />
                    </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-zinc-300">Category</label>
                        <select
                          value={profileData.businessCategories}
                          onChange={(e) => setProfileData({ ...profileData, businessCategories: e.target.value })}
                        className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 pr-10 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800 appearance-none"
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
                      <GooglePlacesAutocomplete
                        value={profileData.businessLocation}
                        onChange={(value) => setProfileData({ ...profileData, businessLocation: value })}
                        onCoordinatesChange={(lat, lng) => {
                          setProfileData({ ...profileData, businessLatitude: lat, businessLongitude: lng })
                        }}
                        placeholder="e.g., Athens, Greece"
                        locale={locale}
                        className="block w-full rounded-xl border-0 bg-gray-50/80 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800"
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
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
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
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
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
                        className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
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
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
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
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
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
                          className="block w-full rounded-xl border-0 bg-gray-50/80 pl-12 pr-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:bg-zinc-800" 
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
                  className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all duration-200 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:from-green-500 dark:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700"
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
                className="rounded-lg border-0 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:bg-zinc-800"
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
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                    <div className="relative">
                      <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">Conversion</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
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
                  <div className="rounded-2xl bg-gradient-to-br from-green-50/50 to-white p-5 dark:from-green-950/20 dark:to-zinc-800/30">
                    <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">Overall</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
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
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl md:text-4xl">
                {tRefer("title")}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400 sm:text-base">
                {tRefer("subtitle")}
              </p>
            </div>

            {/* Invite Link Card */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm dark:border-zinc-800 dark:from-green-950/20 dark:to-zinc-900">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {tRefer("inviteLink")}
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-zinc-400">
                {tRefer("description")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 break-all">
                  {inviteLink || tCommon("loading")}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
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
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    {tRefer("stats.total")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {inviteStats.total || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    {tRefer("stats.pending")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {inviteStats.pending || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    {tRefer("stats.registered")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {inviteStats.registered || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {tRefer("freeMonthsEarned")}
                    </h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {inviteStats.rewardsGranted} {inviteStats.rewardsGranted === 1 ? "month" : "months"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                      {tRefer("freeMonthsDescription")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Invited Businesses List */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tRefer("invitedBusinesses")}
                </h2>
              </div>
              {loadingInvites ? (
                <div className="p-8 text-center text-gray-600 dark:text-zinc-400">
                  {tCommon("loading")}
                </div>
              ) : invites.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {tRefer("noInvites")}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
                    {tRefer("noInvitesDescription")}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {invites.map((invite) => (
                    <div key={invite.id} className="p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {invite.invitedBusiness?.name || "Unknown Business"}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }

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
              <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-white px-6 py-4 dark:border-zinc-800 dark:from-green-950/20 dark:to-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25 dark:from-green-600 dark:to-green-700">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all duration-200 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98] dark:from-green-500 dark:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700"
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
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-green-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:bg-zinc-700 dark:peer-focus:ring-green-800 dark:peer-checked:bg-green-500"></div>
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 dark:bg-zinc-300"></span>
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
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
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-green-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:bg-zinc-700 dark:peer-focus:ring-green-800 dark:peer-checked:bg-green-500"></div>
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
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-green-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:bg-zinc-700 dark:peer-focus:ring-green-800 dark:peer-checked:bg-green-500"></div>
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
        onCreateCoupon={() => {
          setShowTypeSelection(true)
          setEditingCouponId(null)
        }}
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
                    <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                      {/* Total Coupons */}
                      <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-50 to-white p-4 sm:p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                        <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                        <div className="relative">
                          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">Total</p>
                          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
                            {stats.total}
                          </p>
                          <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500">All coupons</p>
                        </div>
                      </div>

                      {/* Pending */}
                      <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-white p-4 sm:p-6 transition hover:shadow-md dark:from-amber-950/20 dark:to-zinc-800/30">
                        <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-200/50 blur-2xl dark:bg-amber-900/30"></div>
                        <div className="relative">
                          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">{t("pending")}</p>
                          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                            {stats.pending}
                          </p>
                          <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500">Awaiting review</p>
                        </div>
                      </div>

                      {/* Approved */}
                      <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-50 to-white p-4 sm:p-6 transition hover:shadow-md dark:from-green-950/20 dark:to-zinc-800/30">
                        <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-200/50 blur-2xl dark:bg-green-900/30"></div>
                        <div className="relative">
                          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">{t("approved")}</p>
                          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">
                            {stats.approved}
                          </p>
                          <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500">Active now</p>
                        </div>
                      </div>

                      {/* Rejected */}
                      <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-50 to-white p-4 sm:p-6 transition hover:shadow-md dark:from-red-950/20 dark:to-zinc-800/30">
                        <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-red-200/50 blur-2xl dark:bg-red-900/30"></div>
                        <div className="relative">
                          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-red-600 dark:text-red-400">{t("rejected")}</p>
                          <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                            {stats.rejected}
                          </p>
                          <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500">Not approved</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

            {/* Header with Create Button */}
            <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Coupons</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-zinc-400">Manage your discount offers</p>
              </div>
              <button
                onClick={() => {
                  setShowTypeSelection(true)
                  setEditingCouponId(null)
                }}
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition-all duration-200 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] dark:from-green-500 dark:to-green-600 dark:shadow-green-500/20 dark:hover:from-green-600 dark:hover:to-green-700"
              >
                <svg className="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                {t("createCoupon")}
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="mb-4 sm:mb-6 overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-1 p-1 overflow-x-auto">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 min-w-[80px] sm:min-w-0 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                      filterStatus === status
                        ? "bg-green-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {status === "ALL" ? t("all") : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupons List */}
            {loading ? (
              <CouponsListSkeleton />
            ) : filteredCoupons.length === 0 ? (
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  No coupons found
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 px-4">
                  {filterStatus === "ALL" 
                    ? "You haven't created any coupons yet. Click the button above to create your first coupon!"
                    : `You don't have any ${filterStatus.toLowerCase()} coupons.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="group rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      {/* Image */}
                      {coupon.imagePath ? (
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <img
                            src={coupon.imagePath}
                            alt={coupon.title}
                            className="h-32 sm:h-20 w-full sm:w-20 rounded-lg object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-32 sm:h-20 w-full sm:w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
                          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                {coupon.title}
                              </h3>
                              <span className={`self-start sm:self-auto flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(coupon.status)}`}>
                                {t(coupon.status.toLowerCase())}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mb-3 line-clamp-2 sm:line-clamp-2">
                              {coupon.description}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-4 sm:gap-y-1 text-xs sm:text-sm">
                              {coupon.couponType === "ONLINE_CODE" && coupon.code && (
                                <span className="text-gray-600 dark:text-zinc-400">
                                  Code: <span className="font-medium text-gray-900 dark:text-white">{coupon.code}</span>
                                </span>
                              )}
                              {coupon.couponType === "QR_CODE" && (
                                <span className="text-gray-600 dark:text-zinc-400">QR Code</span>
                              )}
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {formatDiscountLabel(coupon)}
                              </span>
                              <span className="text-gray-600 dark:text-zinc-400">
                                Expires: {formatExpirationDate(coupon.expirationDate, locale)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 sm:flex-shrink-0">
                            <button
                              onClick={() => handleEditCoupon(coupon)}
                              className="flex-1 sm:flex-initial rounded-lg border border-gray-300 bg-white px-4 py-2 sm:p-2 text-sm sm:text-base text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                              title="Edit"
                            >
                              <span className="sm:hidden">Edit</span>
                              <svg className="hidden sm:block h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingCouponId(coupon.id)}
                              className="flex-1 sm:flex-initial rounded-lg border border-red-300 bg-white px-4 py-2 sm:p-2 text-sm sm:text-base text-red-600 transition hover:bg-red-50 hover:text-red-900 dark:border-red-700 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              title="Delete"
                            >
                              <span className="sm:hidden">Delete</span>
                              <svg className="hidden sm:block h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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

      {/* Coupon Type Selection Modal - Always available */}
      {showTypeSelection && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTypeSelection(false)
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"></div>
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-zinc-900 overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tCouponForm("couponType")}</h3>
              <button
                onClick={() => setShowTypeSelection(false)}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5">
              <div className="space-y-3">
                {/* Online Code Option */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, couponType: "ONLINE_CODE", code: "" }))
                    setShowTypeSelection(false)
                    setShowForm(true)
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-green-500 hover:bg-green-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-green-500 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white">{tCouponForm("onlineCode")}</div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{tCouponForm("onlineCodeDescription")}</div>
                    </div>
                  </div>
                </button>

                {/* QR Code Option */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, couponType: "QR_CODE", code: "" }))
                    setShowTypeSelection(false)
                    setShowForm(true)
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-green-500 hover:bg-green-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-green-500 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white">{tCouponForm("qrCode")}</div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{tCouponForm("qrCodeDescription")}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Coupon Modal - Always available */}
            {showForm && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowForm(false)
                    setEditingCouponId(null) // Clear editing state when closing
                  }
                }}
              >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity dark:bg-black/80"></div>
                
                {/* Modal */}
                <div className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl flex flex-col bg-white shadow-2xl dark:bg-zinc-900 overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
                  {/* Header */}
                  <div className="relative flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-br from-green-50 via-green-50/50 to-white px-4 py-4 sm:px-6 sm:py-5 dark:border-zinc-800 dark:from-green-950/30 dark:via-green-950/20 dark:to-zinc-900">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25 dark:from-green-600 dark:to-green-700">
                        {editingCouponId ? (
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                          {editingCouponId ? "Edit Coupon" : "Create New Coupon"}
                        </h3>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-zinc-400 truncate">
                          {editingCouponId ? "Update your coupon details" : "Add a new discount offer to your business"}
                        </p>
              </div>
                  </div>
                    <button
                      onClick={() => {
                        setShowForm(false)
                        setEditingCouponId(null) // Clear editing state when closing
                      }}
                      className="ml-2 flex-shrink-0 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 touch-manipulation"
                      aria-label="Close modal"
                    >
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                    </button>
              </div>

                  {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-6">
                    {/* Error/Success Message */}
              {message && (
                <div className={`mb-6 animate-in slide-in-from-top-2 fade-in duration-300 rounded-xl border-2 p-4 ${
                  message.type === 'success' 
                    ? 'border-green-300 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200'
                    : 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                }`}>
                        <div className="flex items-start gap-3">
                    {message.type === 'success' ? (
                      <div className="flex-shrink-0 rounded-full bg-green-500 p-2">
                        <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                    ) : (
                      <div className="flex-shrink-0 rounded-full bg-orange-500 p-2">
                        <svg className="h-5 w-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-relaxed whitespace-pre-line break-words">{message.text}</p>
                    </div>
              </div>
            </div>
              )}

              <form id="create-coupon-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      </div>
              <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tCouponForm("basicInformation")}</h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">{tCouponForm("basicInformationDescription")}</p>
                    </div>
                  </div>
                        
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
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
                        className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                                formErrors.title 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                            : 'bg-gray-50 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.title && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formErrors.title}
                              </p>
                            )}
              </div>

              <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
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
                        placeholder="Describe your coupon offer in detail. What makes it special?"
                        className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 resize-none ${
                                formErrors.description 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                            : 'bg-gray-50 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.description && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                                {formErrors.description}
                              </p>
                            )}
                          </div>
                        </div>
              </div>

                {/* Coupon Details Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                        </div>
                <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tCouponForm("couponDetails")}</h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">{tCouponForm("couponDetailsDescription")}</p>
                    </div>
                  </div>

                  {/* Coupon Type Display (Read-only) */}
                  <div className="mb-6">
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                      <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {tCouponForm("couponType")}
                    </label>
                    <div className="rounded-xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 p-4 dark:border-green-500 dark:from-green-900/30 dark:to-green-900/20">
                      <div className="flex items-center gap-3">
                        {formData.couponType === "ONLINE_CODE" ? (
                          <>
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-green-700 dark:text-green-300">{tCouponForm("onlineCode")}</div>
                              <div className="text-xs text-gray-600 dark:text-zinc-400">{tCouponForm("onlineCodeDescription")}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-green-700 dark:text-green-300">{tCouponForm("qrCode")}</div>
                              <div className="text-xs text-gray-600 dark:text-zinc-400">{tCouponForm("qrCodeDescription")}</div>
                            </div>
                          </>
                        )}
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {formData.couponType === "ONLINE_CODE" && (
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                              {tCouponForm("code")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                          required={formData.couponType === "ONLINE_CODE"}
                    value={formData.code}
                              onChange={(e) => {
                                setFormData({ ...formData, code: e.target.value })
                                if (formErrors.code) {
                                  setFormErrors({ ...formErrors, code: undefined })
                                }
                              }}
                          placeholder="e.g., SUMMER2024"
                          className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                                formErrors.code 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                              : 'bg-gray-50 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.code && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formErrors.code}
                              </p>
                            )}
                </div>
                    )}

                <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
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
                        className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>')] bg-[length:1.5rem] bg-[right_0.75rem_center] bg-no-repeat ${
                                formErrors.categoryId 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                            : 'bg-gray-50 dark:bg-zinc-800/50'
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
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formErrors.categoryId}
                              </p>
                            )}
              </div>

                {/* Discount Type */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {tCouponForm("discountType")} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: "PERCENT", discountAmount: undefined })}
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                        formData.discountType === "PERCENT"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: "FIXED", discountPercentage: undefined })}
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                        formData.discountType === "FIXED"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      -€
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: "BOGO_1_1", discountPercentage: undefined, discountAmount: undefined })}
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                        formData.discountType === "BOGO_1_1"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      1+1
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: "BOGO_2_1", discountPercentage: undefined, discountAmount: undefined })}
                      className={`rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                        formData.discountType === "BOGO_2_1"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      2+1
                    </button>
                  </div>
                </div>

                {/* Discount Value - Conditional based on type */}
                {formData.discountType === "PERCENT" && (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                      <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {tCouponForm("discountPercentage")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required={formData.discountType === "PERCENT"}
                        min="1"
                        max="100"
                        value={formData.discountPercentage || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || undefined })
                          if (formErrors.discountPercentage) {
                            setFormErrors({ ...formErrors, discountPercentage: undefined })
                          }
                        }}
                        placeholder="20"
                        className={`block w-full rounded-xl border-0 px-4 py-3 pr-12 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                          formErrors.discountPercentage 
                            ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                            : 'bg-gray-50 dark:bg-zinc-800/50'
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-green-600 dark:text-green-400 pointer-events-none">%</span>
                    </div>
                    {formErrors.discountPercentage && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.discountPercentage}
                      </p>
                    )}
                  </div>
                )}

                {formData.discountType === "FIXED" && (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                      <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {tCouponForm("discountAmount")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required={formData.discountType === "FIXED"}
                        min="0.01"
                        step="0.01"
                        value={formData.discountAmount || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || undefined })
                          if (formErrors.discountAmount) {
                            setFormErrors({ ...formErrors, discountAmount: undefined })
                          }
                        }}
                        placeholder="5.00"
                        className={`block w-full rounded-xl border-0 px-4 py-3 pr-12 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                          formErrors.discountAmount 
                            ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                            : 'bg-gray-50 dark:bg-zinc-800/50'
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-green-600 dark:text-green-400 pointer-events-none">€</span>
                    </div>
                    {formErrors.discountAmount && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.discountAmount}
                      </p>
                    )}
                  </div>
                )}

                {(formData.discountType === "BOGO_1_1" || formData.discountType === "BOGO_2_1") && (
                  <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {formData.discountType === "BOGO_1_1" 
                        ? "Buy 1, Get 1 Free - Customer gets one item free when buying one item"
                        : "Buy 2, Get 1 Free - Customer gets one item free when buying two items"}
                    </p>
                  </div>
                )}

                <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
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
                        className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                                formErrors.expirationDate 
                                  ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                            : 'bg-gray-50 dark:bg-zinc-800/50'
                              }`}
                            />
                            {formErrors.expirationDate && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                                {formErrors.expirationDate}
                              </p>
                            )}
                          </div>
                </div>
              </div>

                {/* Usage Limits Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tCouponForm("usageLimits")}</h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">{tCouponForm("usageLimitsDescription")}</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {tCouponForm("usageLimitType")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.usageLimitType}
                        onChange={(e) => {
                          const newType = e.target.value as "SINGLE_USE" | "MULTIPLE_USE" | "UNLIMITED"
                          setFormData({ 
                            ...formData, 
                            usageLimitType: newType,
                            maxUsesPerUser: newType === "MULTIPLE_USE" ? formData.maxUsesPerUser : undefined
                          })
                          if (formErrors.maxUsesPerUser) {
                            setFormErrors({ ...formErrors, maxUsesPerUser: undefined })
                          }
                        }}
                        className="block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 appearance-none bg-gray-50 dark:bg-zinc-800/50"
                      >
                        <option value="SINGLE_USE">{tCouponForm("singleUse")}</option>
                        <option value="MULTIPLE_USE">{tCouponForm("multipleUses")}</option>
                        <option value="UNLIMITED">{tCouponForm("unlimited")}</option>
                      </select>
                    </div>

                    {formData.usageLimitType === "MULTIPLE_USE" && (
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          {tCouponForm("maxUsesPerUser")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.maxUsesPerUser || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : undefined
                            setFormData({ ...formData, maxUsesPerUser: value })
                            if (formErrors.maxUsesPerUser) {
                              setFormErrors({ ...formErrors, maxUsesPerUser: undefined })
                            }
                          }}
                          placeholder="e.g., 5"
                          className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                            formErrors.maxUsesPerUser 
                              ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                              : 'bg-gray-50 dark:bg-zinc-800/50'
                          }`}
                        />
                        {formErrors.maxUsesPerUser && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formErrors.maxUsesPerUser}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Validity Schedule Card - Only for QR_CODE coupons */}
                {formData.couponType === "QR_CODE" && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-pink-600">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tCouponForm("qrValiditySchedule")}</h3>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">{tCouponForm("qrValidityScheduleDescription")}</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {tCouponForm("enableTimeRestrictions")}
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ 
                                ...formData, 
                                hasTimeRestrictions: true 
                              })
                            }}
                            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                              formData.hasTimeRestrictions
                                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ 
                                ...formData, 
                                hasTimeRestrictions: false,
                                validDays: [],
                                validStartHour: undefined,
                                validEndHour: undefined
                              })
                              setFormErrors({
                                ...formErrors,
                                validDays: undefined,
                                validStartHour: undefined,
                                validEndHour: undefined
                              })
                            }}
                            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                              !formData.hasTimeRestrictions
                                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>

                      {formData.hasTimeRestrictions && (
                        <>
                          <div>
                            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {tCouponForm("validDays")} <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                              {[
                                { value: 1, label: tCouponForm("monday") },
                                { value: 2, label: tCouponForm("tuesday") },
                                { value: 3, label: tCouponForm("wednesday") },
                                { value: 4, label: tCouponForm("thursday") },
                                { value: 5, label: tCouponForm("friday") },
                                { value: 6, label: tCouponForm("saturday") },
                                { value: 0, label: tCouponForm("sunday") },
                              ].map((day) => (
                                <label
                                  key={day.value}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                                    formData.validDays?.includes(day.value)
                                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.validDays?.includes(day.value) || false}
                                    onChange={(e) => {
                                      const currentDays = formData.validDays || []
                                      const newDays = e.target.checked
                                        ? [...currentDays, day.value]
                                        : currentDays.filter((d) => d !== day.value)
                                      setFormData({ ...formData, validDays: newDays })
                                      if (formErrors.validDays) {
                                        setFormErrors({ ...formErrors, validDays: undefined })
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  {day.label}
                                </label>
                              ))}
                            </div>
                            {formErrors.validDays && (
                              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formErrors.validDays}
                              </p>
                            )}
                          </div>

                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {tCouponForm("startHour")} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                max="23"
                                value={formData.validStartHour ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : undefined
                                  setFormData({ ...formData, validStartHour: value })
                                  if (formErrors.validStartHour) {
                                    setFormErrors({ ...formErrors, validStartHour: undefined })
                                  }
                                }}
                                placeholder="0-23"
                                className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                                  formErrors.validStartHour 
                                    ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                    : 'bg-gray-50 dark:bg-zinc-800/50'
                                }`}
                              />
                              {formErrors.validStartHour && (
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                  <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formErrors.validStartHour}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {tCouponForm("endHour")} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                max="23"
                                value={formData.validEndHour ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : undefined
                                  setFormData({ ...formData, validEndHour: value })
                                  if (formErrors.validEndHour) {
                                    setFormErrors({ ...formErrors, validEndHour: undefined })
                                  }
                                }}
                                placeholder="0-23"
                                className={`block w-full rounded-xl border-0 px-4 py-3 text-base text-gray-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:shadow-lg focus:shadow-green-500/10 dark:text-zinc-100 dark:focus:bg-zinc-800 ${
                                  formErrors.validEndHour 
                                    ? 'bg-red-50 ring-2 ring-red-500/30 focus:ring-red-500/30 dark:bg-red-900/10' 
                                    : 'bg-gray-50 dark:bg-zinc-800/50'
                                }`}
                              />
                              {formErrors.validEndHour && (
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                  <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formErrors.validEndHour}
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Upload Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
              <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tCouponForm("imageSectionTitle")}</h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">{tCouponForm("imageSectionDescription")}</p>
                          </div>
                  </div>

                  <div className="space-y-4">
                    {!formData.imagePath ? (
                      <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-green-400 hover:bg-green-50/30 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-green-600 dark:hover:bg-green-900/20">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                          className="hidden"
                        />
                        {uploadingImage ? (
                          <div className="flex flex-col items-center gap-3">
                            <svg className="h-12 w-12 animate-spin text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">{tCommon("loading")}...</span>
                      </div>
                        ) : (
                          <>
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
                              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                </div>
                            <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                              {tCouponForm("clickToUpload")}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                              {tCouponForm("imageFormats")}
                            </p>
                          </>
                        )}
                      </label>
                    ) : (
                      <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-700 dark:from-zinc-800/50 dark:to-zinc-800/30">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="relative flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={formData.imagePath}
                      alt="Preview"
                                className="h-20 w-20 object-cover ring-2 ring-gray-200 dark:ring-zinc-700"
                                    />
                    </div>
                                  <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{tCouponForm("imageUploaded")}</p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">{tCouponForm("readyToUse")}</p>
                  </div>
                    </div>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, imagePath: "" })}
                            className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                >
                            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200/50 bg-white/95 backdrop-blur-sm px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-5 dark:border-zinc-800 dark:bg-zinc-900/95">
                    <p className="hidden text-xs font-medium text-gray-500 dark:text-zinc-400 sm:block">
                      <span className="text-red-500">*</span> Required fields
                    </p>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingCouponId(null) // Clear editing state when canceling
                        }}
                  className="w-full rounded-xl border-2 border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:border-zinc-600 sm:w-auto"
                      >
                  {tCommon("cancel")}
                      </button>
                      <button
                        type="submit"
                        form="create-coupon-form"
                        disabled={submitting || uploadingImage}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all duration-200 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:from-green-500 dark:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700 sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                      <span>{editingCouponId ? "Saving..." : tCouponForm("creating")}</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7" />
                </svg>
                            <span>{editingCouponId ? tCouponForm("update") : tCouponForm("submit")}</span>
                          </>
              )}
                      </button>
            </div>
          </div>
                </div>
          </div>
        )}

      {showQRScanner && (
        <QRScanner 
          onScanSuccess={handleQRScan} 
          onClose={() => {
            setShowQRScanner(false)
            setMessage(null)
          }}
          onRedemptionError={(errorMessage: string) => {
            // This will be handled by the QRScanner component internally
          }}
        />
      )}

      {/* Floating QR Scanner Button - Always visible */}
                    <button
        onClick={() => setShowQRScanner(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-indigo-600 p-2.5 sm:p-3 text-white shadow-lg transition hover:bg-indigo-700 hover:scale-105 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600 touch-manipulation"
        title={t("scanQRButton") || "Scan QR Code"}
        aria-label={t("scanQRButton") || "Scan QR Code"}
      >
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                    </button>
    </div>
  )
}

