import { DEFAULT_SEARCH_PARAMS } from '../../consts'

export const search = {
  state: {
    q: DEFAULT_SEARCH_PARAMS.q,
    indices: DEFAULT_SEARCH_PARAMS.index,
    sourceInclude: '',
    filter: ''
  },
  mutations: {
    setSearchQ (state, q) {
      state.q = q
    },
    setSearchIndices (state, indices) {
      state.indices = indices
    },
    setSearchSourceInclude (state, sourceInclude) {
      state.sourceInclude = sourceInclude
    },
    setSearchFilter (state, filter) {
      state.filter = filter
    },
    resetSearch (state) {
      state.q = DEFAULT_SEARCH_PARAMS.q
      state.indices = DEFAULT_SEARCH_PARAMS.index
    }
  }
}
