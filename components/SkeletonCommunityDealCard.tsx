"use client"

import { motion } from "framer-motion"

export default function SkeletonCommunityDealCard() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900/80">
      {/* Image Skeleton */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700">
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
        {/* Category Badge Skeleton */}
        <motion.div
          className="absolute left-3 top-3 z-10 h-6 w-20 rounded-full bg-white/80 backdrop-blur-sm dark:bg-zinc-800/80"
          animate={{
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
        />
        {/* Coupon Code Badge Skeleton (optional) */}
        <motion.div
          className="absolute right-3 top-3 z-10 h-6 w-16 rounded-full bg-white/80 backdrop-blur-sm dark:bg-zinc-800/80"
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
      <div className="relative p-4">
        {/* Title Skeleton */}
        <div className="mb-2 space-y-2">
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
          <div className="relative h-5 w-1/2 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
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

        {/* Location Skeleton */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="relative h-4 w-32 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
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
        </div>

        {/* Posted By Skeleton */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="relative h-4 w-24 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
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
        </div>

        {/* Date Skeleton */}
        <div className="mb-3 relative h-3 w-20 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
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

        {/* Voting and Comments Skeleton */}
        <div className="mb-3 flex items-center gap-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="relative h-4 w-6 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
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
                  delay: 0.9,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="relative h-4 w-6 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
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
                  delay: 1.05,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="relative h-4 w-6 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
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
                  delay: 1.2,
                }}
              />
            </div>
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="relative h-10 w-full overflow-hidden rounded-lg bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700">
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
              delay: 1.35,
            }}
          />
        </div>
      </div>
    </div>
  )
}

