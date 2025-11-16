"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import Navigation from "@/components/Navigation"

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
}

type ProfileFormState = typeof emptyForm

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const tProfile = useTranslations("profile")
  const tCommon = useTranslations("common")
  const [formData, setFormData] = useState<ProfileFormState>(emptyForm)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)

  const isBusiness = useMemo(() => session?.user.role === "BUSINESS", [session?.user.role])

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
        setFormData({
          name: profile.name ?? "",
          address: profile.address ?? "",
          birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
          phone: profile.phone ?? "",
          about: profile.about ?? "",
          businessDescription: profile.businessDescription ?? "",
          businessCategories: profile.businessCategories.join(", "),
          businessLocation: profile.businessLocation ?? "",
          businessWebsite: profile.businessWebsite ?? "",
          businessInstagram: profile.businessInstagram ?? "",
          businessFacebook: profile.businessFacebook ?? "",
          businessTikTok: profile.businessTikTok ?? "",
        })
      } catch (error) {
        console.error(error)
        setMessage({
          type: "error",
          text: tProfile("error"),
        })
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
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)

      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        birthDate: formData.birthDate || null,
        phone: formData.phone.trim() || null,
        about: formData.about.trim() || null,
        businessDescription: formData.businessDescription.trim() || null,
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
        setFormData({
          name: profile.name ?? "",
          address: profile.address ?? "",
        birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : "",
        phone: profile.phone ?? "",
        about: profile.about ?? "",
        businessDescription: profile.businessDescription ?? "",
        businessCategories: profile.businessCategories.join(", "),
        businessLocation: profile.businessLocation ?? "",
          businessWebsite: profile.businessWebsite ?? "",
          businessInstagram: profile.businessInstagram ?? "",
          businessFacebook: profile.businessFacebook ?? "",
          businessTikTok: profile.businessTikTok ?? "",
        })

      setMessage({
        type: "success",
        text: tProfile("success"),
      })

      await update({ name: profile.name ?? "" })
    } catch (error) {
      console.error(error)
      setMessage({
        type: "error",
        text: tProfile("error"),
      })
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
      <label
        htmlFor={field}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={field}
        name={field}
        value={formData[field]}
        onChange={(event) => handleChange(field, event.target.value)}
        className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
      <label
        htmlFor={field}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <textarea
        id={field}
        name={field}
        rows={4}
        value={formData[field]}
        onChange={(event) => handleChange(field, event.target.value)}
        className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        placeholder={helper}
      />
      {helper && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {helper}
        </p>
      )}
    </div>
  )

  const shouldShowContent = status !== "loading" && !loadingProfile && session

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-wide text-green-600">
            {tCommon("appName")}
          </p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            {tProfile("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            {tProfile("subtitle")}
          </p>
        </div>

        {!shouldShowContent && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              {status === "loading" || loadingProfile
                ? tProfile("loading")
                : tProfile("noSession")}
            </p>
          </div>
        )}

        {shouldShowContent && (
          <form onSubmit={handleSubmit} className="space-y-10">
            {message && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  message.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-300"
                    : "border-red-200 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {tProfile("personalInfo")}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {tProfile("updateHint")}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {renderInput(tProfile("name"), "name", { required: true })}
                {renderInput(tProfile("phone"), "phone", {
                  type: "tel",
                  placeholder: "+30 123 456 7890",
                })}
                {renderInput(tProfile("address"), "address", {
                  placeholder: "123 Example Street",
                })}
                {renderInput(tProfile("birthDate"), "birthDate", {
                  type: "date",
                })}
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                {tProfile("birthDateHelp")}
              </p>

              <div className="mt-6">
                {renderTextArea(
                  tProfile("about"),
                  "about",
                  tProfile("aboutPlaceholder")
                )}
              </div>
            </section>

            {isBusiness && (
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {tProfile("businessInfo")}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {tProfile("businessOnly")}
                  </p>
                </div>

                <div className="space-y-6">
                  {renderTextArea(
                    tProfile("businessDescription"),
                    "businessDescription"
                  )}

                  {renderTextArea(
                    tProfile("businessCategories"),
                    "businessCategories",
                    tProfile("businessCategoriesHelp")
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    {renderInput(tProfile("businessLocation"), "businessLocation")}
                    {renderInput(tProfile("businessWebsite"), "businessWebsite", {
                      type: "url",
                      placeholder: "https://example.com",
                    })}
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {tProfile("businessLocationHint")}
                  </p>

                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                      {tProfile("linkSocial")}
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {renderInput(
                        tProfile("businessInstagram"),
                        "businessInstagram",
                        {
                          type: "url",
                          placeholder: "https://instagram.com/yourbusiness",
                        }
                      )}
                      {renderInput(
                        tProfile("businessFacebook"),
                        "businessFacebook",
                        {
                          type: "url",
                          placeholder: "https://facebook.com/yourbusiness",
                        }
                      )}
                      {renderInput(
                        tProfile("businessTikTok"),
                        "businessTikTok",
                        {
                          type: "url",
                          placeholder: "https://tiktok.com/@yourbusiness",
                        }
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition hover:shadow-green-500/40 disabled:opacity-70"
              >
                {saving ? tCommon("loading") : tProfile("save")}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
