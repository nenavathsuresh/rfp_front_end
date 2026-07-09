import type { LogEntry } from '../types'

export function ActivityLog({ logs }: { logs: LogEntry[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-slate-950">Activity Log</h2>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm custom-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 border-b border-slate-100 px-4 py-2 text-xs last:border-b-0">
            <span className="shrink-0 font-mono text-slate-400">{log.time}</span>
            <span className={`shrink-0 font-bold ${getToneColor(log.tone)}`}>*</span>
            <span className="text-slate-700">{log.message}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function getToneColor(tone: LogEntry['tone']) {
  if (tone === 'danger') return 'text-red-600'
  if (tone === 'success') return 'text-emerald-600'
  if (tone === 'warning') return 'text-amber-600'
  return 'text-blue-600'
}