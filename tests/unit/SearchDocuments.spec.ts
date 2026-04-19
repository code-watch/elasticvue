import { describe, it, expect } from 'vitest'
import { buildQueryFromTableOptions, getTableOptionsToApply } from '../../src/helpers/search/searchQueryTableOptions'

describe('SearchDocuments', () => {
  describe('buildQueryFromTableOptions', () => {
    it('returns empty object when pagination is null', () => {
      expect(buildQueryFromTableOptions(null)).toEqual({})
    })

    it('returns empty object when pagination is undefined', () => {
      expect(buildQueryFromTableOptions(undefined)).toEqual({})
    })

    it('returns from and size with empty sort when no sortBy', () => {
      const pagination = { page: 1, rowsPerPage: 10, sortBy: '', descending: false }
      expect(buildQueryFromTableOptions(pagination)).toEqual({
        from: 0,
        size: 10,
        sort: []
      })
    })

    it('computes from correctly for page 2', () => {
      const pagination = { page: 2, rowsPerPage: 10, sortBy: '', descending: false }
      expect(buildQueryFromTableOptions(pagination)).toMatchObject({ from: 10, size: 10 })
    })

    it('computes from correctly for page 3 with rowsPerPage 20', () => {
      const pagination = { page: 3, rowsPerPage: 20, sortBy: '', descending: false }
      expect(buildQueryFromTableOptions(pagination)).toMatchObject({ from: 40, size: 20 })
    })

    it('returns single sort ascending when sortBy set and descending false', () => {
      const pagination = { page: 1, rowsPerPage: 10, sortBy: 'name', descending: false }
      expect(buildQueryFromTableOptions(pagination)).toEqual({
        from: 0,
        size: 10,
        sort: [{ name: { order: 'asc' } }]
      })
    })

    it('returns single sort descending when sortBy set and descending true', () => {
      const pagination = { page: 1, rowsPerPage: 10, sortBy: 'ISODATE', descending: true }
      expect(buildQueryFromTableOptions(pagination)).toEqual({
        from: 0,
        size: 10,
        sort: [{ ISODATE: { order: 'desc' } }]
      })
    })
  })

  describe('getTableOptionsToApply (cases 1-4: pagination/sort behaviour)', () => {
    const basePagination = { page: 2, rowsPerPage: 10, sortBy: '', descending: false }
    const baseTableOptions = { from: 10, size: 10, sort: [] }

    it('case 1: initial state - no sort in query, no sortBy in table → paginate applies from/size and empty sort', () => {
      const query = { query: {}, size: 100, from: 0 }
      const result = getTableOptionsToApply(query, baseTableOptions, basePagination)
      expect(result).toEqual(baseTableOptions)
      expect((result as { sort: unknown[] }).sort).toEqual([])
    })

    it('applies full table options when query has no sort', () => {
      const query = { query: {}, size: 100, from: 0 }
      const result = getTableOptionsToApply(query, baseTableOptions, basePagination)
      expect(result).toEqual(baseTableOptions)
    })

    it('applies full table options when query.sort is missing', () => {
      const query = { query: {} }
      const result = getTableOptionsToApply(query, baseTableOptions, basePagination)
      expect(result).toEqual(baseTableOptions)
    })

    it('applies full table options when query.sort is empty array', () => {
      const query = { sort: [] }
      const result = getTableOptionsToApply(query, baseTableOptions, basePagination)
      expect(result).toEqual(baseTableOptions)
    })

    it('case 3: single manual sort, table has no sortBy → preserve', () => {
      const query = { sort: [{ ISODATE: { order: 'desc' } }] }
      const result = getTableOptionsToApply(query, baseTableOptions, basePagination)
      expect(result).toEqual({ from: 10, size: 10 })
      expect(result).not.toHaveProperty('sort')
    })

    it('preserves multi-sort: applies only size and from when query has multi sort and table has no sortBy', () => {
      const query = {
        sort: [{ ISODATE: { order: 'desc' } }, { _seq_no: { order: 'desc' } }]
      }
      const result = getTableOptionsToApply(query, baseTableOptions, basePagination)
      expect(result).toEqual({ from: 10, size: 10 })
      expect(result).not.toHaveProperty('sort')
    })

    it('issue #317: paginating to page 2 with multi-level sort in query preserves sort (only from/size applied)', () => {
      const query = {
        track_total_hits: true,
        query: { query_string: { query: '*' } },
        size: 100,
        from: 0,
        sort: [{ ISODATE: { order: 'desc' } }, { _seq_no: { order: 'desc' } }]
      }
      const paginationPage2 = { page: 2, rowsPerPage: 100, sortBy: '', descending: false }
      const tableOptions = buildQueryFromTableOptions(paginationPage2)
      const toApply = getTableOptionsToApply(query, tableOptions, paginationPage2)
      expect(toApply).toEqual({ from: 100, size: 100 })
      expect(toApply).not.toHaveProperty('sort')
      const merged = Object.assign({}, query, toApply)
      expect(merged.sort).toEqual([{ ISODATE: { order: 'desc' } }, { _seq_no: { order: 'desc' } }])
    })

    it('case 3 & 4b: manual sorts in query - preserve on paginate even when table has sortBy', () => {
      const query = {
        sort: [{ ISODATE: { order: 'desc' } }, { _seq_no: { order: 'desc' } }]
      }
      const paginationWithSort = { ...basePagination, sortBy: 'name', descending: true }
      const tableOptionsWithSort = { from: 10, size: 10, sort: [{ name: { order: 'desc' } }] }
      const result = getTableOptionsToApply(query, tableOptionsWithSort, paginationWithSort)
      expect(result).toEqual({ from: 10, size: 10 })
      expect(result).not.toHaveProperty('sort')
    })

    it('case 2: column click then paginate - query single sort matches table → keep sort', () => {
      const query = { sort: [{ name: { order: 'asc' } }] }
      const paginationWithSort = { ...basePagination, sortBy: 'name', descending: false }
      const tableOptionsWithSort = { from: 10, size: 10, sort: [{ name: { order: 'asc' } }] }
      const result = getTableOptionsToApply(query, tableOptionsWithSort, paginationWithSort)
      expect(result).toEqual(tableOptionsWithSort)
    })

    it('issue #347: second click same column toggles order (asc → desc)', () => {
      const query = { sort: [{ 'Year.keyword': { order: 'asc' } }] }
      const paginationDesc = { page: 1, rowsPerPage: 10, sortBy: 'Year.keyword', descending: true }
      const tableOptionsDesc = buildQueryFromTableOptions(paginationDesc)
      const result = getTableOptionsToApply(query, tableOptionsDesc, paginationDesc)
      expect(result).toEqual({
        from: 0,
        size: 10,
        sort: [{ 'Year.keyword': { order: 'desc' } }]
      })
    })

    it('preserves multi-field sort in one array element when paginating (table still has sortBy)', () => {
      const compound = {
        'Year.keyword': { order: 'desc' },
        'Title.keyword': { order: 'asc' }
      }
      const query = {
        query: { query_string: { query: '*' } },
        size: 10,
        from: 30,
        sort: [compound]
      }
      const pagination = { page: 4, rowsPerPage: 10, sortBy: 'Year.keyword', descending: true }
      const tableOptions = buildQueryFromTableOptions(pagination)
      const result = getTableOptionsToApply(query, tableOptions, pagination)
      expect(result).toEqual({ from: 30, size: 10 })
      expect(result).not.toHaveProperty('sort')
      expect(Object.assign({}, query, result).sort).toEqual([compound])
    })

    it('preserves string sort entries (e.g. _doc, _score) when paginating', () => {
      const query = { sort: ['_doc'], size: 10, from: 0 }
      const pagination = { page: 2, rowsPerPage: 10, sortBy: 'name', descending: false }
      const tableOptions = buildQueryFromTableOptions(pagination)
      const result = getTableOptionsToApply(query, tableOptions, pagination)
      expect(result).toEqual({ from: 10, size: 10 })
      expect(result).not.toHaveProperty('sort')
      expect(Object.assign({}, query, result).sort).toEqual(['_doc'])
    })

    it('preserves object-form sort (e.g. _script) when paginating', () => {
      const scriptSort = {
        _script: {
          type: 'number',
          script: { lang: 'painless', source: "doc['x'].value" },
          order: 'asc'
        }
      }
      const query = { sort: scriptSort, size: 10, from: 0 }
      const pagination = { page: 2, rowsPerPage: 10, sortBy: '', descending: false }
      const tableOptions = buildQueryFromTableOptions(pagination)
      const result = getTableOptionsToApply(query, tableOptions, pagination)
      expect(result).toEqual({ from: 10, size: 10 })
      expect(result).not.toHaveProperty('sort')
      expect(Object.assign({}, query, result).sort).toEqual(scriptSort)
    })

    it('case 3: single manual sort, table has different sortBy → preserve', () => {
      const query = { sort: [{ date: { order: 'asc' } }] }
      const paginationWithSort = { ...basePagination, sortBy: 'name', descending: false }
      const tableOptionsWithSort = { from: 10, size: 10, sort: [{ name: { order: 'asc' } }] }
      const result = getTableOptionsToApply(query, tableOptionsWithSort, paginationWithSort)
      expect(result).toEqual({ from: 10, size: 10 })
      expect(result).not.toHaveProperty('sort')
    })

    it('applies full table options when query.sort is not an array (invalid)', () => {
      const query = { sort: 'invalid' }
      const result = getTableOptionsToApply(query, baseTableOptions, basePagination)
      expect(result).toEqual(baseTableOptions)
    })

    it('preserves multi-sort when table sortBy is empty string', () => {
      const query = {
        sort: [{ a: { order: 'asc' } }, { b: { order: 'desc' } }, { c: { order: 'asc' } }]
      }
      const result = getTableOptionsToApply(query, baseTableOptions, { ...basePagination, sortBy: '' })
      expect(result).toEqual({ from: 10, size: 10 })
    })

    it('case 4a: column click wins - when sortBy changes, applying full tableOptions overwrites query multi-sort', () => {
      const query = {
        sort: [{ ISODATE: { order: 'desc' } }, { _seq_no: { order: 'desc' } }]
      }
      const paginationColumnClick = { page: 1, rowsPerPage: 10, sortBy: 'name', descending: true }
      const tableOptions = buildQueryFromTableOptions(paginationColumnClick)
      expect(tableOptions.sort).toEqual([{ name: { order: 'desc' } }])
      const merged = Object.assign({}, query, tableOptions)
      expect(merged.sort).toEqual([{ name: { order: 'desc' } }])
    })
  })
})
