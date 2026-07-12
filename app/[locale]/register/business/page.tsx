"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import AddressAutocomplete from "@/components/AddressAutocomplete"
import OpenStreetMapPicker from "@/components/OpenStreetMapPicker"

const businessRegistrationSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    terms: z.boolean().refine((value) => value, {
      message: "You must accept the terms to continue",
    }),
    businessName: z.string().min(2, "Business name is required"),
    phone: z.string().min(5, "Phone number is required"),
    vatNumber: z.string().min(8, "VAT number must be at least 8 characters").max(9, "VAT number must be at most 9 characters"),
    categoryId: z.string().min(1, "Select a business category"),
    description: z.string().optional().or(z.literal("")),
    address: z.string().min(3, "Business address is required"),
    city: z.string().min(2, "City is required"),
    postalCode: z.string().min(4, "Postal code is required"),
    website: z.union([z.string().url("Please enter a valid URL"), z.literal("")]).optional(),
    instagram: z.union([z.string().url("Please enter a valid URL"), z.literal("")]).optional(),
    facebook: z.union([z.string().url("Please enter a valid URL"), z.literal("")]).optional(),
    tiktok: z.union([z.string().url("Please enter a valid URL"), z.literal("")]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  })

type BusinessFormValues = z.infer<typeof businessRegistrationSchema>

interface Category {
  id: string
  nameEn: string
  nameEl: string
}

// Steps will be defined inside the component to use translations

