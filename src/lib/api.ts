import type { ApiDuplicate, ApiFile, DuplicateItem, FileStatus, UploadedFile } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) return normalizedPath
  return `${API_BASE_URL}${normalizedPath}`
}

export async function api<T>(method: string, path: string, body?: FormData | object): Promise<T> {
  const options: RequestInit = { method, headers: {} }

  if (body instanceof FormData) {
    options.body = body
  } else if (body) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(buildApiUrl(path), options)
  if (!response.ok) {
    let message = 'API request failed'
    try {
      const error = await response.json() as { detail?: string; message?: string }
      message = error.detail ?? error.message ?? message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileExtension(fileName: string) {
  return fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : ''
}

export function now() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export function normalizeFile(file: ApiFile): UploadedFile {
  const name = file.name ?? 'Untitled document'
  const ext = (file.ext ?? getFileExtension(name)).replace(/^\./, '').toUpperCase()

  return {
    id: file.id ?? crypto.randomUUID(),
    name,
    ext,
    size: typeof file.size === 'number' ? formatBytes(file.size) : file.size ?? '-',
    status: normalizeStatus(file.status),
  }
}

function normalizeStatus(status?: string): FileStatus {
  if (status === 'ingested' || status === 'deleted' || status === 'kept_duplicate' || status === 'rejected') {
    return status
  }
  return 'staged'
}

export function normalizeDuplicate(duplicate: ApiDuplicate): DuplicateItem {
  return {
    originalName: duplicate.original_name,
    duplicateName: duplicate.duplicate_name,
    duplicateId: duplicate.duplicate,
  }
}