type MetricsProps = {
  metrics: {
    staged: number
    ingested: number
    duplicates: number
    rejected: number
  }
}

export function Metrics({ metrics }: MetricsProps) {
  const items = [
    { label: 'Staged', value: metrics.staged, className: 'text-slate-950', accent: 'bg-slate-900', description: 'Files waiting for ingestion' },
    { label: 'Ingested', value: metrics.ingested, className: 'text-emerald-600', accent: 'bg-emerald-500', description: 'Ready for analysis' },
    { label: 'Duplicates', value: metrics.duplicates, className: 'text-amber-600', accent: 'bg-amber-500', description: 'Flagged during review' },
    { label: 'Rejected', value: metrics.rejected, className: 'text-red-600', accent: 'bg-red-500', description: 'Unsupported or invalid' },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className={`absolute left-0 top-0 h-full w-1 ${item.accent}`} />
          <div className="flex items-start justify-between gap-3 pl-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{item.description}</p>
            </div>
            <p className={`text-3xl font-black ${item.className}`}>{item.value}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

