import { useState, useEffect, useCallback } from 'react'
import { Account, Script, Bookmark } from './types'
import Sidebar from './components/Sidebar'
import AddAccountDialog from './components/AddAccountDialog'
import BookmarkDialog from './components/BookmarkDialog'
import ScriptConsole from './components/ScriptConsole'
import UrlBar from './components/UrlBar'
import BookmarksBar from './components/BookmarksBar'

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [currentTitle, setCurrentTitle] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false)
  const [editBookmark, setEditBookmark] = useState<Bookmark | null>(null)
  const [showConsole, setShowConsole] = useState(false)

  const isAnyDialogOpen = showAddDialog || !!editAccount || showBookmarkDialog

  // Notify main process when dialog opens/closes
  useEffect(() => {
    if (isAnyDialogOpen) {
      window.api.showDialog()
    } else {
      window.api.hideDialog()
    }
  }, [isAnyDialogOpen])

  // Notify main process when console opens/closes
  useEffect(() => {
    window.api.setConsoleOpen(showConsole)
  }, [showConsole])

  // Load initial data
  useEffect(() => {
    window.api.getAccounts().then(setAccounts)
    window.api.getScripts().then(setScripts)
    window.api.getBookmarks().then(setBookmarks)
  }, [])

  // Listen for navigation updates
  useEffect(() => {
    window.api.onNavigationUpdate(({ accountId, url }) => {
      if (accountId === activeAccountId) {
        setCurrentUrl(url)
      }
    })
    window.api.onTitleUpdate(({ accountId, title }) => {
      if (accountId === activeAccountId) {
        setCurrentTitle(title)
      }
    })
  }, [activeAccountId])

  // ---- Account handlers ----

  const handleSwitchAccount = useCallback(async (accountId: string) => {
    await window.api.switchAccount(accountId)
    setActiveAccountId(accountId)
    const url = await window.api.getCurrentUrl()
    setCurrentUrl(url)
    setCurrentTitle('')
  }, [])

  const handleAddAccount = useCallback(async (name: string, url: string) => {
    const account = await window.api.addAccount({ name, url })
    setAccounts((prev) => [...prev, account])
    setShowAddDialog(false)
    await handleSwitchAccount(account.id)
  }, [handleSwitchAccount])

  const handleEditAccount = useCallback(async (name: string, url: string) => {
    if (!editAccount) return
    const updated = await window.api.updateAccount(editAccount.id, { name, url })
    if (updated) {
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      if (activeAccountId === editAccount) {
        // Reload the current page with the new URL
        window.api.navigate(url)
        setCurrentUrl(url)
      }
    }
    setEditAccount(null)
  }, [editAccount, activeAccountId])

  const handleDeleteAccount = useCallback(async (accountId: string) => {
    await window.api.deleteAccount(accountId)
    setAccounts((prev) => prev.filter((a) => a.id !== accountId))
    if (activeAccountId === accountId) {
      setActiveAccountId(null)
      setCurrentUrl('')
      setCurrentTitle('')
    }
  }, [activeAccountId])

  // ---- Navigation ----

  const handleNavigate = useCallback(async (url: string) => {
    await window.api.navigate(url)
    setCurrentUrl(url)
  }, [])

  // ---- Script handlers ----

  const handleSaveScript = useCallback(async (script: Script) => {
    const saved = await window.api.saveScript(script)
    setScripts((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }, [])

  const handleDeleteScript = useCallback(async (scriptId: string) => {
    await window.api.deleteScript(scriptId)
    setScripts((prev) => prev.filter((s) => s.id !== scriptId))
  }, [])

  const handleExecuteScript = useCallback(async (code: string) => {
    return await window.api.executeScript(code)
  }, [])

  const handleToggleScript = useCallback(async (scriptId: string, enabled: boolean) => {
    await window.api.toggleScript(scriptId, enabled)
    setScripts((prev) => prev.map((s) => (s.id === scriptId ? { ...s, enabled } : s)))
  }, [])

  const handleToggleAutoExecute = useCallback(async (scriptId: string, autoExecute: boolean) => {
    await window.api.toggleAutoExecute(scriptId, autoExecute)
    setScripts((prev) => prev.map((s) => (s.id === scriptId ? { ...s, autoExecute } : s)))
  }, [])

  // ---- Bookmark handlers ----

  const handleSaveBookmark = useCallback(async (bookmark: Bookmark) => {
    const saved = await window.api.saveBookmark(bookmark)
    setBookmarks((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    setShowBookmarkDialog(false)
    setEditBookmark(null)
  }, [])

  const handleDeleteBookmark = useCallback(async (id: string) => {
    await window.api.deleteBookmark(id)
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return (
    <div className="app">
      <Sidebar
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={handleSwitchAccount}
        onDeleteAccount={handleDeleteAccount}
        onEditAccount={(account) => setEditAccount(account)}
        onAddAccount={() => setShowAddDialog(true)}
        onToggleConsole={() => setShowConsole((v) => !v)}
      />
      <div className="main-content">
        {activeAccountId && (
          <>
            <UrlBar
              url={currentUrl}
              title={currentTitle}
              onNavigate={handleNavigate}
              onBack={() => window.api.goBack()}
              onForward={() => window.api.goForward()}
              onReload={() => window.api.reload()}
            />
            <BookmarksBar
              bookmarks={bookmarks}
              onExecuteScript={handleExecuteScript}
              onAdd={() => { setEditBookmark(null); setShowBookmarkDialog(true) }}
              onEdit={(bm) => { setEditBookmark(bm); setShowBookmarkDialog(true) }}
              onDelete={handleDeleteBookmark}
            />
          </>
        )}
        {!activeAccountId && (
          <div className="empty-state">
            <div className="empty-icon">+</div>
            <h2>Multi Account Browser</h2>
            <p>Click "+" in the sidebar to add an account, then select it to start browsing.</p>
          </div>
        )}
        {showConsole && activeAccountId && (
          <ScriptConsole
            scripts={scripts}
            onSave={handleSaveScript}
            onDelete={handleDeleteScript}
            onExecute={handleExecuteScript}
            onToggleScript={handleToggleScript}
            onToggleAutoExecute={handleToggleAutoExecute}
            onClose={() => setShowConsole(false)}
          />
        )}
      </div>
      {showAddDialog && (
        <AddAccountDialog onAdd={handleAddAccount} onClose={() => setShowAddDialog(false)} />
      )}
      {editAccount && (
        <AddAccountDialog
          onAdd={() => {}}
          onClose={() => setEditAccount(null)}
          editName={editAccount.name}
          editUrl={editAccount.url}
          onEdit={handleEditAccount}
        />
      )}
      {showBookmarkDialog && (
        <BookmarkDialog
          onSave={handleSaveBookmark}
          onClose={() => { setShowBookmarkDialog(false); setEditBookmark(null) }}
          editBookmark={editBookmark}
        />
      )}
    </div>
  )
}
