"use client"

import { use } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Navigation from "@/components/Navigation"
import { motion } from "framer-motion"

export default function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const t = useTranslations("terms")
  const tCommon = useTranslations("common")

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-green-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-xl shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/80 p-6 sm:p-8 lg:p-12"
        >
          {/* Header */}
          <div className="mb-8 border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-4"
            >
              <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M15 19l-7-7 7-7" />
              </svg>
              {tCommon("back")}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("lastUpdated")}: {t("lastUpdatedDate")}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section1.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {t("section1.content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section2.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {t("section2.content")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-zinc-700 dark:text-zinc-300 ml-4">
                <li>{t("section2.item1")}</li>
                <li>{t("section2.item2")}</li>
                <li>{t("section2.item3")}</li>
                <li>{t("section2.item4")}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section3.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {t("section3.content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section4.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {t("section4.content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section5.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {t("section5.content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section6.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {t("section6.content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section7.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                {t("section7.content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                {t("section8.title")}
              </h2>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {t("section8.content")}
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
              {t("questions")}{" "}
              <Link href={`/${locale}/contact`} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-semibold">
                {t("contactUs")}
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

