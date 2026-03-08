import { Link } from '@tanstack/react-router'
import {
  type ClawdisSkillMetadata,
  PLATFORM_SKILL_LICENSE,
  PLATFORM_SKILL_LICENSE_SUMMARY,
} from 'clawhub-schema'
import { Package } from 'lucide-react'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { getSkillBadges } from '../lib/badges'
import { formatCompactStat, formatSkillStatsTriplet } from '../lib/numberFormat'
import type { PublicSkill, PublicUser } from '../lib/publicUser'
import { type LlmAnalysis, SecurityScanResults } from './SkillSecurityScanResults'
import { SkillInstallCard } from './SkillInstallCard'
import { UserBadge } from './UserBadge'

export type SkillModerationInfo = {
  isPendingScan: boolean
  isMalwareBlocked: boolean
  isSuspicious: boolean
  isHiddenByMod: boolean
  isRemoved: boolean
  reason?: string
}

type SkillFork = {
  kind: 'fork' | 'duplicate'
  version: string | null
  skill: { slug: string; displayName: string }
  owner: { handle: string | null; userId: Id<'users'> | null }
}

type SkillCanonical = {
  skill: { slug: string; displayName: string }
  owner: { handle: string | null; userId: Id<'users'> | null }
}

type SkillHeaderProps = {
  skill: Doc<'skills'> | PublicSkill
  owner: Doc<'users'> | PublicUser | null
  ownerHandle: string | null
  latestVersion: Doc<'skillVersions'> | null
  modInfo: SkillModerationInfo | null
  canManage: boolean
  isAuthenticated: boolean
  isStaff: boolean
  isStarred: boolean | undefined
  onToggleStar: () => void
  onOpenReport: () => void
  forkOf: SkillFork | null
  forkOfLabel: string
  forkOfHref: string | null
  forkOfOwnerHandle: string | null
  canonical: SkillCanonical | null
  canonicalHref: string | null
  canonicalOwnerHandle: string | null
  staffModerationNote: string | null
  staffVisibilityTag: string | null
  isAutoHidden: boolean
  isRemoved: boolean
  nixPlugin: string | undefined
  hasPluginBundle: boolean
  configRequirements: ClawdisSkillMetadata['config'] | undefined
  cliHelp: string | undefined
  tagEntries: Array<[string, Id<'skillVersions'>]>
  versionById: Map<Id<'skillVersions'>, Doc<'skillVersions'>>
  tagName: string
  onTagNameChange: (value: string) => void
  tagVersionId: Id<'skillVersions'> | ''
  onTagVersionChange: (value: Id<'skillVersions'> | '') => void
  onTagSubmit: () => void
  tagVersions: Doc<'skillVersions'>[]
  clawdis: ClawdisSkillMetadata | undefined
  osLabels: string[]
}

