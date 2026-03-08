import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: SettingsRedirect,
})

// 中国部署版：Settings 需要登录，直接重定向到首页
function SettingsRedirect() {
  return <Navigate to="/" />
}
