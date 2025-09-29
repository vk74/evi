<!--
  File: Application.System.DataValidation.vue - frontend file
  Description: Data validation system settings for application data integrity
  Purpose: Configure data validation rules, patterns, and validation policies
  Version: 1.4.0
  
  Features:
  - Standard fields validation settings (text-micro, text-mini, etc.)
  - Well-known fields validation settings (user-name, group-name, email, telephone)
  - Backend integration with settings API
  - Real-time synchronization with database
  - Loading states and error handling
-->

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhCaretUpDown } from '@phosphor-icons/vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/modules/admin/settings/service.update.settings';
import { useUiStore } from '@/core/state/uistate';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';
import { validateRegexString, validateRegexStringDetailed } from '@/core/helpers/validate.regex';
import { validatePhoneMask } from '@/core/helpers/validate.phone.mask';

// Section path identifier
const section_path = 'Application.System.DataValidation';

// Store references
const appSettingsStore = useAppSettingsStore();
const uiStore = useUiStore();

// Get current instance for force update
const instance = getCurrentInstance();

// Translations
const { t, locale } = useI18n();

// Loading states
const isLoadingSettings = ref(true);

// Flag to track first load vs user changes
const isFirstLoad = ref(true);

// Individual setting loading states
const settingLoadingStates = ref<Record<string, boolean>>({});
const settingErrorStates = ref<Record<string, boolean>>({});
const settingRetryAttempts = ref<Record<string, number>>({});

// State for tracking regex values - initial (from DB) and current (user input)
const initialEmailRegex = ref<string | null>(null);
const currentEmailRegex = ref<string | null>(null);

// State for tracking phone mask values - initial (from DB) and current (user input)
const initialPhoneMask = ref<string | null>(null);
const currentPhoneMask = ref<string | null>(null);

// Flags to prevent recursive watcher calls during validation restoration
const isRestoringEmailRegex = ref(false);
const isRestoringPhoneMask = ref(false);

// Keys for forcing component re-render
const emailRegexKey = ref(0);
const phoneMaskKey = ref(0);

// Define all settings that need to be loaded
const allSettings = [
  'standardFields.allowSpecialChars',
  'standardFields.textMicro.maxLength',
  'standardFields.textMini.maxLength',
  'standardFields.textShort.maxLength',
  'standardFields.textMedium.maxLength',
  'standardFields.textLong.maxLength',
  'standardFields.textExtraLong.maxLength',
  'wellKnownFields.userName.minLength',
  'wellKnownFields.userName.maxLength',
  'wellKnownFields.userName.allowNumbers',
  'wellKnownFields.userName.allowUsernameChars',
  'wellKnownFields.userName.latinOnly',
  'wellKnownFields.groupName.minLength',
  'wellKnownFields.groupName.maxLength',
  'wellKnownFields.groupName.allowNumbers',
  'wellKnownFields.groupName.allowUsernameChars',
  'wellKnownFields.groupName.latinOnly',
  'wellKnownFields.email.regex',
  'wellKnownFields.telephoneNumber.mask',
];

// Initialize loading states for all settings
allSettings.forEach(settingName => {
  settingLoadingStates.value[settingName] = true;
  settingErrorStates.value[settingName] = false;
  settingRetryAttempts.value[settingName] = 0;
});

// Local UI state for immediate interaction - initialize with null (not set)
const standardFieldsSettings = ref({
  allowSpecialChars: null as boolean | null
});

const standardFields = ref([
  {
    id: 'text-micro',
    name: 'micro',
    maxLength: null as number | null,
    maxLengthOptions: Array.from({ length: 9 }, (_, i) => i + 2)
  },
  {
    id: 'text-mini',
    name: 'mini',
    maxLength: null as number | null,
    maxLengthOptions: Array.from({ length: 49 }, (_, i) => i + 2)
  },
  {
    id: 'text-short',
    name: 'short',
    maxLength: null as number | null,
    maxLengthOptions: Array.from({ length: 20 }, (_, i) => 10 + (i * 10))
  },
  {
    id: 'text-medium',
    name: 'medium',
    maxLength: null as number | null,
    maxLengthOptions: Array.from({ length: 25 }, (_, i) => 20 + (i * 20))
  },
  {
    id: 'text-long',
    name: 'long',
    maxLength: null as number | null,
    maxLengthOptions: Array.from({ length: 100 }, (_, i) => 50 + (i * 50))
  },
  {
    id: 'text-extralong',
    name: 'extra long',
    maxLength: null as number | null,
    maxLengthOptions: Array.from({ length: 100 }, (_, i) => 100 + (i * 100))
  }
]);

