<!--
version: 1.5.0
Frontend file for catalog product card component.
Displays product information in a card format with light blue theme and camera icon.
File: CatalogProductCard.vue

Changes in v1.3.0:
- Removed status display (products in catalog are already published)
- Replaced "Created: date" with "Published: date" using published_at field
- Added two-column layout: photo placeholder on left, product info on right
- Added price placeholder between header and description
- Photo placeholder with 3:4 aspect ratio and camera icon

Changes in v1.4.0:
- Moved "Published: date" to left column below photo placeholder
- Changed price text to black color and increased font size by 2 points
- Removed blue camera icon from header

Changes in v1.5.0:
- Reduced photo placeholder width from 40% to 33% to give more space for description
- Added word wrapping styles for description to prevent text overflow
- Added overflow handling for product info column
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CatalogProduct } from './types.products';
import { PhCamera } from '@phosphor-icons/vue'

// ==================== PROPS ====================
interface Props {
  product: CatalogProduct;
  cardColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  cardColor: '#E8F4F8'
});
const emit = defineEmits<{ (e: 'select', productId: string): void }>()

// ==================== PHOSPHOR ICONS SUPPORT ====================
const phosphorIcons = ref<Record<string, any>>({})

const loadPhosphorIcons = async () => {
  if (Object.keys(phosphorIcons.value).length > 0) return
  try {
    const icons = await import('@phosphor-icons/vue')
    phosphorIcons.value = icons
  } catch (error) {
    
  }
}

loadPhosphorIcons()

const getPhosphorIcon = (iconName: string | null) => {
  if (!iconName || !phosphorIcons.value[iconName]) return null
  return phosphorIcons.value[iconName]
}

// ==================== COLOR HELPERS ====================
function darkenHexColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean
  const amount = Math.max(0, Math.min(100, percent)) / 100
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  const dark = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))))
  const toHex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${toHex(dark(r))}${toHex(dark(g))}${toHex(dark(b))}`
}

const cardStyle = computed(() => {
  const bgColor = props.cardColor;
  const hoverColor = darkenHexColor(bgColor, 3);
  return {
    '--card-bg': bgColor,
    '--card-bg-hover': hoverColor
  };
})
</script>

<template>
  <v-card
    class="product-card"
    :style="cardStyle"
    elevation="2"
    hover
    @click="emit('select', props.product.id)"
  >
    <div class="product-card-content">
      <!-- Left column: Photo placeholder -->
      <div class="photo-placeholder">
        <div class="photo-box">
          <PhCamera
            size="32"
            weight="regular"
            color="#009688"
          />
        </div>
        <!-- Published date below photo -->
        <div class="published-date">
          опубликовано: {{ product.published_at ? new Date(product.published_at).toLocaleDateString('ru-RU') : '—' }}
        </div>
      </div>

      <!-- Right column: Product info -->
      <div class="product-info-column">
        <v-card-title class="d-flex align-center pa-0 pb-2">
          <div class="flex-grow-1">
            <div class="text-h6">
              {{ product.name }}
            </div>
            <div class="text-caption text-grey">
              {{ product.product_code || 'Без кода' }}
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pa-0">
          <!-- Price placeholder -->
          <div class="price-placeholder mb-3">
            <span class="price-text">—</span>
          </div>

          <!-- Description -->
          <p class="description-text text-body-2 mb-3">
            {{ product.description || 'Описание отсутствует' }}
          </p>
        </v-card-text>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.product-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: var(--card-bg, #E8F4F8) !important;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  background-color: var(--card-bg-hover, #DAE9F3) !important;
}

/* Two-column layout */
.product-card-content {
  display: flex;
  gap: 16px;
  padding: 16px;
}

/* Photo placeholder - left column */
.photo-placeholder {
  flex: 0 0 33%;
  max-width: 40%;
  min-width: 30%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-box {
  background: #fff;
  border: 2px dashed rgba(0, 150, 136, 0.4);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #009688;
  aspect-ratio: 3 / 4;
  width: 100%;
}

/* Published date below photo */
.published-date {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
  white-space: nowrap;
}

/* Product info - right column */
.product-info-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.product-info-column .v-card-title {
  padding-bottom: 0;
  min-width: 0;
}

.product-info-column .v-card-text {
  flex-grow: 1;
  padding-top: 0;
  min-width: 0;
  overflow: hidden;
}

/* Description text wrapping */
.description-text {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  overflow: hidden;
  line-height: 1.5;
}

/* Price placeholder */
.price-placeholder {
  display: flex;
  align-items: center;
}

.price-text {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
}

/* Responsive: stack columns on mobile */
@media (max-width: 600px) {
  .product-card-content {
    flex-direction: column;
  }

  .photo-placeholder {
    flex: 0 0 auto;
    max-width: 100%;
    width: 100%;
  }

  .photo-box {
    aspect-ratio: 4 / 3;
  }
}
</style> 