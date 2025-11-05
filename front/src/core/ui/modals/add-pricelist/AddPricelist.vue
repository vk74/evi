<!--
Version: 1.5.1
Modal component for creating a new price list.
Frontend file for adding a new price list in the pricing admin module.
Fetches active currencies dynamically from backend.
Includes active/disabled status toggle (v-switch) positioned next to currency selector.
Filename: AddPricelist.vue

Changes in v1.5.1:
- Added validation to ensure selected currency is in the list of active currencies
- Protection against race conditions where currency was disabled after loading
-->
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCaretUpDown } from '@phosphor-icons/vue'
import { fetchCurrenciesService } from '@/modules/admin/pricing/currencies/service.fetch.currencies'
import type { Currency } from '@/modules/admin/pricing/types.pricing.admin'

// Props
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [data: { name: string; currency: string; isActive: boolean }]
}>()

// Translations
const { t } = useI18n()

// Form state
const priceListName = ref<string>('')
const selectedCurrency = ref<string>('USD')
const isActive = ref<boolean>(false)

// Currency options - loaded dynamically from backend
const currencyOptions = ref<Array<{ title: string; value: string }>>([])
const isLoadingCurrencies = ref(false)

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
  isActive.value = false
}

// Handle create action
const handleCreate = () => {
  // Validate that selected currency is in the list of active currencies
  const activeCurrencyCodes = currencyOptions.value.map(item => item.value)
  if (!activeCurrencyCodes.includes(selectedCurrency.value)) {
    // Validation error - invalid or inactive currency
    // This protects against race conditions where currency was disabled after loading
    return
  }

  emit('create', {
    name: priceListName.value,
    currency: selectedCurrency.value,
    isActive: isActive.value
  })
  dialogModel.value = false
}

// Handle cancel action
const handleCancel = () => {
  dialogModel.value = false
}

// Fetch active currencies on component mount
onMounted(async () => {
  // Fetch currencies
  try {
    isLoadingCurrencies.value = true
    const currencies = await fetchCurrenciesService(true) // activeOnly = true
    currencyOptions.value = currencies.map((c: Currency) => ({
      title: `${c.code}${c.symbol ? ' (' + c.symbol + ')' : ''}`,
      value: c.code
    }))
    // Set first currency as default if available
    if (currencyOptions.value.length > 0) {
      selectedCurrency.value = currencyOptions.value[0].value
    }
  } catch (error) {
    console.error('Failed to load currencies:', error)
    // Fallback to hardcoded options on error
    currencyOptions.value = [
      { title: 'USD', value: 'USD' },
      { title: 'EUR', value: 'EUR' },
      { title: 'GBP', value: 'GBP' }
    ]
  } finally {
    isLoadingCurrencies.value = false
  }
})
</script>

<template>
  <v-dialog
    v-model="dialogModel"
    max-width="650"
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

        <!-- Currency and Status row -->
        <div class="d-flex align-center mb-2" style="gap: 24px;">
          <!-- Currency selector -->
          <div style="width: 140px;">
            <v-select
              v-model="selectedCurrency"
              :items="currencyOptions"
              :loading="isLoadingCurrencies"
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

          <!-- Status toggle -->
          <div>
            <v-switch
              v-model="isActive"
              color="teal-darken-2"
              label="active"
              hide-details
            />
          </div>
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

</style>

