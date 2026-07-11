import { useState, useEffect } from 'react'

interface UrlBarProps {
  url: string
  title: string
  onNavigate: (url: string) => void
  onBack: () => void
  onForward: () => void
  onReload: () => void
}

export default function UrlBar({ url, title, onNavigate, onBack, onForward, onReload }: UrlBarProps) {
  const [inputValue, setInputValue] = useState(url)

  useEffect(() => {
    setInputValue(url)
  }, [url])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onNavigate(inputValue.trim())
    }
  }

  return (
    <div className="url-bar">
      <button className="nav-btn" onClick={onBack} title="Back">
        ←
      </button>
      <button className="nav-btn" onClick={onForward} title="Forward">
        →
      </button>
      <button className="nav-btn" onClick={onReload} title="Reload">
        ↻
      </button>
      <form className="url-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="url-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter URL..."
        />
      </form>
      {title && <div className="page-title">{title}</div>}
    </div>
  )
}
