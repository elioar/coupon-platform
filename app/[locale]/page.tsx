"use client"

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CouponCard from '@/components/CouponCard';
import { isMember } from '@/lib/client-utils';
import { useSession } from 'next-auth/react';

interface Category {
  id: string;
  nameEn: string;
  nameEl: string;
  slug: string;
}

interface Coupon {
  id: string;
  title: string;
  description: string;
  code: string;
  discountPercentage: number;
  expirationDate: string;
  imagePath: string | null;
  category: {
    id: string;
    nameEn: string;
    nameEl: string;
  };
  business?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCoupons, setFeaturedCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeMembers: 0,
    totalBusinesses: 0,
  });
  const [loading, setLoading] = useState(true);

  const userIsMember = isMember(session?.user || null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories?.slice(0, 8) || []);

        // Fetch featured coupons (approved only)
        const couponsRes = await fetch('/api/coupons?status=APPROVED&limit=6');
        const couponsData = await couponsRes.json();
        const coupons = couponsData.coupons || [];
        setFeaturedCoupons(coupons);

        // Fetch stats
        try {
          if (session?.user?.role === 'ADMIN') {
            const statsRes = await fetch('/api/admin/stats');
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats({
                totalCoupons: statsData.totalCoupons || coupons.length,
                activeMembers: statsData.activeMembers || 0,
                totalBusinesses: statsData.totalBusinesses || 0,
              });
            } else {
              // Fallback stats
              setStats({
                totalCoupons: coupons.length,
                activeMembers: 0,
                totalBusinesses: 0,
              });
            }
          } else {
            // For non-admins, use coupon count as estimate
            setStats({
              totalCoupons: coupons.length,
              activeMembers: 0,
              totalBusinesses: 0,
            });
          }
        } catch (statsError) {
          // If stats fail, use coupon count
          setStats({
            totalCoupons: coupons.length,
            activeMembers: 0,
            totalBusinesses: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.role]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />
      
      {/* Hero Section */}
      <section className="flex min-h-screen items-center bg-white dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:bg-gradient-to-br">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Left Side - Hero Content */}
            <div className="lg:col-span-2">
              {/* Top Banner */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 dark:bg-green-900/30">
                <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('hero.banner')}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
                {t('hero.title')}{' '}
                <span className="text-green-600 dark:text-green-400">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
                {t('hero.description')}
              </p>

              {/* CTA Button */}
              <div className="mt-8">
                <Link
                  href={`/${locale}/coupons`}
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-xl"
                >
                  <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('hero.browseCoupons')}
                </Link>
              </div>

              {/* Statistics */}
              <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {stats.totalCoupons}+
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {t('stats.coupons')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {stats.totalBusinesses}+
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {t('stats.businesses')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      €{stats.totalCoupons * 10}K+
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {t('stats.savings')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {stats.activeMembers}+
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      {t('stats.members')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Trending Deals */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-orange-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {t('featured.title')}
                    </h2>
                  </div>
                  <svg className="h-5 w-5 text-yellow-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                  {t('featured.subtitle')}
                </p>

                {/* Deal Listings */}
                {loading ? (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    {tCommon('loading')}
                  </div>
                ) : featuredCoupons.length > 0 ? (
                  <div className="space-y-4">
                    {featuredCoupons.slice(0, 3).map((coupon) => (
                      <Link
                        key={coupon.id}
                        href={`/${locale}/coupons`}
                        className="group flex items-center gap-3 rounded-lg border-b border-zinc-100 pb-4 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 last:border-0"
                      >
                        {coupon.imagePath ? (
                          <img
                            src={coupon.imagePath}
                            alt={coupon.title}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <svg className="h-8 w-8 text-zinc-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-green-600 dark:group-hover:text-green-400">
                            {coupon.title}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {coupon.business?.name || 'Business'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {coupon.discountPercentage}%
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            OFF
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    No deals available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {t('features.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t('features.verified.title')}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t('features.verified.description')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t('features.unlimited.title')}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t('features.unlimited.description')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t('features.categories.title')}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t('features.categories.description')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t('features.easy.title')}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t('features.easy.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {t('howItWorks.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute -top-4 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                1
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t('howItWorks.step1.title')}
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {t('howItWorks.step1.description')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute -top-4 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                2
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t('howItWorks.step2.title')}
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {t('howItWorks.step2.description')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="absolute -top-4 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
                3
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t('howItWorks.step3.title')}
              </h3>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {t('howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      {categories.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {t('categories.title')}
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                {t('categories.subtitle')}
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3 lg:max-w-none lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/coupons?category=${category.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition hover:border-violet-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-700"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 mx-auto transition group-hover:scale-110 dark:bg-violet-900/30">
                    <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {locale === 'el' ? category.nameEl : category.nameEn}
                  </h3>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href={`/${locale}/coupons`}
                className="inline-flex items-center gap-2 text-violet-600 font-semibold transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                {t('categories.viewAll')}
                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Coupons Section */}
      {featuredCoupons.length > 0 && (
        <section className="bg-white py-24 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                {t('featured.title')}
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                {t('featured.subtitle')}
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
              {featuredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  isMember={userIsMember}
                  locale={locale}
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href={`/${locale}/coupons`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-8 font-semibold text-white shadow-md transition hover:bg-violet-700 hover:shadow-lg"
              >
                {t('featured.viewAll')}
                <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="bg-white py-24 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              {t('stats.title')}
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-6 lg:max-w-none lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                {stats.totalCoupons}+
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t('stats.coupons')}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {stats.activeMembers}+
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t('stats.members')}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalBusinesses}+
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t('stats.businesses')}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                €{stats.totalCoupons * 10}K+
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t('stats.savings')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              {t('cta.description')}
            </p>
            <div className="mt-10">
              <Link
                href={`/${locale}/register`}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 font-semibold text-white shadow-lg transition hover:from-green-600 hover:to-emerald-600 hover:shadow-xl"
              >
                {t('cta.button')}
                <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} {tCommon('appName')} — {t('footer')}
          </div>
        </div>
      </footer>
    </div>
  );
}
