import { Bookmark } from '../types'

function decodeBookmarklet(code: string): string {
  let decoded = code.trim()
  // Strip javascript: prefix
  if (decoded.toLowerCase().startsWith('javascript:')) {
    decoded = decoded.substring(11)
  }
  // Decode URI-encoded characters (may need multiple passes for nested encoding)
  let prev = ''
  while (prev !== decoded) {
    prev = decoded
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      break
    }
  }
  return decoded
}

interface BookmarksBarProps {
  bookmarks: Bookmark[]
  onExecuteScript: (code: string) => Promise<{ result?: any; error?: string }>
  onAdd: () => void
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
}

export default function BookmarksBar({
  bookmarks,
  onExecuteScript,
  onAdd,
  onEdit,
  onDelete
}: BookmarksBarProps) {
  return (
    <div className="bookmarks-bar">
      <div className="bookmarks-panel">
        {bookmarks.map((bm) => (
          <div key={bm.id} className="bookmark-item">
            <button
              className="bookmark-btn"
              title={'Run: ' + bm.name}
              onClick={async () => {
                const decoded = decodeBookmarklet(bm.code)
                const res = await onExecuteScript(decoded)
                if (res.error) {
                  alert('Script Error: ' + res.error)
                }
              }}
            >
              <span className="bookmark-icon">{bm.icon}</span>
              <span className="bookmark-name">{bm.name}</span>
            </button>
            <div className="bookmark-actions">
              <button
                className="bookmark-action-btn"
                title="Edit"
                onClick={() => onEdit(bm)}
              >
                edit
              </button>
              <button
                className="bookmark-action-btn bookmark-action-delete"
                title="Delete"
                onClick={() => onDelete(bm.id)}
              >
                del
              </button>
            </div>
          </div>
        ))}
        <button className="bookmark-add-btn" onClick={onAdd} title="Add Bookmark">
          + Add
        </button>
      </div>
    </div>
  )
}
