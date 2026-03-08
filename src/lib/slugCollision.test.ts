import { describe, expect, it } from 'vitest'
import { getPublicSlugCollision } from './slugCollision'

describe('getPublicSlugCollision', () => {
  it('returns null when availability result is missing', () => {
    expect(
      getPublicSlugCollision({
        isSoulMode: false,
        slug: 'demo',
        result: undefined,
      }),
    ).toBeNull()
  })

  it('returns null when slug is available', () => {
    expect(
      getPublicSlugCollision({
        isSoulMode: false,
        slug: 'demo',
        result: {
          available: true,
          reason: 'available',
          message: null,
          url: null,
        },
      }),
    ).toBeNull()
  })

  it('returns collision with link when query reports unavailable with URL', () => {
    expect(
      getPublicSlugCollision({
        isSoulMode: false,
        slug: 'demo',
        result: {
          available: false,
          reason: 'taken',
          message: '标识已被占用。请选择其他标识。',
          url: '/alice/demo',
        },
      }),
    ).toEqual({
      message: '标识已被占用。请选择其他标识。',
      url: '/alice/demo',
    })
  })

  it('returns generic collision message when backend message is empty', () => {
    expect(
      getPublicSlugCollision({
        isSoulMode: false,
        slug: 'demo',
        result: {
          available: false,
          reason: 'reserved',
          message: '   ',
          url: null,
        },
      }),
    ).toEqual({
      message: '标识已被占用。请选择其他标识。',
      url: null,
    })
  })
})
