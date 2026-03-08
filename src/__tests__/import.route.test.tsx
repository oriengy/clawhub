import { render } from '@testing-library/react'
import { vi } from 'vitest'

// 中国部署版：Import 路由已重定向到首页，仅测试重定向行为
const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: unknown }) => config,
  Navigate: (props: { to: string }) => {
    navigateMock(props.to)
    return null
  },
}))

describe('Import route', () => {
  beforeEach(() => {
    navigateMock.mockReset()
  })

  it('redirects to home page', async () => {
    const { Route } = await import('../routes/import')
    const Component = (Route as { component: React.ComponentType }).component
    render(<Component />)
    expect(navigateMock).toHaveBeenCalledWith('/')
  })
})
