<!--
  File: panel.current.password.policies.vue
  Version: 1.1.0
  Description: Autonomous panel component for displaying current password policies
  Purpose: Shows current password policy requirements and generates example password
  
  Features:
  - Autonomous component that loads password policies independently using public API
  - Displays password requirements and example password
  - Shows loading, error, and success states
  - Integrates with public password policies API (not admin settings)
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import { fetchPublicPasswordPolicies } from '@/core/services/service.fetch.public.password.policies';
import { usePublicSettingsStore, type PasswordPolicies } from '@/core/state/state.public.settings';
import PhIcon from '@/core/ui/icons/PhIcon.vue'

// ==================== STORES ====================
const { t } = useI18n();
const uiStore = useUiStore();
const publicStore = usePublicSettingsStore();

// ==================== PASSWORD POLICY STATE ====================
/**
 * Password policy loading state and settings
 */
const isLoadingPasswordPolicies = ref(true)
const passwordPolicyError = ref(false)
const currentPasswordPolicies = ref<PasswordPolicies | null>(null)

// ==================== COMPUTED ====================
/**
 * Generate example password based on current password policy settings
 */
const generateExamplePassword = computed(() => {
  // Don't generate example if there are loading or error states or null values
  if (isLoadingPasswordPolicies.value || passwordPolicyError.value || !currentPasswordPolicies.value) {
    return null
  }
  
  const policies = currentPasswordPolicies.value
  const min = policies.minLength
  const max = policies.maxLength
  const length = Math.max(min, Math.min(max, 12))
  let chars: string[] = []
  if (policies.requireLowercase) chars.push('a')
  if (policies.requireUppercase) chars.push('A')
  if (policies.requireNumbers) chars.push('1')
  if (policies.requireSpecialChars && policies.allowedSpecialChars.length > 0) chars.push(policies.allowedSpecialChars[0])
  if (chars.length === 0) chars.push('a')
  let filler: string[] = []
  if (policies.requireLowercase) filler = filler.concat(['b','c','d','e','f','g','h','j','k','m','n','p','q','r','s','t','u','v','w','x','y','z'])
  if (policies.requireUppercase) filler = filler.concat(['B','C','D','E','F','G','H','J','K','M','N','P','Q','R','S','T','U','V','W','X','Y','Z'])
  if (policies.requireNumbers) filler = filler.concat(['2','3','4','5','6','7','8','9'])
  if (policies.requireSpecialChars && policies.allowedSpecialChars.length > 0) filler = filler.concat(policies.allowedSpecialChars.split(''))
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
  if (isLoadingPasswordPolicies.value || passwordPolicyError.value || !currentPasswordPolicies.value) {
    return null
  }
  
  const policies = currentPasswordPolicies.value
  const requirements: string[] = []
  
  // Add length requirement (min and max)
  requirements.push(t('panels.passwordPolicies.rules.lengthRange', { 
    minLength: policies.minLength, 
    maxLength: policies.maxLength 
  }))
  
  if (policies.requireLowercase) {
    requirements.push(t('panels.passwordPolicies.rules.lowercase'))
  }
  
  if (policies.requireUppercase) {
    requirements.push(t('panels.passwordPolicies.rules.uppercase'))
  }
  
  if (policies.requireNumbers) {
    requirements.push(t('panels.passwordPolicies.rules.numbers'))
  }
  
  if (policies.requireSpecialChars) {
    requirements.push(t('panels.passwordPolicies.rules.specialChars'))
  }
  
  return requirements.join(', ')
})

/**
 * Check if password policies are ready (loaded and valid)
 */
const passwordPoliciesReady = computed(() => {
  return !isLoadingPasswordPolicies.value && !passwordPolicyError.value && currentPasswordPolicies.value !== null
})

// ==================== METHODS ====================
/**
 * Load password policy settings from public API
 */
const loadPasswordPolicies = async (forceRefresh = false) => {
  isLoadingPasswordPolicies.value = true
  passwordPolicyError.value = false
  
  try {
    
    // Use public API instead of admin settings API
    const policies = await fetchPublicPasswordPolicies(forceRefresh)
    currentPasswordPolicies.value = policies
    
    
    
  } catch (error) {
    passwordPolicyError.value = true
    uiStore.showErrorSnackbar(t('panels.passwordPolicies.error'))
    
    // Set fallback policies in case of error
    currentPasswordPolicies.value = {
      minLength: 8,
      maxLength: 40,
      requireLowercase: true,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    }
  } finally {
    isLoadingPasswordPolicies.value = false
  }
}

// ==================== METHODS ====================
/**
 * Force refresh password policies (for admin use)
 */
const refreshPasswordPolicies = async () => {
  await loadPasswordPolicies(true)
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
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
      <PhIcon name="mdi-alert-circle" :size="16" color="rgb(var(--v-theme-error))" class="mr-2" />
      <span class="text-caption text-error">
        {{ t('panels.passwordPolicies.error') }}
      </span>
    </div>
    
    <!-- Success state with password info -->
    <div v-else-if="passwordPoliciesReady">
      <div class="d-flex align-center justify-space-between mb-2">
        <p class="text-body-2 text-grey-darken-1 mb-0">
          {{ t('panels.passwordPolicies.examplePassword') }}
        </p>
        <v-btn
          :icon="undefined"
          size="small"
          variant="text"
          color="primary"
          :loading="isLoadingPasswordPolicies"
          :title="t('panels.passwordPolicies.refresh')"
          @click="refreshPasswordPolicies"
        >
          <template #default>
            <PhIcon name="mdi-refresh" />
          </template>
        </v-btn>
      </div>
      <p class="text-h6 font-weight-bold text-primary mb-2">
        {{ generateExamplePassword || '—' }}
      </p>
      <p class="text-body-2 text-grey-darken-3">
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