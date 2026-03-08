import { getSiteName } from '../lib/site'

export function Footer() {
  const siteName = getSiteName()
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-divider" aria-hidden="true" />
        <div className="site-footer-row">
          <div className="site-footer-copy">
            {siteName} · 一个{' '}
            <a href="https://openclaw.ai" target="_blank" rel="noreferrer">
              OpenClaw
            </a>{' '}
            项目 · 部署于{' '}
            <a href="https://vercel.com" target="_blank" rel="noreferrer">
              Vercel
            </a>{' '}
            · 由{' '}
            <a href="https://www.convex.dev" target="_blank" rel="noreferrer">
              Convex
            </a>{' '}
            驱动 ·{' '}
            <a href="https://github.com/openclaw/clawhub" target="_blank" rel="noreferrer">
              开源 (MIT)
            </a>{' '}
            ·{' '}
            <a href="https://steipete.me" target="_blank" rel="noreferrer">
              Peter Steinberger
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
