import { Button } from '../Button'
import { Modal } from '../Modal'

type RejectedFilesModalProps = {
  isOpen: boolean
  files: string[]
  onClose: () => void
}

export function RejectedFilesModal({ isOpen, files, onClose }: RejectedFilesModalProps) {
  return (
    <Modal isOpen={isOpen}>
      <h2 className="text-lg font-bold text-slate-950">Format Not Supported</h2>
      <p className="mt-2 text-sm text-slate-600">{files.length} file{files.length === 1 ? '' : 's'} rejected:</p>
      <div className="mt-4 flex max-h-48 flex-wrap gap-2 overflow-y-auto custom-scrollbar">
        {files.map((file) => (
          <span key={file} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{file}</span>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" className="mt-0 w-auto" onClick={onClose}>Got it</Button>
      </div>
    </Modal>
  )
}