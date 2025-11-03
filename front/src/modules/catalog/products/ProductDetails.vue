<!--
version: 1.6.1
Frontend file for product details view component.
Displays extended info and placeholders for product options.
File: ProductDetails.vue

Changes in v1.5.0:
- Moved product name from header to "main" block
- Removed separate header section with product name and divider
- Replaced "Main" block title with product name (black, bold, larger font size)

Changes in v1.6.0:
- Added sections (description and main options) with tab-like navigation
- Moved long_description from description block to "description" section
- Moved product options table to "main options" section
- Removed "Product options" header
- Removed long_description from description block (short_description remains)

Changes in v1.6.1:
- Changed default section from 'description' to 'main-options'
- Product card now opens with options table section by default
-->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CatalogProductDetails } from './types.products'
import { fetchProductDetails } from './service.fetch.product.details'
import { fetchProductOptions } from './service.fetch.product.options'
import type { CatalogProductOption } from './types.products'
import ProductOptionsTable from './ProductOptionsTable.vue'
import { PhCaretUpDown, PhSquare, PhMicrosoftExcelLogo } from '@phosphor-icons/vue'

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
const optionsTableRef = ref<any>(null)
const selectedSection = ref<'description' | 'main-options'>('main-options')

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

async function loadOptions() {
  try {
    options.value = await fetchProductOptions(props.productId)
  } catch (e) {
    // errors are handled in service
    options.value = []
  }
}

onMounted(() => { 
  loadDetails()
  loadOptions() 
})
watch(() => props.productId, () => { 
  loadDetails()
  loadOptions() 
})
</script>

