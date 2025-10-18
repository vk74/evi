<!--
Version: 1.1.0
Modal component for creating a new price list.
Frontend file for adding a new price list in the pricing admin module.
Filename: AddPricelist.vue
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhCaretUpDown } from '@phosphor-icons/vue'

// Props
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [data: { name: string; currency: string; type: string }]
}>()

// Form state
const priceListName = ref<string>('')
const selectedCurrency = ref<string>('USD')
const priceListType = ref<'products' | 'services' | 'universal'>('universal')

// Currency options
const currencyOptions = [
  { title: 'USD', value: 'USD' },
  { title: 'EUR', value: 'EUR' },
  { title: 'GBP', value: 'GBP' }
]

// Local dialog state
const dialogModel = ref(props.modelValue)

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  dialogModel.value = newVal
})

// Watch for internal changes
watch(dialogModel, (newVal) => {
  emit('update:modelValue', newVal)
  // Reset form when dialog closes
  if (!newVal) {
    resetForm()
  }
})

// Reset form to initial state
const resetForm = () => {
  priceListName.value = ''
  selectedCurrency.value = 'USD'
  priceListType.value = 'universal'
}

// Handle create action
const handleCreate = () => {
  emit('create', {
    name: priceListName.value,
    currency: selectedCurrency.value,
    type: priceListType.value
  })
  dialogModel.value = false
}

// Handle cancel action
const handleCancel = () => {
  dialogModel.value = false
}
</script>

<template>
  <v-dialog
    v-model="dialogModel"
    max-width="500"
    persistent
    @keydown.esc="handleCancel"
  >
    <v-card>
      <v-card-title class="text-h6 px-6 pt-6 pb-4">
        add new price list
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <!-- Price list name field -->
        <div class="mb-4">
          <v-text-field
            v-model="priceListName"
            label="price list name"
            variant="outlined"
            density="comfortable"
            color="teal"
            hide-details
          />
        </div>

        <!-- Currency selector -->
        <div class="mb-4">
          <v-select
            v-model="selectedCurrency"
            :items="currencyOptions"
            label="currency"
            variant="outlined"
            density="comfortable"
            color="teal"
            hide-details
          >
            <template #append-inner>
              <PhCaretUpDown class="dropdown-icon" />
            </template>
          </v-select>
        </div>

        <!-- Price list type selector -->
        <div class="mb-2">
          <div class="text-caption text-grey-darken-1 mb-2">
            type
          </div>
          <v-btn-toggle
            v-model="priceListType"
            mandatory
            color="teal"
            class="type-toggle-group"
            density="comfortable"
          >
            <v-btn
              value="products"
              variant="outlined"
              size="small"
            >
              products
            </v-btn>
            <v-btn
              value="services"
              variant="outlined"
              size="small"
            >
              services
            </v-btn>
            <v-btn
              value="universal"
              variant="outlined"
              size="small"
            >
              universal
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-6 pt-4">
        <v-spacer />
        <v-btn
          color="grey"
          variant="outlined"
          class="text-none"
          @click="handleCancel"
        >
          CANCEL
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          class="text-none"
          @click="handleCreate"
        >
          CREATE
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Type toggle group styling */
.type-toggle-group {
  width: 100%;
}

.type-toggle-group :deep(.v-btn) {
  flex: 1;
  text-transform: lowercase;
}
</style>

