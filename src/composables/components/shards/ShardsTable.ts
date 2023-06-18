import { useIndicesStore } from '../../../store/indices.js'
import { computed, Ref, ref, watch } from 'vue'
import { useTableColumnHover } from '../../TableColumnHover.ts'
import { useSnackbar } from '../../Snackbar.ts'
import { useElasticsearchAdapter } from '../../CallElasticsearch.ts'
import { EsShard, TableShards } from '../../../helpers/shards.ts'

export type ShardsTableProps = {
  shards: TableShards
}

export const useShardsTable = (props: ShardsTableProps, emit: any) => {
  const indicesStore = useIndicesStore()

  const filter = ref('')
  const { markedColumnIndex, markColumn, unmarkColumn } = useTableColumnHover()

  const filteredShards = computed(() => {
    const shards = Object.assign({}, props.shards)
    if (Object.keys(shards).length === 0) return shards

    if (!indicesStore.showHiddenIndices) {
      Object.assign(shards, { indexNames: shards.indexNames.filter(item => !item.match(new RegExp(indicesStore.hideIndicesRegex))) })
    }

    if (filter.value.length !== 0) {
      const query = filter.value.slice().toLowerCase().trim()
      Object.assign(shards, { indexNames: shards.indexNames.filter(item => item.includes(query)) })
    }

    return shards
  })

  const columns = computed(() => {
    const start = (pagination.value.page - 1) * pagination.value.rowsPerPage
    const end = start + pagination.value.rowsPerPage
    const slice = filteredShards.value?.indexNames?.slice(start, end) || []
    return slice.map(val => ({ label: val, name: val, field: val }))
  })

  const rowsNumber = ref(0)
  watch(filteredShards, newValue => {
    pagination.value.rowsNumber = newValue?.indexNames?.length || 0
  })

  const pagination = ref({
    sortBy: 'desc',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber
  })

  const updateTable = (requestProps: any) => {
    const { page, rowsPerPage, sortBy, descending } = requestProps.pagination

    pagination.value.page = page
    pagination.value.rowsPerPage = rowsPerPage
    pagination.value.sortBy = sortBy
    pagination.value.descending = descending
  }

  const currentReroutingShard: Ref<EsShard> = ref({} as EsShard)
  const initReroute = (shard: EsShard) => {
    if (currentReroutingShard.value.node === shard.node &&
        currentReroutingShard.value.index === shard.index &&
        currentReroutingShard.value.shard === shard.shard) {
      currentReroutingShard.value = {} as EsShard
    } else {
      currentReroutingShard.value = shard
    }
  }

  const { showSnackbar } = useSnackbar()
  const { requestState, callElasticsearch } = useElasticsearchAdapter()
  const reroute = (shardToReroute: EsShard, targetNode: string) => {
    const commands = [
      {
        move: {
          index: shardToReroute.index,
          shard: shardToReroute.shard,
          from_node: shardToReroute.node,
          to_node: targetNode
        }
      }]

    callElasticsearch('clusterReroute', commands).then(() => {
      currentReroutingShard.value = {} as EsShard
      emit('reload')
    }).catch(() => {
      showSnackbar(requestState.value)
    })
  }

  return {
    filter,
    indicesStore,
    pagination,
    columns,
    updateTable,
    markedColumnIndex,
    markColumn,
    unmarkColumn,
    currentReroutingShard,
    initReroute,
    reroute
  }
}