const wellKnownFields = ref([
  {
    id: 'user-name',
    name: 'user name',
    maxLength: null as number | null,
    minLength: null as number | null,
    minLengthOptions: Array.from({ length: 5 }, (_, i) => i + 1),
    maxLengthOptions: Array.from({ length: 10 }, (_, i) => 5 + (i * 5)),
    allowNumbers: null as boolean | null,
    allowUsernameChars: null as boolean | null,
    latinOnly: null as boolean | null
  },
  {
    id: 'group-name',
    name: 'group name',
    maxLength: null as number | null,
    minLength: null as number | null,
    minLengthOptions: Array.from({ length: 5 }, (_, i) => i + 1),
    maxLengthOptions: Array.from({ length: 10 }, (_, i) => 5 + (i * 5)),
    allowNumbers: null as boolean | null,
    allowUsernameChars: null as boolean | null,
    latinOnly: null as boolean | null
  },
  {
    id: 'e-mail',
    name: 'e-mail',
    regex: null as string | null
  },
  {
    id: 'telephone-number',
    name: 'telephone number',
    maxLength: null as number | null,
    mask: null as string | null,
    regex: null as string | null
  }
]);

/**
 * Check if any settings are still loading
 */
const hasLoadingSettings = computed(() => {
  return Object.values(settingLoadingStates.value).some(loading => loading);
});

/**
 * Check if any settings have errors
 */
const hasErrorSettings = computed(() => {
  return Object.values(settingErrorStates.value).some(error => error);
});

/**
 * Check if a specific setting is disabled (loading or has error)
 */
const isSettingDisabled = (settingName: string) => {
  return settingLoadingStates.value[settingName] || settingErrorStates.value[settingName];
};

/**
 * Validate regex string for correctness using unified validation logic
 */
function validateRegex(regexString: string): boolean {
  console.log('🔍 validateRegex called with:', regexString);
  const validation = validateRegexString(regexString);
  
  if (validation.isValid) {
    console.log('✅ Regex validation passed');
    return true;
  } else {
    console.log('❌ Regex validation failed:', validation.error);
    return false;
  }
}

/**
 * Validate regex string with detailed checks and warnings
 */
function validateRegexDetailed(regexString: string): { isValid: boolean; error?: string; warnings?: string[] } {
  console.log('🔍 validateRegexDetailed called with:', regexString);
  const validation = validateRegexStringDetailed(regexString);
  
  if (validation.isValid) {
    console.log('✅ Regex validation passed');
    if (validation.warnings && validation.warnings.length > 0) {
      console.log('⚠️ Regex warnings:', validation.warnings);
    }
  } else {
    console.log('❌ Regex validation failed:', validation.error);
  }
  
  return validation;
}

/**
 * Validate phone mask string for correctness
 */
function validatePhoneMaskString(maskString: string): boolean {
  console.log('🔍 validatePhoneMaskString called with:', maskString);
  const validation = validatePhoneMask(maskString);
  
  if (validation.isValid) {
    console.log('✅ Phone mask validation passed');
    return true;
  } else {
    console.log('❌ Phone mask validation failed:', validation.error);
    return false;
  }
}

/**
 * Escape regex string for JSON serialization
 */
