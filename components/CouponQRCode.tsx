"use client"

import { useTranslations } from "next-intl"
import { useState, useEffect, useRef } from "react"
import QRCode from "qrcode"

interface CouponQRCodeProps {
  couponId: string
  onClose: () => void
}

export default function CouponQRCode({ couponId, onClose }: CouponQRCodeProps) {
  const t = useTranslations("coupons")
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Fetch unique token from API
    const fetchToken = async () => {
      try {
        const response = await fetch(`/api/coupons/${couponId}/qr-token`, {
          method: "POST"
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to generate QR token")
        }

        const data = await response.json()
        // QR contains only the token - server will look up all details
        const token = data.token

        // Generate QR code using qrcode library
        const dataUrl = await QRCode.toDataURL(token, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          },
          errorCorrectionLevel: "M"
        })

        setQrDataUrl(dataUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [couponId])

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 backdrop-blur-sm p-2 text-zinc-600 shadow-lg transition hover:bg-white hover:scale-110 hover:text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("qrCode")}
          </h2>
          <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {t("qrCodeDescription")}
          </p>
          
          {loading && (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-center text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {qrDataUrl && !loading && !error && (
            <div className="flex justify-center rounded-xl bg-white p-6 dark:bg-zinc-800">
              <img 
                src={qrDataUrl} 
                alt="QR Code" 
                className="w-full max-w-[300px] h-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
