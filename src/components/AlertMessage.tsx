import { toneStyles } from '../lib/constants'
import type { AppAlert } from '../types'

export function AlertMessage({ alert }: { alert: AppAlert }) {
  return (
    <div className={`rounded-lg border p-4 text-sm leading-6 ${toneStyles[alert.type]}`}>
      <p className="font-bold">{alert.title}</p>
      <p>{alert.body}</p>
    </div>
  )
}