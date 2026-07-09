import type { ReactNode } from 'react'
import { Button } from './Button'

type SidebarProps = {
  hasWorkspace: boolean
  hasStagedFiles: boolean
  isIngesting: boolean
  onCreateWorkspace: () => void
  onUpload: () => void
  onRunIngestion: () => void
  onClearAll: () => void
}

export function Sidebar({
  hasWorkspace,
  hasStagedFiles,
  isIngesting,
  onCreateWorkspace,
  onUpload,
  onRunIngestion,
  onClearAll,
}: SidebarProps) {
  return (
    <aside className="flex flex-col gap-4 border-r border-slate-800 bg-slate-950 p-5 text-white shadow-xl lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto custom-scrollbar">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-300">RFP Intake</p>
        <h2 className="mt-2 text-xl font-black text-white">Document workspace</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Stage, validate, ingest, then analyze RFP files from one controlled flow.</p>
      </div>

      <Step index="01" title="Workspace" description="Create a Case ID folder to begin your RFP session.">
        <Button variant="primary" onClick={onCreateWorkspace}>Start Process</Button>
      </Step>
      <Step index="02" title="Upload Documents" description="Upload one or more RFP documents. Duplicates are checked before ingestion.">
        <Button variant="violet" onClick={onUpload} disabled={!hasWorkspace}>Upload RFP Files</Button>
      </Step>
      <Step index="03" title="Run Ingestion">
        <Button variant="success" onClick={onRunIngestion} disabled={!hasStagedFiles || isIngesting}>
          Run Ingestion Check
        </Button>
        {isIngesting ? (
          <div className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3" aria-live="polite">
            <p className="mb-2 text-xs font-bold text-emerald-200">Running ingestion check...</p>
            <div className="h-2 overflow-hidden rounded-full border border-emerald-400/20 bg-emerald-950">
              <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] rounded-full bg-emerald-400" />
            </div>
          </div>
        ) : null}
        <Button variant="neutral" onClick={onClearAll}>Clear All Files</Button>
      </Step>
    </aside>
  )
}

function Step({ index, title, description, children }: { index: string; title: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-slate-800 text-[11px] font-black text-blue-200">{index}</span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">{title}</h2>
      </div>
      {description ? <p className="mb-3 text-sm leading-6 text-slate-400">{description}</p> : null}
      {children}
    </div>
  )
}

