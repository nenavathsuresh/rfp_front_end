import { useMemo, useRef, useState } from 'react'
import { ActivityLog } from '../components/ActivityLog'
import { AlertMessage } from '../components/AlertMessage'
import { DropZone } from '../components/DropZone'
import { FileTable } from '../components/FileTable'
import { Metrics } from '../components/Metrics'
import { Sidebar } from '../components/Sidebar'
import { DuplicateModal } from '../components/modals/DuplicateModal'
import { RejectedFilesModal } from '../components/modals/RejectedFilesModal'
import { WorkspaceModal } from '../components/modals/WorkspaceModal'
import { WorkflowResultsTable, type WorkflowResult } from '../components/WorkflowResultsTable'
import { allowedExtensions } from '../lib/constants'
import { api, buildApiUrl, getErrorMessage, getFileExtension, normalizeDuplicate, normalizeFile, now } from '../lib/api'
import type { ApiDuplicate, ApiFile, AppAlert, AlertType, DuplicateItem, LogEntry, UploadedFile } from '../types'

type RfpWorkspacePageProps = {
  onOpenChatbot: () => void
}

export function RfpWorkspacePage({ onOpenChatbot }: RfpWorkspacePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [workspace, setWorkspace] = useState('')
  const [workspaceInput, setWorkspaceInput] = useState('')
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([])
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [alert, setAlert] = useState<AppAlert | null>(null)
  const [duplicateQueue, setDuplicateQueue] = useState<DuplicateItem[]>([])
  const [activeDuplicate, setActiveDuplicate] = useState<DuplicateItem | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [isWorkflowReady, setIsWorkflowReady] = useState(false)
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
  const [workflowResults, setWorkflowResults] = useState<WorkflowResult[]>([])
  const [vectorDbPath, setVectorDbPath] = useState('')
  const [workflowRunId, setWorkflowRunId] = useState('')
  const [pendingHitl, setPendingHitl] = useState<WorkflowHitlRequest | null>(null)
  const [workflowHumanInput, setWorkflowHumanInput] = useState('')
  const [workflowAgentOutput, setWorkflowAgentOutput] = useState<Record<string, string>>({})

  const hasWorkspace = Boolean(workspace)
  const stagedFiles = files.filter((file) => file.status === 'staged')
  const metrics = useMemo(
    () => ({
      staged: stagedFiles.length,
      ingested: files.filter((file) => file.status === 'ingested').length,
      duplicates: files.filter((file) => file.status === 'kept_duplicate').length,
      rejected: rejectedFiles.length,
    }),
    [files, rejectedFiles.length, stagedFiles.length],
  )

  const addLog = (message: string, tone: AlertType = 'info') => {
    setLogs((current) => [
      ...current,
      { id: crypto.randomUUID(), time: now(), message, tone },
    ])
  }

  const openWorkspaceModal = () => {
    setWorkspaceInput('')
    setIsWorkspaceModalOpen(true)
  }

  const refreshFiles = async () => {
    const response = await api<{ files: ApiFile[] }>('GET', '/api/files')
    setFiles(response.files.map(normalizeFile))
  }

  const createWorkspace = async () => {
    const name = workspaceInput.trim()
    if (!name) return

    try {
      const response = await api<{ name?: string; path?: string }>('POST', '/api/workspace', { name })
      setWorkspace(response.name ?? name)
      setFiles([])
      setRejectedFiles([])
      setAlert({
        type: 'info',
        title: 'Workspace Created',
        body: response.path ?? `Case ID ${response.name ?? name} is ready for document staging.`,
      })
      addLog(`Workspace created: ${response.path ?? response.name ?? name}`, 'info')
      setIsWorkspaceModalOpen(false)
      await refreshFiles()
    } catch (error) {
      setAlert({ type: 'danger', title: 'Workspace Error', body: getErrorMessage(error) })
    }
  }

  const handleSelectedFiles = async (fileList: FileList | File[]) => {
    if (!hasWorkspace) return

    const incomingFiles = Array.from(fileList)
    if (!incomingFiles.length) return

    const formData = new FormData()
    const rejected: string[] = []

    incomingFiles.forEach((file) => {
      const ext = getFileExtension(file.name)
      if (!allowedExtensions.has(ext)) {
        rejected.push(file.name)
        return
      }

      formData.append('files', file)
    })

    if (rejected.length) {
      setRejectedFiles((current) => [...current, ...rejected])
      setIsErrorModalOpen(true)
      rejected.forEach((name) => addLog(`Rejected: ${name} - format not supported`, 'danger'))
    }

    if (![...formData.entries()].length) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const response = await api<{ results?: Array<{ name: string }> }>('POST', '/api/upload', formData)
      response.results?.forEach((file) => addLog(`Staged: ${file.name}`, 'success'))
      setAlert({
        type: 'success',
        title: 'Files Uploaded',
        body: `${response.results?.length ?? incomingFiles.length - rejected.length} file(s) staged by the server.`,
      })
      await refreshFiles()
    } catch (error) {
      setAlert({ type: 'danger', title: 'Upload Error', body: getErrorMessage(error) })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeFile = async (id: string) => {
    try {
      await api('POST', '/api/resolve', { file_id: id, action: 'delete' })
      addLog('File removed from staging', 'warning')
      await refreshFiles()
    } catch (error) {
      setAlert({ type: 'danger', title: 'Delete Error', body: getErrorMessage(error) })
    }
  }

  const runIngestion = async () => {
    if (!stagedFiles.length || isIngesting) return

    setAlert(null)
    setIsIngesting(true)
    addLog('Running ingestion check', 'info')

    try {
      const response = await api<{ duplicates?: ApiDuplicate[]; vector_db?: string }>('POST', '/api/ingest')
      const duplicates = (response.duplicates ?? []).map(normalizeDuplicate)
      setVectorDbPath(response.vector_db ?? '')

      if (duplicates.length) {
        const [first, ...rest] = duplicates
        setDuplicateQueue(rest)
        setActiveDuplicate(first)
        setIsDuplicateModalOpen(true)
        setIsIngesting(false)
        addLog(`${duplicates.length} duplicate candidate${duplicates.length === 1 ? '' : 's'} found`, 'warning')
        return
      }

      await finalizeIngestion()
    } catch (error) {
      setIsIngesting(false)
      setAlert({ type: 'danger', title: 'Ingestion Error', body: getErrorMessage(error) })
    }
  }

  const finalizeIngestion = async () => {
    try {
      const response = await api<{ ingested: number; total: number; workspace?: string }>('POST', '/api/finalize')
      await refreshFiles()
      setIsIngesting(false)
      setAlert({
        type: 'success',
        title: 'Ingestion Stage Success',
        body: `${response.ingested} new file(s) ingested. Total in workspace: ${response.total}.`,
      })
      addLog(`Ingestion complete - ${response.total} file(s) ready for RFP analysis`, 'success')
      setIsWorkflowReady(true)
      if (response.workspace) setWorkspace(response.workspace)
    } catch (error) {
      setIsIngesting(false)
      setAlert({ type: 'danger', title: 'Finalize Error', body: getErrorMessage(error) })
    }
  }

  const resolveDuplicate = async (action: 'keep' | 'delete') => {
    if (!activeDuplicate) return

    try {
      await api('POST', '/api/resolve', { file_id: activeDuplicate.duplicateId, action })
      addLog(
        `${action === 'delete' ? 'Deleted' : 'Kept'} duplicate: ${activeDuplicate.duplicateName}`,
        action === 'delete' ? 'danger' : 'warning',
      )
      await refreshFiles()

      const [next, ...rest] = duplicateQueue
      if (next) {
        setDuplicateQueue(rest)
        setActiveDuplicate(next)
        return
      }

      setDuplicateQueue([])
      setActiveDuplicate(null)
      setIsDuplicateModalOpen(false)
      setIsIngesting(true)
      await finalizeIngestion()
    } catch (error) {
      setIsIngesting(false)
      setAlert({ type: 'danger', title: 'Duplicate Resolution Error', body: getErrorMessage(error) })
    }
  }

  const clearAll = async () => {
    let clearWarning: AppAlert | null = null

    try {
      await api('POST', '/api/workspace', { name: `_reset_${Date.now()}` })
    } catch (error) {
      clearWarning = { type: 'warning', title: 'Clear Warning', body: getErrorMessage(error) }
    }

    setFiles([])
    setLogs([])
    setRejectedFiles([])
    setAlert(clearWarning)
    setDuplicateQueue([])
    setActiveDuplicate(null)
    setIsDuplicateModalOpen(false)
    setIsIngesting(false)
    setIsWorkflowReady(false)
    setIsWorkflowRunning(false)
    setWorkflowResults([])
    setVectorDbPath('')
    setWorkflowRunId('')
    setPendingHitl(null)
    setWorkflowHumanInput('')
    setWorkflowAgentOutput({})
    addLog('All files cleared', 'warning')
  }

  const runWorkflow = async () => {
    if (isWorkflowRunning) return

    const workflowIndexPath = getWorkflowIndexPath(workspace, vectorDbPath)
    if (!workflowIndexPath) {
      setAlert({
        type: 'danger',
        title: 'Workflow Error',
        body: 'Workspace path is missing. Please run ingestion first.',
      })
      return
    }

    setAlert(null)
    setIsWorkflowRunning(true)
    setWorkflowResults([])
    setWorkflowRunId('')
    setPendingHitl(null)
    setWorkflowHumanInput('')
    setWorkflowAgentOutput({})
    addLog('Running RFP workflow stream', 'info')

    try {
      const response = await fetch(buildApiUrl('/api/workflow/run/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index_path: workflowIndexPath }),
      })

      if (!response.ok || !response.body) {
        let message = 'Failed to start workflow stream'
        try {
          const error = await response.json() as { detail?: string; message?: string }
          message = error.detail ?? error.message ?? message
        } catch {
          message = response.statusText || message
        }
        throw new Error(message)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '))
          if (!dataLine) continue
          handleWorkflowStreamEvent(JSON.parse(dataLine.slice('data: '.length)) as WorkflowStreamEvent)
        }
      }
    } catch (error) {
      setAlert({ type: 'danger', title: 'Workflow Error', body: getErrorMessage(error) })
      addLog(`Workflow error - ${getErrorMessage(error)}`, 'danger')
      setIsWorkflowRunning(false)
    }
  }

  const handleWorkflowStreamEvent = (event: WorkflowStreamEvent) => {
    if ('run_id' in event && event.run_id) setWorkflowRunId(event.run_id)

    switch (event.type) {
      case 'start':
        addLog(event.message ?? 'Workflow stream started', 'info')
        break
      case 'log':
        addLog(event.message, 'info')
        break
      case 'agent_start':
        addLog(`${event.agent} started`, 'info')
        break
      case 'agent_delta':
        setWorkflowAgentOutput((current) => ({
          ...current,
          [event.agent]: `${current[event.agent] ?? ''}${event.text ?? ''}`,
        }))
        break
      case 'agent_checkpoint':
        setWorkflowAgentOutput((current) => ({ ...current, [event.agent]: event.text ?? '' }))
        break
      case 'hitl_request':
        setPendingHitl({
          requestId: event.request_id,
          agent: event.agent,
          text: event.text ?? '',
          isEvidenceAgent: Boolean(event.is_evidence_agent),
        })
        setWorkflowHumanInput('')
        addLog(`Human review requested by ${event.agent}`, 'warning')
        break
      case 'hitl_response_received':
        addLog('Human response received by workflow', 'success')
        break
      case 'final_results': {
        const results = normalizeWorkflowResults(event)
        setWorkflowResults(results)
        setAlert({
          type: 'success',
          title: 'Workflow Complete',
          body: `${results.length} result${results.length === 1 ? '' : 's'} returned from the backend workflow.`,
        })
        addLog(`Workflow complete - ${results.length} result${results.length === 1 ? '' : 's'} ready`, 'success')
        break
      }
      case 'error':
        setAlert({ type: 'danger', title: 'Workflow Error', body: event.message })
        addLog(`Workflow error - ${event.message}`, 'danger')
        setIsWorkflowRunning(false)
        break
      case 'done':
        setIsWorkflowRunning(false)
        setPendingHitl(null)
        addLog('Workflow stream closed', 'success')
        break
    }
  }

  const sendWorkflowHumanResponse = async (action: WorkflowHumanAction) => {
    if (!workflowRunId || !pendingHitl) return

    try {
      await api('POST', '/api/workflow/respond', {
        run_id: workflowRunId,
        request_id: pendingHitl.requestId,
        action,
        text: workflowHumanInput,
      })
      addLog(`Submitted workflow ${action}`, action === 'exit' ? 'warning' : 'success')
      setPendingHitl(null)
      setWorkflowHumanInput('')
    } catch (error) {
      setAlert({ type: 'danger', title: 'Workflow Review Error', body: getErrorMessage(error) })
    }
  }
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-950 px-4 text-white shadow-sm sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-500 text-sm font-black text-white shadow-sm shadow-blue-500/20">AI</span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black sm:text-lg">AI-Driven RFP Generator</h1>
            <p className="truncate text-xs font-medium text-slate-400">Document intake, ingestion, and response workflow</p>
          </div>
        </div>
        <span
          className={`ml-auto inline-flex max-w-[42vw] items-center truncate rounded-full border px-3 py-1 text-xs font-bold ${
            hasWorkspace
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border-blue-400/30 bg-blue-400/10 text-blue-200'
          }`}
        >
          {hasWorkspace ? workspace : 'No workspace'}
        </span>
      </header>

      <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-slate-100 lg:grid-cols-[320px_1fr]">
        <Sidebar
          hasWorkspace={hasWorkspace}
          hasStagedFiles={stagedFiles.length > 0}
          isIngesting={isIngesting}
          onCreateWorkspace={openWorkspaceModal}
          onUpload={() => fileInputRef.current?.click()}
          onRunIngestion={runIngestion}
          onClearAll={clearAll}
        />

        <section className="flex min-w-0 flex-col gap-5 p-4 sm:p-6 lg:p-8">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Workspace Console</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Prepare RFP documents for analysis</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Create a workspace, upload source files, resolve duplicates, then run ingestion before using chatbot or structured workflow results.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-600 sm:flex">
                <span className="rounded-md bg-white px-3 py-2 shadow-sm">1 Workspace</span>
                <span className="rounded-md bg-white px-3 py-2 shadow-sm">2 Upload</span>
                <span className="rounded-md bg-white px-3 py-2 shadow-sm">3 Ingest</span>
                <span className="rounded-md bg-white px-3 py-2 shadow-sm">4 Analyze</span>
              </div>
            </div>
          </div>
          <Metrics metrics={metrics} />
          {alert ? <AlertMessage alert={alert} /> : null}
          <DropZone
            disabled={!hasWorkspace}
            isDragging={isDragging}
            inputRef={fileInputRef}
            onFiles={handleSelectedFiles}
            onDragStateChange={setIsDragging}
          />
          {files.length ? <FileTable files={files} onRemove={removeFile} /> : null}
          {isWorkflowReady ? (
            <section className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm">
              <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3">
                <span className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700">Analysis ready</span>
              </div>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">RFP analysis is ready</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Open the chatbot for Q&A or run the backend workflow for structured results.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                 <button
                    type="button"
                    onClick={onOpenChatbot}
                    className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
                  >
                    Chatbot
                  </button>
                  <button
                    type="button"
                    onClick={runWorkflow}
                    disabled={isWorkflowRunning}
                    className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isWorkflowRunning ? 'Running...' : 'Start Workflow'}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
          {logs.length ? <ActivityLog logs={logs} /> : null}
          {pendingHitl ? (
            <section className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm">
              <div className="border-b border-amber-100 bg-amber-50 px-5 py-3">
                <span className="inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-bold text-amber-700">Human review required</span>
              </div>
              <div className="grid gap-4 p-5">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{pendingHitl.agent}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {pendingHitl.isEvidenceAgent ? 'Ask an evidence question or approve to finish.' : 'Approve this checkpoint or send feedback to revise.'}
                  </p>
                </div>
                <pre className="max-h-72 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700 whitespace-pre-wrap">{pendingHitl.text || 'No checkpoint output returned.'}</pre>
                <textarea
                  value={workflowHumanInput}
                  onChange={(event) => setWorkflowHumanInput(event.target.value)}
                  rows={4}
                  placeholder={pendingHitl.isEvidenceAgent ? 'Ask an evidence question' : 'Optional feedback'}
                  className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => sendWorkflowHumanResponse('approve')} className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">Approve</button>
                  {pendingHitl.isEvidenceAgent && (
                  <button
                    type="button"
                    onClick={() => sendWorkflowHumanResponse("feedback")}
                    className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 shadow-sm transition hover:bg-amber-100"
                  >
                    Send question
                  </button>
                )}
                  {/* <button type="button" onClick={() => sendWorkflowHumanResponse('feedback')} className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 shadow-sm transition hover:bg-amber-100">Send question</button> */}
                  {/* <button type="button" onClick={() => sendWorkflowHumanResponse('exit')} className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-100">Exit Workflow</button> */}
                </div>
              </div>
            </section>
          ) : null}
          {Object.keys(workflowAgentOutput).length ? (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-3">
                <h2 className="text-lg font-black text-slate-950">Live Workflow Output</h2>
              </div>
              <div className="grid gap-3 p-5">
                {Object.entries(workflowAgentOutput).map(([agent, output]) => (
                  <details key={agent} open className="rounded-md border border-slate-200 bg-slate-50">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-slate-800">{agent}</summary>
                    <pre className="max-h-80 overflow-auto border-t border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 whitespace-pre-wrap">{output}</pre>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
          {workflowResults.length ? <WorkflowResultsTable data={workflowResults} isLoading={isWorkflowRunning} onRun={runWorkflow} /> : null}
        </section>
      </main>
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        value={workspaceInput}
        onChange={setWorkspaceInput}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onSubmit={createWorkspace}
      />
      <DuplicateModal
        duplicate={activeDuplicate}
        isOpen={isDuplicateModalOpen}
        onResolve={resolveDuplicate}
      />
      <RejectedFilesModal
        isOpen={isErrorModalOpen}
        files={rejectedFiles}
        onClose={() => setIsErrorModalOpen(false)}
      />
    </div>
  )
}

type WorkflowApiResponse = {
  results?: unknown[] | Record<string, unknown>
  data?: unknown[]
  rows?: unknown[]
}

type WorkflowHumanAction = 'approve' | 'feedback' | 'exit'

type WorkflowHitlRequest = {
  requestId: string
  agent: string
  text: string
  isEvidenceAgent: boolean
}

type WorkflowStreamEvent =
  | { type: 'start'; run_id: string; message?: string }
  | { type: 'log'; run_id: string; message: string }
  | { type: 'agent_start'; run_id: string; agent: string }
  | { type: 'agent_delta'; run_id: string; agent: string; text?: string }
  | { type: 'agent_checkpoint'; run_id: string; agent: string; text?: string }
  | { type: 'hitl_request'; run_id: string; request_id: string; agent: string; text?: string; is_evidence_agent?: boolean }
  | { type: 'hitl_response_received'; run_id: string; request_id: string }
  | { type: 'final_results'; run_id: string; results?: unknown[] | Record<string, unknown>; usage_report?: string }
  | { type: 'error'; run_id?: string; message: string }
  | { type: 'done'; run_id: string }

function normalizeWorkflowResults(response: WorkflowApiResponse): WorkflowResult[] {
  const payload = response.results ?? response.data ?? response.rows ?? []
  const rows = Array.isArray(payload)
    ? payload
    : isRecord(payload)
      ? Object.entries(payload).map(([agent, output]) => ({
          id: agent,
          section: 'Agent Output',
          requirement: agent,
          status: 'Complete',
          owner: 'Workflow',
          confidence: '-',
          summary: typeof output === 'string' ? output : JSON.stringify(output),
        }))
      : []

  return rows.map((row, index) => {
    const item = isRecord(row) ? row : {}

    return {
      id: readString(item, ['id', 'requirement_id', 'key'], `workflow-${index}`),
      section: readString(item, ['section', 'category', 'document_section'], 'General'),
      requirement: readString(item, ['requirement', 'question', 'title', 'name'], `Requirement ${index + 1}`),
      status: readString(item, ['status', 'state'], 'Pending Review'),
      owner: readString(item, ['owner', 'assignee', 'team'], 'RFP Team'),
      confidence: readString(item, ['confidence', 'score'], '-'),
      summary: readString(item, ['summary', 'answer', 'description', 'notes'], '-'),
    }
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(source: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number') return String(value)
  }

  return fallback
}




function getWorkflowIndexPath(workspace: string, vectorDbPath: string) {
  if (workspace) return workspace.replace(/[\\/]+$/, '')
  return vectorDbPath.replace(/[\\/]vectorstore[\\/]*$/i, '')
}
