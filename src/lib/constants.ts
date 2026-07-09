import type { AlertType, FileStatus } from '../types'

export const allowedExtensions = new Set([
  'pdf',
  'docx',
  'md',
  'xlsx',
  'xls',
  'csv',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'tiff',
  'webp',
])

export const formatLabels = ['PDF', 'DOCX', 'MD', 'XLSX', 'CSV', 'PNG', 'JPG', 'GIF', 'BMP', 'TIFF', 'WEBP']

export const toneStyles: Record<AlertType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
}

export const statusStyles: Record<FileStatus, string> = {
  staged: 'bg-blue-50 text-blue-700 ring-blue-200',
  ingested: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  deleted: 'bg-red-50 text-red-700 ring-red-200',
  kept_duplicate: 'bg-amber-50 text-amber-800 ring-amber-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
}

export const statusLabels: Record<FileStatus, string> = {
  staged: 'Staged',
  ingested: 'Ingested',
  deleted: 'Deleted',
  kept_duplicate: 'Duplicate',
  rejected: 'Rejected',
}