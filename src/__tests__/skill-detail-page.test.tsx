import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SkillDetailPage } from '../components/SkillDetailPage'

const navigateMock = vi.fn()
const useAuthStatusMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

const useQueryMock = vi.fn()
const getReadmeMock = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
  useMutation: () => vi.fn(),
  useAction: () => getReadmeMock,
}))

vi.mock('../lib/useAuthStatus', () => ({
  useAuthStatus: () => useAuthStatusMock(),
}))

describe('SkillDetailPage', () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    getReadmeMock.mockReset()
    navigateMock.mockReset()
    useAuthStatusMock.mockReset()
    getReadmeMock.mockResolvedValue({ text: '' })
    useAuthStatusMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      me: null,
    })
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      return undefined
    })
  })

  it('shows a loading indicator while loading', () => {
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      return undefined
    })

    render(<SkillDetailPage slug="weather" />)
    expect(screen.getByText(/加载技能中/)).toBeTruthy()
    expect(screen.queryByText(/技能未找到/)).toBeNull()
  })

  it('shows not found when skill query resolves to null', async () => {
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      return null
    })

    render(<SkillDetailPage slug="missing-skill" />)
    expect(await screen.findByText(/技能未找到/)).toBeTruthy()
  })

  it('redirects legacy routes to canonical owner/slug', async () => {
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      if (args && typeof args === 'object' && 'skillId' in args) return []
      return {
        skill: {
          _id: 'skills:1',
          slug: 'weather',
          displayName: 'Weather',
          summary: 'Get current weather.',
          ownerUserId: 'users:1',
          tags: {},
          stats: { stars: 0, downloads: 0 },
        },
        owner: { handle: 'steipete', name: 'Peter' },
        latestVersion: { _id: 'skillVersions:1', version: '1.0.0', parsed: {} },
      }
    })

    render(<SkillDetailPage slug="weather" redirectToCanonical />)
    expect(screen.getByText(/加载技能中/)).toBeTruthy()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled()
    })
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/$owner/$slug',
      params: { owner: 'steipete', slug: 'weather' },
      replace: true,
    })
  })

  it('opens report dialog for authenticated users', async () => {
    useAuthStatusMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      me: { _id: 'users:1', role: 'user' },
    })
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      if (args && typeof args === 'object' && 'skillId' in args) return []
      if (args && typeof args === 'object' && 'slug' in args) {
        return {
          skill: {
            _id: 'skills:1',
            slug: 'weather',
            displayName: 'Weather',
            summary: 'Get current weather.',
            ownerUserId: 'users:1',
            tags: {},
            stats: { stars: 0, downloads: 0 },
          },
          owner: { handle: 'steipete', name: 'Peter' },
          latestVersion: { _id: 'skillVersions:1', version: '1.0.0', parsed: {}, files: [] },
        }
      }
      return undefined
    })

    render(<SkillDetailPage slug="weather" />)

    expect(
      (
        await screen.findAllByText(
          /free to use, modify, and redistribute\. no attribution required\./i,
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/举报需要填写原因。滥用举报可能导致封号。/)).toBeNull()

    fireEvent.click(await screen.findByRole('button', { name: /举报/ }))

    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByText(/举报技能/)).toBeTruthy()
  })

  it('defers compare version query until compare tab is requested', async () => {
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      if (args && typeof args === 'object' && 'limit' in args) {
        return []
      }
      if (args && typeof args === 'object' && 'skillId' in args) return []
      if (args && typeof args === 'object' && 'slug' in args) {
        return {
          skill: {
            _id: 'skills:1',
            slug: 'weather',
            displayName: 'Weather',
            summary: 'Get current weather.',
            ownerUserId: 'users:1',
            tags: {},
            stats: { stars: 0, downloads: 0 },
          },
          owner: { handle: 'steipete', name: 'Peter' },
          latestVersion: { _id: 'skillVersions:1', version: '1.0.0', parsed: {}, files: [] },
        }
      }
      return undefined
    })

    render(<SkillDetailPage slug="weather" />)
    expect(await screen.findByText('Weather')).toBeTruthy()

    expect(
      useQueryMock.mock.calls.some(
        ([, args]: [unknown, unknown]) =>
          typeof args === 'object' &&
          args !== null &&
          'limit' in args &&
          (args as { limit: number }).limit === 200,
      ),
    ).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: /对比/ }))

    await waitFor(() => {
      expect(
        useQueryMock.mock.calls.some(
          ([, args]: [unknown, unknown]) =>
            typeof args === 'object' &&
            args !== null &&
            'limit' in args &&
            (args as { limit: number }).limit === 200,
        ),
      ).toBe(true)
    })
  })
})
