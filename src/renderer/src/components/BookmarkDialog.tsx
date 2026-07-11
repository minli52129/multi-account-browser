import { useState } from 'react'
import { Bookmark } from '../types'

interface BookmarkDialogProps {
  onSave: (bookmark: Bookmark) => void
  onClose: () => void
  editBookmark?: Bookmark | null
}

export default function BookmarkDialog({ onSave, onClose, editBookmark }: BookmarkDialogProps) {
  const isEdit = !!editBookmark
  const [name, setName] = useState(editBookmark?.name || '')
  const [icon, setIcon] = useState(editBookmark?.icon || '\u{1F517}')
  const [code, setCode] = useState(editBookmark?.code || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    onSave({
      id: editBookmark?.id || `bm_${Date.now()}`,
      name: name.trim(),
      icon: icon.trim() || '\u{1F517}',
      code: code.trim(),
      enabled: true
    })
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Bookmark' : 'Add Bookmark'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Order Detail"
                autoFocus
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Icon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="emoji"
              />
            </div>
          </div>
          <div className="form-group">
            <label>JavaScript Code</label>
            <textarea
              className="form-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="javascript:(function(){ ... })();"
              spellCheck={false}
              rows={12}
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim() || !code.trim()}>
              {isEdit ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
