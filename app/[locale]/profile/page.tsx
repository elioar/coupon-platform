"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import Navigation from "@/components/Navigation"
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete"

interface ProfileResponse {
  profile: {
    name: string
    address: string | null
    birthDate: string | null
    phone: string | null
    about: string | null
    businessDescription: string | null
    businessCategories: string[]
    businessLocation: string | null
    businessWebsite: string | null
    businessInstagram: string | null
    businessFacebook: string | null
    businessTikTok: string | null
  }
}

type MessageState =
  | {
      type: "success" | "error"
      text: string
    }
  | null

const emptyForm = {
  name: "",
  address: "",
  birthDate: "",
  phone: "",
  about: "",
  businessDescription: "",
  businessCategories: "",
  businessLocation: "",
  businessWebsite: "",
  businessInstagram: "",
  businessFacebook: "",
  businessTikTok: "",
  businessVatNumber: "",
  businessCity: "",
  businessPostalCode: "",
}

type ProfileFormState = typeof emptyForm

interface Category {
  id: string
  nameEn: string
  nameEl: string
}

const parseBusinessMeta = (raw: string | null) => {
  if (!raw) {
    return { raw: "", vatNumber: "", city: "", postalCode: "", logoUrl: "" }
  }
  try {
    const parsed = JSON.parse(raw)
    return {
      raw: parsed.raw ?? "",
      vatNumber: parsed.vatNumber ?? "",
      city: parsed.city ?? "",
      postalCode: parsed.postalCode ?? "",
      logoUrl: parsed.logoUrl ?? "",
    }
  } catch {
    return { raw: raw ?? "", vatNumber: "", city: "", postalCode: "", logoUrl: "" }
  }
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const tProfile = useTranslations("profile")
  const tCommon = useTranslations("common")
  const locale = useLocale()

  const [formData, setFormData] = useState<ProfileFormState>(emptyForm)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const isBusiness = useMemo(() => session?.user.role === "BUSINESS", [session?.user.role])
  const businessMeta = useMemo(
    () => parseBusinessMeta(session?.user.businessDescription ?? null),
    [session?.user.businessDescription]
  )
  const businessDescriptionEmptyText = useMemo(() => {
    if (locale === "el") {
      return "Προσθέστε μια σύντομη περιγραφή ώστε τα μέλη να ξέρουν τι προσφέρετε."
    }
    try {
      return tProfile("businessDescriptionEmpty")
    } catch {
      return "Add a short description so members know what you offer."
    }
  }, [locale, tProfile])
  const selectedCategoryName = useMemo(() => {
    if (!formData.businessCategories) {
      return ""
    }
    const match = categories.find((category) => category.id === formData.businessCategories)
    if (!match) {
      return ""
    }
    return locale === "el" ? match.nameEl : match.nameEn
  }, [categories, formData.businessCategories, locale])
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        if (!res.ok) return
        const data = await res.json()
        setCategories(data.categories || [])
      } catch (error) {
        // Failed to load categories - handled silently
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) {
        setLoadingProfile(false)
        return
      }

      try {
        const res = await fetch("/api/profile")
        if (!res.ok) {
          throw new Error("Failed to load profile")
        }

        const data = (await res.json()) as ProfileResponse
        const profile = data.profile
        const meta = parseBusinessMeta(profile.businessDescription ?? null)
        setFormData({
          name: profile.name ?? "",
          address: profile.address ?? "",
          birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
          phone: profile.phone ?? "",
          about: profile.about ?? "",
          businessDescription: meta.raw || "",
          businessCategories: profile.businessCategories[0] ?? "",
          businessLocation: profile.businessLocation ?? "",
          businessWebsite: profile.businessWebsite ?? "",
          businessInstagram: profile.businessInstagram ?? "",
          businessFacebook: profile.businessFacebook ?? "",
          businessTikTok: profile.businessTikTok ?? "",
          businessVatNumber: meta.vatNumber,
          businessCity: meta.city,
          businessPostalCode: meta.postalCode,
        })
      } catch (error) {
        setMessage({ type: "error", text: tProfile("error") })
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [session, tProfile])

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const categoriesArray = formData.businessCategories
        ? [formData.businessCategories.trim()]
        : []

      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        birthDate: formData.birthDate || null,
        phone: formData.phone.trim() || null,
        about: formData.about.trim() || null,
        businessDescription: JSON.stringify({
          raw: formData.businessDescription.trim(),
          vatNumber: formData.businessVatNumber.trim(),
          city: formData.businessCity.trim(),
          postalCode: formData.businessPostalCode.trim(),
          logoUrl: businessMeta.logoUrl,
        }),
        businessCategories: categoriesArray,
        businessLocation: formData.businessLocation.trim() || null,
        businessWebsite: formData.businessWebsite.trim() || null,
        businessInstagram: formData.businessInstagram.trim() || null,
        businessFacebook: formData.businessFacebook.trim() || null,
        businessTikTok: formData.businessTikTok.trim() || null,
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      const result = (await response.json()) as ProfileResponse
        const profile = result.profile
        const meta = parseBusinessMeta(profile.businessDescription ?? null)

        setFormData({
          name: profile.name ?? "",
        address: profile.address ?? "",
        birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
        phone: profile.phone ?? "",
        about: profile.about ?? "",
        businessDescription: meta.raw || "",
        businessCategories: profile.businessCategories[0] ?? "",
        businessLocation: profile.businessLocation ?? "",
        businessWebsite: profile.businessWebsite ?? "",
        businessInstagram: profile.businessInstagram ?? "",
        businessFacebook: profile.businessFacebook ?? "",
        businessTikTok: profile.businessTikTok ?? "",
        businessVatNumber: meta.vatNumber,
        businessCity: meta.city,
        businessPostalCode: meta.postalCode,
      })

      setMessage({ type: "success", text: tProfile("success") })
      await update({ name: profile.name ?? "" })
    } catch (error) {
      setMessage({ type: "error", text: tProfile("error") })
    } finally {
      setSaving(false)
    }
  }

  const renderInput = (
    label: string,
    field: keyof ProfileFormState,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
        <span>{label}</span>
        {props.required && <span className="text-white/30">•</span>}
      </div>
      <input
        id={field}
        name={field}
        value={formData[field]}
        onChange={(event) => handleChange(field, event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        {...props}
      />
    </div>
  )

  const renderTextArea = (
    label: string,
    field: keyof ProfileFormState,
    helper?: string
  ) => (
    <div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
        <span>{label}</span>
      </div>
      <textarea
        id={field}
        name={field}
        rows={4}
        value={formData[field]}
        onChange={(event) => handleChange(field, event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        placeholder={helper}
      />
      {helper && (
        <p className="mt-1 text-xs text-white/40">
          {helper}
        </p>
      )}
    </div>
  )

  const shouldShowContent = status !== "loading" && !loadingProfile && session

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03060b] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-500/15 blur-[140px]" />
      </div>

      <Navigation />

      <main className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
        <section className="grid gap-6 rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0c1325]/95 via-[#050a13] to-[#04070d] p-6 shadow-2xl backdrop-blur-2xl lg:grid-cols-[1.5fr,0.9fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.6em] text-emerald-100/70">{tCommon("appName")}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{tProfile("title")}</h1>
              <p className="mt-1 text-sm text-white/70">{session?.user.email}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/25 via-emerald-500/5 to-transparent p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Role</p>
                <p className="mt-2 text-lg font-semibold text-white">{session?.user.role ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/20 via-sky-500/5 to-transparent p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Member</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {session?.user.membershipExpiry
                    ? new Date(session.user.membershipExpiry).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-fuchsia-500/5 to-transparent p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">{tProfile("phone")}</p>
                <p className="mt-2 text-lg font-semibold text-white">{formData.phone || "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">{tProfile("businessCategories")}</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {selectedCategoryName || "—"}
                </p>
              </div>
            </div>
          </div>
          {isBusiness ? (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-transparent to-sky-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">VAT / AFM</p>
              <p className="mt-2 text-2xl font-semibold text-white">{businessMeta.vatNumber || "—"}</p>
              <p className="text-sm text-white/60">{businessMeta.city || tProfile("businessLocation")}</p>
              <div className="mt-4 space-y-2 text-sm text-white/80">
                <p>
                  {tProfile("businessLocation")}: {formData.businessLocation || "—"}
                </p>
                <p className="break-all">
                  {tProfile("businessWebsite")}: {formData.businessWebsite || "—"}
                </p>
                <p className="text-xs text-white/60">
                  {formData.businessDescription?.trim()
                    ? formData.businessDescription
                    : businessDescriptionEmptyText}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/15 via-transparent to-transparent p-5 text-sm text-white/80">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">{tProfile("address")}</p>
              <p className="mt-2 text-lg font-semibold text-white">{formData.address || "—"}</p>
              <div className="mt-4 space-y-2">
                <p>{tProfile("phone")}: {formData.phone || "—"}</p>
                <p>{tProfile("birthDate")}: {formData.birthDate || "—"}</p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#060b13] via-[#05070d] to-[#04060a] p-6 shadow-2xl backdrop-blur-2xl">
          {!shouldShowContent ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-white/70">
              {status === "loading" || loadingProfile ? tProfile("loading") : tProfile("noSession")}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "border-red-500/30 bg-red-500/10 text-red-100"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className={`grid gap-5 ${isBusiness ? "lg:grid-cols-2" : ""}`}>
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">{tProfile("personalInfo")}</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Profile</h2>
                  </div>
                  <div className="space-y-5">
                    <div className="grid gap-4">
                      {renderInput(tProfile("name"), "name", { required: true })}
                      {renderInput(tProfile("phone"), "phone", {
                        type: "tel",
                        placeholder: "+30 123 456 7890",
                      })}
                      {renderInput(tProfile("address"), "address", {
                        placeholder: "123 Example Street",
                      })}
                      {renderInput(tProfile("birthDate"), "birthDate", { type: "date" })}
                    </div>
                    <p className="text-xs text-white/60">{tProfile("birthDateHelp")}</p>
                  </div>
                </section>

                {isBusiness && (
                  <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 to-transparent p-5">
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-[0.4em] text-white/50">{tProfile("businessInfo")}</p>
                      <h2 className="mt-1 text-xl font-semibold text-white">Business</h2>
                    </div>
                    <div className="space-y-5">
                      {renderTextArea(tProfile("businessDescription"), "businessDescription")}
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderInput("VAT / AFM", "businessVatNumber")}
                        {renderInput("City", "businessCity")}
                        {renderInput("Postal Code", "businessPostalCode")}
                        {renderInput(tProfile("businessWebsite"), "businessWebsite", {
                          type: "url",
                          placeholder: "https://example.com",
                        })}
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
                          <span>{tProfile("businessCategories")}</span>
                        </div>
                        <select
                          value={formData.businessCategories}
                          onChange={(event) => handleChange("businessCategories", event.target.value)}
                          disabled={categories.length === 0}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">{tProfile("businessCategoriesPlaceholder")}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {locale === "el" ? category.nameEl : category.nameEn}
                            </option>
                          ))}
                        </select>
                        <p className={`mt-1 text-xs ${categories.length === 0 ? "text-amber-300/80" : "text-white/50"}`}>
                          {categories.length === 0
                            ? tProfile("businessCategoriesEmpty")
                            : tProfile("businessCategoriesHelp")}
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
                            <span>{tProfile("businessLocation")}</span>
                          </div>
                          <GooglePlacesAutocomplete
                            value={formData.businessLocation}
                            onChange={(value) => handleChange("businessLocation", value)}
                            placeholder="Enter your business location..."
                            locale={locale}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                          />
                        </div>
                        {renderInput(tProfile("businessInstagram"), "businessInstagram", {
                          type: "url",
                          placeholder: "https://instagram.com/yourbusiness",
                        })}
                        {renderInput(tProfile("businessFacebook"), "businessFacebook", {
                          type: "url",
                          placeholder: "https://facebook.com/yourbusiness",
                        })}
                        {renderInput(tProfile("businessTikTok"), "businessTikTok", {
                          type: "url",
                          placeholder: "https://tiktok.com/@yourbusiness",
                        })}
                      </div>
                      <p className="text-xs text-white/60">{tProfile("businessLocationHint")}</p>
                    </div>
                  </section>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-3xl bg-gradient-to-r from-emerald-400 to-sky-400 px-8 py-3 text-sm font-semibold text-zinc-900 shadow-lg shadow-emerald-500/40 transition hover:shadow-sky-500/40 disabled:opacity-50"
                >
                  {saving ? tCommon("loading") : tProfile("save")}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  )

}
