/**
 * LocationSelectionModal.vue
 * Version: 1.2.0
 * Modal dialog for user country selection.
 * Frontend file that allows users to select and save their country location.
 * Modal cannot be closed if user has no saved country in DB.
 * 
 * Features:
 * - Country dropdown populated from getCountries() helper
 * - Loads current country from DB on open
 * - Persistent modal when user has no saved country
 * - Save functionality with API call
 * - Error handling and user feedback
 * 
 * Changes in v1.1.0:
 * - Added loading current country from DB on modal open
 * - Modal cannot be closed if original country is null and not saved
 * - Close button always visible but disabled when no saved country
 * 
 * Changes in v1.2.0:
 * - Reduced modal width by 30% (from 500px to 350px)
 * - Added caret icon to country dropdown
 */

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { getCountries } from '@/core/helpers/get.countries';
import { getUserCountry } from '@/core/services/service.get.user.country';
import { api } from '@/core/api/service.axios';
import { PhCaretUpDown } from '@phosphor-icons/vue';

// Init i18n and stores
const { t } = useI18n();
const uiStore = useUiStore();
const userStore = useUserAuthStore();

// Component props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Component emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Form state
const selectedCountry = ref<string>('select country');
const originalCountry = ref<string | null>(null); // Saved country from DB
const countries = ref<string[]>([]);
const loading = ref(false);
const loadingCountries = ref(false);
const loadingUserCountry = ref(false);
const error = ref<string>('');
const defaultOption = 'select country';
const countrySaved = ref<boolean>(false); // Flag that country was saved in this session

// Computed properties
const isCountrySelected = computed(() => {
  return selectedCountry.value !== '' && selectedCountry.value !== defaultOption;
});

// Check if user has saved country (from DB or saved in this session)
const hasSavedCountry = computed(() => {
  return originalCountry.value !== null || countrySaved.value;
});

// Modal can be closed only if user has saved country
const isModalPersistent = computed(() => {
  return !hasSavedCountry.value;
});

// Close button is disabled if no saved country
const isCloseButtonDisabled = computed(() => {
  return !hasSavedCountry.value;
});

// Close modal handler
const closeModal = (): void => {
  if (hasSavedCountry.value) {
    emit('update:modelValue', false);
  }
};

// Load countries list
const loadCountries = async (): Promise<void> => {
  loadingCountries.value = true;
  error.value = '';
  
  try {
    const countriesList = await getCountries();
    countries.value = countriesList;
  } catch (err) {
    error.value = t('locationSelection.error.loadingCountries');
    uiStore.showErrorSnackbar(t('locationSelection.error.loadingCountries'));
  } finally {
    loadingCountries.value = false;
  }
};

// Load user country from DB
const loadUserCountry = async (): Promise<void> => {
  loadingUserCountry.value = true;
  error.value = '';
  
  try {
    const country = await getUserCountry();
    originalCountry.value = country;
    
    // Set selected country: use DB value if exists, otherwise default option
    if (country !== null && country !== '') {
      selectedCountry.value = country;
    } else {
      selectedCountry.value = defaultOption;
    }
  } catch (err) {
    error.value = t('locationSelection.error.loadingUserCountry');
    uiStore.showErrorSnackbar(t('locationSelection.error.loadingUserCountry'));
    // On error, set to default option
    selectedCountry.value = defaultOption;
  } finally {
    loadingUserCountry.value = false;
  }
};

// Save country
const saveCountry = async (): Promise<void> => {
  if (!isCountrySelected.value) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await api.post('/api/admin/users/update-country', {
      country: selectedCountry.value
    });

    if (response.data) {
      // Update original country to saved value
      originalCountry.value = selectedCountry.value;
      countrySaved.value = true;
      
      uiStore.showSuccessSnackbar(t('locationSelection.success.saved'));
      // Close modal after successful save
      emit('update:modelValue', false);
    } else {
      error.value = t('locationSelection.error.saveFailed');
      uiStore.showErrorSnackbar(t('locationSelection.error.saveFailed'));
    }
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || t('locationSelection.error.unexpectedError');
    error.value = errorMessage;
    uiStore.showErrorSnackbar(errorMessage);
  } finally {
    loading.value = false;
  }
};

// Watch for modal opening
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    error.value = '';
    countrySaved.value = false;
    
    // Load countries list and user country in parallel
    await Promise.all([
      loadCountries(),
      loadUserCountry()
    ]);
  }
});

// Initialize on mount
onMounted(async () => {
  if (props.modelValue) {
    await Promise.all([
      loadCountries(),
      loadUserCountry()
    ]);
  }
});
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    :persistent="isModalPersistent"
    max-width="350"
    @update:model-value="(value) => emit('update:modelValue', value)"
    @click:outside="closeModal"
  >
    <v-card>
      <v-card-title class="text-h6 pa-4">
        {{ t('locationSelection.title') }}
      </v-card-title>
      
      <v-card-text class="pa-4">
        <v-select
          v-model="selectedCountry"
          :label="t('locationSelection.label')"
          :items="countries"
          :loading="loadingCountries || loadingUserCountry"
          :disabled="loadingCountries || loadingUserCountry"
          :error-messages="error ? [error] : []"
          :item-title="(item) => item"
          :item-value="(item) => item"
          variant="outlined"
          density="compact"
          class="mb-4"
        >
          <template #prepend-item>
            <v-list-item
              :value="defaultOption"
              :title="t('locationSelection.selectCountry')"
            />
          </template>
          <template #append-inner>
            <PhCaretUpDown class="dropdown-icon" />
          </template>
        </v-select>
      </v-card-text>
      
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="grey"
          variant="outlined"
          class="mr-2"
          :disabled="isCloseButtonDisabled || loading || loadingUserCountry"
          @click="closeModal"
        >
          {{ t('locationSelection.close') }}
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          :loading="loading"
          :disabled="!isCountrySelected || loadingCountries || loadingUserCountry"
          @click="saveCountry"
        >
          {{ t('locationSelection.save') }}
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