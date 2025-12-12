"use client"

import { useTranslations } from "next-intl"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import GooglePlacesAutocomplete from "./GooglePlacesAutocomplete"

interface CreateDealModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  locale: string
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

export default function CreateDealModal({ isOpen, onClose, onSuccess, locale }: CreateDealModalProps) {
  const t = useTranslations("community")
  const tCommon = useTranslations("common")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    imageUrl: "",
    couponCode: "",
    expiresAt: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        latitude: null,
        longitude: null,
        imageUrl: "",
        couponCode: "",
        expiresAt: "",
      })
      setErrors({})
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErrors({ ...errors, imageUrl: "" })

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload/community", {
        method: "POST",
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, imageUrl: data.url })
      } else {
        const errorData = await response.json()
        setErrors({ ...errors, imageUrl: errorData.error || "Upload failed" })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      setErrors({ ...errors, imageUrl: "Failed to upload image" })
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = t("validation.titleMin")
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = t("validation.descriptionMin")
    }

    if (!formData.category) {
      newErrors.category = t("validation.categoryRequired")
    }

    if (!formData.location || formData.location.trim().length < 1) {
      newErrors.location = t("validation.locationRequired")
    }

    if (!formData.imageUrl) {
      newErrors.imageUrl = t("validation.imageRequired")
    }

    if (!formData.expiresAt) {
      newErrors.expiresAt = t("validation.expiresAtRequired")
    } else {
      const expiresAt = new Date(formData.expiresAt)
      if (expiresAt <= new Date()) {
        newErrors.expiresAt = t("validation.expiresAtFuture")
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/community-deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          expiresAt: new Date(formData.expiresAt).toISOString(),
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || "Failed to create deal" })
      }
    } catch (error) {
      console.error("Error creating deal:", error)
      setErrors({ submit: "Failed to create deal" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50"
          >
            {/* Header */}
            <div className="relative border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 px-6 sm:px-8 py-6">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-zinc-600 dark:text-zinc-300 shadow-md hover:bg-white dark:hover:bg-zinc-800 hover:scale-110 transition-all"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {t("createDeal")}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Share a great deal with the community
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(92vh-180px)] scrollbar-thin">
              <div className="p-6 sm:p-8 space-y-6">
                {/* Image Upload - Modern Design */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("form.image")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {formData.imageUrl ? (
                    <div className="relative group">
                      <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <Image
                          src={formData.imageUrl}
                          alt="Uploaded"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 rounded-lg bg-white/90 hover:bg-white backdrop-blur-sm text-zinc-900 px-4 py-2 text-sm font-medium shadow-lg transition-all hover:scale-105"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, imageUrl: "" })
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = ""
                                }
                              }}
                              className="rounded-lg bg-red-500/90 hover:bg-red-500 backdrop-blur-sm text-white px-4 py-2 text-sm font-medium shadow-lg transition-all hover:scale-105"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={`group relative flex w-full items-center gap-4 rounded-2xl border px-6 py-5 transition-all ${
                        errors.imageUrl
                          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 transition-colors">
                        {uploading ? (
                          <svg className="h-6 w-6 text-zinc-600 dark:text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-6 w-6 text-zinc-600 dark:text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                          {uploading ? t("form.uploading") : t("form.uploadImage")}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          PNG, JPG, WEBP up to 5MB
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-zinc-400 shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  {errors.imageUrl && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.imageUrl}
                    </p>
                  )}
                </div>

                {/* Basic Info - Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {t("form.title")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full rounded-lg border-2 px-4 py-3 text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none ${
                        errors.title
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                      }`}
                      placeholder={t("form.titlePlaceholder")}
                    />
                    {errors.title && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {t("form.category")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full rounded-lg border-2 px-4 py-3 text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none ${
                        errors.category
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                      }`}
                    >
                      <option value="">{t("form.selectCategory")}</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {t("form.location")} <span className="text-red-500">*</span>
                    </label>
                    <GooglePlacesAutocomplete
                      value={formData.location}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          location: value,
                          // If user types / changes text, coordinates may no longer match.
                          latitude: null,
                          longitude: null,
                        })
                      }
                      onCoordinatesChange={(lat, lng) =>
                        setFormData((prev) => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng,
                        }))
                      }
                      placeholder={t("form.locationPlaceholder")}
                      locale={locale}
                      className={`w-full rounded-lg border-2 px-4 py-3 text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none ${
                        errors.location
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                      }`}
                    />
                    {errors.location && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("form.description")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none resize-none ${
                      errors.description
                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                        : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                    }`}
                    placeholder={t("form.descriptionPlaceholder")}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Coupon & Expiration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      <svg className="h-4 w-4 text-zinc-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {t("form.couponCode")} 
                      <span className="text-xs font-normal text-zinc-400">({t("form.optional")})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                      className="w-full rounded-lg border-2 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-4 py-3 font-mono text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-green-500 dark:focus:border-green-600 transition-colors"
                      placeholder={t("form.couponCodePlaceholder")}
                    />
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {t("form.expiresAt")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className={`w-full rounded-lg border-2 px-4 py-3 text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none ${
                        errors.expiresAt
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                      }`}
                    />
                    {errors.expiresAt && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.expiresAt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {errors.submit}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions - Sticky */}
              <div className="sticky bottom-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 sm:px-8 py-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none sm:px-6 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 sm:flex-none sm:px-8 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t("form.submitting")}
                      </span>
                    ) : (
                      t("form.submit")
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
