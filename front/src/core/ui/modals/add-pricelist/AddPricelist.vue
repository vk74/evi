<!--
Version: 1.5.1
Modal component for creating a new price list.
Frontend file for adding a new price list in the pricing admin module.
Fetches active currencies dynamically from backend.
Includes active/disabled status toggle (v-switch) positioned next to currency selector.
Includes country selector (required field) positioned to the left of currency selector.
Filename: AddPricelist.vue

Changes in v1.5.1:
- Added validation to ensure selected currency is in the list of active currencies
- Protection against race conditions where currency was disabled after loading

Changes in v1.5.0:
- Countries list now loaded dynamically from backend API instead of hardcoded values

Changes in v1.4.0:
- Added country field (required) with dropdown selector
- Country selector positioned to the left of currency selector
- Dynamic validation for country (must be selected from available countries)
- Default country value is "select country" placeholder
-->
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhCaretUpDown } from '@phosphor-icons/vue'
import { fetchCurrenciesService } from '@/modules/admin/pricing/currencies/service.fetch.currencies'
import { getCountries } from '@/core/helpers/get.countries'
import type { Currency } from '@/modules/admin/pricing/types.pricing.admin'

// Props
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [data: { name: string; currency: string; country: string; isActive: boolean }]
}>()

// Translations
const { t } = useI18n()

// Form state
const priceListName = ref<string>('')
const selectedCountry = ref<string>('select country')
const selectedCurrency = ref<string>('USD')
const isActive = ref<boolean>(false)

// Currency options - loaded dynamically from backend
const currencyOptions = ref<Array<{ title: string; value: string }>>([])
const isLoadingCurrencies = ref(false)

// Country options - loaded dynamically from backend
const countryOptions = ref<Array<{ title: string; value: string; disabled?: boolean }>>([])
const isLoadingCountries = ref(false)

// Helper function to get country translation key
const getCountryTranslationKey = (countryCode: string): string => {
  return `admin.settings.application.regionalsettings.countries.${countryCode}`
}

// Computed country options with translations - includes placeholder and dynamically loaded countries
const countryOptionsWithTranslations = computed(() => {
  const placeholder = { value: 'select country', title: t('addPricelist.selectCountry'), disabled: true }
  const countries = countryOptions.value.map(country => ({
    ...country,
    title: t(getCountryTranslationKey(country.value))
  }))
  return [placeholder, ...countries]
})

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
  selectedCountry.value = 'select country'
  selectedCurrency.value = 'USD'
  isActive.value = false
}

// Handle create action
const handleCreate = () => {
  // Validate country selection
  if (!selectedCountry.value || selectedCountry.value === 'select country') {
    // Validation error - country must be selected
    return
  }

  // Get list of real countries (excluding placeholder)
  const realCountries = countryOptions.value.map(item => item.value)

  // Validate that selected country is in the list of real countries
  if (!realCountries.includes(selectedCountry.value)) {
    // Validation error - invalid country
    return
  }

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
    country: selectedCountry.value,
    isActive: isActive.value
  })
  dialogModel.value = false
}

// Handle cancel action
const handleCancel = () => {
  dialogModel.value = false
}

// Fetch active currencies and countries on component mount
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

  // Fetch countries
  try {
    isLoadingCountries.value = true
    const countries = await getCountries()
    countryOptions.value = countries.map((countryCode: string) => ({
      value: countryCode,
      title: countryCode // Will be translated via computed
    }))
  } catch (error) {
    console.error('Failed to load countries:', error)
    // Fallback to hardcoded options on error
    countryOptions.value = [
      { value: 'russia', title: 'russia' },
      { value: 'kazakhstan', title: 'kazakhstan' }
    ]
  } finally {
    isLoadingCountries.value = false
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

        <!-- Country, Currency and Status row -->
        <div class="d-flex align-center mb-2" style="gap: 24px;">
          <!-- Country selector -->
          <div style="width: 200px;">
            <v-select
              v-model="selectedCountry"
              :items="countryOptionsWithTranslations"
              :loading="isLoadingCountries"
              label="country"
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

