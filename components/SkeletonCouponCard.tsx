"use client"

import { motion } from "framer-motion"

export default function SkeletonCouponCard() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white shadow-lg dark:border-zinc-800/50 dark:bg-zinc-900/80">
      {/* Image Skeleton */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          style={{ width: "60%", transform: "skewX(-20deg)" }}
          animate={{
            x: ["-150%", "250%"],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear",
          }}
        />
        {/* Badge Skeletons */}
        <motion.div
          className="absolute right-3 top-3 z-10 h-8 w-20 rounded-full bg-white/80 backdrop-blur-sm dark:bg-zinc-800/80"
          animate={{
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute left-3 top-3 z-10 h-6 w-16 rounded-full bg-white/80 backdrop-blur-sm dark:bg-zinc-800/80"
          animate={{
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
            delay: 0.4,
          }}
        />
      </div>

      {/* Content Skeleton */}
      <div className="relative p-6">
        {/* Expiration Date Skeleton */}
        <div className="mb-3 flex items-center justify-end">
          <div className="relative h-6 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{ width: "50%", transform: "skewX(-20deg)" }}
              animate={{
                x: ["-150%", "250%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
              }}
            />
          </div>
        </div>

        {/* Title Skeleton */}
        <div className="mb-3 space-y-2">
          <div className="relative h-6 w-3/4 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{ width: "50%", transform: "skewX(-20deg)" }}
              animate={{
                x: ["-150%", "250%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
                delay: 0.15,
              }}
            />
          </div>
          <div className="relative h-4 w-1/2 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{ width: "50%", transform: "skewX(-20deg)" }}
              animate={{
                x: ["-150%", "250%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
                delay: 0.3,
              }}
            />
          </div>
        </div>

        {/* Business Name Skeleton */}
        <div className="relative mb-3 h-4 w-24 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
            style={{ width: "50%", transform: "skewX(-20deg)" }}
            animate={{
              x: ["-150%", "250%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
              delay: 0.45,
            }}
          />
        </div>

        {/* Description Skeleton */}
        <div className="mb-6 space-y-2">
          <div className="relative h-3 w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{ width: "50%", transform: "skewX(-20deg)" }}
              animate={{
                x: ["-150%", "250%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
                delay: 0.6,
              }}
            />
          </div>
          <div className="relative h-3 w-5/6 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{ width: "50%", transform: "skewX(-20deg)" }}
              animate={{
                x: ["-150%", "250%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
                delay: 0.75,
              }}
            />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ width: "60%", transform: "skewX(-20deg)" }}
            animate={{
              x: ["-150%", "250%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
              delay: 0.9,
            }}
          />
        </div>
      </div>
    </div>
  )
}

