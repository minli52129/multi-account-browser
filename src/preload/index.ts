import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Account management
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  addAccount: (account: { name: string; url: string }) => ipcRenderer.invoke('add-account', account),
  updateAccount: (accountId: string, updates: any) => ipcRenderer.invoke('update-account', accountId, updates),
  deleteAccount: (accountId: string) => ipcRenderer.invoke('delete-account', accountId),
  switchAccount: (accountId: string) => ipcRenderer.invoke('switch-account', accountId),

  // Navigation
  navigate: (url: string) => ipcRenderer.invoke('navigate', url),
  getCurrentUrl: () => ipcRenderer.invoke('get-current-url'),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  reload: () => ipcRenderer.invoke('reload'),

  // Script management
  getScripts: () => ipcRenderer.invoke('get-scripts'),
  saveScript: (script: any) => ipcRenderer.invoke('save-script', script),
  deleteScript: (scriptId: string) => ipcRenderer.invoke('delete-script', scriptId),
  executeScript: (code: string) => ipcRenderer.invoke('execute-script', code),
  toggleScript: (scriptId: string, enabled: boolean) => ipcRenderer.invoke('toggle-script', scriptId, enabled),
  toggleAutoExecute: (scriptId: string, autoExecute: boolean) =>
    ipcRenderer.invoke('toggle-auto-execute', scriptId, autoExecute),

  // Bookmark management
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmark: (bookmark: any) => ipcRenderer.invoke('save-bookmark', bookmark),
  deleteBookmark: (bookmarkId: string) => ipcRenderer.invoke('delete-bookmark', bookmarkId),

  // View management
  showDialog: () => ipcRenderer.invoke('show-dialog'),
  hideDialog: () => ipcRenderer.invoke('hide-dialog'),
  setConsoleOpen: (isOpen: boolean) => ipcRenderer.invoke('set-console-open', isOpen),

  // Events
  onNavigationUpdate: (callback: (data: { accountId: string; url: string }) => void) => {
    ipcRenderer.on('navigation-update', (_event, data) => callback(data))
  },
  onTitleUpdate: (callback: (data: { accountId: string; title: string }) => void) => {
    ipcRenderer.on('title-update', (_event, data) => callback(data))
  }
}

contextBridge.exposeInMainWorld('api', api)
