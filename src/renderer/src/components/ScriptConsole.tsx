import { useState } from 'react'
import { Script } from '../types'

interface ScriptConsoleProps {
  scripts: Script[]
  onSave: (script: Script) => void
  onDelete: (scriptId: string) => void
  onExecute: (code: string) => Promise<{ result?: any; error?: string }>
  onToggleScript: (scriptId: string, enabled: boolean) => void
  onToggleAutoExecute: (scriptId: string, autoExecute: boolean) => void
  onClose: () => void
}

export default function ScriptConsole({
  scripts,
  onSave,
  onDelete,
  onExecute,
  onToggleScript,
  onToggleAutoExecute,
  onClose
}: ScriptConsoleProps) {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [scriptName, setScriptName] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  const handleExecute = async () => {
    if (!code.trim()) return
    const result = await onExecute(code)
    const timestamp = new Date().toLocaleTimeString()
    if (result.error) {
      setOutput((prev) => [`[${timestamp}] Error: ${result.error}`, ...prev])
    } else {
      const display = result.result !== undefined ? JSON.stringify(result.result) : 'undefined'
      setOutput((prev) => [`[${timestamp}] => ${display}`, ...prev])
    }
  }

  const handleSaveScript = () => {
    if (!code.trim()) return
    const name = scriptName.trim() || `Script ${scripts.length + 1}`
    const script: Script = {
      id: editingScript?.id || `script_${Date.now()}`,
      name,
      code,
      autoExecute: editingScript?.autoExecute ?? false,
      enabled: true
    }
    onSave(script)
    setEditingScript(null)
    setScriptName('')
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const handleLoadScript = (script: Script) => {
    setCode(script.code)
    setScriptName(script.name)
    setEditingScript(script)
  }

  return (
    <div className="console-panel">
      <div className="console-header">
        <h3>JS Console</h3>
        <div className="console-actions">
          {showSaved && <span className="saved-badge">Saved!</span>}
          <button className="icon-btn" onClick={onClose} title="Close Console">
            ×
          </button>
        </div>
      </div>
      <div className="console-body">
        <div className="script-editor">
          <div className="editor-toolbar">
            <input
              type="text"
              className="script-name-input"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              placeholder="Script name..."
            />
            <button className="btn-small" onClick={handleSaveScript} title="Save Script">
              Save
            </button>
            <button className="btn-small btn-run" onClick={handleExecute} title="Execute">
              Run
            </button>
          </div>
          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Enter JavaScript code here..."
            spellCheck={false}
          />
        </div>
        <div className="console-output">
          <div className="output-header">Output</div>
          <div className="output-content">
            {output.length === 0 && <div className="output-empty">Run a script to see output</div>}
            {output.map((line, i) => (
              <div key={i} className="output-line">
                {line}
              </div>
            ))}
          </div>
        </div>
        {scripts.length > 0 && (
          <div className="saved-scripts">
            <div className="output-header">Saved Scripts</div>
            <div className="scripts-list">
              {scripts.map((script) => (
                <div key={script.id} className="script-item">
                  <div className="script-info" onClick={() => handleLoadScript(script)}>
                    <span className="script-name">{script.name}</span>
                  </div>
                  <div className="script-controls">
                    <label className="toggle-label" title="Enabled">
                      <input
                        type="checkbox"
                        checked={script.enabled}
                        onChange={(e) => onToggleScript(script.id, e.target.checked)}
                      />
                      <span className="toggle-text">On</span>
                    </label>
                    <label className="toggle-label" title="Auto-execute on page load">
                      <input
                        type="checkbox"
                        checked={script.autoExecute}
                        onChange={(e) => onToggleAutoExecute(script.id, e.target.checked)}
                      />
                      <span className="toggle-text">Auto</span>
                    </label>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => onDelete(script.id)}
                      title="Delete Script"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
