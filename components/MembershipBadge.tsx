import { useTranslations } from "next-intl"
import { format } from "date-fns"

interface MembershipBadgeProps {
  membershipExpiry: string | null
}

export default function MembershipBadge({ membershipExpiry }: MembershipBadgeProps) {
  const t = useTranslations("membership")

  const isMember = membershipExpiry && new Date(membershipExpiry) > new Date()

  if (!isMember) {
    return (
      <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {t("notMember")}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {t("active")}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">
              {t("expires")}: {format(new Date(membershipExpiry), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

