"use client"

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 dark:bg-green-900/30"
              >
                <motion.svg
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                  className="h-4 w-4 text-green-600 dark:text-green-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </motion.svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('hero.banner')}
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl"
              >
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {t('hero.title')}{' '}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="text-green-600 dark:text-green-400"
                >
                  {t('hero.titleHighlight')}
                </motion.span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="mt-6 text-lg text-zinc-600 dark:text-zinc-400"
              >
                {t('hero.description')}
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.1, type: "spring", stiffness: 200 }}
                className="mt-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`/${locale}/coupons`}
                    className="hero-button-glow group relative inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-600 hover:shadow-xl"
                  >
                    <motion.span
                      className="relative z-10 flex items-center gap-2"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <motion.svg
                        className="h-5 w-5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </motion.svg>
                      {t('hero.browseCoupons')}
                    </motion.span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Statistics */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.3 }}
                className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4"
              >
                {[
                  {
                    icon: (
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    ),
                    bgColor: "bg-green-100 dark:bg-green-900/30",
                    value: `${stats.totalCoupons}+`,
                    label: t('stats.coupons'),
                    delay: 0.1
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ),
                    bgColor: "bg-blue-100 dark:bg-blue-900/30",
                    value: `${stats.totalBusinesses}+`,
                    label: t('stats.businesses'),
                    delay: 0.2
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ),
                    bgColor: "bg-amber-100 dark:bg-amber-900/30",
                    value: `€${stats.totalCoupons * 10}K+`,
                    label: t('stats.savings'),
                    delay: 0.3
                  },
                  {
                    icon: (
                      <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ),
                    bgColor: "bg-purple-100 dark:bg-purple-900/30",
                    value: `${stats.activeMembers}+`,
                    label: t('stats.members'),
                    delay: 0.4
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.3 + stat.delay }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, delay: 1.3 + stat.delay, type: "spring" }}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
                    >
                      {stat.icon}
                    </motion.div>
                    <div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.5 + stat.delay }}
                        className="text-2xl font-bold text-zinc-900 dark:text-zinc-50"
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Side - Trending Deals */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="lg:col-span-1"
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="mb-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <motion.svg
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 text-orange-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </motion.svg>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {t('featured.title')}
                    </h2>
                  </div>
                  <motion.svg
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-5 w-5 text-yellow-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </motion.svg>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mb-6 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {t('featured.subtitle')}
                </motion.p>

                {/* Deal Listings */}
                {loading ? (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    {tCommon('loading')}
                  </div>
                ) : featuredCoupons.length > 0 ? (
                  <div className="space-y-4">
                    {featuredCoupons.slice(0, 3).map((coupon, index) => (
                      <motion.div
                        key={coupon.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                        whileHover={{ x: 5, scale: 1.02 }}
                      >
                        <Link
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
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    No deals available
                  </div>
                )}
              </motion.div>
            </motion.div>
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
