import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'violet' | 'success' | 'neutral' | 'outline' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  violet: 'bg-violet-600 text-white hover:bg-violet-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  neutral: 'bg-slate-600 text-white hover:bg-slate-700',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
}

export function Button({ children, variant, className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`mt-2 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}