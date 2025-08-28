<!--
version: 1.0.0
Frontend file for catalog service card component.
Displays service information in a card format.
File: CatalogServiceCard.vue
-->
<script setup lang="ts">
import { ref } from 'vue';
import type { CatalogService } from './types.services';
import { PhCube } from '@phosphor-icons/vue'

// ==================== PROPS ====================
interface Props {
  service: CatalogService;
}

const props = defineProps<Props>();
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
</script>

<template>
  <v-card
    class="service-card"
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: rgb(242, 242, 242);
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 0, 0, 0.24);
}

.service-card .v-card-title {
  padding-bottom: 8px;
}

.service-card .v-card-text {
  flex-grow: 1;
  padding-top: 0;
}
</style> 