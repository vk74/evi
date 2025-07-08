/**
 * File: panel.current.password.policies.vue
 * Version: 1.0.0
 * Description: Autonomous panel component for displaying current password policies
 * Purpose: Shows current password policy requirements and generates example password
 * 
 * Features:
 * - Autonomous component that loads password policies independently
 * - Displays password requirements and example password
 * - Shows loading, error, and success states
 * - Integrates with Application.Security.PasswordPolicies settings
 */

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';

// ==================== STORES ====================
const { t } = useI18n();
const uiStore = useUiStore();

// ==================== PASSWORD POLICY STATE ====================
/**
 * Password policy loading state and settings
 */
const isLoadingPasswordPolicies = ref(true)
const passwordPolicyError = ref(false)
const passwordMinLength = ref<number | null>(null)
const passwordMaxLength = ref<number | null>(null)
const requireLowercase = ref<boolean | null>(null)
const requireUppercase = ref<boolean | null>(null)
const requireNumbers = ref<boolean | null>(null)
const requireSpecialChars = ref<boolean | null>(null)
const allowedSpecialChars = ref<string | null>(null)

// ==================== COMPUTED ====================
/**
 * Generate example password based on current password policy settings
 */
const generateExamplePassword = computed(() => {
  // Don't generate example if there are loading or error states or null values
  if (isLoadingPasswordPolicies.value || passwordPolicyError.value || 
      passwordMinLength.value === null || passwordMaxLength.value === null ||
      requireLowercase.value === null || requireUppercase.value === null ||
      requireNumbers.value === null || requireSpecialChars.value === null ||
      allowedSpecialChars.value === null) {
    return null
  }
  
  const min = Number(passwordMinLength.value)
  const max = Number(passwordMaxLength.value)
  const length = Math.max(min, Math.min(max, 12))
  let chars: string[] = []
  if (requireLowercase.value) chars.push('a')
  if (requireUppercase.value) chars.push('A')
  if (requireNumbers.value) chars.push('1')
  if (requireSpecialChars.value && allowedSpecialChars.value.length > 0) chars.push(allowedSpecialChars.value[0])
  if (chars.length === 0) chars.push('a')
  let filler: string[] = []
  if (requireLowercase.value) filler = filler.concat(['b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z'])
  if (requireUppercase.value) filler = filler.concat(['B','C','D','E','F','G','H','J','K','M','N','P','Q','R','S','T','U','V','W','X','Y','Z'])
  if (requireNumbers.value) filler = filler.concat(['2','3','4','5','6','7','8','9'])
  if (requireSpecialChars.value && allowedSpecialChars.value.length > 0) filler = filler.concat(allowedSpecialChars.value.split(''))
  if (filler.length === 0) filler = ['a','b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z']
  let fillIndex = 0
  while (chars.length < length) {
    chars.push(filler[fillIndex % filler.length])
    fillIndex++
  }
  return chars.join('')
})

/**
 * Get password requirements description
 */
const getPasswordRequirements = computed(() => {
  // Don't show requirements if there are loading or error states or null values
  if (isLoadingPasswordPolicies.value || passwordPolicyError.value || 
      passwordMinLength.value === null || requireLowercase.value === null ||
      requireUppercase.value === null || requireNumbers.value === null ||
      requireSpecialChars.value === null) {
    return null
  }
  
  const requirements: string[] = []
  
  requirements.push(`минимум ${passwordMinLength.value} символов`)
  
  if (requireLowercase.value) {
    requirements.push('строчные буквы')
  }
  
  if (requireUppercase.value) {
    requirements.push('заглавные буквы')
  }
  
  if (requireNumbers.value) {
    requirements.push('цифры')
  }
  
  if (requireSpecialChars.value) {
    requirements.push('специальные символы')
  }
  
  return requirements.join(', ')
})

/**
 * Check if password policies are ready (loaded and valid)
 */
