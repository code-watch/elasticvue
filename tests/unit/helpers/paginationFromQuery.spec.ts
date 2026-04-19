import { describe, it, expect } from 'vitest'
import { paginationFromQuery } from '../../../src/helpers/search/paginationFromQuery'

describe('paginationFromQuery', () => {
  it('maps from/size to 1-based page (from 30, size 10 → page 4)', () => {
    expect(paginationFromQuery({ size: 10, from: 30 }, 10)).toEqual({ page: 4, rowsPerPage: 10 })
  })

  it('defaults from to 0 when missing', () => {
    expect(paginationFromQuery({ size: 10 }, 10)).toEqual({ page: 1, rowsPerPage: 10 })
  })

  it('uses fallback rowsPerPage when size missing', () => {
    expect(paginationFromQuery({ from: 30 }, 10)).toEqual({ page: 4, rowsPerPage: 10 })
  })

  it('uses query size when present', () => {
    expect(paginationFromQuery({ size: 20, from: 40 }, 10)).toEqual({ page: 3, rowsPerPage: 20 })
  })

  it('uses fallback when size invalid', () => {
    expect(paginationFromQuery({ size: 0, from: 0 }, 10)).toEqual({ page: 1, rowsPerPage: 10 })
    expect(paginationFromQuery({ size: -1, from: 0 }, 10)).toEqual({ page: 1, rowsPerPage: 10 })
  })

  it('uses default 10 when fallback not positive', () => {
    expect(paginationFromQuery({ from: 0 }, 0)).toEqual({ page: 1, rowsPerPage: 10 })
  })
})
