<!--
version: 1.1.0
Frontend file for catalog product card component.
Displays product information in a card format with light blue theme and camera icon.
File: CatalogProductCard.vue
-->
<script setup lang="ts">
import { ref } from 'vue';
import type { CatalogProduct } from './types.products';
import { PhCamera } from '@phosphor-icons/vue'

// ==================== PROPS ====================
interface Props {
  product: CatalogProduct;
}

const props = defineProps<Props>();
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
</script>

<template>
  <v-card
    class="product-card"
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: rgb(240, 248, 255); /* Light blue background */
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); /* Blue shadow */
  border-color: rgba(59, 130, 246, 0.3); /* Blue border */
}

.product-card .v-card-title {
  padding-bottom: 8px;
}

.product-card .v-card-text {
  flex-grow: 1;
  padding-top: 0;
}
</style> 