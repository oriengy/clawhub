import type { Doc } from '../../convex/_generated/dataModel'
import { type LlmAnalysis, SecurityScanResults } from './SkillSecurityScanResults'

type SkillVersionsPanelProps = {
  versions: Doc<'skillVersions'>[] | undefined
  nixPlugin: boolean
  skillSlug: string
}

export function SkillVersionsPanel({ versions, nixPlugin, skillSlug }: SkillVersionsPanelProps) {
  return (
    <div className="tab-body">
      <div>
        <h2 className="section-title" style={{ fontSize: '1.2rem', margin: 0 }}>
          版本
        </h2>
        <p className="section-subtitle" style={{ margin: 0 }}>
          {nixPlugin
            ? '查看发布历史和更新日志。'
            : '下载旧版本或查看更新日志。'}
        </p>
      </div>
      <div className="version-scroll">
        <div className="version-list">
          {(versions ?? []).map((version) => (
            <div key={version._id} className="version-row">
              <div className="version-info">
                <div>
                  v{version.version} · {new Date(version.createdAt).toLocaleDateString()}
                  {version.changelogSource === 'auto' ? (
                    <span style={{ color: 'var(--ink-soft)' }}> · auto</span>
                  ) : null}
                </div>
                <div style={{ color: '#5c554e', whiteSpace: 'pre-wrap' }}>{version.changelog}</div>
                <div className="version-scan-results">
                  {version.sha256hash || version.llmAnalysis ? (
                    <SecurityScanResults
                      sha256hash={version.sha256hash}
                      vtAnalysis={version.vtAnalysis}
                      llmAnalysis={version.llmAnalysis as LlmAnalysis | undefined}
                      variant="badge"
                    />
                  ) : null}
                </div>
              </div>
              {!nixPlugin ? (
                <div className="version-actions">
                  <a
                    className="btn version-zip"
                    href={`${import.meta.env.VITE_CONVEX_SITE_URL}/api/v1/download?slug=${skillSlug}&version=${version.version}`}
                  >
                    Zip
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
