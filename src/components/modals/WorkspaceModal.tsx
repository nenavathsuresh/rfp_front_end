import { Button } from '../Button'
import { Modal } from '../Modal'

type WorkspaceModalProps = {
  isOpen: boolean
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export function WorkspaceModal({ isOpen, value, onChange, onClose, onSubmit }: WorkspaceModalProps) {
  return (
    <Modal isOpen={isOpen}>
      <h2 className="text-lg font-bold text-slate-950">Create Workspace</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Enter a name for this RFP workspace. This becomes the Case ID for the session.</p>
      <label className="mt-5 block text-sm font-semibold text-slate-700" htmlFor="workspace-name">Workspace Name</label>
      <input
        id="workspace-name"
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        value={value}
        placeholder="Example: PGE_RFP_Q3_2026"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit()
        }}
        autoFocus
      />
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" className="mt-0 w-auto" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="mt-0 w-auto" onClick={onSubmit}>Create Workspace</Button>
      </div>
    </Modal>
  )
}