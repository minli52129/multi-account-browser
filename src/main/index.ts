import { app, BrowserWindow, ipcMain, session, WebContentsView } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

// ============ Data Storage ============
const userDataPath = app.getPath('userData')
const dataDir = join(userDataPath, 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

interface Account {
  id: string
  name: string
  url: string
  partition: string
  createdAt: string
}

interface Script {
  id: string
  name: string
  code: string
  autoExecute: boolean
  enabled: boolean
}

interface Bookmark {
  id: string
  name: string
  icon: string
  code: string
  enabled: boolean
}

interface AppData {
  accounts: Account[]
  scripts: Script[]
  bookmarks: Bookmark[]
}

const dataFile = join(dataDir, 'app-data.json')

function loadData(): AppData {
  if (existsSync(dataFile)) {
    return JSON.parse(readFileSync(dataFile, 'utf-8'))
  }
  return { accounts: [], scripts: [], bookmarks: [] }
}

function saveData(data: AppData): void {
  writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

// ============ Global State ============
let mainWindow: BrowserWindow | null = null
let activeView: WebContentsView | null = null
let currentAccountId: string | null = null
let consoleOpen = false

const SIDEBAR_WIDTH = 260
const URL_BAR_HEIGHT = 44
const BOOKMARKS_BAR_HEIGHT = 36
const CONSOLE_HEIGHT = 340

function updateViewBounds(): void {
  if (!activeView || !mainWindow) return
  const { width, height } = mainWindow.getContentBounds()
  const topOffset = URL_BAR_HEIGHT + BOOKMARKS_BAR_HEIGHT
  const viewHeight = consoleOpen ? height - topOffset - CONSOLE_HEIGHT : height - topOffset
  activeView.setBounds({
    x: SIDEBAR_WIDTH,
    y: topOffset,
    width: width - SIDEBAR_WIDTH,
    height: Math.max(viewHeight, 0)
  })
}

// ============ Window Creation ============
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Multi Account Browser',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Load renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('resize', () => {
    updateViewBounds()
  })

  mainWindow.on('closed', () => {
    if (activeView) {
      activeView.webContents.close()
      activeView = null
    }
    mainWindow = null
  })
}

// ============ Browser View Management ============
// Track which partitions already have listeners
const registeredPartitions = new Set<string>()

