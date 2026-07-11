export interface Account {
  id: string
  name: string
  url: string
  partition: string
  createdAt: string
}

export interface Script {
  id: string
  name: string
  code: string
  autoExecute: boolean
  enabled: boolean
}

export interface Bookmark {
  id: string
  name: string
  icon: string
  code: string
  enabled: boolean
}

export interface ElectronAPI {
  getAccounts: () => Promise<Account[]>
  addAccount: (account: { name: string; url: string }) => Promise<Account>
  updateAccount: (accountId: string, updates: Partial<Account>) => Promise<Account | null>
  deleteAccount: (accountId: string) => Promise<boolean>
  switchAccount: (accountId: string) => Promise<boolean>
  navigate: (url: string) => Promise<void>
  getCurrentUrl: () => Promise<string>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  reload: () => Promise<void>
  getScripts: () => Promise<Script[]>
  saveScript: (script: Script) => Promise<Script>
  deleteScript: (scriptId: string) => Promise<boolean>
  executeScript: (code: string) => Promise<{ result?: any; error?: string }>
  toggleScript: (scriptId: string, enabled: boolean) => Promise<boolean>
  toggleAutoExecute: (scriptId: string, autoExecute: boolean) => Promise<boolean>
  getBookmarks: () => Promise<Bookmark[]>
  saveBookmark: (bookmark: Bookmark) => Promise<Bookmark>
  deleteBookmark: (bookmarkId: string) => Promise<boolean>
  showDialog: () => Promise<void>
  hideDialog: () => Promise<void>
  setConsoleOpen: (isOpen: boolean) => Promise<void>
  onNavigationUpdate: (callback: (data: { accountId: string; url: string }) => void) => void
  onTitleUpdate: (callback: (data: { accountId: string; title: string }) => void) => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