const passwordPoliciesReady = computed(() => {
  return !isLoadingPasswordPolicies.value && !passwordPolicyError.value &&
         passwordMinLength.value !== null && passwordMaxLength.value !== null &&
         requireLowercase.value !== null && requireUppercase.value !== null &&
         requireNumbers.value !== null && requireSpecialChars.value !== null &&
         allowedSpecialChars.value !== null
})

// ==================== METHODS ====================
/**
 * Load password policy settings from backend
 */
const loadPasswordPolicies = async () => {
  isLoadingPasswordPolicies.value = true
  passwordPolicyError.value = false
  
  try {
    console.log('[PasswordPoliciesPanel] Loading password policy settings')
    
    const settings = await fetchSettings('Application.Security.PasswordPolicies')
    
    if (settings && settings.length > 0) {
      // Extract settings by name
      const settingsMap = new Map(settings.map(s => [s.setting_name, s.value]))
      
      passwordMinLength.value = Number(settingsMap.get('password.min.length') ?? 8)
      passwordMaxLength.value = Number(settingsMap.get('password.max.length') ?? 40)
      requireLowercase.value = Boolean(settingsMap.get('password.require.lowercase') ?? true)
      requireUppercase.value = Boolean(settingsMap.get('password.require.uppercase') ?? true)
      requireNumbers.value = Boolean(settingsMap.get('password.require.numbers') ?? true)
      requireSpecialChars.value = Boolean(settingsMap.get('password.require.special.chars') ?? false)
      allowedSpecialChars.value = String(settingsMap.get('password.allowed.special.chars') ?? '!@#$%^&*()_+-=[]{}|;:,.<>?')
      
      console.log('[PasswordPoliciesPanel] Password policies loaded successfully:', {
        minLength: passwordMinLength.value,
        maxLength: passwordMaxLength.value,
        requireLowercase: requireLowercase.value,
        requireUppercase: requireUppercase.value,
        requireNumbers: requireNumbers.value,
        requireSpecialChars: requireSpecialChars.value,
        allowedSpecialChars: allowedSpecialChars.value
      })
      
      uiStore.showSuccessSnackbar('настройки политики паролей загружены')
    } else {
      throw new Error('No password policy settings found')
    }
  } catch (error) {
    console.error('[PasswordPoliciesPanel] Failed to load password policies:', error)
    passwordPolicyError.value = true
    uiStore.showErrorSnackbar(t('panels.passwordPolicies.error'))
  } finally {
    isLoadingPasswordPolicies.value = false
  }
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  console.log('[PasswordPoliciesPanel] Mounted - loading password policies')
  await loadPasswordPolicies()
})
</script>

<template>
  <div class="password-policies-panel">
    <!-- Loading state -->
    <div
      v-if="isLoadingPasswordPolicies"
      class="d-flex align-center"
    >
      <v-progress-circular
        size="16"
        width="2"
        indeterminate
        color="primary"
        class="mr-2"
      />
      <span class="text-caption text-grey">
        {{ t('panels.passwordPolicies.loading') }}
      </span>
    </div>
    
    <!-- Error state -->
    <div
      v-else-if="passwordPolicyError"
      class="d-flex align-center"
    >
      <v-icon
        icon="mdi-alert-circle"
        color="error"
        size="16"
        class="mr-2"
      />
      <span class="text-caption text-error">
        {{ t('panels.passwordPolicies.error') }}
      </span>
    </div>
    
    <!-- Success state with password info -->
    <div v-else-if="passwordPoliciesReady">
      <p class="text-body-2 text-grey-darken-1 mb-2">
        {{ t('panels.passwordPolicies.examplePassword') }}
      </p>
      <p class="text-h6 font-weight-bold text-primary mb-2">
        {{ generateExamplePassword || '—' }}
      </p>
      <p class="text-caption text-grey">
        {{ t('panels.passwordPolicies.requirements') }} {{ getPasswordRequirements || '—' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.password-policies-panel {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
</style> 