<!--
version: 1.2.0
Frontend file for catalog product card component.
Displays product information in a card format with light blue theme and camera icon.
File: CatalogProductCard.vue
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
    <v-card-title class="d-flex align-center">
      <PhCamera
        size="24"
        weight="regular"
        color="rgb(59, 130, 246)"
        class="me-3"
      />
      <div class="flex-grow-1">
        <div class="text-h6">
          {{ product.name }}
        </div>
        <div class="text-caption text-grey">
          {{ product.product_code || 'Без кода' }}
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <p class="text-body-2 mb-3">
        {{ product.description || 'Описание отсутствует' }}
      </p>

      <!-- Product-specific info -->
      <div class="mt-3">
        <div class="text-caption text-grey">
          Статус: {{ product.status === 'published' ? 'Опубликован' : 'Черновик' }}
        </div>
        <div class="text-caption text-grey">
          Создан: {{ new Date(product.created_at).toLocaleDateString('ru-RU') }}
        </div>
      </div>
    </v-card-text>
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

.product-card .v-card-title {
  padding-bottom: 8px;
}

.product-card .v-card-text {
  flex-grow: 1;
  padding-top: 0;
}
</style> 