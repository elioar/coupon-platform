import { ButtonHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline"
  | "dangerOutline"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: "sm" | "md" | "lg"
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"

  const variantStyles = {
    primary:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
    secondary:
      "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    ghost:
      "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
    outline:
      "border border-green-600 text-green-700 hover:bg-green-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-900/20",
    dangerOutline:
      "border border-red-600 text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-900/20",
  }

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

