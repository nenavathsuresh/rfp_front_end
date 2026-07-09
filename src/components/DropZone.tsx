import type { RefObject } from 'react'

type DropZoneProps = {
  disabled: boolean
  isDragging: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onFiles: (files: FileList) => void
  onDragStateChange: (value: boolean) => void
}

export function DropZone({ disabled, isDragging, inputRef, onFiles, onDragStateChange }: DropZoneProps) {
  const dragClass = isDragging ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-600/10' : 'border-slate-300 bg-white'

  return (
    <label
      className={`relative block overflow-hidden rounded-lg border-2 border-dashed p-8 text-center shadow-sm transition sm:p-10 ${dragClass} ${
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer hover:border-blue-500 hover:bg-blue-50 hover:shadow-md'
      }`}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) onDragStateChange(true)
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(event) => {
        event.preventDefault()
        onDragStateChange(false)
        if (!disabled) onFiles(event.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        className="absolute inset-0 h-full w-full cursor-inherit opacity-0"
        type="file"
        multiple
        disabled={disabled}
        accept=".pdf,.docx,.md,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp"
        onChange={(event) => event.target.files && onFiles(event.target.files)}
      />
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-lg font-black text-blue-700 shadow-sm">UP</div>
      <p className="text-base font-black text-slate-950">Drop files here or click to browse</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">PDF, DOCX, MD, XLSX, CSV, and images are supported for ingestion.</p>
      <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
        {['Duplicate check', 'Vector ingestion', 'RFP analysis'].map((label) => (
          <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
            {label}
          </span>
        ))}
      </div>
    </label>
  )
}

