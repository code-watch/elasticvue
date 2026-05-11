<template>
  <div>
    <q-icon name="warning" color="negative" size="sm" v-if="allocationDisabled" />
    <q-toggle
      v-if="loaded"
      :model-value="!allocationDisabled"
      :label="t('shards.shards_table.allocation.label')"
      :color="allocationDisabled ? 'negative' : 'primary'"
      :disable="loading"
      class="q-mr-md"
      keep-color
      @update:model-value="toggleAllocation"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useElasticsearchAdapter } from '../../composables/CallElasticsearch'
import { useTranslation } from '../../composables/i18n'
import { useSnackbar } from '../../composables/Snackbar'

const t = useTranslation()
const { requestState, loading, callElasticsearch } = useElasticsearchAdapter()
const { showSnackbar } = useSnackbar()

const loaded = ref(false)
const allocationDisabled = ref(false)

const loadAllocationState = async () => {
  try {
    const settings = await callElasticsearch('clusterGetSettings')
    const allocationSetting =
      settings?.persistent?.cluster?.routing?.allocation?.enable ||
      settings?.transient?.cluster?.routing?.allocation?.enable ||
      'all'
    allocationDisabled.value = allocationSetting === 'none'
    loaded.value = true
  } catch (_e) {}
}

const toggleAllocation = async (newEnabled: boolean) => {
  if (
    !confirm(
      newEnabled ? t('shards.shards_table.allocation.enable_confirm') : t('shards.shards_table.allocation.disable_confirm')
    )
  )
    return

  const body = {
    persistent: {
      'cluster.routing.allocation.enable': newEnabled ? 'all' : 'none'
    }
  }

  try {
    await callElasticsearch('clusterPutSettings', body)
    allocationDisabled.value = !newEnabled
    showSnackbar(requestState.value, {
      body: newEnabled ? t('shards.shards_table.allocation.enable_growl') : t('shards.shards_table.allocation.disable_growl')
    })
  } catch (_e) {
    showSnackbar(requestState.value)
  }
}

onMounted(loadAllocationState)
</script>
