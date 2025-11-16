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
  locationDescription: string | null
  locationError: string | null
  hasDistanceCoupons: boolean
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
  locationDescription,
  locationError,
  hasDistanceCoupons,
}: CategoryFilterProps) {
  const t = useTranslations("coupons")
  const tCommon = useTranslations("common")

  return (
    <div className="mb-10">
      {/* Search Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={tCommon("search")}
              className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-12 pr-4 text-sm shadow-md shadow-zinc-200/40 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-green-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onNearMeClick}
            disabled={locationLoading || (!geolocationSupported && !nearMeEnabled)}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition md:w-auto ${
              nearMeEnabled
                ? "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500"
            } ${locationLoading ? "opacity-70" : ""}`}
          >
            {locationLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                {t("nearMeSearching")}
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {nearMeEnabled ? t("nearMeDisable") : t("nearMeEnable")}
              </>
            )}
          </button>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {locationError ? (
            <p className="font-medium text-red-600 dark:text-red-400">{locationError}</p>
          ) : nearMeEnabled && locationDescription ? (
            <p className="text-zinc-600 dark:text-zinc-400">{locationDescription}</p>
          ) : (
            <p className="text-zinc-400">{t("nearMeDescription")}</p>
          )}
          {nearMeEnabled && !locationError && (
            <p className="font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
              {t("nearMeGpsActive")}
            </p>
          )}
          {nearMeEnabled && !locationError && !hasDistanceCoupons && (
            <p className="text-amber-600 dark:text-amber-400">{t("nearMeNoData")}</p>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("filterByCategory")}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onSelectCategory(null)}
          className={`group relative overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
            selectedCategory === null
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105"
              : "bg-white text-zinc-700 shadow-md hover:shadow-lg hover:scale-105 hover:bg-green-50 hover:text-green-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-green-300"
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {tCommon("all")}
          </span>
          {selectedCategory === null && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shine"></div>
          )}
        </button>
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`group relative overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                isSelected
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105"
                  : "bg-white text-zinc-700 shadow-md hover:shadow-lg hover:scale-105 hover:bg-green-50 hover:text-green-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-green-300"
              }`}
            >
              <span className="relative z-10">{locale === "el" ? category.nameEl : category.nameEn}</span>
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shine"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

