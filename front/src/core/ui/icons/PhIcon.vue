<!--
version: 1.0.0
Frontend file providing a thin wrapper over @phosphor-icons/vue components.
File: PhIcon.vue
Purpose: Render Phosphor icons by mapping existing mdi-* names to Phosphor equivalents
and avoid importing MDI or other icon fonts. Supports size/color props.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  name: string
  size?: number | string
  color?: string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
}

const props = defineProps<Props>()

const iconModule = ref<Record<string, any> | null>(null)

onMounted(async () => {
  if (!iconModule.value) {
    iconModule.value = await import('@phosphor-icons/vue')
  }
})

// Map common mdi names used in the app to Phosphor component names
const mdiToPhosphorMap: Record<string, string> = {
  'mdi-magnify': 'PhMagnifyingGlass',
  'mdi-close': 'PhX',
  'mdi-check-circle': 'PhCheckCircle',
  'mdi-minus-circle': 'PhMinusCircle',
  'mdi-image-outline': 'PhImage',
  'mdi-account-search': 'PhUserSearch',
  'mdi-palette': 'PhPaintBrush',
  'mdi-alert-circle': 'PhWarningCircle',
  'mdi-eye': 'PhEye',
  'mdi-eye-off': 'PhEyeSlash',
  'mdi-cube': 'PhCube',
  'mdi-folder': 'PhFolder',
  'mdi-folder-open': 'PhFolderOpen',
  'mdi-package-variant': 'PhPackage',
  'mdi-refresh': 'PhArrowClockwise',
  'mdi-checkbox-blank-outline': 'PhSquare',
  'mdi-checkbox-marked': 'PhCheckSquare',
  'mdi-checkbox-marked-outline': 'PhCheckSquare',
  'mdi-chevron-double-left': 'PhCaretDoubleLeft',
  'mdi-chevron-left': 'PhCaretLeft',
  'mdi-chevron-right': 'PhCaretRight',
  'mdi-chevron-double-right': 'PhCaretDoubleRight',
  'mdi-book-open-outline': 'PhBookOpen',
  'mdi-book-open-page-variant-outline': 'PhBookOpenText',
  'mdi-pencil-ruler': 'PhPencilRuler',
  'mdi-shield-outline': 'PhShield',
  'mdi-account-cog-outline': 'PhUserGear',
  'mdi-briefcase-outline': 'PhBriefcase',
  'mdi-chart-box-outline': 'PhChartBar',
  'mdi-account-clock-outline': 'PhUserClock',
  'mdi-form-textbox-password': 'PhPassword',
  'mdi-shield-key-outline': 'PhShieldCheck',
  'mdi-server': 'PhServer',
  'mdi-transit-connection-variant': 'PhShareNetwork',
  'mdi-text-box-outline': 'PhTextT',
  'mdi-account-group-outline': 'PhUsersThree',
  'mdi-account-multiple-outline': 'PhUsers',
  'mdi-chart-timeline-variant': 'PhChartLine',
  'mdi-menu': 'PhList',
  'mdi-chevron-down': 'PhCaretDown',
  'mdi-publish': 'PhUploadSimple',
  'mdi-content-save-outline': 'PhFloppyDisk',
  'mdi-account-multiple-plus-outline': 'PhUserPlus',
  'mdi-account-plus-outline': 'PhUserPlus',
  'mdi-help-circle-outline': 'PhQuestion',
  // Common app/settings/catalog icons
  'mdi-cog': 'PhGear',
  'mdi-cog-outline': 'PhGear',
  'mdi-tools': 'PhToolbox',
  'mdi-home': 'PhHouse',
  'mdi-star': 'PhStar',
  'mdi-heart': 'PhHeart',
  'mdi-file': 'PhFile',
  'mdi-image': 'PhImage',
  'mdi-book': 'PhBook',
  'mdi-account': 'PhUser',
  'mdi-calendar': 'PhCalendar',
  'mdi-clock': 'PhClock',
  'mdi-bell': 'PhBell',
  'mdi-email': 'PhEnvelope',
  'mdi-phone': 'PhPhone',
  'mdi-map-marker': 'PhMapPin',
  'mdi-car': 'PhCar',
  'mdi-airplane': 'PhAirplane',
  'mdi-train': 'PhTrain',
  'mdi-bus': 'PhBus',
  'mdi-bike': 'PhBicycle',
  'mdi-food': 'PhForkKnife',
  'mdi-cup': 'PhCoffee',
  'mdi-gift': 'PhGift',
  'mdi-shopping': 'PhShoppingBag',
  'mdi-cart': 'PhShoppingCart',
  // Added for ItemSelector controls
  'mdi-plus': 'PhPlus',
  'mdi-minus': 'PhMinus'
}

const iconComponent = computed(() => {
  const module = iconModule.value
  if (!module) return null
  const mapped = mdiToPhosphorMap[props.name]
  const phName = mapped || props.name
  return module[phName] || module['PhQuestion']
})

const sizePx = computed(() => {
  const s = props.size ?? 20
  return typeof s === 'number' ? s : parseInt(String(s), 10) || 20
})

const weight = computed(() => props.weight ?? 'regular')
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    :size="sizePx"
    :color="props.color || 'currentColor'"
    :weight="weight"
  />
</template>

<style scoped>
/* No styles */
</style>


