export type AlertType = 'success' | 'warning' | 'danger' | 'info'
export type FileStatus = 'staged' | 'ingested' | 'deleted' | 'kept_duplicate' | 'rejected'
export type DuplicateAction = 'keep' | 'delete'

export type UploadedFile = {
  id: string
  name: string
  ext: string
  size: string
  status: FileStatus
}

export type LogEntry = {
  id: string
  time: string
  message: string
  tone: AlertType
}

export type AppAlert = {
  type: AlertType
  title: string
  body: string
}

export type DuplicateItem = {
  originalName: string
  duplicateName: string
  duplicateId: string
}

export type ApiDuplicate = {
  original_name: string
  duplicate_name: string
  duplicate: string
}

export type ApiFile = {
  id?: string
  name?: string
  ext?: string
  size?: string | number
  status?: string
}