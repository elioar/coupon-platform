"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface CommunityDeal {
  id: string
  title: string
  description: string
  category: string
  location: string
  imageUrl: string
  couponCode: string | null
  createdAt: string
  expiresAt: string
  commentsCount: number
  upvotesCount: number
  downvotesCount: number
  myVote: "UP" | "DOWN" | null
  user: {
    id: string
    name: string
    email: string
  }
}

interface CommunityDealModalProps {
  deal: CommunityDeal | null
  locale: string
  onClose: () => void
  canInteract?: boolean
  onVoteStateChange?: (dealId: string, payload: { upvotesCount: number; downvotesCount: number; myVote: "UP" | "DOWN" | null }) => void
  onCommentsCountChange?: (dealId: string, nextCount: number) => void
}

const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date)
}

interface CommunityDealComment {
  id: string
  createdAt: string
  text: string
  user: {
    id: string
    name: string
  }
}

function formatTimeAgo(dateString: string, locale: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (minutes < 1) return locale === "el" ? "τώρα" : "just now"
  if (minutes === 1) return locale === "el" ? "πριν 1 λεπτό" : "1 minute ago"
  if (minutes < 60) return locale === "el" ? `πριν ${minutes} λεπτά` : `${minutes} minutes ago`
  if (hours === 1) return locale === "el" ? "πριν 1 ώρα" : "1 hour ago"
  if (hours < 24) return locale === "el" ? `πριν ${hours} ώρες` : `${hours} hours ago`
  if (days === 1) return locale === "el" ? "πριν 1 ημέρα" : "1 day ago"
  return locale === "el" ? `πριν ${days} ημέρες` : `${days} days ago`
}

