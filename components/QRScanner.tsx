"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { useTranslations } from "next-intl"

// Add custom animations
const styles = `
  @keyframes scale-in {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes checkmark {
    0% {
      stroke-dasharray: 0 50;
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dasharray: 50 0;
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes fade-in {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slide-up {
    0% {
      opacity: 0;
      transform: translateY(15px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scan-beam {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(100%);
      opacity: 0;
    }
  }
  
  @keyframes corner-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
  
  @keyframes grid-scan {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 100% 100%;
    }
  }
  
  @keyframes processing-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
  
  @keyframes processing-rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  @keyframes processing-ripple {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  .animate-scale-in {
    animation: scale-in 0.4s ease-out;
  }
  
  .animate-checkmark {
    animation: checkmark 0.5s ease-out 0.2s forwards;
    stroke-dasharray: 50;
    stroke-dashoffset: 50;
  }
  
  .animate-fade-in {
    animation: fade-in 0.4s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slide-up 0.4s ease-out forwards;
  }
  
  .animate-scan-beam {
    animation: scan-beam 2s linear infinite;
  }
  
  .animate-corner-pulse {
    animation: corner-pulse 1.5s ease-in-out infinite;
  }
  
  .animate-grid-scan {
    animation: grid-scan 3s linear infinite;
  }
  
  .animate-processing-pulse {
    animation: processing-pulse 1.5s ease-in-out infinite;
  }
  
  .animate-processing-rotate {
    animation: processing-rotate 2s linear infinite;
  }
  
  .animate-processing-ripple {
    animation: processing-ripple 2s ease-out infinite;
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  if (!document.head.querySelector('style[data-qr-scanner-animations]')) {
    styleSheet.setAttribute('data-qr-scanner-animations', 'true')
    document.head.appendChild(styleSheet)
  }
}

interface QRScannerProps {
  onScanSuccess: (data: string) => Promise<{ success: boolean; message?: string; error?: string; isAlreadyRedeemed?: boolean }>
  onClose: () => void
  onRedemptionError?: (message: string) => void
}

export default function QRScanner({ onScanSuccess, onClose, onRedemptionError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanAttempts, setScanAttempts] = useState(0)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showRedeemedError, setShowRedeemedError] = useState(false)
  const [redeemedErrorMessage, setRedeemedErrorMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const onScanSuccessRef = useRef(onScanSuccess)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scanningRef = useRef(false)
  const t = useTranslations("dashboard.business")

  // Keep callback ref updated
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
  }, [onScanSuccess])

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    scanningRef.current = false
    setScanning(false)
  }

  const scanQRCode = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (scanningRef.current && !isProcessing && !showSuccess && !showRedeemedError) {
        animationFrameRef.current = requestAnimationFrame(scanQRCode)
      }
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      if (scanningRef.current && !isProcessing && !showSuccess && !showRedeemedError) {
        animationFrameRef.current = requestAnimationFrame(scanQRCode)
      }
      return
    }

    // Draw video frame to canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Try to decode QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert"
    })

    if (code) {
      const trimmedText = code.data.trim()
      setLastScannedCode(trimmedText)
      setScanAttempts(prev => prev + 1)

      // Validate that it's a QR token
      if (trimmedText && trimmedText.startsWith('qr_')) {
        // Prevent multiple scans of the same code
        if (isProcessing || showSuccess || showRedeemedError) {
          // Continue scanning but ignore this code
          if (scanningRef.current && !isProcessing && !showSuccess && !showRedeemedError) {
            animationFrameRef.current = requestAnimationFrame(scanQRCode)
          }
          return
        }
        
        stopScanner()
        
        // Show processing state (neutral, not success)
        setIsProcessing(true)
        setShowSuccess(false)
        setShowRedeemedError(false)
        setError(null)
        
        // Process redemption and wait for result (async operation handled with .then())
        onScanSuccessRef.current(trimmedText).then((result) => {
          setIsProcessing(false)
          
          if (result.success) {
            // Show success
            setShowSuccess(true)
            setSuccessMessage(result.message || "Valid QR Code!")
            setShowRedeemedError(false)
            setError(null)
          } else {
            // Show error - check if already redeemed
            if (result.isAlreadyRedeemed) {
              setShowRedeemedError(true)
              setRedeemedErrorMessage(result.message || result.error || "This coupon was already redeemed")
              setShowSuccess(false)
              setError(null)
            } else {
              setError(result.message || result.error || "Redemption failed")
              setShowSuccess(false)
              setShowRedeemedError(false)
            }
          }
        }).catch((error: any) => {
          setIsProcessing(false)
          setError(error?.message || "Failed to process redemption")
          setShowSuccess(false)
          setShowRedeemedError(false)
        })
        return // Don't continue scanning after processing
      } else {
        if (scanAttempts > 15) {
          setError(`Scanned code doesn't match expected format. Make sure you're scanning the QR code from the "Show QR" button. Last scanned: "${trimmedText.substring(0, 30)}${trimmedText.length > 30 ? '...' : ''}"`)
        }
      }
    }

    // Continue scanning - always continue if scanning is true and not processing
    if (scanningRef.current && !isProcessing && !showSuccess && !showRedeemedError) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode)
    }
  }

  const startScanner = async () => {
    try {
      setError(null)
      setScanAttempts(0)
      setLastScannedCode(null)
      scanningRef.current = true
      setScanning(true)

      // Check for secure context
      if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error("Camera access requires HTTPS or localhost")
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute("playsinline", "true")
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              // Start scanning loop after video starts playing
              // Use a small delay to ensure video is fully ready
              setTimeout(() => {
                if (scanningRef.current && !animationFrameRef.current) {
                  animationFrameRef.current = requestAnimationFrame(scanQRCode)
                }
              }, 100)
            }).catch(() => {
              // Error playing video - silently fail
            })
          }
        }
        
        // Also try to start scanning when video can play
        videoRef.current.oncanplay = () => {
          if (scanningRef.current && !animationFrameRef.current && videoRef.current && videoRef.current.readyState >= 2) {
            animationFrameRef.current = requestAnimationFrame(scanQRCode)
          }
        }
      }
    } catch (err: any) {
      let errorMsg = "Failed to start camera"
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Camera permission denied. Please allow camera access and try again."
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No camera found. Please connect a camera and try again."
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMsg = "Camera is already in use by another application. Please close other apps using the camera and try again."
      } else if (err.message) {
        errorMsg = err.message
      }
      
      setError(errorMsg)
      setScanning(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      setScanning(false)
      
      const image = new Image()
      const url = URL.createObjectURL(file)
      
      image.onload = async () => {
        URL.revokeObjectURL(url)
        
        if (!canvasRef.current) return
        
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = image.width
        canvas.height = image.height
        ctx.drawImage(image, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        })

        if (code) {
          const trimmedText = code.data.trim()
          
          if (trimmedText && trimmedText.startsWith('qr_')) {
            // Show processing state (neutral, not success)
            setIsProcessing(true)
            setShowSuccess(false)
            setShowRedeemedError(false)
            setError(null)
            
            // Process redemption and wait for result (async operation)
            onScanSuccessRef.current(trimmedText).then((result) => {
              setIsProcessing(false)
              
              if (result.success) {
                // Show success
                setShowSuccess(true)
                setSuccessMessage(result.message || "Valid QR Code!")
                setShowRedeemedError(false)
                setError(null)
              } else {
                // Show error - check if already redeemed
                if (result.isAlreadyRedeemed) {
                  setShowRedeemedError(true)
                  setRedeemedErrorMessage(result.message || result.error || "This coupon was already redeemed")
                  setShowSuccess(false)
                  setError(null)
                } else {
                  setError(result.message || result.error || "Redemption failed")
                  setShowSuccess(false)
                  setShowRedeemedError(false)
                }
              }
            }).catch((error: any) => {
              setIsProcessing(false)
              setError(error?.message || "Failed to process redemption")
              setShowSuccess(false)
              setShowRedeemedError(false)
            })
          } else {
            setError("The scanned code is not a valid coupon QR code. Please scan the QR code from the coupon page.")
          }
        } else {
          setError("Could not detect QR code in the image. Make sure the QR code is clear, well-lit, and not damaged.")
        }
      }

      image.onerror = () => {
        URL.revokeObjectURL(url)
        setError("Failed to load image. Please try another image.")
      }

      image.src = url
    } catch (err: any) {
      setError(err?.message || "Failed to scan QR code from image")
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Start scanner on mount
  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="relative w-full h-full sm:h-auto sm:max-w-2xl overflow-hidden rounded-none sm:rounded-2xl bg-white shadow-xl dark:bg-zinc-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {t("scanQRCode") || "Scan QR Code"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                {t("scanQRDescription") || "Redeem customer coupons"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner()
              onClose()
            }}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 flex-shrink-0 ml-2"
            aria-label="Close scanner"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col p-4 sm:p-6 min-h-0">
          {/* Camera View */}
          <div className="relative w-full rounded-lg overflow-hidden flex-1 min-h-[300px] sm:min-h-[400px] bg-gray-900 flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-all duration-300 ${showSuccess || showRedeemedError || isProcessing ? 'opacity-30 blur-sm' : ''}`}
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="text-center max-w-sm w-full mx-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-zinc-800">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Επεξεργασία...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scanning Frame with Animation */}
            {scanning && !showSuccess && !showRedeemedError && !error && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-48 sm:w-64 sm:h-64">
                  {/* Simple corner brackets */}
                  <div className="absolute -top-1 -left-1 h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-l-2 border-white/60 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-r-2 border-white/60 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-l-2 border-white/60 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-r-2 border-white/60 rounded-br-lg"></div>
                </div>
              </div>
            )}
            
            {/* Success Overlay */}
            {showSuccess && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="text-center max-w-sm w-full mx-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-zinc-800">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Επιτυχής
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {successMessage || "Το κουπόνι εξαργυρώθηκε επιτυχώς"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Overlay - Already Redeemed */}
            {showRedeemedError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="text-center max-w-sm w-full mx-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-zinc-800">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Ήδη Εξαργυρωμένο
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {redeemedErrorMessage || "Αυτό το κουπόνι έχει ήδη χρησιμοποιηθεί"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading State */}
            {!scanning && !error && !showSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="text-center px-4">
                  <div className="mx-auto mb-3 sm:mb-4 h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <p className="text-xs sm:text-sm text-white">Initializing camera...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !showSuccess && !showRedeemedError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 text-center max-w-md w-full mx-4 border border-gray-200 dark:border-zinc-800">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500">
                      <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Σφάλμα
                  </h3>
                  <p className="mb-5 text-sm text-gray-600 dark:text-gray-400 break-words">
                    {error}
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={startScanner}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                      {t("retry") || "Δοκίμασε Ξανά"}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                      {t("uploadImage") || "Ανέβασε Εικόνα"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Section */}
          {scanning && !error && !showSuccess && (
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-zinc-400 px-2">
                {t("scanningQR") || "Point your camera at the QR code"}
              </p>
              
              {lastScannedCode && !lastScannedCode.startsWith('qr_') && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 sm:p-3">
                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">Invalid QR Code Format</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 break-all">
                    Expected format: <code className="rounded bg-yellow-100 dark:bg-yellow-900/50 px-1 py-0.5 font-mono text-xs">qr_xxxxx</code>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3 sm:mt-4 flex gap-2">
            {!error && scanning && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 touch-manipulation"
              >
                {t("uploadImage") || "Upload Image"}
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
