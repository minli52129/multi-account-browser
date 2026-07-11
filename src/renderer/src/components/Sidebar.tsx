import { Account } from '../types'

interface SidebarProps {
  accounts: Account[]
  activeAccountId: string | null
  onSelectAccount: (id: string) => void
  onDeleteAccount: (id: string) => void
  onEditAccount: (account: Account) => void
  onAddAccount: () => void
  onToggleConsole: () => void
}

export default function Sidebar({
  accounts,
  activeAccountId,
  onSelectAccount,
  onDeleteAccount,
  onEditAccount,
  onAddAccount,
  onToggleConsole
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>MAB</h1>
      </div>
      <div className="sidebar-section">
        <div className="section-title">
          Accounts
          <button className="icon-btn add-btn" onClick={onAddAccount} title="Add Account">
            +
          </button>
        </div>
        <div className="account-list">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`account-item ${activeAccountId === account.id ? 'active' : ''}`}
              onClick={() => onSelectAccount(account.id)}
            >
              <div className="account-avatar">
                {account.name.charAt(0).toUpperCase()}
              </div>
              <div className="account-info">
                <div className="account-name">{account.name}</div>
                <div className="account-url">{new URL(account.url || 'https://example.com').hostname}</div>
              </div>
              <div className="account-item-actions">
                <button
                  className="icon-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditAccount(account)
                  }}
                  title="Edit Account"
                >
                  edit
                </button>
                <button
                  className="icon-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteAccount(account.id)
                  }}
                  title="Delete Account"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="empty-list">No accounts yet</div>
          )}
        </div>
      </div>
      <div className="sidebar-footer">
        <button className="console-btn" onClick={onToggleConsole} title="Toggle JS Console">
          Console
        </button>
      </div>
    </div>
  )
}