function createBrowserView(account: Account): void {
  if (!mainWindow) return

  // Remove and destroy existing view
  if (activeView) {
    mainWindow.contentView.removeChildView(activeView)
    activeView.webContents.close()
    activeView = null
  }

  const partition = `persist:${account.partition}`
  const ses = session.fromPartition(partition)

  // Only register the auto-script listener once per partition
  if (!registeredPartitions.has(partition)) {
    registeredPartitions.add(partition)
    ses.webRequest.onCompleted({ urls: ['*://*/*'] }, () => {
      injectAutoScripts(account.id)
    })
  }

  activeView = new WebContentsView({
    webPreferences: {
      partition,
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  updateViewBounds()
  mainWindow.contentView.addChildView(activeView)

  // Load URL
  if (account.url) {
    activeView.webContents.loadURL(account.url)
  }

  // Forward navigation events to renderer
  activeView.webContents.on('did-navigate', (_event, url) => {
    mainWindow?.webContents.send('navigation-update', { accountId: account.id, url })
  })

  activeView.webContents.on('page-title-updated', (_event, title) => {
    mainWindow?.webContents.send('title-update', { accountId: account.id, title })
  })

  currentAccountId = account.id
}

async function injectAutoScripts(accountId: string): Promise<void> {
  if (!activeView || currentAccountId !== accountId) return

  const data = loadData()
  const autoScripts = data.scripts.filter((s) => s.autoExecute && s.enabled)

  for (const script of autoScripts) {
    try {
      await activeView.webContents.executeJavaScript(script.code)
    } catch (err) {
      console.error(`Script "${script.name}" failed:`, err)
    }
  }
}

// ============ IPC Handlers ============
function setupIPC(): void {
  // Account management
  ipcMain.handle('get-accounts', () => {
    return loadData().accounts
  })

  ipcMain.handle('add-account', (_event, account: Omit<Account, 'id' | 'partition' | 'createdAt'>) => {
    const data = loadData()
    const id = `account_${Date.now()}`
    const newAccount: Account = {
      ...account,
      id,
      partition: id,
      createdAt: new Date().toISOString()
    }
    data.accounts.push(newAccount)
    saveData(data)
    return newAccount
  })

  ipcMain.handle('update-account', (_event, accountId: string, updates: Partial<Account>) => {
    const data = loadData()
    const idx = data.accounts.findIndex((a) => a.id === accountId)
    if (idx >= 0) {
      data.accounts[idx] = { ...data.accounts[idx], ...updates, id: accountId }
      saveData(data)
      return data.accounts[idx]
    }
    return null
  })

  ipcMain.handle('delete-account', (_event, accountId: string) => {
    const data = loadData()
    data.accounts = data.accounts.filter((a) => a.id !== accountId)
    saveData(data)

    if (currentAccountId === accountId && activeView && mainWindow) {
      mainWindow.contentView.removeChildView(activeView)
      activeView = null
      currentAccountId = null
    }

    return true
  })

  ipcMain.handle('switch-account', (_event, accountId: string) => {
    const data = loadData()
    const account = data.accounts.find((a) => a.id === accountId)
    if (account) {
      createBrowserView(account)
      return true
    }
    return false
  })

  ipcMain.handle('navigate', (_event, url: string) => {
    if (activeView) {
      let targetUrl = url
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl
      }
      activeView.webContents.loadURL(targetUrl)
    }
  })

  ipcMain.handle('get-current-url', () => {
    return activeView?.webContents.getURL() || ''
  })

  ipcMain.handle('go-back', () => {
    if (activeView?.webContents.canGoBack()) {
      activeView.webContents.goBack()
    }
  })

  ipcMain.handle('go-forward', () => {
    if (activeView?.webContents.canGoForward()) {
      activeView.webContents.goForward()
    }
  })

  ipcMain.handle('reload', () => {
    activeView?.webContents.reload()
  })

  // Script management
  ipcMain.handle('get-scripts', () => {
    return loadData().scripts
  })

  ipcMain.handle('save-script', (_event, script: Script) => {
    const data = loadData()
    const idx = data.scripts.findIndex((s) => s.id === script.id)
    if (idx >= 0) {
      data.scripts[idx] = script
    } else {
      data.scripts.push(script)
    }
    saveData(data)
    return script
  })

  ipcMain.handle('delete-script', (_event, scriptId: string) => {
    const data = loadData()
    data.scripts = data.scripts.filter((s) => s.id !== scriptId)
    saveData(data)
    return true
  })

  ipcMain.handle('execute-script', async (_event, code: string) => {
    if (!activeView) return { error: 'No active browser view' }
    try {
      // Override prompt/alert with HTML dialogs (native ones don't work in BrowserView executeJavaScript)
      const wrapped = `
        if (!window.__mabDialogOverridden) {
          window.__mabDialogOverridden = true;
          window.prompt = function(msg, defaultVal) {
            var d = document.createElement('dialog');
            d.style.cssText = 'padding:20px 24px;border:1px solid #ccc;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;min-width:320px';
            d.innerHTML = '<p style="margin:0 0 12px;font-size:14px;color:#333">' + (msg||'') + '</p>'
              + '<input id="__mabPromptInput" style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box" value="' + (defaultVal||'').replace(/"/g,'&quot;') + '">'
              + '<div style="margin-top:14px;text-align:right"><button id="__mabPromptCancel" style="padding:6px 16px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;margin-right:8px;font-size:13px">Cancel</button>'
              + '<button id="__mabPromptOk" style="padding:6px 16px;border:none;border-radius:4px;background:#1677ff;color:#fff;cursor:pointer;font-size:13px">OK</button></div>';
            document.body.appendChild(d);
            d.showModal();
            var result = null;
            var resolved = false;
            d.querySelector('#__mabPromptOk').onclick = function(){ result = d.querySelector('#__mabPromptInput').value; resolved = true; d.close(); };
            d.querySelector('#__mabPromptCancel').onclick = function(){ resolved = true; d.close(); };
            d.onkeydown = function(e){ if(e.key==='Enter'){ result = d.querySelector('#__mabPromptInput').value; resolved = true; d.close(); } if(e.key==='Escape'){ resolved = true; d.close(); } };
            d.querySelector('#__mabPromptInput').focus();
            d.addEventListener('close', function(){ d.remove(); });
            return result;
          };
          window.alert = function(msg) {
            var d = document.createElement('dialog');
            d.style.cssText = 'padding:20px 24px;border:1px solid #ccc;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;min-width:280px';
            d.innerHTML = '<p style="margin:0 0 14px;font-size:14px;color:#333;white-space:pre-wrap">' + (msg||'') + '</p>'
              + '<div style="text-align:right"><button id="__mabAlertOk" style="padding:6px 20px;border:none;border-radius:4px;background:#1677ff;color:#fff;cursor:pointer;font-size:13px">OK</button></div>';
            document.body.appendChild(d);
            d.showModal();
            d.querySelector('#__mabAlertOk').onclick = function(){ d.close(); };
            d.onkeydown = function(e){ if(e.key==='Enter'||e.key==='Escape'){ d.close(); } };
            d.addEventListener('close', function(){ d.remove(); });
          };
          window.confirm = function(msg) {
            var d = document.createElement('dialog');
            d.style.cssText = 'padding:20px 24px;border:1px solid #ccc;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;min-width:280px';
            d.innerHTML = '<p style="margin:0 0 14px;font-size:14px;color:#333;white-space:pre-wrap">' + (msg||'') + '</p>'
              + '<div style="text-align:right"><button id="__mabConfirmCancel" style="padding:6px 16px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;margin-right:8px;font-size:13px">Cancel</button>'
              + '<button id="__mabConfirmOk" style="padding:6px 16px;border:none;border-radius:4px;background:#1677ff;color:#fff;cursor:pointer;font-size:13px">OK</button></div>';
            document.body.appendChild(d);
            d.showModal();
            var result = false;
            d.querySelector('#__mabConfirmOk').onclick = function(){ result = true; d.close(); };
            d.querySelector('#__mabConfirmCancel').onclick = function(){ d.close(); };
            d.onkeydown = function(e){ if(e.key==='Enter'){ result = true; d.close(); } if(e.key==='Escape'){ d.close(); } };
            d.addEventListener('close', function(){ d.remove(); });
            return result;
          };
        }
        ${code}
      `
      const result = await activeView.webContents.executeJavaScript(wrapped)
      return { result }
    } catch (err: any) {
      return { error: err.message || String(err) }
    }
  })

  ipcMain.handle('toggle-script', (_event, scriptId: string, enabled: boolean) => {
    const data = loadData()
    const script = data.scripts.find((s) => s.id === scriptId)
    if (script) {
      script.enabled = enabled
      saveData(data)
    }
    return true
  })

  ipcMain.handle('toggle-auto-execute', (_event, scriptId: string, autoExecute: boolean) => {
    const data = loadData()
    const script = data.scripts.find((s) => s.id === scriptId)
    if (script) {
      script.autoExecute = autoExecute
      saveData(data)
    }
    return true
  })

  // Bookmark management
  ipcMain.handle('get-bookmarks', () => {
    return loadData().bookmarks || []
  })

  ipcMain.handle('save-bookmark', (_event, bookmark: Bookmark) => {
    const data = loadData()
    if (!data.bookmarks) data.bookmarks = []
    const idx = data.bookmarks.findIndex((b) => b.id === bookmark.id)
    if (idx >= 0) {
      data.bookmarks[idx] = bookmark
    } else {
      data.bookmarks.push(bookmark)
    }
    saveData(data)
    return bookmark
  })

  ipcMain.handle('delete-bookmark', (_event, bookmarkId: string) => {
    const data = loadData()
    data.bookmarks = (data.bookmarks || []).filter((b) => b.id !== bookmarkId)
    saveData(data)
    return true
  })

  // View management
  ipcMain.handle('show-dialog', () => {
    if (activeView) {
      activeView.setVisible(false)
    }
  })

  ipcMain.handle('hide-dialog', () => {
    if (activeView) {
      activeView.setVisible(true)
    }
  })

  ipcMain.handle('set-console-open', (_event, isOpen: boolean) => {
    consoleOpen = isOpen
    updateViewBounds()
  })
}

// ============ App Lifecycle ============

// Flush all session cookies to disk before quitting
async function flushAllSessions(): Promise<void> {
  const sessions = session.defaultSession
  const accounts = loadData().accounts
  try {
    await sessions.cookies.flushStore()
  } catch {}
  for (const account of accounts) {
    try {
      const ses = session.fromPartition(`persist:${account.partition}`)
      await ses.cookies.flushStore()
    } catch {}
  }
}

app.on('before-quit', async (e) => {
  e.preventDefault()
  await flushAllSessions()
  app.exit()
})

app.whenReady().then(() => {
  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