function escapeRegexForJson(regexString: string | null): string {
  console.log('🔧 escapeRegexForJson called with:', regexString);
  if (!regexString) {
    console.log('⚠️ Empty regex string, returning empty string');
    return '';
  }
  
  // For JSON serialization, we need to escape backslashes and quotes properly
  // The key is to escape backslashes first, then quotes
  const escaped = regexString
    .replace(/\\/g, '\\\\')  // Escape backslashes: \ becomes \\
    .replace(/"/g, '\\"')    // Escape double quotes: " becomes \"
    .replace(/'/g, "\\'");   // Escape single quotes: ' becomes \'
  
  console.log('🔧 Escaped regex:', escaped);
  console.log('🔧 JSON.stringify test:', JSON.stringify(escaped));
  return escaped;
}

/**
 * Update setting in store when local state changes
 */
function updateSetting(settingName: string, value: any) {
  // Only update if setting is not disabled
  if (!isSettingDisabled(settingName)) {
    console.log(`Updating setting ${settingName} to:`, value);
    updateSettingFromComponent(section_path, settingName, value);
  }
}

/**
 * Load a single setting by name
 */
async function loadSetting(settingName: string): Promise<boolean> {
  settingLoadingStates.value[settingName] = true;
  settingErrorStates.value[settingName] = false;
  
  try {
    console.log(`Loading setting: ${settingName}`);
    
    // Try to get setting from cache first
    const cachedSettings = appSettingsStore.getCachedSettings(section_path);
    const cachedSetting = cachedSettings?.find(s => s.setting_name === settingName);
    
    if (cachedSetting) {
      console.log(`Found cached setting: ${settingName}`, cachedSetting.value);
      updateLocalSetting(settingName, cachedSetting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    }
    
    // If not in cache, fetch from backend
    const settings = await fetchSettings(section_path);
    const setting = settings?.find(s => s.setting_name === settingName);
    
    if (setting) {
      console.log(`Successfully loaded setting: ${settingName}`, setting.value);
      updateLocalSetting(settingName, setting.value);
      settingLoadingStates.value[settingName] = false;
      return true;
    } else {
      throw new Error(`Setting ${settingName} not found`);
    }
  } catch (error) {
    console.error(`Failed to load setting ${settingName}:`, error);
    settingErrorStates.value[settingName] = true;
    settingLoadingStates.value[settingName] = false;
    
    // Try retry if we haven't exceeded attempts
    if (settingRetryAttempts.value[settingName] < 1) {
      settingRetryAttempts.value[settingName]++;
      console.log(`Retrying setting ${settingName} in 5 seconds...`);
      setTimeout(() => loadSetting(settingName), 5000);
    } else {
      // Show error toast only on final failure
      uiStore.showErrorSnackbar(`ошибка загрузки настройки: ${settingName}`);
    }
    
    return false;
  }
}

/**
 * Update local setting value based on setting name
 */
function updateLocalSetting(settingName: string, value: any) {
  // Helper function to safely convert values without changing null
  const safeBoolean = (val: any) => val === null ? null : Boolean(val);
  const safeNumber = (val: any) => val === null ? null : Number(val);
  const safeString = (val: any) => val === null ? null : String(val);

  switch (settingName) {
    case 'standardFields.allowSpecialChars':
      standardFieldsSettings.value.allowSpecialChars = safeBoolean(value);
      break;
    case 'standardFields.textMicro.maxLength':
      standardFields.value[0].maxLength = safeNumber(value);
      break;
    case 'standardFields.textMini.maxLength':
      standardFields.value[1].maxLength = safeNumber(value);
      break;
    case 'standardFields.textShort.maxLength':
      standardFields.value[2].maxLength = safeNumber(value);
      break;
    case 'standardFields.textMedium.maxLength':
      standardFields.value[3].maxLength = safeNumber(value);
      break;
    case 'standardFields.textLong.maxLength':
      standardFields.value[4].maxLength = safeNumber(value);
      break;
    case 'standardFields.textExtraLong.maxLength':
      standardFields.value[5].maxLength = safeNumber(value);
      break;
    case 'wellKnownFields.userName.minLength':
      wellKnownFields.value[0].minLength = safeNumber(value);
      break;
    case 'wellKnownFields.userName.maxLength':
      wellKnownFields.value[0].maxLength = safeNumber(value);
      break;
    case 'wellKnownFields.userName.allowNumbers':
      wellKnownFields.value[0].allowNumbers = safeBoolean(value);
      break;
    case 'wellKnownFields.userName.allowUsernameChars':
      wellKnownFields.value[0].allowUsernameChars = safeBoolean(value);
      break;
    case 'wellKnownFields.userName.latinOnly':
      wellKnownFields.value[0].latinOnly = safeBoolean(value);
      break;
    case 'wellKnownFields.groupName.minLength':
      wellKnownFields.value[1].minLength = safeNumber(value);
      break;
    case 'wellKnownFields.groupName.maxLength':
      wellKnownFields.value[1].maxLength = safeNumber(value);
      break;
    case 'wellKnownFields.groupName.allowNumbers':
      wellKnownFields.value[1].allowNumbers = safeBoolean(value);
      break;
    case 'wellKnownFields.groupName.allowUsernameChars':
      wellKnownFields.value[1].allowUsernameChars = safeBoolean(value);
      break;
    case 'wellKnownFields.groupName.latinOnly':
      wellKnownFields.value[1].latinOnly = safeBoolean(value);
      break;
    case 'wellKnownFields.email.regex':
      const emailValue = safeString(value);
      console.log('📧 Email regex initialization:', emailValue);
      wellKnownFields.value[2].regex = emailValue;
      // Устанавливаем исходное и текущее значения равными значению из БД
      initialEmailRegex.value = emailValue;
      currentEmailRegex.value = emailValue;
      console.log('📧 Initial values set - initialEmailRegex:', initialEmailRegex.value, 'currentEmailRegex:', currentEmailRegex.value);
      break;
    case 'wellKnownFields.telephoneNumber.mask':
      const maskValue = safeString(value);
      console.log('📞 Phone mask initialization:', maskValue);
      wellKnownFields.value[3].mask = maskValue;
      // Устанавливаем исходное и текущее значения равными значению из БД
      initialPhoneMask.value = maskValue;
      currentPhoneMask.value = maskValue;
      console.log('📞 Initial values set - initialPhoneMask:', initialPhoneMask.value, 'currentPhoneMask:', currentPhoneMask.value);
      break;
  }
}

/**
 * Load all settings from the backend and update local state
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Application.System.DataValidation');
    
    // Disable watch effects during initial load
    isFirstLoad.value = true;
    
    // Load all settings for the section in one request
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log(`Successfully loaded ${settings.length} settings for section: ${section_path}`);
      
      // Update local state for each setting
      allSettings.forEach(settingName => {
        const setting = settings.find(s => s.setting_name === settingName);
        if (setting) {
          updateLocalSetting(settingName, setting.value);
          settingLoadingStates.value[settingName] = false;
          settingErrorStates.value[settingName] = false;
        } else {
          console.warn(`Setting ${settingName} not found in loaded settings`);
          settingLoadingStates.value[settingName] = false;
          settingErrorStates.value[settingName] = true;
        }
      });
      
      // Enable user changes after all settings are loaded and local state is updated
      // Use nextTick to ensure all synchronous updates complete before enabling watchers
      await nextTick();
      isFirstLoad.value = false;
      
      // Show success toast for initial load
      uiStore.showSuccessSnackbar('настройки успешно загружены');
    } else {
      console.log('No settings loaded - using defaults');
      
      // Mark all settings as failed to load
      allSettings.forEach(settingName => {
        settingLoadingStates.value[settingName] = false;
        settingErrorStates.value[settingName] = true;
      });
      
      // Enable user changes even if no settings loaded
      await nextTick();
      isFirstLoad.value = false;
    }
    
  } catch (error) {
    console.error('Failed to load data validation settings:', error);
    
    // Mark all settings as failed to load
    allSettings.forEach(settingName => {
      settingLoadingStates.value[settingName] = false;
      settingErrorStates.value[settingName] = true;
    });
    
    // Enable user changes even on error
    await nextTick();
    isFirstLoad.value = false;
  } finally {
    isLoadingSettings.value = false;
  }
}

/**
 * Retry loading a specific setting
 */
async function retrySetting(settingName: string) {
  settingRetryAttempts.value[settingName] = 0;
  settingErrorStates.value[settingName] = false;
  await loadSetting(settingName);
}

// Update standard field max length
const updateStandardFieldMaxLength = (fieldId: string, maxLength: number) => {
  const field = standardFields.value.find(f => f.id === fieldId);
  if (field) {
    field.maxLength = maxLength;
  }
};

// Update well-known field setting
const updateWellKnownFieldSetting = (fieldId: string, setting: string, value: any) => {
  const field = wellKnownFields.value.find(f => f.id === fieldId);
  if (field) {
    (field as any)[setting] = value;
  }
};

// Update standard fields global setting
const updateStandardFieldsGlobalSetting = (setting: string, value: any) => {
  (standardFieldsSettings.value as any)[setting] = value;
};

// Watch for changes in local state - only after first load is complete
watch(
  () => standardFieldsSettings.value.allowSpecialChars,
  (newValue, oldValue) => {
    // Only update if: not first load, value is not null, and value actually changed
    if (!isFirstLoad.value && newValue !== null && newValue !== oldValue) {
      console.log('Watch triggered: standardFields.allowSpecialChars', { newValue, oldValue, isFirstLoad: isFirstLoad.value });
      updateSetting('standardFields.allowSpecialChars', newValue);
    }
  },
  { flush: 'post' } // Ensure this runs after DOM updates
);

// Watch for standard fields max length changes
watch(
  () => standardFields.value.map(f => f.maxLength),
  (newValues, oldValues) => {
    if (!isFirstLoad.value) {
      newValues.forEach((value, index) => {
        // Only update if value is not null and actually changed
        if (value !== null && value !== oldValues?.[index]) {
          // Map field IDs to correct setting names
          const fieldIdToSettingName = {
            'text-micro': 'textMicro',
            'text-mini': 'textMini', 
            'text-short': 'textShort',
            'text-medium': 'textMedium',
            'text-long': 'textLong',
            'text-extralong': 'textExtraLong'
          };
          const settingName = `standardFields.${fieldIdToSettingName[standardFields.value[index].id]}.maxLength`;
          console.log('Watch triggered: standardFields maxLength', { settingName, value, oldValue: oldValues?.[index], isFirstLoad: isFirstLoad.value });
          updateSetting(settingName, value);
        }
      });
    }
  },
  { deep: true, flush: 'post' } // Ensure this runs after DOM updates
);

// Watch for user-name field changes - individual field watchers
watch(
  () => wellKnownFields.value[0]?.minLength,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.userName.minLength', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[0]?.maxLength,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.userName.maxLength', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[0]?.allowNumbers,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.userName.allowNumbers', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[0]?.allowUsernameChars,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.userName.allowUsernameChars', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[0]?.latinOnly,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.userName.latinOnly', newValue);
    }
  }
);

// Watch for group-name field changes - individual field watchers
watch(
  () => wellKnownFields.value[1]?.minLength,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.groupName.minLength', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[1]?.maxLength,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.groupName.maxLength', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[1]?.allowNumbers,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.groupName.allowNumbers', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[1]?.allowUsernameChars,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.groupName.allowUsernameChars', newValue);
    }
  }
);

