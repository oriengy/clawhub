import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { gravatarUrl } from '../lib/gravatar'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const me = useQuery(api.users.me)
  const updateProfile = useMutation(api.users.updateProfile)
  const deleteAccount = useMutation(api.users.deleteAccount)
  const tokens = useQuery(api.tokens.listMine) as
    | Array<{
        _id: Id<'apiTokens'>
        label: string
        prefix: string
        createdAt: number
        lastUsedAt?: number
        revokedAt?: number
      }>
    | undefined
  const createToken = useMutation(api.tokens.create)
  const revokeToken = useMutation(api.tokens.revoke)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [tokenLabel, setTokenLabel] = useState('CLI token')
  const [newToken, setNewToken] = useState<string | null>(null)

  useEffect(() => {
    if (!me) return
    setDisplayName(me.displayName ?? '')
    setBio(me.bio ?? '')
  }, [me])

  if (!me) {
    return (
      <main className="section">
        <div className="card">请登录以访问设置。</div>
      </main>
    )
  }

  const avatar = me.image ?? (me.email ? gravatarUrl(me.email, 160) : undefined)
  const identityName = me.displayName ?? me.name ?? me.handle ?? 'Profile'
  const handle = me.handle ?? (me.email ? me.email.split('@')[0] : undefined)

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    await updateProfile({ displayName, bio })
    setStatus('已保存。')
  }

  async function onDelete() {
    const ok = window.confirm(
      '确定要永久删除账号吗？此操作不可撤销。\n\n' +
        '已发布的技能将继续公开。',
    )
    if (!ok) return
    await deleteAccount()
  }

  async function onCreateToken() {
    const label = tokenLabel.trim() || 'CLI token'
    const result = await createToken({ label })
    setNewToken(result.token)
  }

  return (
    <main className="section settings-shell">
      <h1 className="section-title">设置</h1>
      <div className="card settings-profile">
        <div className="settings-avatar">
          {avatar ? (
            <img src={avatar} alt={identityName} />
          ) : (
            <span>{identityName[0]?.toUpperCase() ?? 'U'}</span>
          )}
        </div>
        <div className="settings-profile-body">
          <div className="settings-name">{identityName}</div>
          {handle ? <div className="settings-handle">@{handle}</div> : null}
          {me.email ? <div className="settings-email">{me.email}</div> : null}
        </div>
      </div>
      <form className="card settings-card" onSubmit={onSave}>
        <label className="settings-field">
          <span>显示名称</span>
          <input
            className="settings-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label className="settings-field">
          <span>简介</span>
          <textarea
            className="settings-input"
            rows={5}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="介绍一下你正在做的事情。"
          />
        </label>
        <div className="settings-actions">
          <button className="btn btn-primary settings-save" type="submit">
            保存
          </button>
          {status ? <div className="stat">{status}</div> : null}
        </div>
      </form>

      <div className="card settings-card">
        <h2 className="section-title danger-title" style={{ marginTop: 0 }}>
          API Token
        </h2>
        <p className="section-subtitle">
          用于 `clawhub` CLI 的令牌。令牌仅在创建时显示一次。
        </p>

        <div className="settings-field">
          <span>标签</span>
          <input
            className="settings-input"
            value={tokenLabel}
            onChange={(event) => setTokenLabel(event.target.value)}
            placeholder="CLI token"
          />
        </div>
        <div className="settings-actions">
          <button
            className="btn btn-primary settings-save"
            type="button"
            onClick={() => void onCreateToken()}
          >
            创建令牌
          </button>
          {newToken ? (
            <div className="stat" style={{ overflowX: 'auto' }}>
              <div style={{ marginBottom: 8 }}>请立即复制此令牌：</div>
              <code>{newToken}</code>
            </div>
          ) : null}
        </div>

        {(tokens ?? []).length ? (
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {(tokens ?? []).map((token) => (
              <div
                key={token._id}
                className="stat"
                style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
              >
                <div>
                  <div>
                    <strong>{token.label}</strong>{' '}
                    <span style={{ opacity: 0.7 }}>({token.prefix}…)</span>
                  </div>
                  <div style={{ opacity: 0.7 }}>
                    创建于 {formatDate(token.createdAt)}
                    {token.lastUsedAt ? ` · 使用于 ${formatDate(token.lastUsedAt)}` : ''}
                    {token.revokedAt ? ` · 已撤销 ${formatDate(token.revokedAt)}` : ''}
                  </div>
                </div>
                <div>
                  <button
                    className="btn"
                    type="button"
                    disabled={Boolean(token.revokedAt)}
                    onClick={() => void revokeToken({ tokenId: token._id })}
                  >
                    {token.revokedAt ? '已撤销' : '撤销'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="section-subtitle" style={{ marginTop: 16 }}>
            暂无令牌。
          </p>
        )}
      </div>

      <div className="card danger-card">
        <h2 className="section-title danger-title">危险操作</h2>
        <p className="section-subtitle">
          永久删除你的账号。此操作不可撤销。已发布的技能将继续公开。
        </p>
        <button className="btn btn-danger" type="button" onClick={() => void onDelete()}>
          删除账号
        </button>
      </div>
    </main>
  )
}

function formatDate(value: number) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}
