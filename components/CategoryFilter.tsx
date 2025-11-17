"use client"

import { useTranslations } from "next-intl"

interface Category {
  id: string
  nameEn: string
  nameEl: string
  slug: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  locale: string
  nearMeEnabled: boolean
  locationLoading: boolean
  geolocationSupported: boolean
  onNearMeClick: () => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  locale,
  nearMeEnabled,
  locationLoading,
  geolocationSupported,
  onNearMeClick,
}: CategoryFilterProps) {
  const t = useTranslations("coupons")
  const tCommon = useTranslations("common")

  return (
    <div className="mb-10 space-y-6">
      {/* Search Bar */}
      <div className="mb-2">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-4.5 w-4.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={tCommon("search")}
            className="w-full rounded-2xl border border-zinc-300 bg-transparent py-3 pl-12 pr-16 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-12 flex items-center pr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onNearMeClick}
            disabled={locationLoading || (!geolocationSupported && !nearMeEnabled)}
            className={`absolute inset-y-0 right-2 my-1 flex w-10 items-center justify-center rounded-2xl text-sm font-semibold transition ${
              nearMeEnabled
                ? "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
            } ${locationLoading ? "opacity-70" : ""}`}
            aria-pressed={nearMeEnabled}
          >
            {locationLoading ? (
              <svg className="h-4.5 w-4.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}
            <span className="sr-only">{nearMeEnabled ? t("nearMeDisable") : t("nearMeEnable")}</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-300">
          {t("filterByCategory")}
        </h3>
      </div>
      <div className="-mx-2 sm:mx-0">
        <div className="flex gap-2 overflow-x-auto pb-2 pl-2 sm:flex-wrap sm:overflow-visible sm:pl-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => onSelectCategory(null)}
            className={`group relative flex-shrink-0 rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-200 drop-shadow-sm ${
              selectedCategory === null
                ? "border-transparent bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/40"
                : "border border-zinc-200 bg-white/80 text-zinc-600 hover:border-green-400 hover:text-green-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {tCommon("all")}
            </span>

          </button>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`group relative flex-shrink-0 rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-200 drop-shadow-sm ${
                  isSelected
                    ? "border-transparent bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                    : "border-zinc-200 bg-white/80 text-zinc-600 hover:border-green-400 hover:text-green-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                }`}
              >
                <span className="relative z-10">{locale === "el" ? category.nameEl : category.nameEn}</span>

              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

