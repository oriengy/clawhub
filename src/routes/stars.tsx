import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/stars')({
  component: StarsRedirect,
})

// 中国部署版：Stars 需要登录，直接重定向到首页
function StarsRedirect() {
  return <Navigate to="/" />
}
