import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { strToU8, zipSync } from 'fflate'
import { vi } from 'vitest'

import { Upload } from '../routes/upload'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: unknown }) => config,
  useNavigate: () => vi.fn(),
  useSearch: () => ({ updateSlug: undefined }),
}))

const generateUploadUrl = vi.fn()
const publishVersion = vi.fn()
const generateChangelogPreview = vi.fn()
const fetchMock = vi.fn()
const useQueryMock = vi.fn()
const useAuthStatusMock = vi.fn()
let useActionCallCount = 0

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
  useMutation: () => generateUploadUrl,
  useAction: () => {
    useActionCallCount += 1
    return useActionCallCount % 2 === 1 ? publishVersion : generateChangelogPreview
  },
}))

vi.mock('../lib/useAuthStatus', () => ({
  useAuthStatus: () => useAuthStatusMock(),
}))

describe('Upload route', () => {
  beforeEach(() => {
    generateUploadUrl.mockReset()
    publishVersion.mockReset()
    generateChangelogPreview.mockReset()
    fetchMock.mockReset()
    useQueryMock.mockReset()
    useAuthStatusMock.mockReset()
    useActionCallCount = 0
    useAuthStatusMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      me: { _id: 'users:1' },
    })
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      return null
    })
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ storageId: 'storage-id' }),
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows validation issues before submit', async () => {
    render(<Upload />)
    const publishButton = screen.getByRole('button', { name: /发布/i })
    expect(publishButton.getAttribute('disabled')).not.toBeNull()
    expect(screen.getByText(/标识（Slug）为必填项/i)).toBeTruthy()
    expect(screen.getByText(/显示名称为必填项/i)).toBeTruthy()
  })

  it('marks the input for folder uploads', async () => {
    render(<Upload />)
    const input = screen.getByTestId('upload-input')
    await waitFor(() => {
      expect(input.getAttribute('webkitdirectory')).not.toBeNull()
    })
  })

  it('enables publish when fields and files are valid', async () => {
    generateUploadUrl.mockResolvedValue('https://upload.local')
    render(<Upload />)
    fireEvent.change(screen.getByPlaceholderText('skill-name'), {
      target: { value: 'cool-skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('我的技能'), {
      target: { value: 'Cool Skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), {
      target: { value: '1.2.3' },
    })
    fireEvent.change(screen.getByPlaceholderText('latest, stable'), {
      target: { value: 'latest' },
    })
    const file = new File(['hello'], 'SKILL.md', { type: 'text/markdown' })
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /我拥有此技能的权利，并同意以 MIT-0 许可发布/i,
      }),
    )

    const publishButton = screen.getByRole('button', { name: /发布/i }) as HTMLButtonElement
    expect(await screen.findByText(/全部检查通过/i)).toBeTruthy()
    expect(publishButton.getAttribute('disabled')).toBeNull()
  })

  it('extracts zip uploads and unwraps top-level folders', async () => {
    render(<Upload />)
    fireEvent.change(screen.getByPlaceholderText('skill-name'), {
      target: { value: 'cool-skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('我的技能'), {
      target: { value: 'Cool Skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), {
      target: { value: '1.2.3' },
    })
    fireEvent.change(screen.getByPlaceholderText('latest, stable'), {
      target: { value: 'latest' },
    })

    const zip = zipSync({
      'hetzner-cloud-skill/SKILL.md': new Uint8Array(strToU8('hello')),
      'hetzner-cloud-skill/notes.txt': new Uint8Array(strToU8('notes')),
    })
    const zipBytes = Uint8Array.from(zip).buffer
    const zipFile = new File([zipBytes], 'bundle.zip', { type: 'application/zip' })

    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [zipFile] } })
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /我拥有此技能的权利，并同意以 MIT-0 许可发布/i,
      }),
    )

    expect(await screen.findByText('notes.txt', {}, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByText('SKILL.md')).toBeTruthy()
    expect(await screen.findByText(/全部检查通过/i, {}, { timeout: 3000 })).toBeTruthy()
  })

  it('unwraps folder uploads so SKILL.md can be at the top-level', async () => {
    generateUploadUrl.mockResolvedValue('https://upload.local')
    publishVersion.mockResolvedValue(undefined)
    render(<Upload />)
    fireEvent.change(screen.getByPlaceholderText('skill-name'), {
      target: { value: 'ynab' },
    })
    fireEvent.change(screen.getByPlaceholderText('我的技能'), {
      target: { value: 'YNAB' },
    })
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), {
      target: { value: '1.0.0' },
    })
    fireEvent.change(screen.getByPlaceholderText('latest, stable'), {
      target: { value: 'latest' },
    })

    const file = new File(['hello'], 'SKILL.md', { type: 'text/markdown' })
    Object.defineProperty(file, 'webkitRelativePath', { value: 'ynab/SKILL.md' })

    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /我拥有此技能的权利，并同意以 MIT-0 许可发布/i,
      }),
    )

    expect(await screen.findByText('SKILL.md')).toBeTruthy()
    expect(await screen.findByText(/全部检查通过/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /发布/i }))
    await waitFor(() => {
      expect(
        publishVersion.mock.calls.some((call) =>
          Array.isArray((call[0] as { files?: unknown }).files),
        ),
      ).toBe(true)
    })
    const args = publishVersion.mock.calls
      .map((call) => call[0] as { files?: Array<{ path: string }> })
      .find((call) => Array.isArray(call.files))
    expect(args?.files?.[0]?.path).toBe('SKILL.md')
  })

  it('blocks non-text folder uploads (png)', async () => {
    render(<Upload />)
    fireEvent.change(screen.getByPlaceholderText('skill-name'), {
      target: { value: 'cool-skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('我的技能'), {
      target: { value: 'Cool Skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), {
      target: { value: '1.2.3' },
    })
    fireEvent.change(screen.getByPlaceholderText('latest, stable'), {
      target: { value: 'latest' },
    })

    const skill = new File(['hello'], 'SKILL.md', { type: 'text/markdown' })
    const png = new File([new Uint8Array([137, 80, 78, 71]).buffer], 'screenshot.png', {
      type: 'image/png',
    })
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [skill, png] } })

    expect(await screen.findByText('screenshot.png')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /发布/i }))
    expect(await screen.findByText(/请移除非文本文件：screenshot\.png/i)).toBeTruthy()
    expect(screen.getByText('screenshot.png')).toBeTruthy()
  })

  it('shows an informational note when mac junk files are ignored', async () => {
    render(<Upload />)
    fireEvent.change(screen.getByPlaceholderText('skill-name'), {
      target: { value: 'cool-skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('我的技能'), {
      target: { value: 'Cool Skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), {
      target: { value: '1.2.3' },
    })
    fireEvent.change(screen.getByPlaceholderText('latest, stable'), {
      target: { value: 'latest' },
    })

    const skill = new File(['hello'], 'SKILL.md', { type: 'text/markdown' })
    const junk = new File(['junk'], '.DS_Store', { type: 'application/octet-stream' })
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [skill, junk] } })
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /我拥有此技能的权利，并同意以 MIT-0 许可发布/i,
      }),
    )

    expect(await screen.findByText('SKILL.md')).toBeTruthy()
    expect(screen.queryByText('.DS_Store')).toBeNull()
    expect(await screen.findByText(/已忽略 1 个 macOS 垃圾文件/i)).toBeTruthy()
    expect(await screen.findByText(/全部检查通过/i)).toBeTruthy()
  })

  it('surfaces publish errors and stays on page', async () => {
    publishVersion.mockRejectedValueOnce(new Error('Changelog is required'))
    generateUploadUrl.mockResolvedValue('https://upload.local')
    render(<Upload />)
    fireEvent.change(screen.getByPlaceholderText('skill-name'), {
      target: { value: 'cool-skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('我的技能'), {
      target: { value: 'Cool Skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), {
      target: { value: '1.2.3' },
    })
    fireEvent.change(screen.getByPlaceholderText('latest, stable'), {
      target: { value: 'latest' },
    })
    fireEvent.change(screen.getByPlaceholderText('描述此技能的变更内容...'), {
      target: { value: 'Initial drop.' },
    })
    const file = new File(['hello'], 'SKILL.md', { type: 'text/markdown' })
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /我拥有此技能的权利，并同意以 MIT-0 许可发布/i,
      }),
    )
    const publishButton = screen.getByRole('button', { name: /发布/i }) as HTMLButtonElement
    await screen.findByText(/全部检查通过/i)
    fireEvent.click(publishButton)
    expect(await screen.findByText(/Changelog is required/i)).toBeTruthy()
  })

  it('blocks publish in preflight when slug availability reports a collision', async () => {
    useQueryMock.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === 'skip') return undefined
      if (
        args &&
        typeof args === 'object' &&
        'slug' in (args as Record<string, unknown>) &&
        (args as Record<string, unknown>).slug === 'taken-skill'
      ) {
        return {
          available: false,
          reason: 'taken',
          message: '标识已被占用。请选择其他标识。',
          url: '/alice/taken-skill',
        }
      }
      return null
    })

    render(<Upload />)
    fireEvent.change(screen.getByPlaceholderText('skill-name'), {
      target: { value: 'taken-skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('我的技能'), {
      target: { value: 'Taken Skill' },
    })
    fireEvent.change(screen.getByPlaceholderText('1.0.0'), {
      target: { value: '1.2.3' },
    })
    fireEvent.change(screen.getByPlaceholderText('latest, stable'), {
      target: { value: 'latest' },
    })
    fireEvent.change(screen.getByPlaceholderText('描述此技能的变更内容...'), {
      target: { value: 'Initial drop.' },
    })
    const file = new File(['hello'], 'SKILL.md', { type: 'text/markdown' })
    const input = screen.getByTestId('upload-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText(/标识已被占用。请选择其他标识。/)).toBeTruthy()
    expect(screen.getByRole('link', { name: '/alice/taken-skill' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /发布技能/i }).getAttribute('disabled')).not.toBeNull()
  })
})
