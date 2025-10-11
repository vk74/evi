<!--
version: 1.1.0
Frontend file for product details view component.
Displays extended info and placeholders for product options.
File: ProductDetails.vue
-->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CatalogProductDetails } from './types.products'
import { fetchProductDetails } from './service.fetch.product.details'
import { PhCamera } from '@phosphor-icons/vue'
import { fetchProductOptions } from './service.fetch.product.options'
import type { CatalogProductOption } from './types.products'
import ProductOptionsTable from './ProductOptionsTable.vue'

// Props (MVP): accept productId from parent context/navigation state
interface Props { 
  productId: string
  cardColor?: string
}
const props = withDefaults(defineProps<Props>(), {
  cardColor: '#E8F4F8'
})

// Local state
const details = ref<CatalogProductDetails | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const options = ref<CatalogProductOption[]>([])

// i18n
const { t } = useI18n()

// Computed properties for visibility
const hasTechSpecs = computed(() => {
  if (!details.value) return false
  return details.value.tech_specs && Object.keys(details.value.tech_specs).length > 0
})

const hasAreaSpecifics = computed(() => {
  if (!details.value) return false
  return details.value.area_specifics && Object.keys(details.value.area_specifics).length > 0
})

const hasIndustrySpecifics = computed(() => {
  if (!details.value) return false
  return details.value.industry_specifics && Object.keys(details.value.industry_specifics).length > 0
})

const hasKeyFeatures = computed(() => {
  if (!details.value) return false
  return details.value.key_features && Object.keys(details.value.key_features).length > 0
})

const hasProductOverview = computed(() => {
  if (!details.value) return false
  return details.value.product_overview && Object.keys(details.value.product_overview).length > 0
})

// Computed property for details card styling
const detailsStyle = computed(() => ({
  '--details-bg': props.cardColor
}))

// Phosphor icons support
const phosphorIcons = ref<Record<string, any>>({})
const loadPhosphorIcons = async () => {
  if (Object.keys(phosphorIcons.value).length > 0) return
  try { const icons = await import('@phosphor-icons/vue'); phosphorIcons.value = icons } catch (e) { }
}
const getPhosphorIcon = (iconName: string | null) => {
  if (!iconName || !phosphorIcons.value[iconName]) return null
  return phosphorIcons.value[iconName]
}

async function loadDetails() {
  try {
    loading.value = true
    error.value = null
    details.value = await fetchProductDetails(props.productId) 
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    error.value = msg
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadPhosphorIcons(); loadDetails() })
watch(() => props.productId, () => { loadDetails(); loadOptions() })

async function loadOptions() {
  try {
    options.value = await fetchProductOptions(props.productId)
  } catch (e) {
    // errors are handled in service
    options.value = []
  }
}

onMounted(() => { loadOptions() })
</script>

<template>
  <div class="product-details" :style="detailsStyle">
    <!-- Header -->
    <div class="header d-flex align-center mb-4">
      <PhCamera
        size="28"
        weight="regular"
        color="rgb(59, 130, 246)"
        class="me-3"
      />
      <div class="text-h6">
        {{ details?.name }}
      </div>
    </div>

    <!-- Details blocks (MVP skeleton) -->
    <div class="details-grid">
      <div class="detail-block">
        <div class="block-title">
          {{ t('catalog.productDetails.main') }}
        </div>
        <div class="block-body">
          <div>{{ t('catalog.productDetails.productCode') }}: {{ details?.product_code || 'Не указан' }}</div>
          <div>{{ t('catalog.productDetails.status') }}: {{ details?.status === 'published' ? t('catalog.productDetails.published') : 'Черновик' }}</div>
          <div>{{ t('catalog.productDetails.createdAt') }}: {{ details?.created_at }}</div>
        </div>
      </div>

      <div class="detail-block">
        <div class="block-title">
          {{ t('catalog.productDetails.description') }}
        </div>
        <div class="block-body">
          <div v-if="details?.short_description" class="mb-2">
            {{ t('catalog.productDetails.shortDescription') }}: {{ details.short_description }}
          </div>
          <div v-if="details?.long_description">
            {{ t('catalog.productDetails.longDescription') }}: {{ details.long_description }}
          </div>
        </div>
      </div>

      <div v-if="hasTechSpecs" class="detail-block">
        <div class="block-title">
          {{ t('catalog.productDetails.techSpecs') }}
        </div>
        <div class="block-body">
          <pre>{{ JSON.stringify(details?.tech_specs, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="hasAreaSpecifics" class="detail-block">
        <div class="block-title">
          {{ t('catalog.productDetails.areaSpecifics') }}
        </div>
        <div class="block-body">
          <pre>{{ JSON.stringify(details?.area_specifics, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="hasIndustrySpecifics" class="detail-block">
        <div class="block-title">
          {{ t('catalog.productDetails.industrySpecifics') }}
        </div>
        <div class="block-body">
          <pre>{{ JSON.stringify(details?.industry_specifics, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="hasKeyFeatures" class="detail-block">
        <div class="block-title">
          {{ t('catalog.productDetails.keyFeatures') }}
        </div>
        <div class="block-body">
          <pre>{{ JSON.stringify(details?.key_features, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="hasProductOverview" class="detail-block">
        <div class="block-title">
          {{ t('catalog.productDetails.productOverview') }}
        </div>
        <div class="block-body">
          <pre>{{ JSON.stringify(details?.product_overview, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- Product options area -->
    <div class="product-options mt-6">
      <div class="text-subtitle-1 mb-2">
        {{ t('catalog.productDetails.productOptions') }}
      </div>
      <ProductOptionsTable :items="options" />
    </div>
  </div>
</template>

<style scoped>
.product-details {
  padding: 16px;
  background-color: var(--details-bg, #E8F4F8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
}
.details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.detail-block { background: #fff; border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 12px; }
.block-title { font-weight: 600; margin-bottom: 8px; color: rgb(59, 130, 246); }
.product-options { background: #fff; border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 12px; }
</style>
