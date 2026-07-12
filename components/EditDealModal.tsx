"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Button from "./Button"
import AddressAutocomplete from "./AddressAutocomplete"

interface DealFormData {
  title: string
  description: string
  category: string
  location: string
  expiresAt: string
  imageUrl: string
  link: string
  priceValue: string
  priceType: "" | "EUR" | "PERCENT" | "ONE_PLUS_ONE" | "TWO_PLUS_ONE" | "FREE" | "OTHER"
  merchantName: string
  origin: "GR" | "INTERNATIONAL"
  startsAt: string
  extraInfo: string
  redeemSteps: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "REPORTED"
  couponCode?: string
  latitude?: number | null
  longitude?: number | null
}

interface Deal {
  id: string
  title: string
  description: string
  category: string
  location?: string | null
  expiresAt?: string | Date | null
  imageUrl?: string | null
  link?: string | null
  sourceUrl?: string | null
  priceValue?: string | null
  priceType?: string | null
  merchantName?: string | null
  origin?: string | null
  startsAt?: string | Date | null
  extraInfo?: string | null
  redeemSteps?: string | null
  status?: string | null
  couponCode?: string | null
  latitude?: number | null
  longitude?: number | null
}

interface EditDealModalProps {
  deal: Deal | null
  isOpen: boolean
  onClose: () => void
  onSave: (formData: DealFormData) => Promise<void>
  categories?: string[]
  showSaveAndApprove?: boolean
  saving?: boolean
  onImageUpload?: (file: File) => Promise<string>
  locale?: string
  onSuccess?: () => void
}

