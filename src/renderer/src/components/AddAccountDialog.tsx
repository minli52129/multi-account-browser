import { useState } from 'react'

interface AddAccountDialogProps {
  onAdd: (name: string, url: string) => void
  onClose: () => void
  editName?: string
  editUrl?: string
  onEdit?: (name: string, url: string) => void
}

export default function AddAccountDialog({
  onAdd,
  onClose,
  editName,
  editUrl,
  onEdit
}: AddAccountDialogProps) {
  const isEdit = !!onEdit
  const [name, setName] = useState(editName || '')
  const [url, setUrl] = useState(editUrl || 'https://h5-quanyi.dragonpass.com.cn/#/personalCenter')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && url.trim()) {
      if (isEdit && onEdit) {
        onEdit(name.trim(), url.trim())
      } else {
        onAdd(name.trim(), url.trim())
      }
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Account' : 'Add Account'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Personal, Test"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Website URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim() || !url.trim()}>
              {isEdit ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
