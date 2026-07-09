import { Button } from '../Button'
import { Modal } from '../Modal'
import type { DuplicateAction, DuplicateItem } from '../../types'

type DuplicateModalProps = {
  isOpen: boolean
  duplicate: DuplicateItem | null
  onResolve: (action: DuplicateAction) => void
}

export function DuplicateModal({ isOpen, duplicate, onResolve }: DuplicateModalProps) {
  return (
    <Modal isOpen={isOpen && Boolean(duplicate)}>
      <h2 className="text-lg font-bold text-slate-950">Duplicate Content Detected</h2>
      {duplicate ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p><span className="font-bold">Original:</span> {duplicate.originalName}</p>
          <p className="mt-1"><span className="font-bold">Duplicate:</span> {duplicate.duplicateName}</p>
        </div>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-slate-600">Both files appear to contain identical content. Choose how to handle the duplicate file.</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" className="mt-0 w-auto" onClick={() => onResolve('keep')}>Keep Both</Button>
        <Button variant="danger" className="mt-0 w-auto" onClick={() => onResolve('delete')}>Delete Duplicate</Button>
      </div>
    </Modal>
  )
}