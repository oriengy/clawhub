import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardRedirect,
})

// 中国部署版：Dashboard 需要登录，直接重定向到首页
function DashboardRedirect() {
  return <Navigate to="/" />
}