watch(
  () => wellKnownFields.value[1]?.latinOnly,
  (newValue, oldValue) => {
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      updateSettingFromComponent(section_path, 'wellKnownFields.groupName.latinOnly', newValue);
    }
  }
);

// Watch for e-mail field changes - individual field watchers
watch(
  () => currentEmailRegex.value,
  (newValue, oldValue) => {
    console.log('👀 Email regex watcher triggered:', { newValue, oldValue, isFirstLoad: isFirstLoad.value, isRestoring: isRestoringEmailRegex.value });
    
    // Skip processing if we're currently restoring a value to prevent recursive calls
    if (isRestoringEmailRegex.value) {
      console.log('📧 Skipping email regex processing - currently restoring');
      return;
    }
    
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      console.log('📧 Processing email regex change...');
      
      // Validate regex with detailed checks before sending to backend
      if (newValue) {
        const validation = validateRegexDetailed(newValue);
        
        if (!validation.isValid) {
          console.log('❌ Email regex validation failed, restoring to initial value');
          console.log('📧 Before restore - currentEmailRegex:', currentEmailRegex.value, 'initialEmailRegex:', initialEmailRegex.value);
          
          // Set flag to prevent recursive watcher calls
          isRestoringEmailRegex.value = true;
          
          // Восстанавливаем к исходному значению из БД
          currentEmailRegex.value = initialEmailRegex.value;
          
          // Force component re-render by changing key
          emailRegexKey.value++;
          
          // Force update the component instance
          if (instance?.proxy) {
            (instance.proxy as any).$forceUpdate();
          }
          
          // Reset flag after restoration
          nextTick(() => {
            isRestoringEmailRegex.value = false;
            console.log('📧 Email regex restoration completed with key:', emailRegexKey.value);
          });
          
          console.log('📧 After restore - currentEmailRegex:', currentEmailRegex.value);
          
          // Show comprehensive error message with restoration info
          const errorMessage = `Некорректное регулярное выражение: ${validation.error}. Восстановлено последнее корректное значение.`;
          uiStore.showErrorSnackbar(errorMessage, { timeout: 6000 }); // Show longer for detailed message
          console.log('📧 Error message shown, returning without API call');
          return; // НЕ отправляем запрос
        }
        
        // Show warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
          console.log('⚠️ Email regex warnings:', validation.warnings);
          // Можно показать предупреждения пользователю, но не блокировать отправку
        }
        
        console.log('✅ Email regex validation passed, sending to server');
        console.log('📧 Before update - initialEmailRegex:', initialEmailRegex.value);
        
        // Wrap regex in JSON string for PostgreSQL JSON field
        const jsonValue = JSON.stringify(newValue); // Convert to JSON string
        console.log('📧 Sending regex to server:', newValue);
        console.log('📧 JSON wrapped for PostgreSQL:', jsonValue);
        updateSettingFromComponent(section_path, 'wellKnownFields.email.regex', jsonValue);
        
        // Обновляем исходное значение
        initialEmailRegex.value = newValue;
        console.log('📧 After update - initialEmailRegex:', initialEmailRegex.value);
      }
    } else {
      console.log('📧 Email regex watcher skipped:', { isFirstLoad: isFirstLoad.value, newValue, oldValue });
    }
  }
);

