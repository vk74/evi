<!--
version: 1.0.0
Frontend file for service details view component.
Displays extended info and placeholders for service offerings.
File: ServiceDetails.vue
-->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CatalogServiceDetails } from './types.service.details'
import { fetchServiceDetails } from './service.fetch.service.details'

// Props (MVP): accept serviceId from parent context/navigation state
interface Props { serviceId: string }
const props = defineProps<Props>()

// Local state
const details = ref<CatalogServiceDetails | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// i18n
const { t } = useI18n()

// Phosphor icons support
const phosphorIcons = ref<Record<string, any>>({})
const loadPhosphorIcons = async () => {
  if (Object.keys(phosphorIcons.value).length > 0) return
  try { const icons = await import('@phosphor-icons/vue'); phosphorIcons.value = icons } catch (e) { console.error(e) }
}
const getPhosphorIcon = (iconName: string | null) => {
  if (!iconName || !phosphorIcons.value[iconName]) return null
  return phosphorIcons.value[iconName]
}

async function loadDetails() {
  try {
    loading.value = true
    error.value = null
    details.value = await fetchServiceDetails(props.serviceId) 
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    error.value = msg
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadPhosphorIcons(); loadDetails() })
watch(() => props.serviceId, () => { loadDetails() })
</script>

<template>
  <div class="service-details">
    <!-- Header -->
    <div class="header d-flex align-center mb-4">
      <component
        v-if="details?.icon && getPhosphorIcon(details.icon)"
        :is="getPhosphorIcon(details.icon)"
        size="28"
        weight="regular"
        color="rgb(20, 184, 166)"
        class="me-3"
      />
      <v-icon v-else size="large" color="teal" class="me-3">mdi-cube</v-icon>
      <div class="text-h6">{{ details?.name }}</div>
    </div>

    <!-- Details blocks (MVP skeleton) -->
    <div class="details-grid">
      <div class="detail-block">
        <div class="block-title">{{ t('catalog.serviceDetails.main') }}</div>
        <div class="block-body">
          <div>{{ t('catalog.serviceDetails.priority') }}: {{ details?.priority }}</div>
          <div>{{ t('catalog.serviceDetails.status') }}: {{ t('catalog.serviceDetails.inProduction') }}</div>
          <div>{{ t('catalog.serviceDetails.createdAt') }}: {{ details?.created_at }}</div>
        </div>
      </div>

      <div class="detail-block">
        <div class="block-title">{{ t('catalog.serviceDetails.roles') }}</div>
        <div class="block-body">
          <div>{{ t('catalog.serviceDetails.owner') }}: {{ details?.owner }}</div>
          <div>{{ t('catalog.serviceDetails.backupOwner') }}: {{ details?.backup_owner }}</div>
          <div>{{ t('catalog.serviceDetails.technicalOwner') }}: {{ details?.technical_owner }}</div>
          <div>{{ t('catalog.serviceDetails.backupTechnicalOwner') }}: {{ details?.backup_technical_owner }}</div>
        </div>
      </div>

      <div class="detail-block">
        <div class="block-title">{{ t('catalog.serviceDetails.supportGroups') }}</div>
        <div class="block-body">
          <div>{{ t('catalog.serviceDetails.tier1') }}: {{ details?.support_tier1 }}</div>
          <div>{{ t('catalog.serviceDetails.tier2') }}: {{ details?.support_tier2 }}</div>
          <div>{{ t('catalog.serviceDetails.tier3') }}: {{ details?.support_tier3 }}</div>
          <div>{{ t('catalog.serviceDetails.dispatcher') }}: {{ details?.dispatcher }}</div>
        </div>
      </div>

      <div class="detail-block">
        <div class="block-title">{{ t('catalog.serviceDetails.description') }}</div>
        <div class="block-body">
          <div class="mb-2">{{ t('catalog.serviceDetails.purpose') }}: {{ details?.purpose }}</div>
          <div>{{ t('catalog.serviceDetails.longDescription') }}: {{ details?.description_long }}</div>
        </div>
      </div>
    </div>

    <!-- Offerings area -->
    <div class="offerings mt-6">
      <div class="text-subtitle-1 mb-2">{{ t('catalog.serviceDetails.offerings') }}</div>
      <div class="text-body-2 text-grey">{{ t('catalog.serviceDetails.offeringsEmpty') }}</div>
    </div>
  </div>
</template>

<style scoped>
.service-details { padding: 16px; }
.details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.detail-block { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 12px; }
.block-title { font-weight: 600; margin-bottom: 8px; }
</style>


