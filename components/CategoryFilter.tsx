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
  locale: string
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  locale,
}: CategoryFilterProps) {
  const t = useTranslations("coupons")
  const tCommon = useTranslations("common")

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
        {t("filterByCategory")}
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            selectedCategory === null
              ? "bg-violet-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {tCommon("all")}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedCategory === category.id
                ? "bg-violet-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {locale === "el" ? category.nameEl : category.nameEn}
          </button>
        ))}
      </div>
    </div>
  )
}