// Watch for telephone-number field changes - individual field watchers

watch(
  () => currentPhoneMask.value,
  (newValue, oldValue) => {
    console.log('👀 Phone mask watcher triggered:', { newValue, oldValue, isFirstLoad: isFirstLoad.value, isRestoring: isRestoringPhoneMask.value });
    
    // Skip processing if we're currently restoring a value to prevent recursive calls
    if (isRestoringPhoneMask.value) {
      console.log('📞 Skipping phone mask processing - currently restoring');
      return;
    }
    
    if (!isFirstLoad.value && newValue !== undefined && newValue !== oldValue) {
      console.log('📞 Processing phone mask change...');
      
      // Validate phone mask before sending to backend
      if (newValue) {
        const isValid = validatePhoneMaskString(newValue);
        
        if (!isValid) {
          console.log('❌ Phone mask validation failed, restoring to initial value');
          console.log('📞 Before restore - currentPhoneMask:', currentPhoneMask.value, 'initialPhoneMask:', initialPhoneMask.value);
          
          // Set flag to prevent recursive watcher calls
          isRestoringPhoneMask.value = true;
          
          // Восстанавливаем к исходному значению из БД
          currentPhoneMask.value = initialPhoneMask.value;
          
          // Force component re-render by changing key
          phoneMaskKey.value++;
          
          // Force update the component instance
          if (instance?.proxy) {
            (instance.proxy as any).$forceUpdate();
          }
          
          // Reset flag after restoration
          nextTick(() => {
            isRestoringPhoneMask.value = false;
            console.log('📞 Phone mask restoration completed with key:', phoneMaskKey.value);
          });
          
          console.log('📞 After restore - currentPhoneMask:', currentPhoneMask.value);
          
          // Show comprehensive error message with restoration info
          const errorMessage = `Некорректная маска телефона. Восстановлено последнее корректное значение.`;
          uiStore.showErrorSnackbar(errorMessage, { timeout: 6000 }); // Show longer for detailed message
          console.log('📞 Error message shown, returning without API call');
          return; // НЕ отправляем запрос
        }
        
        console.log('✅ Phone mask validation passed, sending to server');
        console.log('📞 Before update - initialPhoneMask:', initialPhoneMask.value);
        
        // Wrap phone mask in JSON string for PostgreSQL JSON field
        const jsonValue = JSON.stringify(newValue); // Convert to JSON string
        console.log('📞 Sending phone mask to server:', newValue);
        console.log('📞 JSON wrapped for PostgreSQL:', jsonValue);
        updateSettingFromComponent(section_path, 'wellKnownFields.telephoneNumber.mask', jsonValue);
        
        // Обновляем исходное значение
        initialPhoneMask.value = newValue;
        console.log('📞 After update - initialPhoneMask:', initialPhoneMask.value);
      }
    } else {
      console.log('📞 Phone mask watcher skipped:', { isFirstLoad: isFirstLoad.value, newValue, oldValue });
    }
  }
);


// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

// Initialize component
onMounted(() => {
  console.log('Application.System.DataValidation component initialized');
  loadSettings();
});

</script>

<template>
  <div class="data-validation-settings">
    <h2 class="text-h6 mb-4">
      {{ t('admin.settings.sections.datavalidation') }}
    </h2>
    
    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />
    
    <template v-if="!isLoadingSettings">
      <!-- Settings content -->
      <div class="settings-section">
        <div class="section-content">
        <!-- ==================== STANDARD FIELDS SECTION ==================== -->
        <div class="settings-group mb-4">
          <h3 class="text-subtitle-1 mb-2 font-weight-medium">
            {{ t('admin.settings.datavalidation.standardFields.title') }}
          </h3>
          
          <!-- Global settings for standard fields -->
          <div class="settings-subgroup mb-4">
            
            <div class="d-flex align-center mb-3">
              <v-switch
                v-model="standardFieldsSettings.allowSpecialChars"
                color="teal-darken-2"
                :label="t('admin.settings.datavalidation.settings.allowSpecialChars')"
                hide-details
                :disabled="isSettingDisabled('standardFields.allowSpecialChars')"
                :loading="settingLoadingStates['standardFields.allowSpecialChars']"
              />
              <v-tooltip
                v-if="settingErrorStates['standardFields.allowSpecialChars']"
                location="top"
                max-width="300"
              >
                <template #activator="{ props }">
                  <v-icon 
                    icon="mdi-alert-circle" 
                    size="small" 
                    class="ms-2" 
                    color="error"
                    v-bind="props"
                    style="cursor: pointer;"
                    @click="retrySetting('standardFields.allowSpecialChars')"
                  />
                </template>
                <div class="pa-2">
                  <p class="text-subtitle-2 mb-2">
                    {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.title') }}
                  </p>
                  <p class="text-caption">
                    {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.retry') }}
                  </p>
                </div>
              </v-tooltip>
            </div>
            
          </div>
          
          <!-- Standard fields list -->
          <div class="settings-subgroup">
            <h4 class="text-subtitle-2 mb-3 font-weight-medium">
              {{ t('admin.settings.datavalidation.standardFields.maxLengthPerFieldType') }}
            </h4>
            
            <div class="standard-fields-grid">
              <div v-for="(field, index) in standardFields" :key="field.id" class="field-row">
                <div class="d-flex align-center">
                  <v-select
                    v-model="field.maxLength"
                    :items="field.maxLengthOptions"
                    :label="t(`admin.settings.datavalidation.standardFields.${field.id.replace('text-', '')}`)"
                    variant="outlined"
                    density="comfortable"
                    color="teal-darken-2"
                    class="dropdown-select"
                    :disabled="isSettingDisabled(`standardFields.${field.id.replace('text-', 'text')}.maxLength`)"
                    :loading="settingLoadingStates[`standardFields.${field.id.replace('text-', 'text')}.maxLength`]"
                  >
                    <template #append-inner>
                      <PhCaretUpDown class="dropdown-icon" />
                    </template>
                  </v-select>
                  <span class="text-caption text-grey-darken-1 ml-2">
                    {{ field.id === 'text-micro' ? '2-10' : 
                       field.id === 'text-mini' ? '2-50' : 
                       field.id === 'text-short' ? '10-200' : 
                       field.id === 'text-medium' ? '20-500' : 
                       field.id === 'text-long' ? '50-5000' : 
                       '100-10000' }}
                  </span>
                  <v-tooltip
                    v-if="settingErrorStates[`standardFields.${field.id.replace('text-', 'text')}.maxLength`]"
                    location="top"
                    max-width="300"
                  >
                    <template #activator="{ props }">
                      <v-icon 
                        icon="mdi-alert-circle" 
                        size="small" 
                        class="ms-2" 
                        color="error"
                        v-bind="props"
                        style="cursor: pointer;"
                        @click="retrySetting(`standardFields.${field.id.replace('text-', 'text')}.maxLength`)"
                      />
                    </template>
                    <div class="pa-2">
                      <p class="text-subtitle-2 mb-2">
                        {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.title') }}
                      </p>
                      <p class="text-caption">
                        {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.retry') }}
                      </p>
                    </div>
                  </v-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- ==================== WELL-KNOWN FIELDS SECTION ==================== -->
        <div class="settings-group mb-6">
          <h3 class="text-subtitle-1 mb-4 font-weight-medium">
            {{ t('admin.settings.datavalidation.wellKnownFields.title') }}
          </h3>
          
          <!-- Well-known fields list -->
          <div class="settings-subgroup">
            <div class="well-known-fields-grid">
              <div v-for="field in wellKnownFields" :key="field.id" class="field-card">
                <div class="d-flex align-center mb-2">
                  <h5 class="text-subtitle-2 font-weight-medium">{{ t(`admin.settings.datavalidation.wellKnownFields.${field.id === 'user-name' ? 'userName' : field.id === 'group-name' ? 'groupName' : field.id === 'e-mail' ? 'email' : field.id === 'telephone-number' ? 'telephoneNumber' : field.id}`) }}</h5>
                </div>
                
                <div class="field-settings">
                  <div class="d-flex flex-column mb-2">
                    <!-- Special handling for e-mail field -->
                    <v-text-field
                      v-if="field.id === 'e-mail'"
                      :key="`email-regex-${emailRegexKey}`"
                      v-model="currentEmailRegex"
                      :label="t('admin.settings.datavalidation.wellKnownFields.emailRegexLabel')"
                      variant="outlined"
                      density="compact"
                      color="teal-darken-2"
                      style="width: 450px;"
                      class="mb-2"
                      data-testid="email-regex-input"
                      :disabled="isSettingDisabled('wellKnownFields.email.regex')"
                      :loading="settingLoadingStates['wellKnownFields.email.regex']"
                      :error="currentEmailRegex ? !validateRegexString(currentEmailRegex).isValid : false"
                      :error-messages="currentEmailRegex && !validateRegexString(currentEmailRegex).isValid ? validateRegexString(currentEmailRegex).error : ''"
                      :hint="t('admin.settings.datavalidation.wellKnownFields.emailRegexHint')"
                      persistent-hint
                    />
                    <v-tooltip
                      v-if="field.id === 'e-mail' && settingErrorStates['wellKnownFields.email.regex']"
                      location="top"
                      max-width="300"
                    >
                      <template #activator="{ props }">
                        <v-icon 
                          icon="mdi-alert-circle" 
                          size="small" 
                          class="ms-2" 
                          color="error"
                          v-bind="props"
                          style="cursor: pointer;"
                          @click="retrySetting('wellKnownFields.email.regex')"
                        />
                      </template>
                      <div class="pa-2">
                        <p class="text-subtitle-2 mb-2">
                          {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.title') }}
                        </p>
                        <p class="text-caption">
                          {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.retry') }}
                        </p>
                      </div>
                    </v-tooltip>
                    
                    <!-- Special handling for telephone field -->
                    <template v-if="field.id === 'telephone-number'">
                      <v-text-field
                        :key="`phone-mask-${phoneMaskKey}`"
                        v-model="currentPhoneMask"
                        :label="t('admin.settings.datavalidation.wellKnownFields.phoneMaskLabel')"
                        variant="outlined"
                        density="compact"
                        color="teal-darken-2"
                        style="width: 450px;"
                        class="mb-2"
                        data-testid="phone-mask-input"
                        :disabled="isSettingDisabled('wellKnownFields.telephoneNumber.mask')"
                        :loading="settingLoadingStates['wellKnownFields.telephoneNumber.mask']"
                        :error="currentPhoneMask ? !validatePhoneMask(currentPhoneMask).isValid : false"
                        :error-messages="currentPhoneMask && !validatePhoneMask(currentPhoneMask).isValid ? validatePhoneMask(currentPhoneMask).error : ''"
                        :hint="t('admin.settings.datavalidation.wellKnownFields.phoneMaskHint')"
                        persistent-hint
                      />
                      <v-tooltip
                        v-if="settingErrorStates['wellKnownFields.telephoneNumber.mask']"
                        location="top"
                        max-width="300"
                      >
                        <template #activator="{ props }">
                          <v-icon 
                            icon="mdi-alert-circle" 
                            size="small" 
                            class="ms-2" 
                            color="error"
                            v-bind="props"
                            style="cursor: pointer;"
                            @click="retrySetting('wellKnownFields.telephoneNumber.mask')"
                          />
                        </template>
                        <div class="pa-2">
                          <p class="text-subtitle-2 mb-2">
                            {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.title') }}
                          </p>
                          <p class="text-caption">
                            {{ t('admin.settings.usersmanagement.groupsmanagement.messages.error.tooltip.retry') }}
                          </p>
                        </div>
                      </v-tooltip>
                    </template>
                    
                    <!-- Regular fields with min/max length -->
                    <template v-else-if="field.id !== 'telephone-number' && field.id !== 'e-mail'">
                      <div class="d-flex align-center mb-2">
                        <v-select
                          v-if="field.minLength !== undefined"
                          v-model="field.minLength"
                          :items="field.minLengthOptions"
                          :label="t('admin.settings.datavalidation.wellKnownFields.minimumLength')"
                          variant="outlined"
                          density="compact"
                          color="teal-darken-2"
                          class="dropdown-select"
                          :disabled="isSettingDisabled(`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.minLength`)"
                          :loading="settingLoadingStates[`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.minLength`]"
                        >
                          <template #append-inner>
                            <PhCaretUpDown class="dropdown-icon" />
                          </template>
                        </v-select>
                        <span class="text-caption text-grey-darken-1 ml-2">
                          {{ field.id === 'user-name' || field.id === 'group-name' ? '1-5' : '1-8' }}
                        </span>
                      </div>
                      
                      <div class="d-flex align-center mb-2">
                        <v-select
                          v-model="field.maxLength"
                          :items="field.id === 'user-name' || field.id === 'group-name' ? field.maxLengthOptions : Array.from({ length: 100 }, (_, i) => i + 1)"
                          :label="t('admin.settings.datavalidation.wellKnownFields.maximumLength')"
                          variant="outlined"
                          density="compact"
                          color="teal-darken-2"
                          class="dropdown-select"
                          :disabled="isSettingDisabled(`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.maxLength`)"
                          :loading="settingLoadingStates[`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.maxLength`]"
                        >
                          <template #append-inner>
                            <PhCaretUpDown class="dropdown-icon" />
                          </template>
                        </v-select>
                        <span class="text-caption text-grey-darken-1 ml-2">
                          {{ field.id === 'user-name' || field.id === 'group-name' ? '5-50' : '1-100' }}
                        </span>
                      </div>
                    </template>
                    
                    <!-- Switches only for non-e-mail and non-telephone fields -->
                    <template v-if="field.id !== 'e-mail' && field.id !== 'telephone-number'">
                      <v-switch
                        v-if="field.allowNumbers !== undefined"
                        v-model="field.allowNumbers"
                        color="teal-darken-2"
                        :label="t('admin.settings.datavalidation.wellKnownFields.allowNumbers')"
                        hide-details
                        density="compact"
                        class="mb-1"
                        :disabled="isSettingDisabled(`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.allowNumbers`)"
                        :loading="settingLoadingStates[`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.allowNumbers`]"
                      />
                      <v-switch
                        v-if="field.allowUsernameChars !== undefined"
                        v-model="field.allowUsernameChars"
                        color="teal-darken-2"
                        :label="t('admin.settings.datavalidation.wellKnownFields.allowUsernameChars', { fieldName: field.id === 'user-name' ? t('admin.settings.datavalidation.wellKnownFields.userName') : t('admin.settings.datavalidation.wellKnownFields.groupName') })"
                        hide-details
                        density="compact"
                        class="mb-1"
                        :disabled="isSettingDisabled(`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.allowUsernameChars`)"
                        :loading="settingLoadingStates[`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.allowUsernameChars`]"
                      />
                      <v-switch
                        v-if="field.latinOnly !== undefined"
                        v-model="field.latinOnly"
                        color="teal-darken-2"
                        :label="t('admin.settings.datavalidation.wellKnownFields.latinOnly')"
                        hide-details
                        density="compact"
                        class="mb-1"
                        :disabled="isSettingDisabled(`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.latinOnly`)"
                        :loading="settingLoadingStates[`wellKnownFields.${field.id === 'user-name' ? 'userName' : 'groupName'}.latinOnly`]"
                      />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.data-validation-settings {
  max-width: 1400px;
}

.settings-header {
  padding-bottom: 16px;
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.settings-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
}

.settings-subgroup {
  margin-bottom: 16px;
}

.settings-subgroup:last-child {
  margin-bottom: 0;
}

.field-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.01);
  width: 500px;
}

.well-known-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.field-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-settings .v-switch {
  margin-bottom: 0;
}

.field-settings .v-text-field {
  margin-bottom: 8px;
}

/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}

/* Unified dropdown width - force all selects to be exactly 150px */
.dropdown-select {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
  flex: none !important;
}

/* Target the actual input field inside v-select */
.dropdown-select :deep(.v-field__input) {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
}

/* Target the field wrapper */
.dropdown-select :deep(.v-field) {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
}

/* Force container width */
.dropdown-select :deep(.v-input__control) {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
}

/* Standard fields grid layout */
.standard-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.field-row {
  display: flex;
  align-items: center;
}

/* Responsive adjustments for standard fields */
@media (max-width: 960px) {
  .standard-fields-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>