export default function BusinessRegisterPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const t = useTranslations("auth.register")
  const tBusiness = useTranslations("auth.register.businessRegistration")
  const tCommon = useTranslations("common")
  
  // Get invite parameter from URL
  const inviteId = searchParams.get("invite")

  const steps = [
    { id: 1, title: tBusiness("stepAccount"), icon: "👤" },
    { id: 2, title: tBusiness("stepBusinessInfo"), icon: "🏢" },
    { id: 3, title: tBusiness("stepLocation"), icon: "📍" },
    { id: 4, title: tBusiness("stepOnlinePresence"), icon: "🌐" },
  ]

  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState("")
  const [businessSubmitting, setBusinessSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [direction, setDirection] = useState(1)
  const [isExpanding, setIsExpanding] = useState(false)
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const businessForm = useForm<BusinessFormValues>({
    resolver: zodResolver(businessRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
      businessName: "",
      phone: "",
      vatNumber: "",
      categoryId: "",
      description: "",
      address: "",
      city: "",
      postalCode: "",
      website: "",
      instagram: "",
      facebook: "",
      tiktok: "",
    },
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        if (!res.ok) return
        const data = await res.json()
        setCategories(data.categories || [])
      } catch (err) {
        // Failed to load categories - silently fail
      }
    }
    fetchCategories()
  }, [])


  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    if (checks.length) strength++
    if (checks.lowercase) strength++
    if (checks.uppercase) strength++
    if (checks.number) strength++
    if (checks.special) strength++

    return { strength, checks }
  }

  const passwordValue = businessForm.watch("password")
  const passwordStrength = checkPasswordStrength(passwordValue || "")
  const strengthLevel = passwordStrength.strength
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]

  const handleNext = async () => {
    let fieldsToValidate: (keyof BusinessFormValues)[] = []

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["email", "password", "confirmPassword", "terms"]
        break
      case 2:
        fieldsToValidate = ["businessName", "phone", "vatNumber", "categoryId"]
        break
      case 3:
        fieldsToValidate = ["address", "city", "postalCode"]
        break
      case 4:
        // Last step, validate all and submit
        break
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await businessForm.trigger(fieldsToValidate)
      if (!isValid) return
    }

    if (currentStep < steps.length) {
      setDirection(1)
      setIsExpanding(true)
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
        setTimeout(() => setIsExpanding(false), 100)
      }, 150)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }


  const handleSubmit = businessForm.handleSubmit(async (values) => {
    setBusinessSubmitting(true)
    setError("")

    try {
      const payload = {
        role: "BUSINESS",
        name: values.businessName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        vatNumber: values.vatNumber,
        categoryId: values.categoryId,
        address: values.address,
        city: values.city || "",
        postalCode: values.postalCode || "",
        description: values.description || "",
        website: values.website || "",
        instagram: values.instagram || "",
        facebook: values.facebook || "",
        tiktok: values.tiktok || "",
        businessLatitude: locationCoordinates?.lat ?? null,
        businessLongitude: locationCoordinates?.lng ?? null,
        ...(inviteId && { inviterId: inviteId }),
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t("error"))
        return
      }

      businessForm.reset()
      router.push(`/${locale}/login`)
    } catch (err) {
      setError(t("error"))
    } finally {
      setBusinessSubmitting(false)
    }
  })

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: direction * 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-4 sm:space-y-5"
          >
            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("email")} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...businessForm.register("email")}
                className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                placeholder="business@example.com"
              />
              {businessForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("password")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...businessForm.register("password")}
                  className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-1.5 sm:mt-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {businessForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.password.message}</p>
              )}

              {/* Password Strength Indicator */}
              {passwordValue && (
                <div className="mt-2 space-y-2">
                  {/* Animated Strength Line */}
                  <div className="relative">
                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(strengthLevel / 5) * 100}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          strengthLevel <= 2
                            ? "bg-gradient-to-r from-red-500 to-red-600"
                            : strengthLevel === 3
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            : strengthLevel === 4
                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                            : "bg-gradient-to-r from-green-500 to-emerald-600"
                        }`}
                      >
                        <motion.div
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-full w-1/3 bg-white/30"
                        />
                      </motion.div>
                    </div>
                    <p className={`mt-1.5 text-[10px] sm:text-xs font-semibold ${
                      strengthLevel <= 2
                        ? "text-red-600 dark:text-red-400"
                        : strengthLevel === 3
                        ? "text-yellow-600 dark:text-yellow-400"
                        : strengthLevel === 4
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-green-600 dark:text-green-400"
                    }`}>
                      {passwordValue ? strengthLabels[strengthLevel - 1] || "Very Weak" : ""}
                    </p>
                  </div>

                  {/* Password Requirements */}
                  <div className="mt-2 space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.length ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      <motion.svg
                        animate={{ scale: passwordStrength.checks.length ? [1, 1.2, 1] : 1 }}
                        className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.length ? "text-green-500" : "text-zinc-400"}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {passwordStrength.checks.length ? (
                          <path d="M5 13l4 4L19 7" />
                        ) : (
                          <path d="M6 18L18 6M6 6l12 12" />
                        )}
                      </motion.svg>
                      <span>{t("passwordCheckLength")}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.lowercase ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      <motion.svg
                        animate={{ scale: passwordStrength.checks.lowercase ? [1, 1.2, 1] : 1 }}
                        className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.lowercase ? "text-green-500" : "text-zinc-400"}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {passwordStrength.checks.lowercase ? (
                          <path d="M5 13l4 4L19 7" />
                        ) : (
                          <path d="M6 18L18 6M6 6l12 12" />
                        )}
                      </motion.svg>
                      <span>{t("passwordCheckLowercase")}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.uppercase ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      <motion.svg
                        animate={{ scale: passwordStrength.checks.uppercase ? [1, 1.2, 1] : 1 }}
                        className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.uppercase ? "text-green-500" : "text-zinc-400"}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {passwordStrength.checks.uppercase ? (
                          <path d="M5 13l4 4L19 7" />
                        ) : (
                          <path d="M6 18L18 6M6 6l12 12" />
                        )}
                      </motion.svg>
                      <span>{t("passwordCheckUppercase")}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.number ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      <motion.svg
                        animate={{ scale: passwordStrength.checks.number ? [1, 1.2, 1] : 1 }}
                        className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.number ? "text-green-500" : "text-zinc-400"}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {passwordStrength.checks.number ? (
                          <path d="M5 13l4 4L19 7" />
                        ) : (
                          <path d="M6 18L18 6M6 6l12 12" />
                        )}
                      </motion.svg>
                      <span>{t("passwordCheckNumber")}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] sm:text-xs ${passwordStrength.checks.special ? "text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      <motion.svg
                        animate={{ scale: passwordStrength.checks.special ? [1, 1.2, 1] : 1 }}
                        className={`h-3 w-3 flex-shrink-0 ${passwordStrength.checks.special ? "text-green-500" : "text-zinc-400"}`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {passwordStrength.checks.special ? (
                          <path d="M5 13l4 4L19 7" />
                        ) : (
                          <path d="M6 18L18 6M6 6l12 12" />
                        )}
                      </motion.svg>
                      <span>{t("passwordCheckSpecial")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {tBusiness("confirmPassword")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...businessForm.register("confirmPassword")}
                  className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-1.5 sm:mt-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {businessForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="group relative flex items-start gap-3 rounded-xl border-2 border-zinc-200 bg-gradient-to-br from-white to-zinc-50/50 p-4 transition-all duration-300 hover:border-green-400 hover:bg-gradient-to-br hover:from-green-50/50 hover:to-emerald-50/30 hover:shadow-lg hover:shadow-green-500/10 dark:border-zinc-700 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900/50 dark:hover:border-green-600 dark:hover:from-green-900/20 dark:hover:to-emerald-900/10 cursor-pointer overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Custom checkbox container */}
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    {...businessForm.register("terms")}
                    className="peer sr-only"
                  />
                  {/* Custom checkbox design */}
                  <div className="relative h-5 w-5 rounded-md border-2 border-zinc-300 bg-white transition-all duration-300 peer-checked:border-green-500 peer-checked:bg-gradient-to-br peer-checked:from-green-500 peer-checked:to-emerald-600 peer-focus:ring-2 peer-focus:ring-green-500 peer-focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 peer-checked:dark:border-green-500 group-hover:border-green-400 dark:group-hover:border-green-600">
                    {/* Checkmark icon */}
                    <motion.svg
                      initial={false}
                      animate={{
                        scale: businessForm.watch("terms") ? [0, 1.2, 1] : 0,
                        opacity: businessForm.watch("terms") ? 1 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 h-full w-full text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </motion.svg>
                    {/* Shine effect when checked */}
                    {businessForm.watch("terms") && (
                      <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: "100%", opacity: [0, 0.5, 0] }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                    )}
                  </div>
                  {/* Ripple effect on click */}
                  <motion.div
                    className="absolute inset-0 rounded-md bg-green-500/20"
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{
                      scale: businessForm.watch("terms") ? [0, 2, 0] : 0,
                      opacity: [0.5, 0, 0],
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                
                <div className="relative flex-1 z-10">
                  <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {tBusiness("acceptTerms")}{" "}
                    <Link 
                      href={`/${locale}/terms`} 
                      target="_blank"
                      className="font-semibold text-green-600 hover:text-green-700 underline underline-offset-2 transition-colors dark:text-green-400 dark:hover:text-green-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tBusiness("termsAndConditions")}
                    </Link>
                    {" "}{tBusiness("and")}{" "}
                    <Link 
                      href={`/${locale}/privacy`} 
                      target="_blank"
                      className="font-semibold text-green-600 hover:text-green-700 underline underline-offset-2 transition-colors dark:text-green-400 dark:hover:text-green-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tBusiness("privacyPolicy")}
                    </Link>
                    {" "}{tBusiness("agreeCommunications")}. <span className="text-red-500">*</span>
                  </span>
                </div>
              </label>
              {businessForm.formState.errors.terms && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                >
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {businessForm.formState.errors.terms.message}
                </motion.p>
              )}
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: direction * 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-4 sm:space-y-5"
          >
            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {tBusiness("businessName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...businessForm.register("businessName")}
                className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                placeholder="My Business Ltd"
              />
              {businessForm.formState.errors.businessName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.businessName.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tBusiness("phoneNumber")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...businessForm.register("phone")}
                  className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  placeholder="+30 123 456 7890"
                />
                {businessForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {tBusiness("vatNumber")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={9}
                  {...businessForm.register("vatNumber")}
                  className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  placeholder="123456789"
                />
                {businessForm.formState.errors.vatNumber && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.vatNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {tBusiness("businessCategory")} <span className="text-red-500">*</span>
              </label>
              <select
                {...businessForm.register("categoryId")}
                className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="" className="bg-zinc-900 text-zinc-600">
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-zinc-900 text-white">
                    {locale === "el" ? category.nameEl : category.nameEn}
                  </option>
                ))}
              </select>
              {businessForm.formState.errors.categoryId && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">{tBusiness("businessDescription")}</label>
              <textarea
                {...businessForm.register("description")}
                rows={4}
                className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                placeholder="Describe your business, products, and services..."
              />
              {businessForm.formState.errors.description && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.description.message}</p>
              )}
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: direction * 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-4 sm:space-y-5"
          >
            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {tBusiness("address")} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="address"
                control={businessForm.control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Enter your business address..."
                    locale={locale}
                    className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  />
                )}
              />
              {businessForm.formState.errors.address && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {tBusiness("setExactLocation")} <span className="text-red-500">*</span>
              </label>
              <Controller
                name="address"
                control={businessForm.control}
                render={({ field }) => (
                  <OpenStreetMapPicker
                    address={field.value}
                    darkMode={typeof window !== "undefined" && document.documentElement.classList.contains("dark")}
                    onLocationChange={(address, lat, lng, details) => {
                      field.onChange(address)
                      setLocationCoordinates({ lat, lng })

                      if (details?.city) {
                        businessForm.setValue("city", details.city, { shouldValidate: true })
                      }
                      if (details?.postalCode) {
                        businessForm.setValue("postalCode", details.postalCode, { shouldValidate: true })
                      }
                    }}
                    locale={locale}
                    className="mt-1.5 sm:mt-2"
                  />
                )}
              />
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                {tBusiness("mapInstructions")}
              </p>

              {/* City & Postal Code — auto-filled from the map, but editable manually as a fallback */}
              <div className="mt-4 grid gap-4 sm:gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {locale === "el" ? "Πόλη" : "City"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...businessForm.register("city")}
                    className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    placeholder={locale === "el" ? "π.χ. Θεσσαλονίκη" : "e.g. Thessaloniki"}
                  />
                  {businessForm.formState.errors.city && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {locale === "el" ? "Ταχυδρομικός Κώδικας" : "Postal Code"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...businessForm.register("postalCode")}
                    className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    placeholder={locale === "el" ? "π.χ. 54622" : "e.g. 54622"}
                  />
                  {businessForm.formState.errors.postalCode && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.postalCode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: direction * 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-4 sm:space-y-5"
          >
            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">{tBusiness("websiteUrl")}</label>
              <input
                type="url"
                {...businessForm.register("website")}
                className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                placeholder="https://www.example.com"
              />
              {businessForm.formState.errors.website && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.website.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">{tBusiness("instagramUrl")}</label>
                <input
                  type="url"
                  {...businessForm.register("instagram")}
                  className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  placeholder="https://instagram.com/yourbusiness"
                />
                {businessForm.formState.errors.instagram && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.instagram.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">{tBusiness("facebookUrl")}</label>
                <input
                  type="url"
                  {...businessForm.register("facebook")}
                  className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  placeholder="https://facebook.com/yourbusiness"
                />
                {businessForm.formState.errors.facebook && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.facebook.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">{tBusiness("tiktokUrl")}</label>
              <input
                type="url"
                {...businessForm.register("tiktok")}
                className="mt-1.5 sm:mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                placeholder="https://tiktok.com/@yourbusiness"
              />
              {businessForm.formState.errors.tiktok && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{businessForm.formState.errors.tiktok.message}</p>
              )}
            </div>

            {/* Completion Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/20"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-green-900 dark:text-green-100">
                    {tBusiness("almostDone")}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-green-700 dark:text-green-300">
                    {tBusiness("reviewInfo")}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )


      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 text-center">
          <Link href={`/${locale}/register`} className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <span>{tCommon("appName")}</span>
          </Link>
          <h1 className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-50">{tBusiness("title")}</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">{tBusiness("subtitle")}</p>
        </div>

        {/* Modern Step Indicator */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-3 lg:gap-4 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const isUpcoming = currentStep < step.id
              
              return (
                <div key={step.id} className="flex flex-1 min-w-0 items-center">
                  <div className="flex flex-col items-center min-w-0 flex-1 relative">
                    {/* Step Circle */}
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActive ? [1, 1.1, 1] : isCompleted ? 1 : 0.95,
                          boxShadow: isActive 
                            ? `0 0 0 3px rgba(34, 197, 94, 0.15), 0 2px 8px rgba(34, 197, 94, 0.25)` 
                            : isCompleted
                            ? "0 2px 8px rgba(34, 197, 94, 0.25)"
                            : "none"
                        }}
                        transition={{ 
                          duration: 0.3, 
                          type: "spring", 
                          stiffness: 300,
                          scale: { duration: 0.4 }
                        }}
                        className={`relative flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 text-xs sm:text-sm md:text-base lg:text-lg font-semibold transition-all duration-300 shrink-0 z-10 ${
                          isCompleted
                            ? `border-green-500 bg-green-500 text-white`
                            : isActive
                            ? `border-green-500 bg-green-500 text-white`
                            : "border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                        }`}
                      >
                        {isCompleted ? (
                          <motion.svg
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </motion.svg>
                        ) : (
                          <span className="text-[14px] sm:text-base md:text-lg">{step.icon}</span>
                        )}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-green-500 opacity-20 sm:opacity-30 blur-lg sm:blur-xl"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.2, 0.4, 0.2],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Step Title */}
                    <motion.p
                      initial={false}
                      animate={{
                        color: isActive || isCompleted 
                          ? "rgb(34, 197, 94)" 
                          : "rgb(161, 161, 170)"
                      }}
                      className={`mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-xs font-semibold text-center leading-tight transition-colors whitespace-nowrap ${
                        isActive || isCompleted 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      <span className="hidden md:inline">{step.title}</span>
                      <span className="hidden sm:inline md:hidden">{step.title.split(" ")[0]}</span>
                      <span className="sm:hidden">{index + 1}</span>
                    </motion.p>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex items-center justify-center mx-0.5 sm:mx-1 md:mx-2 flex-1 min-w-[4px] sm:min-w-[6px] md:min-w-0 h-0 sm:h-0.5 md:h-1">
                      <div className="relative w-full h-0.5 sm:h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <motion.div
                          initial={false}
                          animate={{
                            width: isCompleted ? "100%" : "0%",
                          }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: isExpanding ? 1.02 : 1,
          }}
          transition={{ 
            duration: 0.5,
            scale: {
              duration: 0.3,
              ease: "easeOut"
            }
          }}
          className="rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-xl shadow-zinc-900/5 dark:border-zinc-800/80 dark:bg-zinc-900/80 overflow-hidden"
        >
          <motion.div
            animate={{
              scale: isExpanding ? 1.01 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
              {error && (
                <div className="mb-4 sm:mb-6 rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200">
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-4 sm:mt-6 lg:mt-8 flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 sm:pt-6 dark:border-zinc-800">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`rounded-lg border border-zinc-300 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition ${
                  currentStep === 1
                    ? "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
                >
                  {tBusiness("previous")}
                </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/50"
                >
                  {tBusiness("next")}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={businessSubmitting || !businessForm.formState.isValid}
                  className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/50 disabled:opacity-50"
                >
                  {businessSubmitting ? tCommon("loading") : tBusiness("createAccount")}
                </button>
              )}
            </div>
          </form>
          </motion.div>
        </motion.div>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          {t("hasAccount")}{" "}
          <Link href={`/${locale}/login`} className="font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
            {t("loginLink")}
          </Link>
        </div>
      </div>
    </div>
  )
}

