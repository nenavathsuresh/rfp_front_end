import { statusLabels, statusStyles } from '../lib/constants'
import type { UploadedFile } from '../types'

type FileTableProps = {
  files: UploadedFile[]
  onRemove: (id: string) => void
}

export function FileTable({ files, onRemove }: FileTableProps) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-slate-950">Uploaded Files</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[2fr_80px_90px_130px_44px] border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
          <div>File</div>
          <div>Type</div>
          <div>Size</div>
          <div>Status</div>
          <div />
        </div>
        {files.map((file) => (
          <div
            key={file.id}
            className="grid gap-3 border-b border-slate-200 px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50 md:grid-cols-[2fr_80px_90px_130px_44px] md:items-center"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">{file.ext}</span>
              <span className="truncate font-medium text-slate-800" title={file.name}>{file.name}</span>
            </div>
            <div className="text-slate-600">{file.ext}</div>
            <div className="text-slate-600">{file.size}</div>
            <div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyles[file.status]}`}>
                {statusLabels[file.status]}
              </span>
            </div>
            <div>
              {file.status === 'staged' || file.status === 'kept_duplicate' ? (
                <button
                  type="button"
                  className="rounded px-2 py-1 text-sm font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  onClick={() => onRemove(file.id)}
                  aria-label={`Remove ${file.name}`}
                >
                  X
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}