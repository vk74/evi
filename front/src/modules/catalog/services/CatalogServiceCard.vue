<!--
version: 1.1.0
Frontend file for catalog service card component.
Displays service information in a card format.
File: CatalogServiceCard.vue
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CatalogService } from './types.services';
import { PhCube } from '@phosphor-icons/vue'

// ==================== PROPS ====================
interface Props {
  service: CatalogService;
  cardColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  cardColor: '#F5F5F5'
});
const emit = defineEmits<{ (e: 'select', serviceId: string): void }>()

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
    class="service-card"
    :style="cardStyle"
    elevation="2"
    hover
    @click="emit('select', props.service.id)"
  >
    <v-card-title class="d-flex align-center">
      <component
        :is="getPhosphorIcon(service.icon)"
        v-if="service.icon && getPhosphorIcon(service.icon)"
        size="24"
        weight="regular"
        color="rgb(20, 184, 166)"
        class="me-3"
      />
      <PhCube v-else :size="24" color="teal" class="me-3" />
      <div class="flex-grow-1">
        <div class="text-h6">
          {{ service.name }}
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <p class="text-body-2 mb-3">
        {{ service.description }}
      </p>

      <!-- Owner info -->
      <div class="mt-3">
        <div class="text-caption text-grey">
          Владелец: {{ service.owner }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.service-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: var(--card-bg, #F5F5F5) !important;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 0, 0, 0.24);
  background-color: var(--card-bg-hover, #ECECEC) !important;
}

.service-card .v-card-title {
  padding-bottom: 8px;
}

.service-card .v-card-text {
  flex-grow: 1;
  padding-top: 0;
}
</style> 