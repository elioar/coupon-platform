"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import Button from "@/components/Button"
import { EditDealModal } from "@/components/EditDealModal"

interface PendingDeal {
  id: string
  title: string
  description: string
  category: string
  location: string
  imageUrl: string
  couponCode: string | null
  expiresAt: string
  sourceUrl: string | null
  sourceType: "USER" | "AI"
  createdAt: string
  link?: string | null
  priceValue?: string | null
  priceType?: "EUR" | "PERCENT" | "ONE_PLUS_ONE" | "TWO_PLUS_ONE" | "FREE" | "OTHER" | null
  merchantName?: string | null
  origin?: "GR" | "INTERNATIONAL" | null
  startsAt?: string | null
  extraInfo?: string | null
  redeemSteps?: string | null
  user: {
    id: string
    name: string
    email: string
  }
}

export default function CommunityImportPage() {
  const { data: session } = useSession()
  const t = useTranslations("dashboard.admin")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string

  const [pendingDeals, setPendingDeals] = useState<PendingDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [editingDeal, setEditingDeal] = useState<PendingDeal | null>(null)
  const [saving, setSaving] = useState(false)
  const [processingDeal, setProcessingDeal] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string>("")
  const [importProgress, setImportProgress] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const QUICK_URLS_KEY = "community-import-quick-urls"
  const defaultQuickUrls: { id: string; label: string; url: string }[] = [
    { id: "1", label: "Lagonika.gr", url: "https://www.lagonika.gr" },
    { id: "2", label: "HappyDeals.gr", url: "https://www.happydeals.gr" },
  ]
  const [quickUrls, setQuickUrls] = useState<{ id: string; label: string; url: string }[]>(defaultQuickUrls)
  const [showAddQuickUrl, setShowAddQuickUrl] = useState(false)
  const [newQuickUrlLabel, setNewQuickUrlLabel] = useState("")
  const [newQuickUrlValue, setNewQuickUrlValue] = useState("")

  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUICK_URLS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { id: string; label: string; url: string }[]
        if (Array.isArray(parsed) && parsed.length > 0) setQuickUrls(parsed)
      }
    } catch (_) {}
  }, [])

  const persistQuickUrls = (next: { id: string; label: string; url: string }[]) => {
    try {
      localStorage.setItem(QUICK_URLS_KEY, JSON.stringify(next))
    } catch (_) {}
  }

  const addQuickUrl = () => {
    const label = newQuickUrlLabel.trim() || t("communityImport.newUrlDefault")
    const url = newQuickUrlValue.trim()
    if (!url) return
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const next = [...quickUrls, { id, label, url }]
    setQuickUrls(next)
    persistQuickUrls(next)
    setNewQuickUrlLabel("")
    setNewQuickUrlValue("")
    setShowAddQuickUrl(false)
  }

  const removeQuickUrl = (id: string) => {
    const next = quickUrls.filter((q) => q.id !== id)
    setQuickUrls(next)
    persistQuickUrls(next)
  }

  const categories = [
    "Food & Dining",
    "Fashion",
    "Electronics",
    "Beauty & Health",
    "Travel",
    "Home & Garden",
    "Sports & Fitness",
    "Entertainment",
    "Other",
  ]

  useEffect(() => {
    fetchPendingDeals()
  }, [])

  const fetchPendingDeals = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/community/pending")
      if (response.ok) {
        const data = await response.json()
        setPendingDeals(data.deals || [])
      } else {
        setMessage({ type: "error", text: t("communityImport.errorLoadPending") })
      }
    } catch (error) {
      console.error("Error fetching pending deals:", error)
      setMessage({ type: "error", text: t("communityImport.errorLoadPendingDesc") })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) {
      setMessage({ type: "error", text: t("communityImport.errorEnterUrl") })
      return
    }

    // Stages that match the actual import process steps (keys for i18n)
    const stageKeys = [
      "stageFetching",
      "stageDownloading",
      "stageParsing",
      "stageFindingLinks",
      "stageSendingAI",
      "stageAnalyzing",
      "stageExtracting",
      "stageValidating",
      "stageCheckingDupes",
      "stageSaving",
      "stageFinalizing",
    ] as const
    const stages = [
      { progress: 5, duration: 1200 },
      { progress: 15, duration: 1500 },
      { progress: 25, duration: 1000 },
      { progress: 35, duration: 1200 },
      { progress: 45, duration: 2000 },
      { progress: 60, duration: 4000 },
      { progress: 75, duration: 3500 },
      { progress: 85, duration: 1500 },
      { progress: 92, duration: 2000 },
      { progress: 96, duration: 1500 },
      { progress: 98, duration: 1000 },
    ]

    try {
      setImporting(true)
      setMessage(null)
      setImportProgress(0)
      setImportStatus(t(`communityImport.${stageKeys[0]}`)) // Set initial status
      
      // Start fetching in parallel with progress animation
      const fetchPromise = fetch("/api/admin/community/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: importUrl }),
      })

      // Animate through stages smoothly
      let currentStage = 0
      let currentProgress = 0
      let stageStartTime = Date.now()
      
      const progressInterval = setInterval(() => {
        const now = Date.now()
        
        if (currentStage < stages.length) {
          const stage = stages[currentStage]
          const elapsed = now - stageStartTime
          
          // Move progress towards stage target smoothly
          if (currentProgress < stage.progress) {
            const increment = (stage.progress - currentProgress) * 0.15
            currentProgress = Math.min(stage.progress, currentProgress + increment)
            setImportProgress(Math.round(currentProgress))
          }
          
          // Move to next stage after duration
          if (elapsed >= stage.duration) {
            currentStage++
            stageStartTime = now
            if (currentStage < stages.length) {
              setImportStatus(t(`communityImport.${stageKeys[currentStage]}`))
            }
          }
        } else {
          // After all stages complete, slowly progress from 98% to 99% while waiting for API response
          if (currentProgress < 99) {
            currentProgress = Math.min(99, currentProgress + 0.1)
            setImportProgress(Math.round(currentProgress))
          }
          // Show final processing message
          setImportStatus(t("communityImport.stageProcessingResults"))
        }
      }, 100) // Update every 100ms for smooth animation

      // Wait for fetch to complete
      const response = await fetchPromise

      clearInterval(progressInterval)
      setImportProgress(100)
      setImportStatus(t("communityImport.stageComplete"))

      const data = await response.json()

      if (response.ok) {
        const count = data.count || (data.deal ? 1 : 0)
        const skipped = data.skipped || 0
        
        let messageText = ""
        if (count === 0) {
          if (skipped > 0) {
            messageText = t("communityImport.successAllImported", { count: skipped })
          } else {
            messageText = t("communityImport.successNoNew")
          }
        } else if (count > 1) {
          messageText = t("communityImport.successDealsImported", { count })
        } else {
          messageText = t("communityImport.successDealImported")
        }
        
        if (skipped > 0 && count > 0) {
          messageText += " " + t("communityImport.successDuplicatesSkipped", { count: skipped })
        }
        
        setMessage({ type: "success", text: messageText })
        setImportUrl("")
        fetchPendingDeals()
      } else {
        const errorMessage = data.error || t("communityImport.errorImportFailed")
        const skipped = data.skipped || 0
        if (skipped > 0 && errorMessage.includes("already been imported")) {
          setMessage({ type: "error", text: `${errorMessage} ${t("communityImport.duplicatesFound", { count: skipped })}` })
        } else {
          setMessage({ type: "error", text: errorMessage })
        }
      }
    } catch (error) {
      console.error("Error importing deal:", error)
      setMessage({ type: "error", text: t("communityImport.errorImport") })
    } finally {
      setTimeout(() => {
        setImporting(false)
        setImportStatus("")
        setImportProgress(0)
      }, 500)
    }
  }

  const handleApprove = async (dealId: string) => {
    try {
      setProcessingDeal(dealId)
      const response = await fetch(`/api/admin/community-deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: t("communityImport.successApproved") })
        fetchPendingDeals()
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.error || t("communityImport.errorApproveFailed") })
      }
    } catch (error) {
      console.error("Error approving deal:", error)
      setMessage({ type: "error", text: t("communityImport.errorApprove") })
    } finally {
      setProcessingDeal(null)
    }
  }

  const handleReject = async (dealId: string) => {
    try {
      setProcessingDeal(dealId)
      const response = await fetch(`/api/admin/community-deals/${dealId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: t("communityImport.successRemoved") })
        fetchPendingDeals()
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.error || t("communityImport.errorDeleteFailed") })
      }
    } catch (error) {
      console.error("Error deleting deal:", error)
      setMessage({ type: "error", text: t("communityImport.errorDelete") })
    } finally {
      setProcessingDeal(null)
    }
  }

  const handleEdit = (deal: PendingDeal) => {
    setEditingDeal(deal)
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    const response = await fetch("/api/upload/community", {
      method: "POST",
      body: uploadFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Upload failed")
    }

    const data = await response.json()
    return data.url
  }

  const handleSaveAndApprove = async (formData: any) => {
    if (!editingDeal) {
      console.error("No deal being edited")
      return
    }

    try {
      setSaving(true)
      setMessage(null)
      
      const payload: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location?.trim() || null,
        status: "APPROVED", // Always set to APPROVED when using Save & Approve
        origin: formData.origin || "GR",
      }

      // Handle expiresAt - only send if exists
      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString()
      } else if (editingDeal.expiresAt) {
        payload.expiresAt = editingDeal.expiresAt
      }
      // If neither exists, don't include expiresAt in payload

      // Handle startsAt - only send if exists (don't send null)
      if (formData.startsAt) {
        payload.startsAt = new Date(formData.startsAt).toISOString()
      }
      // If doesn't exist, don't include startsAt in payload

      // Handle link - must be valid URL or null (not empty string)
      if (formData.link?.trim()) {
        payload.link = formData.link.trim()
      } else {
        payload.link = null
      }

      // Handle imageUrl - must be valid URL or undefined (not empty string)
      if (formData.imageUrl?.trim()) {
        payload.imageUrl = formData.imageUrl.trim()
      } else if (editingDeal.imageUrl) {
        payload.imageUrl = editingDeal.imageUrl
      }

      // Handle optional string fields
      if (formData.priceValue?.trim()) {
        payload.priceValue = formData.priceValue.trim()
      } else {
        payload.priceValue = null
      }

      payload.priceType = formData.priceType || null

      if (formData.merchantName?.trim()) {
        payload.merchantName = formData.merchantName.trim()
      } else {
        payload.merchantName = null
      }

      if (formData.extraInfo?.trim()) {
        payload.extraInfo = formData.extraInfo.trim()
      } else {
        payload.extraInfo = null
      }

      if (formData.redeemSteps?.trim()) {
        payload.redeemSteps = formData.redeemSteps.trim()
      } else {
        payload.redeemSteps = null
      }

      console.log("Saving deal with payload:", payload)

      const response = await fetch(`/api/admin/community-deals/${editingDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      let data
      try {
        const text = await response.text()
        console.log("Response text:", text)
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        data = {}
      }

      if (response.ok) {
        setMessage({ type: "success", text: t("communityImport.successUpdated") })
        setEditingDeal(null)
        await fetchPendingDeals()
      } else {
        console.error("Failed to save deal - Status:", response.status, "Data:", data)
        let errorMessage = t("communityImport.errorUpdateFailed")
        
        if (data.message) {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.issues && Array.isArray(data.issues)) {
          const issues = data.issues.map((i: any) => {
            const field = i.path?.join('.') || 'unknown'
            return `${field}: ${i.message}`
          })
          errorMessage = t("communityImport.errorValidation", { details: issues.join(', ') })
        } else if (response.status === 400) {
          errorMessage = t("communityImport.errorInvalidData")
        } else if (response.status === 401) {
          errorMessage = t("communityImport.errorUnauthorized")
        } else if (response.status === 403) {
          errorMessage = t("communityImport.errorForbidden")
        } else if (response.status === 500) {
          errorMessage = t("communityImport.errorServer")
        }
        
        setMessage({ type: "error", text: errorMessage })
      }
    } catch (error) {
      console.error("Error saving deal:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : t("communityImport.errorSaving") })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <DashboardSidebar
        role="ADMIN"
        locale={locale}
        userName={session?.user?.name || ""}
        userEmail={session?.user?.email || ""}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />
      <DashboardHeader
        userName={session?.user?.name || "Admin"}
        userEmail={session?.user?.email || ""}
        role="ADMIN"
        locale={locale}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <main className="ml-0 flex-1 overflow-x-hidden pt-16 lg:ml-72">
        <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
          <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {t("communityImport.title")}
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {t("communityImport.subtitle")}
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mb-6 rounded-lg border p-4 ${
                  message.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Import Form */}
            <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t("communityImport.importFormTitle")}
              </h2>
              
              {/* Quick URL Buttons */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t("communityImport.quickUrls")}
                </span>
                {quickUrls.map((q) => (
                  <div
                    key={q.id}
                    className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <button
                      type="button"
                      onClick={() => setImportUrl(q.url)}
                      disabled={importing}
                      className="rounded-l-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-green-500 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:border-green-600 dark:hover:text-green-400"
                    >
                      {q.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuickUrl(q.id)}
                      disabled={importing}
                      className="rounded-r-lg border-l border-zinc-300 px-1.5 py-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title={t("communityImport.remove")}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddQuickUrl((v) => !v)}
                  disabled={importing}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-zinc-500 transition-colors hover:border-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                  title={t("communityImport.addQuickUrl")}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              {showAddQuickUrl && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <input
                    type="text"
                    value={newQuickUrlLabel}
                    onChange={(e) => setNewQuickUrlLabel(e.target.value)}
                    placeholder={t("communityImport.labelPlaceholder")}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-400"
                  />
                  <input
                    type="url"
                    value={newQuickUrlValue}
                    onChange={(e) => setNewQuickUrlValue(e.target.value)}
                    placeholder={t("communityImport.urlPlaceholder")}
                    className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={addQuickUrl}
                    disabled={!newQuickUrlValue.trim()}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("communityImport.add")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddQuickUrl(false)
                      setNewQuickUrlLabel("")
                      setNewQuickUrlValue("")
                    }}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {t("communityImport.cancel")}
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder={t("communityImport.urlInputPlaceholder")}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-400"
                  disabled={importing}
                />
                <Button
                  onClick={handleImport}
                  disabled={importing || !importUrl.trim()}
                  className="px-6"
                >
                  {importing ? t("communityImport.importing") : t("communityImport.import")}
                </Button>
              </div>

              {/* Loading Progress Indicator */}
              {importing && (
                <div className="mt-6 space-y-3">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  {importStatus && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <svg
                        className="h-4 w-4 animate-spin text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="font-medium">{importStatus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pending Deals Table */}
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("communityImport.pendingDealsCount", { count: pendingDeals.length })}
                </h2>
              </div>

              {loading ? (
                <div className="p-12 text-center text-zinc-600 dark:text-zinc-400">
                  {t("communityImport.loadingPending")}
                </div>
              ) : pendingDeals.length === 0 ? (
                <div className="p-12 text-center text-zinc-600 dark:text-zinc-400">
                  {t("communityImport.noPending")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                          {t("communityImport.tableTitle")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                          {t("communityImport.tableSummary")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                          {t("communityImport.tableCategory")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                          {t("communityImport.tableSource")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                          {t("communityImport.tableCreated")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                          {t("communityImport.tableActions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {pendingDeals.map((deal) => (
                        <tr
                          key={deal.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {deal.title}
                          </td>
                          <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {truncateText(deal.description, 100)}
                          </td>
                          <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {deal.category}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {(deal.link || deal.sourceUrl) ? (
                              <a
                                href={deal.link || deal.sourceUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                                title={deal.link || deal.sourceUrl || ""}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-zinc-500 dark:text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {formatDate(deal.createdAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(deal)}
                                className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                              >
                                {t("communityImport.edit")}
                              </button>
                              <button
                                onClick={() => handleApprove(deal.id)}
                                disabled={processingDeal === deal.id}
                                className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                {processingDeal === deal.id ? t("communityImport.processing") : t("communityImport.approve")}
                              </button>
                              <button
                                onClick={() => handleReject(deal.id)}
                                disabled={processingDeal === deal.id}
                                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                {processingDeal === deal.id ? t("communityImport.processing") : t("communityImport.reject")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </div>
      </main>

      {/* Edit Modal */}
      <EditDealModal
        deal={editingDeal}
        isOpen={!!editingDeal}
        onClose={() => setEditingDeal(null)}
        onSave={handleSaveAndApprove}
        onImageUpload={handleImageUpload}
        categories={categories}
        showSaveAndApprove={true}
        saving={saving}
      />
    </div>
  )
}
