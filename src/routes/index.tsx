import { createFileRoute, Link } from '@tanstack/react-router'
import { useAction, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import { InstallSwitcher } from '../components/InstallSwitcher'
import { SkillCard } from '../components/SkillCard'
import { SkillStatsTripletLine } from '../components/SkillStats'
import { SoulCard } from '../components/SoulCard'
import { SoulStatsTripletLine } from '../components/SoulStats'
import { UserBadge } from '../components/UserBadge'
import { getSkillBadges } from '../lib/badges'
import type { PublicSkill, PublicSoul, PublicUser } from '../lib/publicUser'
import { getSiteMode } from '../lib/site'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const mode = getSiteMode()
  return mode === 'souls' ? <OnlyCrabsHome /> : <SkillsHome />
}

function SkillsHome() {
  type SkillPageEntry = {
    skill: PublicSkill
    ownerHandle?: string | null
    owner?: PublicUser | null
    latestVersion?: unknown
  }

  const highlighted =
    (useQuery(api.skills.listHighlightedPublic, { limit: 6 }) as SkillPageEntry[]) ?? []
  const popularResult = useQuery(api.skills.listPublicPageV2, {
    paginationOpts: { cursor: null, numItems: 12 },
    sort: 'downloads',
    dir: 'desc',
    nonSuspiciousOnly: true,
  }) as { page: SkillPageEntry[] } | undefined
  const popular = popularResult?.page ?? []

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy fade-up" data-delay="1">
            <span className="hero-badge">轻量如龙虾，精准如利爪。</span>
            <h1 className="hero-title">ClawHub，智能体的技能码头。</h1>
            <p className="hero-subtitle">
              上传 AgentSkills 包，像 npm 一样版本化管理，通过向量搜索让它们触手可及。没有门槛，只有信号。
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Link to="/upload" search={{ updateSlug: undefined }} className="btn btn-primary">
                发布技能
              </Link>
              <Link
                to="/skills"
                search={{
                  q: undefined,
                  sort: undefined,
                  dir: undefined,
                  highlighted: undefined,
                  nonSuspicious: true,
                  view: undefined,
                  focus: undefined,
                }}
                className="btn"
              >
                浏览技能
              </Link>
            </div>
          </div>
          <div className="hero-card hero-search-card fade-up" data-delay="2">
            <div className="hero-install" style={{ marginTop: 18 }}>
              <div className="stat">搜索技能。版本化管理，支持回滚。</div>
              <InstallSwitcher exampleSlug="sonoscli" />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">精选技能</h2>
        <p className="section-subtitle">策展精选 — 标记为值得信赖的技能。</p>
        <div className="grid">
          {highlighted.length === 0 ? (
            <div className="card">暂无精选技能。</div>
          ) : (
            highlighted.map((entry) => (
              <SkillCard
                key={entry.skill._id}
                skill={entry.skill}
                badge={getSkillBadges(entry.skill)}
                summaryFallback="全新的技能包。"
                meta={
                  <div className="skill-card-footer-rows">
                    <UserBadge
                      user={entry.owner}
                      fallbackHandle={entry.ownerHandle ?? null}
                      prefix="作者"
                      link={false}
                    />
                    <div className="stat">
                      <SkillStatsTripletLine stats={entry.skill.stats} />
                    </div>
                  </div>
                }
              />
            ))
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">热门技能</h2>
        <p className="section-subtitle">下载量最高的安全技能。</p>
        <div className="grid">
          {popular.length === 0 ? (
            <div className="card">暂无技能。成为第一个发布者吧。</div>
          ) : (
            popular.map((entry) => (
              <SkillCard
                key={entry.skill._id}
                skill={entry.skill}
                summaryFallback="即用型 Agent 技能包。"
                meta={
                  <div className="skill-card-footer-rows">
                    <UserBadge
                      user={entry.owner}
                      fallbackHandle={entry.ownerHandle ?? null}
                      prefix="作者"
                      link={false}
                    />
                    <div className="stat">
                      <SkillStatsTripletLine stats={entry.skill.stats} />
                    </div>
                  </div>
                }
              />
            ))
          )}
        </div>
        <div className="section-cta">
          <Link
            to="/skills"
            search={{
              q: undefined,
              sort: undefined,
              dir: undefined,
              highlighted: undefined,
              nonSuspicious: true,
              view: undefined,
              focus: undefined,
            }}
            className="btn"
          >
            查看全部技能
          </Link>
        </div>
      </section>
    </main>
  )
}

function OnlyCrabsHome() {
  const navigate = Route.useNavigate()
  const ensureSoulSeeds = useAction(api.seed.ensureSoulSeeds)
  const latest = (useQuery(api.souls.list, { limit: 12 }) as PublicSoul[]) ?? []
  const [query, setQuery] = useState('')
  const seedEnsuredRef = useRef(false)
  const trimmedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    if (seedEnsuredRef.current) return
    seedEnsuredRef.current = true
    void ensureSoulSeeds({})
  }, [ensureSoulSeeds])

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy fade-up" data-delay="1">
            <span className="hero-badge">SOUL.md，共享传承。</span>
            <h1 className="hero-title">SoulHub，系统传说的归宿。</h1>
            <p className="hero-subtitle">
              分享 SOUL.md 包，像文档一样版本化管理，将个人系统传说集中在一个公开的地方。
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Link to="/upload" search={{ updateSlug: undefined }} className="btn btn-primary">
                发布灵魂
              </Link>
              <Link
                to="/souls"
                search={{
                  q: undefined,
                  sort: undefined,
                  dir: undefined,
                  view: undefined,
                  focus: undefined,
                }}
                className="btn"
              >
                浏览灵魂
              </Link>
            </div>
          </div>
          <div className="hero-card hero-search-card fade-up" data-delay="2">
            <form
              className="search-bar"
              onSubmit={(event) => {
                event.preventDefault()
                void navigate({
                  to: '/souls',
                  search: {
                    q: trimmedQuery || undefined,
                    sort: undefined,
                    dir: undefined,
                    view: undefined,
                    focus: undefined,
                  },
                })
              }}
            >
              <span className="mono">/</span>
              <input
                className="search-input"
                placeholder="搜索灵魂、提示词或传说"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>
            <div className="hero-install" style={{ marginTop: 18 }}>
              <div className="stat">搜索灵魂。版本化管理，可读性强，易于二次创作。</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">最新灵魂</h2>
        <p className="section-subtitle">平台上最新的 SOUL.md 包。</p>
        <div className="grid">
          {latest.length === 0 ? (
            <div className="card">暂无灵魂。成为第一个发布者吧。</div>
          ) : (
            latest.map((soul) => (
              <SoulCard
                key={soul._id}
                soul={soul}
                summaryFallback="一个 SOUL.md 包。"
                meta={
                  <div className="stat">
                    <SoulStatsTripletLine stats={soul.stats} />
                  </div>
                }
              />
            ))
          )}
        </div>
        <div className="section-cta">
          <Link
            to="/souls"
            search={{
              q: undefined,
              sort: undefined,
              dir: undefined,
              view: undefined,
              focus: undefined,
            }}
            className="btn"
          >
            查看全部灵魂
          </Link>
        </div>
      </section>
    </main>
  )
}
