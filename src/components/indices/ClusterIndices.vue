<template>
  <q-card>
    <q-card-section class="flex items-center">
      <h1 class="text-h5 q-my-none">
        {{ t('indices.heading') }}
      </h1>
      <reload-button :action="load" />
    </q-card-section>

    <q-separator />

    <loader-status :request-state="requestState">
      <indices-table :indices="data || []" @reload="load" />
    </loader-status>
  </q-card>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import IndicesTable from './IndicesTable.vue'
  import LoaderStatus from '../shared/LoaderStatus.vue'
  import ReloadButton from '../shared/ReloadButton.vue'
  import { useElasticsearchRequest } from '../../composables/CallElasticsearch'
  import { useTranslation } from '../../composables/i18n.ts'
  import { EsIndex } from '../../composables/components/indices/IndicesTable.ts'
  import { clusterVersionGte } from '../../helpers/minClusterVersion.ts'

  const t = useTranslation()

  type CatIndicesParams = {
    h: string,
    bytes: string,
    expand_wildcards?: string
  }

  const CAT_INDICES_PARAMS: CatIndicesParams = {
    h: 'index,health,status,uuid,pri,rep,docs.count,store.size,sc,cd',
    bytes: 'b'
  }

  if (clusterVersionGte(8)) CAT_INDICES_PARAMS.expand_wildcards = 'all'

  const { requestState, data, load } = useElasticsearchRequest<EsIndex[]>('catIndices', CAT_INDICES_PARAMS)
  onMounted(load)
</script>
