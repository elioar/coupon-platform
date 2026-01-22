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
  const placeSelectedRef = useRef(false)

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
    } else if (formData.latitude == null || formData.longitude == null) {
      console.log("[CreateDealModal] Validation failed - missing coords:", {
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
      })
      newErrors.location = t("validation.locationGoogleRequired")
    }

    if (!formData.imageUrl) {
      newErrors.imageUrl = t("validation.imageRequired")
    }

    // expiresAt is optional, but if provided, must be in the future
    if (formData.expiresAt) {
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
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
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
          className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50"
        >
          {/* Header - Minimal */}
          <div className="relative border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4 sm:py-5">
            <button
              onClick={onClose}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 pr-10">
              {t("createDeal")}
            </h2>
          </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-160px)] scrollbar-thin">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Image Upload - Minimal */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                      <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <Image
                          src={formData.imageUrl}
                          alt="Uploaded"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute inset-0 flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-lg hover:bg-zinc-50 transition-colors"
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
                              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-lg hover:bg-red-600 transition-colors"
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
                      className={`w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 sm:py-10 transition-colors ${
                        errors.imageUrl
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      {uploading ? (
                        <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-zinc-500 dark:text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {uploading ? t("form.uploading") : t("form.uploadImage")}
                      </span>
                    </button>
                  )}
                  {errors.imageUrl && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.imageUrl}
                    </p>
                  )}
                </div>

                {/* Basic Info - Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("form.title")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                        errors.title
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                      }`}
                      placeholder={t("form.titlePlaceholder")}
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("form.category")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                        errors.category
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
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
                      <p className="mt-1 text-xs text-red-500">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("form.location")} <span className="text-red-500">*</span>
                    </label>
                    <GooglePlacesAutocomplete
                      value={formData.location}
                      onChange={(value) => {
                        console.log("[CreateDealModal] onChange called for:", value, "placeSelected:", placeSelectedRef.current)
                        // Only clear coordinates if a place was NOT just selected
                        // This prevents clearing coordinates when Google sets the value after selection
                        if (placeSelectedRef.current) {
                          console.log("[CreateDealModal] Place was selected, not clearing coords")
                          setFormData((prev) => ({
                            ...prev,
                            location: value,
                          }))
                          return
                        }
                        // User is typing manually, so clear coordinates
                        console.log("[CreateDealModal] User typing manually, clearing coords")
                        setFormData((prev) => ({
                          ...prev,
                          location: value,
                          latitude: null,
                          longitude: null,
                        }))
                      }}
                      onPlaceSelected={({ address, lat, lng }) => {
                        console.log("[CreateDealModal] onPlaceSelected called:", { address, lat, lng })
                        placeSelectedRef.current = true
                        setFormData((prev) => ({
                          ...prev,
                          location: address,
                          latitude: lat,
                          longitude: lng,
                        }))
                        // Reset after a short delay to allow onChange to process
                        setTimeout(() => {
                          placeSelectedRef.current = false
                        }, 200)
                      }}
                      placeholder={t("form.locationPlaceholder")}
                      locale={locale}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                        errors.location
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                      }`}
                    />
                    {errors.location && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {t("form.description")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none ${
                      errors.description
                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                    }`}
                    placeholder={t("form.descriptionPlaceholder")}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Coupon & Expiration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("form.couponCode")} 
                      <span className="text-xs font-normal text-zinc-400 ml-1">({t("form.optional")})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm font-mono text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:focus:border-green-600 transition-colors"
                      placeholder={t("form.couponCodePlaceholder")}
                    />
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("form.expiresAt")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                        errors.expiresAt
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-green-500 dark:focus:border-green-600"
                      }`}
                    />
                    {errors.expiresAt && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.expiresAt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.submit}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions - Sticky */}
              <div className="sticky bottom-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    {tCommon("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