const defaultCategories = [
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

export function EditDealModal({
  deal,
  isOpen,
  onClose,
  onSave,
  categories = defaultCategories,
  showSaveAndApprove = false,
  saving = false,
  onImageUpload,
  locale = "en",
  onSuccess,
}: EditDealModalProps) {
  const t = useTranslations("community")
  const [formData, setFormData] = useState<DealFormData>({
    title: "",
    description: "",
    category: "",
    location: "",
    expiresAt: "",
    imageUrl: "",
    link: "",
    priceValue: "",
    priceType: "",
    merchantName: "",
    origin: "GR",
    startsAt: "",
    extraInfo: "",
    redeemSteps: "",
    status: "PENDING",
    couponCode: "",
    latitude: null,
    longitude: null,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState("")
  const imageInputRef = useRef<HTMLInputElement>(null)
  const placeSelectedRef = useRef(false)

  useEffect(() => {
    if (deal && isOpen) {
      setFormData({
        title: deal.title || "",
        description: deal.description || "",
        category: deal.category || "",
        location: deal.location || "",
        expiresAt: deal.expiresAt
          ? new Date(deal.expiresAt).toISOString().slice(0, 16)
          : "",
        imageUrl: deal.imageUrl || "",
        link: deal.link || "",
        priceValue: deal.priceValue || "",
        priceType: (deal.priceType || "") as DealFormData["priceType"],
        merchantName: deal.merchantName || "",
        origin: (deal.origin || "GR") as "GR" | "INTERNATIONAL",
        startsAt: deal.startsAt
          ? new Date(deal.startsAt).toISOString().slice(0, 16)
          : "",
        extraInfo: deal.extraInfo || "",
        redeemSteps: deal.redeemSteps || "",
        status: (deal.status || "PENDING") as DealFormData["status"],
        couponCode: deal.couponCode || "",
        latitude: deal.latitude || null,
        longitude: deal.longitude || null,
      })
      setImageError("")
    } else if (!deal && isOpen) {
      // Create mode - reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        expiresAt: "",
        imageUrl: "",
        link: "",
        priceValue: "",
        priceType: "",
        merchantName: "",
        origin: "GR",
        startsAt: "",
        extraInfo: "",
        redeemSteps: "",
        status: "PENDING",
        couponCode: "",
        latitude: null,
        longitude: null,
      })
      setImageError("")
    }
  }, [deal, isOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!onImageUpload) {
      console.error("Image upload handler not provided")
      return
    }

    try {
      setUploadingImage(true)
      setImageError("")
      const url = await onImageUpload(file)
      setFormData({ ...formData, imageUrl: url })
    } catch (error: any) {
      setImageError(error.message || "Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    // Basic frontend validation for create mode
    if (!deal) {
      if (!formData.imageUrl) {
        alert(t("validation.imageRequired"))
        return
      }
    }
    await onSave(formData)
    if (!deal && onSuccess) {
      onSuccess()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-zinc-400 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600 dark:[&::-webkit-scrollbar-thumb]:hover:bg-zinc-500">
        <div className="sticky top-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{deal ? t("editDeal") : t("createDeal")}</h2>
            <div className="flex items-center gap-3">
              {(formData.link || (deal && deal.sourceUrl)) && (
                <a
                  href={formData.link || (deal && deal.sourceUrl) || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                  title={formData.link || (deal && deal.sourceUrl) || ""}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {t("sourceUrl")}
                </a>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("form.title")}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("form.description")}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
            />
          </div>
          <div className={`grid gap-4 ${deal ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("form.category")}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {deal && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("status")}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DealFormData["status"] })}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                >
                  <option value="PENDING">{t("pending")}</option>
                  <option value="APPROVED">{t("approved")}</option>
                  <option value="REJECTED">{t("rejected")}</option>
                  <option value="EXPIRED">{t("expired")}</option>
                  <option value="REPORTED">{t("reported")}</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("form.location")}</label>
            {!deal ? (
              <AddressAutocomplete
                value={formData.location}
                onChange={(value) => {
                  if (placeSelectedRef.current) {
                    setFormData((prev) => ({
                      ...prev,
                      location: value,
                    }))
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      location: value,
                      latitude: null,
                      longitude: null,
                    }))
                  }
                }}
                onPlaceSelected={({ address, lat, lng }) => {
                  placeSelectedRef.current = true
                  setFormData((prev) => ({
                    ...prev,
                    location: address,
                    latitude: lat,
                    longitude: lng,
                  }))
                  setTimeout(() => {
                    placeSelectedRef.current = false
                  }, 200)
                }}
                placeholder={t("searchLocation")}
                locale={locale}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            ) : (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("form.image")}</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            {formData.imageUrl ? (
              <div className="relative group">
                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <Image
                    src={formData.imageUrl}
                    alt="Deal image"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? t("form.uploading") : t("changeImage")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: "" })
                          if (imageInputRef.current) {
                            imageInputRef.current.value = ""
                          }
                        }}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-lg hover:bg-red-600 transition-colors"
                      >
                        {t("removeImage")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage || !onImageUpload}
                className="w-full rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-8 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
              >
                {uploadingImage ? t("form.uploading") : t("uploadImageButton")}
              </button>
            )}
            {imageError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{imageError}</p>
            )}
          </div>
          {formData.couponCode !== undefined && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("form.couponCode")}</label>
              <input
                type="text"
                value={formData.couponCode || ""}
                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("startsAt")}</label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("form.expiresAt")}</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("link")}
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://example.com/offer"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("linkHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("priceValue")}</label>
              <input
                type="text"
                value={formData.priceValue}
                onChange={(e) => setFormData({ ...formData, priceValue: e.target.value })}
                placeholder={t("priceValuePlaceholder")}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("priceType")}</label>
              <select
                value={formData.priceType}
                onChange={(e) => setFormData({ ...formData, priceType: e.target.value as DealFormData["priceType"] })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">{t("selectPriceType")}</option>
                <option value="EUR">{t("priceTypeEUR")}</option>
                <option value="PERCENT">{t("priceTypePERCENT")}</option>
                <option value="ONE_PLUS_ONE">{t("priceTypeONE_PLUS_ONE")}</option>
                <option value="TWO_PLUS_ONE">{t("priceTypeTWO_PLUS_ONE")}</option>
                <option value="FREE">{t("priceTypeFREE")}</option>
                <option value="OTHER">{t("priceTypeOTHER")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("merchantName")}</label>
            <input
              type="text"
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              placeholder={t("merchantNamePlaceholder")}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("merchantNameHint")}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("origin")}</label>
            <select
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value as "GR" | "INTERNATIONAL" })}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="GR">{t("originGR")}</option>
              <option value="INTERNATIONAL">{t("originINTERNATIONAL")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("extraInfo")}</label>
            <textarea
              value={formData.extraInfo}
              onChange={(e) => setFormData({ ...formData, extraInfo: e.target.value })}
              rows={2}
              placeholder={t("extraInfoPlaceholder")}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("redeemSteps")}</label>
            <textarea
              value={formData.redeemSteps}
              onChange={(e) => setFormData({ ...formData, redeemSteps: e.target.value })}
              rows={3}
              placeholder={t("redeemStepsPlaceholder")}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("redeemStepsHint")}</p>
          </div>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (deal ? t("saving") : t("form.submitting")) : deal ? (showSaveAndApprove ? t("saveAndApprove") : t("saveChanges")) : t("form.submit")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
