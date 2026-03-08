import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'
import { SkillCard } from '../../components/SkillCard'
import { SkillStatsTripletLine } from '../../components/SkillStats'
import { getSkillBadges } from '../../lib/badges'
import type { PublicSkill, PublicUser } from '../../lib/publicUser'

export const Route = createFileRoute('/u/$handle')({
  component: UserProfile,
})

function UserProfile() {
  const { handle } = Route.useParams()
  const me = useQuery(api.users.me) as Doc<'users'> | null | undefined
  const user = useQuery(api.users.getByHandle, { handle }) as PublicUser | null | undefined
  const publishedSkills = useQuery(
    api.skills.list,
    user ? { ownerUserId: user._id, limit: 50 } : 'skip',
  ) as PublicSkill[] | undefined
  const starredSkills = useQuery(
    api.stars.listByUser,
    user ? { userId: user._id, limit: 50 } : 'skip',
  ) as PublicSkill[] | undefined

  const isSelf = Boolean(me && user && me._id === user._id)
  const [tab, setTab] = useState<'stars' | 'installed'>('stars')
  const [includeRemoved, setIncludeRemoved] = useState(false)
  const installed = useQuery(
    api.telemetry.getMyInstalled,
    isSelf && tab === 'installed' ? { includeRemoved } : 'skip',
  ) as TelemetryResponse | null | undefined

  useEffect(() => {
    if (!isSelf && tab === 'installed') setTab('stars')
  }, [isSelf, tab])

  if (user === undefined) {
    return (
      <main className="section">
        <div className="card">
          <div className="loading-indicator">加载用户中…</div>
        </div>
      </main>
    )
  }

  if (user === null) {
    return (
      <main className="section">
        <div className="card">用户未找到。</div>
      </main>
    )
  }

  const avatar = user.image
  const displayName = user.displayName ?? user.name ?? user.handle ?? 'User'
  const displayHandle = user.handle ?? user.name ?? handle
  const initial = displayName.charAt(0).toUpperCase()
  const isLoadingSkills = starredSkills === undefined
  const skills = starredSkills ?? []
  const isLoadingPublished = publishedSkills === undefined
  const published = publishedSkills ?? []

  return (
    <main className="section">
      <div className="card settings-profile" style={{ marginBottom: 22 }}>
        <div className="settings-avatar" aria-hidden="true">
          {avatar ? <img src={avatar} alt="" /> : <span>{initial}</span>}
        </div>
        <div className="settings-profile-body">
          <div className="settings-name">{displayName}</div>
          <div className="settings-handle">@{displayHandle}</div>
        </div>
      </div>

      {isSelf ? (
        <div className="profile-tabs" role="tablist" aria-label="个人资料标签">
          <button
            className={tab === 'stars' ? 'profile-tab is-active' : 'profile-tab'}
            type="button"
            role="tab"
            aria-selected={tab === 'stars'}
            onClick={() => setTab('stars')}
          >
            收藏
          </button>
          <button
            className={tab === 'installed' ? 'profile-tab is-active' : 'profile-tab'}
            type="button"
            role="tab"
            aria-selected={tab === 'installed'}
            onClick={() => setTab('installed')}
          >
            已安装
          </button>
        </div>
      ) : null}

      {tab === 'installed' && isSelf ? (
        <InstalledSection
          includeRemoved={includeRemoved}
          onToggleRemoved={() => setIncludeRemoved((value) => !value)}
          data={installed}
        />
      ) : (
        <>
          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>
            已发布
          </h2>
          <p className="section-subtitle">该用户发布的技能。</p>

          {isLoadingPublished ? (
            <div className="card">
              <div className="loading-indicator">加载已发布技能中…</div>
            </div>
          ) : published.length > 0 ? (
            <div className="grid" style={{ marginBottom: 18 }}>
              {published.map((skill) => (
                <SkillCard
                  key={skill._id}
                  skill={skill}
                  badge={getSkillBadges(skill)}
                  summaryFallback="Agent 就绪的技能包。"
                  meta={
                    <div className="stat">
                      <SkillStatsTripletLine stats={skill.stats} />
                    </div>
                  }
                />
              ))}
            </div>
          ) : null}

          <h2 className="section-title" style={{ fontSize: '1.3rem' }}>
            收藏
          </h2>
          <p className="section-subtitle">该用户收藏的技能。</p>

          {isLoadingSkills ? (
            <div className="card">
              <div className="loading-indicator">加载收藏中…</div>
            </div>
          ) : skills.length === 0 ? (
            <div className="card">暂无收藏。</div>
          ) : (
            <div className="grid">
              {skills.map((skill) => (
                <SkillCard
                  key={skill._id}
                  skill={skill}
                  badge={getSkillBadges(skill)}
                  summaryFallback="Agent 就绪的技能包。"
                  meta={
                    <div className="stat">
                      <SkillStatsTripletLine stats={skill.stats} />
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}

function InstalledSection(props: {
  includeRemoved: boolean
  onToggleRemoved: () => void
  data: TelemetryResponse | null | undefined
}) {
  const clearTelemetry = useMutation(api.telemetry.clearMyTelemetry)
  const [showRaw, setShowRaw] = useState(false)
  const data = props.data
  if (data === undefined) {
    return (
      <>
        <h2 className="section-title" style={{ fontSize: '1.3rem' }}>
          已安装
        </h2>
        <div className="card">
          <div className="loading-indicator">加载遥测数据…</div>
        </div>
      </>
    )
  }

  if (data === null) {
    return (
      <>
        <h2 className="section-title" style={{ fontSize: '1.3rem' }}>
          已安装
        </h2>
        <div className="card">登录以查看你已安装的技能。</div>
      </>
    )
  }

  return (
    <>
      <h2 className="section-title" style={{ fontSize: '1.3rem' }}>
        Installed
      </h2>
      <p className="section-subtitle" style={{ maxWidth: 760 }}>
        私密视图。只有你能看到你的文件夹/根目录。其他人只能看到每个技能的汇总安装数。
      </p>
      <div className="profile-actions">
        <button className="btn" type="button" onClick={props.onToggleRemoved}>
          {props.includeRemoved ? '隐藏已移除' : '显示已移除'}
        </button>
        <button className="btn" type="button" onClick={() => setShowRaw((value) => !value)}>
          {showRaw ? '隐藏 JSON' : '显示 JSON'}
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => {
            if (!window.confirm('确定删除所有遥测数据？')) return
            void clearTelemetry()
          }}
        >
          删除遥测数据
        </button>
      </div>

      {showRaw ? (
        <div className="card telemetry-json" style={{ marginBottom: 18 }}>
          <pre className="mono" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      ) : null}

      {data.roots.length === 0 ? (
        <div className="card">暂无遥测数据。请在 CLI 中运行 `clawhub sync`。</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {data.roots.map((root) => (
            <div key={root.rootId} className="card telemetry-root">
              <div className="telemetry-root-header">
                <div>
                  <div className="telemetry-root-title">{root.label}</div>
                  <div className="telemetry-root-meta">
                    上次同步 {new Date(root.lastSeenAt).toLocaleString()}
                    {root.expiredAt ? ' · 已过期' : ''}
                  </div>
                </div>
                <div className="tag">{root.skills.length} 个技能</div>
              </div>
              {root.skills.length === 0 ? (
                <div className="stat">此根目录下未找到技能。</div>
              ) : (
                <div className="telemetry-skill-list">
                  {root.skills.map((entry) => (
                    <div key={`${root.rootId}:${entry.skill.slug}`} className="telemetry-skill-row">
                      <a
                        className="telemetry-skill-link"
                        href={`/${encodeURIComponent(String(entry.skill.ownerUserId))}/${entry.skill.slug}`}
                      >
                        <span>{entry.skill.displayName}</span>
                        <span className="telemetry-skill-slug">/{entry.skill.slug}</span>
                      </a>
                      <div className="telemetry-skill-meta mono">
                        {entry.lastVersion ? `v${entry.lastVersion}` : 'v?'}{' '}
                        {entry.removedAt ? '· 已移除' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

type TelemetryResponse = {
  roots: Array<{
    rootId: string
    label: string
    firstSeenAt: number
    lastSeenAt: number
    expiredAt?: number
    skills: Array<{
      skill: {
        slug: string
        displayName: string
        summary?: string
        stats: unknown
        ownerUserId: string
      }
      firstSeenAt: number
      lastSeenAt: number
      lastVersion?: string
      removedAt?: number
    }>
  }>
  cutoffDays: number
}
