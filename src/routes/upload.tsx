import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/upload')({
  component: UploadRedirect,
})

// 中国部署版：Upload 需要登录，直接重定向到首页
function UploadRedirect() {
  return <Navigate to="/" />
}