<template>
  <div class="product-details" :style="detailsStyle">
    <!-- Main + Sidebar layout -->
    <div class="main-with-sidebar">
      <!-- Left main content -->
      <div>
        <!-- Photo + primary info layout -->
        <div class="top-grid">
        <!-- 4:3 photo placeholder -->
        <div class="photo-placeholder">
          <div class="photo-box">
            <span class="photo-text">{{ t('catalog.productDetails.productPhoto') }}</span>
          </div>
        </div>
 
        <!-- Right column: main + description stacked -->
        <div class="right-column">
          <div class="detail-block">
            <div class="product-name-title">
              {{ details?.name }}
            </div>
            <div class="block-body">
              <div>{{ t('catalog.productDetails.productCode') }}: {{ details?.product_code || t('catalog.productDetails.notSpecified') }}</div>
              <div>{{ t('catalog.productDetails.status') }}: {{ details?.status === 'published' ? t('catalog.productDetails.published') : t('catalog.productDetails.draft') }}</div>
              <div>{{ t('catalog.productDetails.createdAt') }}: {{ details?.created_at }}</div>
            </div>
          </div>
 
          <div class="detail-block">
            <div class="block-body">
              <div v-if="details?.short_description">
                {{ details.short_description }}
              </div>
            </div>
          </div>
          
          <div class="inline-row">
            <div class="detail-block control-col">
              <div class="block-body">
                <div class="d-flex align-center" style="gap: 8px;">
                  <span class="me-2">{{ t('catalog.productDetails.options.headers.unitsCount') }}</span>
                  <v-select
                    :items="Array.from({ length: 1000 }, (_, i) => i + 1)"
                    :model-value="1"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="units-vselect"
                    style="max-width: 120px"
                  >
                    <template #append-inner>
                      <PhCaretUpDown class="dropdown-icon" />
                    </template>
                  </v-select>
                </div>
              </div>
            </div>
 
            <div class="detail-block control-col">
              <div class="block-body">
                <div class="d-flex align-center" style="gap: 8px;">
                  <span class="me-2">{{ t('catalog.productDetails.unitPrice') }}</span>
                  <v-text-field
                    model-value="1 000 €"
                    density="compact"
                    variant="outlined"
                    readonly
                    hide-details
                    class="price-field"
                    style="max-width: 120px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
 
        </div>

        <!-- Other details blocks -->
        <div class="details-grid">
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

        <!-- Sections area -->
        <div class="product-sections mt-6">
          <div class="sections-nav">
            <v-btn
              :class="[
                'section-btn',
                { 'section-active': selectedSection === 'description' }
              ]"
              variant="text"
              @click="selectedSection = 'description'"
            >
              {{ t('catalog.productDetails.description') }}
            </v-btn>
            <v-btn
              :class="[
                'section-btn',
                { 'section-active': selectedSection === 'main-options' }
              ]"
              variant="text"
              @click="selectedSection = 'main-options'"
            >
              {{ t('catalog.productDetails.mainOptions') }}
            </v-btn>
          </div>
          
          <div class="section-content">
            <!-- Description section -->
            <div v-if="selectedSection === 'description'">
              <div v-if="details?.long_description">
                {{ details.long_description }}
              </div>
              <div v-else class="text-grey">
                {{ t('catalog.productDetails.noLongDescription') }}
              </div>
            </div>
            
            <!-- Main options section -->
            <div v-if="selectedSection === 'main-options'">
              <ProductOptionsTable ref="optionsTableRef" :items="options" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="pd-sidebar">
        <div class="pd-sidebar-content">
          <!-- Top: totals -->
          <div class="pd-sidebar-top">
            <div class="detail-block">
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.products') }}</span>
                <v-text-field model-value="1 000 €" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.optionsTotal') }}</span>
                <v-text-field model-value="0 €" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.vat') }}</span>
                <v-text-field model-value="0 €" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
            <div class="detail-block">
              <div class="block-body d-flex align-center" style="gap: 8px;">
                <span class="me-2">{{ t('catalog.productDetails.total') }}</span>
                <v-text-field model-value="1 000 000 000 $" density="compact" variant="outlined" readonly hide-details class="sidebar-price-field" />
              </div>
            </div>
          </div>

          <!-- Divider -->
          <v-divider class="sidebar-divider" />

          <!-- Bottom: actions -->
          <div class="pd-sidebar-actions">
            <v-btn block variant="outlined" color="grey" class="mb-3" :prepend-icon="undefined" @click="optionsTableRef?.clearSelections && optionsTableRef.clearSelections()">
              <template #prepend>
                <PhSquare :size="16" color="grey" />
              </template>
              {{ t('catalog.productDetails.clearOptions') }}
            </v-btn>
            <v-btn block variant="outlined" color="teal" :prepend-icon="undefined">
              <template #prepend>
                <PhMicrosoftExcelLogo :size="20" color="teal" />
              </template>
              {{ t('catalog.productDetails.createEstimation') }}
            </v-btn>
          </div>
        </div>
      </div>
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
.main-with-sidebar { display: grid; grid-template-columns: 1fr calc(20% + 20px); gap: 16px; }
.pd-sidebar { display: flex; border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); padding-left: 16px; padding-right: 16px; }
.pd-sidebar-content { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-height: 100%; }
.pd-sidebar-top { display: flex; flex-direction: column; gap: 12px; }
.sidebar-divider { margin-top: 16px; }
.pd-sidebar-actions { display: flex; flex-direction: column; margin-top: auto; }
.sidebar-price-field { width: 125px; flex-shrink: 0; }
.top-grid { display: grid; grid-template-columns: minmax(260px, 360px) 1fr; gap: 16px; }
.photo-placeholder { width: 100%; }
.photo-box { 
  background: #fff; 
  border: 2px dashed rgba(0, 150, 136, 0.4);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #009688;
  aspect-ratio: 4 / 3;
}
.photo-text { font-weight: 500; }
.right-column { display: flex; flex-direction: column; gap: 16px; }
.details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.detail-block { background: #fff; border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 12px; }
.block-title { font-weight: 600; margin-bottom: 8px; color: rgb(59, 130, 246); }
.product-name-title { font-weight: 700; margin-bottom: 8px; color: #009688; font-size: 1.43rem; }
.product-sections { background: #fff; border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 12px; }
.sections-nav {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}
.section-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  text-transform: none;
  font-weight: 400;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
  background-color: transparent !important;
  transition: background-color 0.15s ease;
  padding: 0 16px;
}
.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}
.section-btn:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
.section-content {
  min-height: 200px;
}
 
.inline-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.units-vselect :deep(.v-field) { border-radius: 6px; }
.units-vselect { position: relative; }
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.price-field :deep(.v-field) { border-radius: 6px; }
   
 @media (max-width: 720px) {
   .top-grid { grid-template-columns: 1fr; }
   .main-with-sidebar { grid-template-columns: 1fr; }
   .pd-sidebar { display: none; }
   .inline-row { grid-template-columns: 1fr; }
 }
</style>