export default function CommunityDealModal({
  deal,
  locale,
  onClose,
  canInteract = false,
  onVoteStateChange,
  onCommentsCountChange,
}: CommunityDealModalProps) {
  const t = useTranslations("community")
  const tCommon = useTranslations("common")
  const [copied, setCopied] = useState(false)
  const [upvotes, setUpvotes] = useState(0)
  const [downvotes, setDownvotes] = useState(0)
  const [userVote, setUserVote] = useState<"UP" | "DOWN" | null>(null)
  const [comments, setComments] = useState<CommunityDealComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    if (!deal) return
    setUpvotes(deal.upvotesCount ?? 0)
    setDownvotes(deal.downvotesCount ?? 0)
    setUserVote(deal.myVote ?? null)
  }, [deal?.id])

  useEffect(() => {
    if (!deal) return
    let cancelled = false
    const load = async () => {
      try {
        setIsLoadingComments(true)
        const res = await fetch(`/api/community-deals/${deal.id}/comments`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setComments(data.comments || [])
      } catch (e) {
        console.error("Error loading comments:", e)
      } finally {
        if (!cancelled) setIsLoadingComments(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [deal?.id])

  // Keep parent list counts in sync without triggering setState during render
  useEffect(() => {
    if (!deal) return
    if (typeof onCommentsCountChange !== "function") return
    onCommentsCountChange(deal.id, comments.length)
  }, [deal?.id, comments.length, onCommentsCountChange])

  useEffect(() => {
    if (deal) {
      document.body.style.overflow = "hidden"
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose()
        }
      }
      document.addEventListener("keydown", handleEscape)
      return () => {
        document.body.style.overflow = "unset"
        document.removeEventListener("keydown", handleEscape)
      }
    }
  }, [deal, onClose])

  const copyCode = async () => {
    if (deal?.couponCode) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(deal.couponCode)
        } else {
          const textArea = document.createElement("textarea")
          textArea.value = deal.couponCode
          textArea.style.position = "fixed"
          textArea.style.left = "-999999px"
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand("copy")
          document.body.removeChild(textArea)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        alert("Unable to copy to clipboard. Please copy manually: " + deal.couponCode)
      }
    }
  }

  const vote = async (e: React.MouseEvent, value: "UP" | "DOWN") => {
    e.stopPropagation()
    if (!deal) return
    if (!canInteract) return
    if (isVoting) return
    try {
      setIsVoting(true)
      const res = await fetch(`/api/community-deals/${deal.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) return
      const data = await res.json()
      const nextUp = data.upvotesCount ?? 0
      const nextDown = data.downvotesCount ?? 0
      const nextMyVote = (data.myVote ?? null) as "UP" | "DOWN" | null
      setUpvotes(nextUp)
      setDownvotes(nextDown)
      setUserVote(nextMyVote)
      if (typeof onVoteStateChange === "function") {
        onVoteStateChange(deal.id, { upvotesCount: nextUp, downvotesCount: nextDown, myVote: nextMyVote })
      }
    } catch (err) {
      console.error("Error voting:", err)
    } finally {
      setIsVoting(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deal) return
    if (!canInteract) return
    const text = newComment.trim()
    if (!text) return
    if (text.length > 100) return

    setIsSubmittingComment(true)
    try {
      const res = await fetch(`/api/community-deals/${deal.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev])
        setNewComment("")
      }
    } catch (err) {
      console.error("Error posting comment:", err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (!deal) return null

  return (
    <AnimatePresence>
      {deal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[70vh] overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900 flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-lg p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Left Side - Image */}
              <div className="md:w-2/5 relative h-48 md:h-auto bg-zinc-100 dark:bg-zinc-800 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
                <Image
                  src={deal.imageUrl}
                  alt={deal.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Right Side - Content */}
              <div className="md:w-3/5 flex-1 overflow-y-auto scrollbar-thin p-6 md:p-8 space-y-6">
                {/* Header */}
                <div>
                  <span className="inline-block rounded-md bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                    {deal.category}
                  </span>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                    {deal.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    <span>{deal.user.name}</span>
                    <span>•</span>
                    <span>{deal.location}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                    {deal.description}
                  </p>
                </div>

                {/* Coupon Code */}
                {deal.couponCode && (
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                    <div className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {t("couponCode")}
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-xl font-mono font-bold text-zinc-900 dark:text-zinc-50 tracking-wider break-all">
                        {deal.couponCode}
                      </code>
                      <button
                        onClick={copyCode}
                        className="shrink-0 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium transition-colors"
                      >
                        {copied ? "✓" : t("copyCode")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Votes */}
                <div>
                  <div className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {t("votes")}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => vote(e, "UP")}
                      disabled={!canInteract || isVoting}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        userVote === "UP"
                          ? "border-green-500 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                      } ${(!canInteract || isVoting) ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 15l7-7 7 7" />
                      </svg>
                      <span>{upvotes}</span>
                    </button>
                    <button
                      onClick={(e) => vote(e, "DOWN")}
                      disabled={!canInteract || isVoting}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        userVote === "DOWN"
                          ? "border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400"
                          : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                      } ${(!canInteract || isVoting) ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                      <span>{downvotes}</span>
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <div className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {t("comments")} <span className="text-zinc-400 dark:text-zinc-500">({comments.length})</span>
                  </div>
                  
                  {/* Add Comment */}
                  <form onSubmit={handleSubmitComment} className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={100}
                        disabled={!canInteract}
                        placeholder={t("addCommentPlaceholder")}
                        className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!canInteract || !newComment.trim() || isSubmittingComment}
                        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmittingComment ? "..." : t("post")}
                      </button>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-3">
                    {isLoadingComments ? (
                      <div className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500">
                        {tCommon("loading")}
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-6 text-sm text-zinc-400 dark:text-zinc-500">
                        {t("noComments")}
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="pb-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0 last:pb-0"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {comment.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {comment.user.name}
                            </span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {formatTimeAgo(comment.createdAt, locale)}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-8">
                            {comment.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500">
                  {t("createdAt")}: {formatDate(deal.createdAt, locale)}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
