/**
 * LocationSelectionModal.vue
 * Version: 1.4.0
 * Modal dialog for user location selection.
 * Frontend file that allows users to select and save their location.
 * Modal cannot be closed if user has no saved location in DB.
 * 
 * Features:
 * - Location dropdown populated from app.regions table via API
 * - Loads current location from DB on open
 * - Persistent modal when user has no saved location
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
 * 
 * Changes in v1.2.1:
 * - Added appStore integration to update user country in global state after successful save
 * 
 * Changes in v1.3.0:
 * - Replaced getCountries() with app.regions setting from Application.RegionalSettings
 * - Renamed country references to location for consistency
 * - Updated to use appSettingsStore to get regions list
 * 
 * Changes in v1.4.0:
 * - Replaced settings-based regions loading with API call to app.regions table
 * - Updated to use service.get.regions.ts for fetching regions list
 * - Updated to use service.update.user.location.ts for saving location
 * - Removed dependency on appSettingsStore for regions
 */

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { useAppStore } from '@/core/state/appstate';
import { getUserLocation } from '@/core/services/service.get.user.location';
import { getRegions } from './service.get.regions';
import { updateUserLocation } from './service.update.user.location';
import { PhCaretUpDown } from '@phosphor-icons/vue';

// Init i18n and stores
const { t } = useI18n();
const uiStore = useUiStore();
const userStore = useUserAuthStore();
const appStore = useAppStore();

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
const selectedLocation = ref<string>('select location');
const originalLocation = ref<string | null>(null); // Saved location from DB
const regions = ref<string[]>([]);
const loading = ref(false);
const loadingRegions = ref(false);
const loadingUserLocation = ref(false);
const error = ref<string>('');
const defaultOption = 'select location';
const locationSaved = ref<boolean>(false); // Flag that location was saved in this session

// Computed properties
const isLocationSelected = computed(() => {
  return selectedLocation.value !== '' && selectedLocation.value !== defaultOption;
});

// Check if user has saved location (from DB or saved in this session)
const hasSavedLocation = computed(() => {
  return originalLocation.value !== null || locationSaved.value;
});

// Modal can be closed only if user has saved location
const isModalPersistent = computed(() => {
  return !hasSavedLocation.value;
});

// Close button is disabled if no saved location
const isCloseButtonDisabled = computed(() => {
  return !hasSavedLocation.value;
});

// Close modal handler
const closeModal = (): void => {
  if (hasSavedLocation.value) {
    emit('update:modelValue', false);
  }
};

// Load regions list from app.regions table via API
const loadRegions = async (): Promise<void> => {
  loadingRegions.value = true;
  error.value = '';
  
  try {
    const regionsList = await getRegions();
    regions.value = regionsList;
  } catch (err) {
    error.value = t('locationSelection.error.loadingRegions');
    uiStore.showErrorSnackbar(t('locationSelection.error.loadingRegions'));
    regions.value = [];
  } finally {
    loadingRegions.value = false;
  }
};

// Load user location from DB
const loadUserLocation = async (): Promise<void> => {
  loadingUserLocation.value = true;
  error.value = '';
  
  try {
    const location = await getUserLocation();
    originalLocation.value = location;
    
    // Set selected location: use DB value if exists, otherwise default option
    if (location !== null && location !== '') {
      selectedLocation.value = location;
    } else {
      selectedLocation.value = defaultOption;
    }
  } catch (err) {
    error.value = t('locationSelection.error.loadingUserLocation');
    uiStore.showErrorSnackbar(t('locationSelection.error.loadingUserLocation'));
    // On error, set to default option
    selectedLocation.value = defaultOption;
  } finally {
    loadingUserLocation.value = false;
  }
};

// Save location
const saveLocation = async (): Promise<void> => {
  if (!isLocationSelected.value) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await updateUserLocation(selectedLocation.value);

    if (response && response.location !== undefined) {
      // Update original location to saved value
      originalLocation.value = response.location;
      locationSaved.value = true;
      
      // Update appStore with new location value from response
      const savedLocation = response.location || selectedLocation.value;
      appStore.setUserLocation(savedLocation);
      
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
    locationSaved.value = false;
    
    // Load regions list and user location in parallel
    await Promise.all([
      loadRegions(),
      loadUserLocation()
    ]);
  }
});

// Initialize on mount
onMounted(async () => {
  if (props.modelValue) {
    await Promise.all([
      loadRegions(),
      loadUserLocation()
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
          v-model="selectedLocation"
          :label="t('locationSelection.label')"
          :items="regions"
          :loading="loadingRegions || loadingUserLocation"
          :disabled="loadingRegions || loadingUserLocation"
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
              :title="t('locationSelection.selectLocation')"
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
          :disabled="isCloseButtonDisabled || loading || loadingUserLocation"
          @click="closeModal"
        >
          {{ t('locationSelection.close') }}
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          :loading="loading"
          :disabled="!isLocationSelected || loadingRegions || loadingUserLocation"
          @click="saveLocation"
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

