import { lazy, Suspense } from 'react'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import { SkillVersionsPanel } from './SkillVersionsPanel'

const SkillDiffCard = lazy(() =>
  import('./SkillDiffCard').then((module) => ({ default: module.SkillDiffCard })),
)

const SkillFilesPanel = lazy(() =>
  import('./SkillFilesPanel').then((module) => ({ default: module.SkillFilesPanel })),
)

type SkillFile = Doc<'skillVersions'>['files'][number]

type SkillDetailTabsProps = {
  activeTab: 'files' | 'compare' | 'versions'
  setActiveTab: (tab: 'files' | 'compare' | 'versions') => void
  onCompareIntent: () => void
  readmeContent: string | null
  readmeError: string | null
  latestFiles: SkillFile[]
  latestVersionId: Id<'skillVersions'> | null
  skill: Doc<'skills'>
  diffVersions: Doc<'skillVersions'>[] | undefined
  versions: Doc<'skillVersions'>[] | undefined
  nixPlugin: boolean
}

export function SkillDetailTabs({
  activeTab,
  setActiveTab,
  onCompareIntent,
  readmeContent,
  readmeError,
  latestFiles,
  latestVersionId,
  skill,
  diffVersions,
  versions,
  nixPlugin,
}: SkillDetailTabsProps) {
  return (
    <div className="card tab-card">
      <div className="tab-header">
        <button
          className={`tab-button${activeTab === 'files' ? ' is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('files')}
        >
          文件
        </button>
        <button
          className={`tab-button${activeTab === 'compare' ? ' is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('compare')}
          onMouseEnter={() => {
            onCompareIntent()
            void import('./SkillDiffCard')
          }}
          onFocus={() => {
            onCompareIntent()
            void import('./SkillDiffCard')
          }}
        >
          对比
        </button>
        <button
          className={`tab-button${activeTab === 'versions' ? ' is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('versions')}
        >
          版本
        </button>
      </div>

      {activeTab === 'files' ? (
        <Suspense fallback={<div className="tab-body stat">加载文件查看器…</div>}>
          <SkillFilesPanel
            versionId={latestVersionId}
            readmeContent={readmeContent}
            readmeError={readmeError}
            latestFiles={latestFiles}
          />
        </Suspense>
      ) : null}

      {activeTab === 'compare' ? (
        <div className="tab-body">
          <Suspense fallback={<div className="stat">加载对比查看器…</div>}>
            <SkillDiffCard skill={skill} versions={diffVersions ?? []} variant="embedded" />
          </Suspense>
        </div>
      ) : null}

      {activeTab === 'versions' ? (
        <SkillVersionsPanel versions={versions} nixPlugin={nixPlugin} skillSlug={skill.slug} />
      ) : null}
    </div>
  )
}