export function SkillHeader({
  skill,
  owner,
  ownerHandle,
  latestVersion,
  modInfo,
  canManage,
  isAuthenticated,
  isStaff,
  isStarred,
  onToggleStar,
  onOpenReport,
  forkOf,
  forkOfLabel,
  forkOfHref,
  forkOfOwnerHandle,
  canonical,
  canonicalHref,
  canonicalOwnerHandle,
  staffModerationNote,
  staffVisibilityTag,
  isAutoHidden,
  isRemoved,
  nixPlugin,
  hasPluginBundle,
  configRequirements,
  cliHelp,
  tagEntries,
  versionById,
  tagName,
  onTagNameChange,
  tagVersionId,
  onTagVersionChange,
  onTagSubmit,
  tagVersions,
  clawdis,
  osLabels,
}: SkillHeaderProps) {
  const formattedStats = formatSkillStatsTriplet(skill.stats)

  return (
    <>
      {modInfo?.isPendingScan ? (
        <div className="pending-banner">
          <div className="pending-banner-content">
            <strong>安全扫描进行中</strong>
            <p>
              你的技能正在接受 VirusTotal 扫描。扫描完成后将对其他人可见。通常需要最多 5 分钟——请耐心等待。
            </p>
          </div>
        </div>
      ) : modInfo?.isMalwareBlocked ? (
        <div className="pending-banner pending-banner-blocked">
          <div className="pending-banner-content">
            <strong>技能已封锁——检测到恶意内容</strong>
            <p>
              ClawHub 安全系统将此技能标记为恶意内容。下载已禁用。请查看下方的扫描结果。
            </p>
          </div>
        </div>
      ) : modInfo?.isSuspicious ? (
        <div className="pending-banner pending-banner-warning">
          <div className="pending-banner-content">
            <strong>技能已标记——检测到可疑模式</strong>
            <p>ClawHub 安全系统将此技能标记为可疑。使用前请查看扫描结果。</p>
            {canManage ? (
              <p className="pending-banner-appeal">
                如果你认为此技能被误标，请{' '}
                <a
                  href="https://github.com/openclaw/clawhub/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  在 GitHub 提交 issue
                </a>
                ，我们会说明标记原因及解决方法。
              </p>
            ) : null}
          </div>
        </div>
      ) : modInfo?.isRemoved ? (
        <div className="pending-banner pending-banner-blocked">
          <div className="pending-banner-content">
            <strong>技能已被管理员移除</strong>
            <p>此技能已被移除，其他人无法查看。</p>
          </div>
        </div>
      ) : modInfo?.isHiddenByMod ? (
        <div className="pending-banner pending-banner-blocked">
          <div className="pending-banner-content">
            <strong>技能已隐藏</strong>
            <p>此技能当前已隐藏，其他人无法查看。</p>
          </div>
        </div>
      ) : null}

      <div className="card skill-hero">
        <div className={`skill-hero-top${hasPluginBundle ? ' has-plugin' : ''}`}>
          <div className="skill-hero-header">
            <div className="skill-hero-title">
              <div className="skill-hero-title-row">
                <h1 className="section-title" style={{ margin: 0 }}>
                  {skill.displayName}
                </h1>
                {nixPlugin ? <span className="tag tag-accent">插件包 (nix)</span> : null}
              </div>
              <p className="section-subtitle">{skill.summary ?? '暂无简介。'}</p>

              {isStaff && staffModerationNote ? (
                <div className="skill-hero-note">{staffModerationNote}</div>
              ) : null}
              {nixPlugin ? (
                <div className="skill-hero-note">
                  将技能包、CLI 二进制文件和配置要求打包为一个 Nix 安装。
                </div>
              ) : null}
              <div className="skill-hero-note">
                <strong>{PLATFORM_SKILL_LICENSE}</strong> · {PLATFORM_SKILL_LICENSE_SUMMARY}
              </div>
              <div className="stat">
                ⭐ {formattedStats.stars} · <Package size={14} aria-hidden="true" />{' '}
                {formattedStats.downloads} · {formatCompactStat(skill.stats.installsCurrent ?? 0)} 当前安装
                 · {formattedStats.installsAllTime} 累计安装
              </div>
              <div className="stat">
                <UserBadge user={owner} fallbackHandle={ownerHandle} prefix="作者" size="md" showName />
              </div>
              {forkOf && forkOfHref ? (
                <div className="stat">
                  {forkOfLabel}{' '}
                  <a href={forkOfHref}>
                    {forkOfOwnerHandle ? `@${forkOfOwnerHandle}/` : ''}
                    {forkOf.skill.slug}
                  </a>
                  {forkOf.version ? ` (基于 ${forkOf.version})` : null}
                </div>
              ) : null}
              {canonicalHref ? (
                <div className="stat">
                  规范版本：{' '}
                  <a href={canonicalHref}>
                    {canonicalOwnerHandle ? `@${canonicalOwnerHandle}/` : ''}
                    {canonical?.skill?.slug}
                  </a>
                </div>
              ) : null}
              {getSkillBadges(skill).map((badge) => (
                <div key={badge} className="tag">
                  {badge}
                </div>
              ))}
              <div className="tag tag-accent">{PLATFORM_SKILL_LICENSE}</div>
              {isStaff && staffVisibilityTag ? (
                <div className={`tag${isAutoHidden || isRemoved ? ' tag-accent' : ''}`}>
                  {staffVisibilityTag}
                </div>
              ) : null}
              <div className="skill-actions">
                {isAuthenticated ? (
                  <button
                    className={`star-toggle${isStarred ? ' is-active' : ''}`}
                    type="button"
                    onClick={onToggleStar}
                    aria-label={isStarred ? '取消收藏技能' : '收藏技能'}
                  >
                    <span aria-hidden="true">★</span>
                  </button>
                ) : null}
                {isAuthenticated ? (
                  <button className="btn btn-ghost" type="button" onClick={onOpenReport}>
                    举报
                  </button>
                ) : null}
                {isStaff ? (
                  <Link className="btn" to="/management" search={{ skill: skill.slug }}>
                    管理
                  </Link>
                ) : null}
              </div>
              <SecurityScanResults
                sha256hash={latestVersion?.sha256hash}
                vtAnalysis={latestVersion?.vtAnalysis}
                llmAnalysis={latestVersion?.llmAnalysis as LlmAnalysis | undefined}
              />
              {latestVersion?.sha256hash || latestVersion?.llmAnalysis ? (
                <p className="scan-disclaimer">
                  安全如同层层蟹壳——运行代码前请先审查。
                </p>
              ) : null}
            </div>
            <div className="skill-hero-cta">
              <div className="skill-version-pill">
                <span className="skill-version-label">当前版本</span>
                <strong>v{latestVersion?.version ?? '—'}</strong>
              </div>
              {!nixPlugin && !modInfo?.isMalwareBlocked && !modInfo?.isRemoved ? (
                <a
                  className="btn btn-primary"
                  href={`${import.meta.env.VITE_CONVEX_SITE_URL}/api/v1/download?slug=${skill.slug}`}
                >
                  下载 zip
                </a>
              ) : null}
            </div>
          </div>
          {hasPluginBundle ? (
            <div className="skill-panel bundle-card">
              <div className="bundle-header">
                <div className="bundle-title">插件包 (nix)</div>
                <div className="bundle-subtitle">技能包 · CLI 二进制 · 配置</div>
              </div>
              <div className="bundle-includes">
                <span>SKILL.md</span>
                <span>CLI</span>
                <span>Config</span>
              </div>
              {configRequirements ? (
                <div className="bundle-section">
                  <div className="bundle-section-title">配置要求</div>
                  <div className="bundle-meta">
                    {configRequirements.requiredEnv?.length ? (
                      <div className="stat">
                        <strong>必需环境变量</strong>
                        <span>{configRequirements.requiredEnv.join(', ')}</span>
                      </div>
                    ) : null}
                    {configRequirements.stateDirs?.length ? (
                      <div className="stat">
                        <strong>状态目录</strong>
                        <span>{configRequirements.stateDirs.join(', ')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {cliHelp ? (
                <details className="bundle-section bundle-details">
                  <summary>CLI 帮助（来自插件）</summary>
                  <pre className="hero-install-code mono">{cliHelp}</pre>
                </details>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="skill-tag-row">
          {tagEntries.length === 0 ? (
            <span className="section-subtitle" style={{ margin: 0 }}>
              暂无标签。
            </span>
          ) : (
            tagEntries.map(([tag, versionId]) => (
              <span key={tag} className="tag">
                {tag}
                <span className="tag-meta">v{versionById.get(versionId)?.version ?? versionId}</span>
              </span>
            ))
          )}
        </div>

        {canManage ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              onTagSubmit()
            }}
            className="tag-form"
          >
            <input
              className="search-input"
              value={tagName}
              onChange={(event) => onTagNameChange(event.target.value)}
              placeholder="latest"
            />
            <select
              className="search-input"
              value={tagVersionId ?? ''}
              onChange={(event) => onTagVersionChange(event.target.value as Id<'skillVersions'>)}
            >
              {tagVersions.map((version) => (
                <option key={version._id} value={version._id}>
                  v{version.version}
                </option>
              ))}
            </select>
            <button className="btn" type="submit">
              更新标签
            </button>
          </form>
        ) : null}

        <SkillInstallCard clawdis={clawdis} osLabels={osLabels} />
      </div>
    </>
  )
}
