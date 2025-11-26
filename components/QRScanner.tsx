"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from "html5-qrcode"
import { useTranslations } from "next-intl"

interface QRScannerProps {
  onScanSuccess: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0) // Track scan attempts
  const [initializing, setInitializing] = useState(true) // Track initialization state
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null) // Track last scanned code
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isRunningRef = useRef(false)
  const onScanSuccessRef = useRef(onScanSuccess)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations("dashboard.business")

  // Keep callback ref updated
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
  }, [onScanSuccess])

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        // Check if scanner is actually running before stopping
        if (isRunningRef.current) {
          // Use clear() instead of stop() to avoid DOM errors
          try {
            await scannerRef.current.stop()
          } catch (stopErr: any) {
            // If stop fails, try clear()
            try {
              scannerRef.current.clear()
            } catch (clearErr) {
              // Ignore clear errors too
            }
          }
        } else {
          // Even if not running, try to clear
          try {
            scannerRef.current.clear()
          } catch (clearErr) {
            // Ignore
          }
        }
      } catch (err: any) {
        // Ignore all cleanup errors
        const errorMessage = err?.message || String(err) || ""
        if (!errorMessage.includes("not running") && !errorMessage.includes("not paused") && !errorMessage.includes("removechild") && !errorMessage.includes("not a child")) {
          console.debug("Error stopping scanner:", err)
        }
      } finally {
        // Clear the scanner container FIRST to prevent React DOM conflicts
        try {
          if (containerRef.current) {
            // Clear container before React tries to unmount
            containerRef.current.innerHTML = ""
          }
        } catch (e) {
          // Ignore all DOM errors during cleanup
        }
        isRunningRef.current = false
        setScanning(false)
        scannerRef.current = null
      }
    }
  }

  const startScanner = async () => {
    try {
      setError(null)
      setScanning(false)
      setInitializing(true)
      
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext = window.isSecureContext || 
                              location.protocol === 'https:' || 
                              location.hostname === 'localhost' || 
                              location.hostname === '127.0.0.1'
      
      if (!isSecureContext) {
        throw new Error("Camera access requires HTTPS or localhost. Please use https:// or http://localhost instead of an IP address.")
      }
      
      // Stop any existing scanner first
      if (scannerRef.current && isRunningRef.current) {
        await stopScanner()
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // Wait a bit to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Check multiple times if container is ready
      let container = containerRef.current
      let attempts = 0
      const maxAttempts = 20 // More attempts
      while (!container && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        container = containerRef.current
        attempts++
      }
      
      if (!container) {
        throw new Error("Scanner container not found. The scanner element may not be mounted yet. Please try closing and reopening the scanner.")
      }
      
      // Ensure container has dimensions - wait for layout
      let dimensionAttempts = 0
      while ((!container.clientWidth || !container.clientHeight) && dimensionAttempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        dimensionAttempts++
        // Re-check container in case it changed
        container = containerRef.current
        if (!container) {
          throw new Error("Scanner container was removed. Please try again.")
        }
      }
      
      if (!container.clientWidth || !container.clientHeight) {
        throw new Error(`Scanner container is not properly sized (width: ${container.clientWidth}, height: ${container.clientHeight}). Please ensure the scanner modal is fully visible.`)
      }

      // Create a fresh div element for the scanner (not managed by React)
      // Use a unique ID to avoid conflicts
      const scannerId = `qr-reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Clear container first
      container.innerHTML = ""
      
      // Create scanner element
      const scannerElement = document.createElement("div")
      scannerElement.id = scannerId
      scannerElement.className = "w-full h-full"
      scannerElement.style.width = "100%"
      scannerElement.style.height = "100%"
      scannerElement.style.minHeight = "250px"
      
      // Append to container
      container.appendChild(scannerElement)
      
      // Verify element was added
      const addedElement = document.getElementById(scannerId)
      if (!addedElement) {
        throw new Error("Failed to create scanner element. Please try again.")
      }
      
      // Wait a bit for the element to be fully in the DOM
      await new Promise(resolve => setTimeout(resolve, 100))

      // Create Html5Qrcode instance with better configuration
      // Use ZXing decoder (default) which is more compatible with react-qr-code
      const scanner = new Html5Qrcode(scannerId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      })
      scannerRef.current = scanner
      isRunningRef.current = false

      // Try to get available cameras first
      let cameras: any[] = []
      try {
        cameras = await Html5Qrcode.getCameras()
      } catch (camError: any) {
        // Only warn if it's not a secure context error (we already checked that)
        const errorMsg = camError?.message || String(camError) || ""
        if (!errorMsg.includes("secure context") && !errorMsg.includes("https")) {
          console.debug("Could not enumerate cameras, will try with facingMode:", camError)
        }
      }

      // Function to try starting with a specific camera
      const tryStartCamera = async (cameraConfig: string | { facingMode: string }) => {
        console.log("🎥 Starting scanner with config:", cameraConfig)
        
        console.log("🔧 Scanner config:", {
          fps: 10,
          verbose: true,
          cameraConfig
        })
        
        return scanner.start(
          cameraConfig,
          {
            fps: 30, // Higher FPS for better real-time detection
            qrbox: function(viewfinderWidth, viewfinderHeight) {
              // Use full viewfinder for maximum detection area
              if (!viewfinderWidth || !viewfinderHeight) {
                console.log("Using default qrbox size: 300x300")
                return { width: 300, height: 300 }
              }
              // Use 100% of the smaller dimension for maximum coverage
              const finalSize = Math.min(viewfinderWidth, viewfinderHeight)
              console.log(`📦 QR box size: ${finalSize}x${finalSize} (viewfinder: ${viewfinderWidth}x${viewfinderHeight})`)
              return {
                width: finalSize,
                height: finalSize
              }
            },
            aspectRatio: 1.0,
            // Better QR code detection settings
            disableFlip: false, // Allow rotation
            rememberLastUsedCamera: true,
            // Advanced settings for better detection - balanced resolution
            videoConstraints: {
              facingMode: typeof cameraConfig === 'object' ? cameraConfig.facingMode : undefined,
              width: { ideal: 1280, min: 640 }, // Balanced resolution
              height: { ideal: 720, min: 480 }
            },
            // Verbose logging to see what's happening
            verbose: false, // Disable verbose to reduce noise, but keep error callbacks
            // Try to use native BarcodeDetector API if available (better performance)
            useBarCodeDetectorIfSupported: false, // Disable to use ZXing decoder which is more compatible
            // Additional formats support
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          (decodedText, decodedResult) => {
            console.log("✅✅✅ QR Code detected!")
            console.log("📝 Decoded text:", decodedText)
            console.log("📊 Decoded result:", decodedResult)
            
            const trimmedText = decodedText?.trim() || ""
            
            // Update last scanned code for visual feedback
            setLastScannedCode(trimmedText)
            
            // Increment scan attempts for feedback
            setScanAttempts(prev => {
              const newAttempts = prev + 1
              console.log(`🔍 Scan attempt ${newAttempts}, text length: ${trimmedText.length}, starts with qr_: ${trimmedText.startsWith('qr_')}`)
              return newAttempts
            })
            
            // Validate that it's a QR token
            if (trimmedText && trimmedText.startsWith('qr_')) {
              console.log("✅✅✅ Valid QR token found! Processing...")
              onScanSuccessRef.current(trimmedText)
              stopScanner()
            } else {
              console.warn(`⚠️ Scanned code is not a valid QR token. Expected: qr_xxxxx, got: "${trimmedText.substring(0, 50)}" (length: ${trimmedText.length})`)
              // Show error to user if we've tried many times
              if (scanAttempts > 15) {
                setError(`Scanned code doesn't match expected format. Make sure you're scanning the QR code from the "Show QR" button. Last scanned: "${trimmedText.substring(0, 30)}${trimmedText.length > 30 ? '...' : ''}"`)
              }
              // Don't stop - keep scanning
            }
          },
          (errorMessage) => {
            // Log all errors for debugging - we need to see what's happening
            console.log("🔍 Scanner error callback:", errorMessage)
            // Only show important errors to user
            if (errorMessage.includes("Permission denied") || 
                errorMessage.includes("NotAllowedError") ||
                errorMessage.includes("NotFoundError")) {
              console.error("❌ Critical scanner error:", errorMessage)
            }
          }
        ).then(() => {
          console.log("✅ Scanner started successfully!")
          console.log("👀 Scanner is now active and looking for QR codes...")
          setInitializing(false)
          setError(null)
          
          // Test: Log scanner state after a delay
          setTimeout(() => {
            console.log("🔍 Scanner state check - if you see this, scanner is running")
            console.log("📹 Scanner element:", document.getElementById(scannerId))
            console.log("📹 Container element:", containerRef.current)
          }, 2000)
        })
      }

      // Reset scan attempts when starting
      setScanAttempts(0)
      
      // Try different camera options
      let lastError: any = null
      
      // First, try with facingMode (works better on mobile)
      try {
        await tryStartCamera({ facingMode: "environment" })
        isRunningRef.current = true
        setScanning(true)
        return
      } catch (err: any) {
        lastError = err
        console.debug("Failed with environment facingMode, trying other options:", err)
      }

      // If we have camera list, try each one
      if (cameras.length > 0) {
        for (const camera of cameras) {
          try {
            await tryStartCamera(camera.id)
            isRunningRef.current = true
            setScanning(true)
            setInitializing(false)
            return
          } catch (err: any) {
            lastError = err
            console.debug(`Failed with camera ${camera.label}, trying next:`, err)
          }
        }
      }

      // Try user-facing camera as last resort
      try {
        await tryStartCamera({ facingMode: "user" })
        isRunningRef.current = true
        setScanning(true)
        setInitializing(false)
        return
      } catch (err: any) {
        lastError = err
      }

      // If all attempts failed, throw the last error
      throw lastError || new Error("Failed to start camera with any available option")
    } catch (err: any) {
      isRunningRef.current = false
      setScanning(false)
      setInitializing(false)
      
      let errorMsg = "Failed to start camera"
      
      if (err?.message) {
        const msg = err.message.toLowerCase()
        if (msg.includes("permission") || msg.includes("not allowed") || msg.includes("denied")) {
          errorMsg = "Camera permission denied. Please allow camera access in your browser settings and refresh the page."
        } else if (msg.includes("not found") || msg.includes("no camera") || msg.includes("requested device not found")) {
          errorMsg = "Camera not found. If you're on HTTP (not HTTPS), please use localhost or enable HTTPS. Also check browser camera permissions."
        } else if (msg.includes("not readable") || msg.includes("in use") || msg.includes("could not start")) {
          errorMsg = "Camera is in use by another application. Please close other apps using the camera and try again."
        } else if (msg.includes("overconstrained") || msg.includes("constraint")) {
          errorMsg = "Camera constraints not supported. Trying different camera settings..."
        } else if (msg.includes("clientwidth") || msg.includes("clientheight") || msg.includes("null")) {
          errorMsg = "Scanner initialization error. Please try closing and reopening the scanner, or refresh the page."
        } else {
          errorMsg = `Camera error: ${err.message}. Make sure you're using HTTPS (or localhost) and have granted camera permissions.`
        }
      }
      
      setError(errorMsg)
      // Log as debug to avoid cluttering console with expected errors
      console.debug("Scanner error (handled):", err)
    }
  }

  useEffect(() => {
    // Add global error handler for DOM errors from Html5Qrcode
    const handleDOMError = (event: ErrorEvent) => {
      const errorMsg = event.message || event.error?.message || String(event.error) || ""
      if (errorMsg.includes("removeChild") || 
          errorMsg.includes("not a child") ||
          errorMsg.includes("Failed to execute 'removeChild'") ||
          errorMsg.includes("NotFoundError")) {
        // Suppress DOM errors from Html5Qrcode library
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return false // Return false to prevent default handling
      }
      return true
    }

    // Also handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || String(event.reason) || ""
      if (errorMsg.includes("removeChild") || 
          errorMsg.includes("not a child") ||
          errorMsg.includes("Failed to execute 'removeChild'") ||
          errorMsg.includes("NotFoundError")) {
        event.preventDefault()
        return false
      }
      return true
    }

    // Override removeChild to catch errors
    const originalRemoveChild = Node.prototype.removeChild
    Node.prototype.removeChild = function(child: Node) {
      try {
        return originalRemoveChild.call(this, child)
      } catch (error: any) {
        const errorMsg = error?.message || String(error) || ""
        if (errorMsg.includes("not a child") || errorMsg.includes("NotFoundError")) {
          // Silently ignore - this is expected from Html5Qrcode
          return child
        }
        throw error
      }
    }

    window.addEventListener("error", handleDOMError as EventListener, true)
    window.addEventListener("unhandledrejection", handleUnhandledRejection as EventListener)

    // Delay scanner start to ensure DOM is fully ready and mounted
    const startTimer = setTimeout(() => {
      startScanner().catch((err) => {
        console.error("Failed to start scanner:", err)
        const errorMsg = err?.message || "Failed to initialize scanner"
        if (errorMsg.includes("container") || errorMsg.includes("clientWidth") || errorMsg.includes("null")) {
          setError("Scanner container not ready. Please try closing and reopening the scanner, or refresh the page.")
        } else {
          setError(`Failed to initialize scanner: ${errorMsg}. Please try again or use the upload image option.`)
        }
      })
    }, 500) // Give React and DOM more time to fully render

    return () => {
      clearTimeout(startTimer)
      // Restore original removeChild
      Node.prototype.removeChild = originalRemoveChild
      
      // Remove error handlers
      window.removeEventListener("error", handleDOMError as EventListener, true)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection as EventListener)
      
      // Immediately clear the container to prevent React from trying to unmount it
      // This must happen BEFORE React tries to unmount the component
      if (containerRef.current) {
        try {
          // Clear all children manually to avoid React DOM conflicts
          const container = containerRef.current
          while (container.firstChild) {
            try {
              container.removeChild(container.firstChild)
            } catch (e) {
              // If removeChild fails, use innerHTML as fallback
              container.innerHTML = ""
              break
            }
          }
          container.innerHTML = "" // Final cleanup
        } catch (e) {
          // Ignore DOM errors
        }
      }
      
      // Stop scanner synchronously if possible
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch (e) {
          // Ignore
        }
        scannerRef.current = null
      }
      
      isRunningRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup before React unmounts - runs synchronously before DOM updates
  useLayoutEffect(() => {
    return () => {
      // Stop scanner first
      if (scannerRef.current) {
        try {
          if (isRunningRef.current) {
            scannerRef.current.stop().catch(() => {})
          }
          scannerRef.current.clear().catch(() => {})
        } catch (e) {
          // Ignore errors
        }
        scannerRef.current = null
        isRunningRef.current = false
      }
      
      // Cleanup container before React tries to unmount
      if (containerRef.current) {
        try {
          // Remove all children manually
          const container = containerRef.current
          while (container.firstChild) {
            try {
              container.removeChild(container.firstChild)
            } catch (e) {
              // If removeChild fails, break and use innerHTML
              break
            }
          }
          container.innerHTML = ""
        } catch (e) {
          // Ignore DOM errors
        }
      }
    }
  }, [])

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

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      setScanning(true)
      setShowFileUpload(true)
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file (PNG, JPG, etc.)")
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Image file is too large. Please use an image smaller than 10MB.")
      }
      
      // Create a temporary scanner instance for file scanning
      const tempId = `qr-reader-temp-${Date.now()}`
      const tempElement = document.createElement("div")
      tempElement.id = tempId
      tempElement.style.display = "none"
      document.body.appendChild(tempElement)
      
      const scanner = new Html5Qrcode(tempId)
      
        try {
          // Try scanning with multiple strategies
          let decodedText: string | null = null
          let lastError: any = null
          
          // Strategy 1: Default scan with showScanRegion
          try {
            decodedText = await scanner.scanFile(file, true)
          } catch (e1: any) {
            lastError = e1
            const errorMsg = e1?.message || String(e1) || ""
            
            // Strategy 2: Scan without showScanRegion
            if (errorMsg.includes("No MultiFormat Readers") || errorMsg.includes("detect the code")) {
              try {
                decodedText = await scanner.scanFile(file, false)
              } catch (e2: any) {
                lastError = e2
                
                // Strategy 3: Clear scanner and try again
                try {
                  scanner.clear()
                  await new Promise(resolve => setTimeout(resolve, 50))
                  const scanner2 = new Html5Qrcode(tempId)
                  decodedText = await scanner2.scanFile(file, true)
                  scanner2.clear()
                } catch (e3: any) {
                  lastError = e3
                  
                  // Strategy 4: Try one more time with false
                  try {
                    scanner.clear()
                    await new Promise(resolve => setTimeout(resolve, 50))
                    const scanner3 = new Html5Qrcode(tempId)
                    decodedText = await scanner3.scanFile(file, false)
                    scanner3.clear()
                  } catch (e4: any) {
                    lastError = e4
                    throw new Error("Could not detect QR code in the image. Make sure the QR code is clear, well-lit, and not damaged. Try taking a new photo with better lighting.")
                  }
                }
              }
            } else {
              // For other errors, throw immediately
              throw e1
            }
          }
        
        if (decodedText) {
          // Validate that it looks like a QR token (starts with qr_)
          if (!decodedText.startsWith('qr_')) {
            throw new Error("The scanned code is not a valid coupon QR code. Please scan the QR code from the coupon page.")
          }
          
          onScanSuccessRef.current(decodedText)
          onClose()
        } else {
          throw new Error("No QR code detected in the image. Please make sure the QR code is clearly visible and try again.")
        }
      } finally {
        // Cleanup temp element
        try {
          scanner.clear()
          if (document.body.contains(tempElement)) {
            document.body.removeChild(tempElement)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to scan QR code from image"
      setError(errorMsg)
      setScanning(false)
      console.debug("File scan error:", err)
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 p-6">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 backdrop-blur-sm p-2 text-zinc-600 shadow-lg transition hover:bg-white hover:scale-110 hover:text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Close scanner"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("scanQRCode")}
        </h2>
        <div 
          ref={containerRef}
          className="w-full rounded-lg overflow-hidden min-h-[250px] bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"
          suppressHydrationWarning
        >
          {!scanning && !error && (
            <p className="text-sm text-gray-500 dark:text-zinc-400">Initializing camera...</p>
          )}
          {scanning && showFileUpload && (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Scanning image...</p>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <div className="flex gap-2">
              {!showFileUpload && (
                <>
                  <button
                    onClick={startScanner}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {t("retry") || "Try Again"}
                  </button>
                  <button
                    onClick={() => {
                      setShowFileUpload(true)
                      fileInputRef.current?.click()
                    }}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    {t("uploadImage") || "Upload Image"}
                  </button>
                </>
              )}
              {showFileUpload && (
                <>
                  <button
                    onClick={startScanner}
                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {t("retry") || "Try Camera"}
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click()
                    }}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    {t("uploadImage") || "Try Another Image"}
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-xs text-gray-500 dark:text-zinc-400 space-y-1">
              {!showFileUpload ? (
                <p>
                  {t("cameraTips") || "Make sure you've granted camera permissions and that no other app is using the camera. Or upload a photo of the QR code."}
                </p>
              ) : (
                <>
                  <p className="font-medium">Tips for scanning QR code from image:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Make sure the QR code is clear and in focus</li>
                    <li>Ensure good lighting - avoid shadows or glare</li>
                    <li>The QR code should fill most of the image</li>
                    <li>Avoid blurry or low-resolution images</li>
                    <li>Make sure the QR code is not damaged or partially covered</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
        {scanning && !error && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
              {t("scanningQR") || "Point your camera at the QR code"}
            </p>
            {scanAttempts > 0 && (
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-500">
                Scan attempts: {scanAttempts}
              </p>
            )}
            {scanAttempts === 0 && !initializing && (
              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-2 text-xs text-orange-700 dark:text-orange-300">
                <p className="font-medium">⚠️ Scanner is running but no QR codes detected yet</p>
                <p className="mt-1">Make sure:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>The QR code is clearly visible and in focus</li>
                  <li>You're scanning the QR code from the "Show QR" button</li>
                  <li>The QR code is centered in the frame</li>
                </ul>
              </div>
            )}
            {lastScannedCode && !lastScannedCode.startsWith('qr_') && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-2 text-xs text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">⚠️ Scanned code detected but invalid format:</p>
                <p className="font-mono text-xs break-all">{lastScannedCode.substring(0, 50)}{lastScannedCode.length > 50 ? '...' : ''}</p>
                <p className="mt-1">Expected format: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">qr_xxxxx</code></p>
              </div>
            )}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Tips for better scanning:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Hold the QR code steady and in focus</li>
                <li>Ensure good lighting - avoid shadows or glare</li>
                <li>Keep the QR code centered in the frame</li>
                <li>Move closer if the QR code appears too small</li>
                <li>Make sure the entire QR code is visible</li>
                <li>Make sure you're scanning the QR from the "Show QR" button</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

