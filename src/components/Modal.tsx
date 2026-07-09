import type { ReactNode } from 'react'

type ModalProps = {
  isOpen: boolean
  children: ReactNode
}

export function Modal({ isOpen, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">{children}</div>
    </div>
  )
}