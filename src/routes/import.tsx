import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/import')({
  component: ImportRedirect,
})

// 中国部署版：Import 需要登录，直接重定向到首页
function ImportRedirect() {
  return <Navigate to="/" />
}
