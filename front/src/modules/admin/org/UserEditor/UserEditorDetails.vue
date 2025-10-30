<!--
version: 1.0.2
Frontend file UserEditorDetails.vue.
Purpose: User details form with dynamic validation using public policies and form state management.
Features: Dynamic validation for username/email/phone, static validation for FIO fields, form submission handling.
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserEditorStore } from './state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useOrgAdminStore } from '../state.org.admin'
import { AccountStatus, Gender, EditMode } from './types.user.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import ChangePassword from '@/core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '@/core/ui/modals/change-password/types.change.password'
import { createUserService } from './service.create.new.user'
import { updateUserService } from './service.update.user'
import PasswordPoliciesPanel from '@/core/ui/panels/panel.current.password.policies.vue'
import { PhCaretUpDown, PhCheckSquare, PhSquare, PhEye, PhEyeSlash } from '@phosphor-icons/vue'
import { fetchPublicValidationRules } from '@/core/services/service.fetch.public.validation.rules'
import { fetchPublicPasswordPolicies } from '@/core/services/service.fetch.public.password.policies'
import { usePublicSettingsStore, type PasswordPolicies, type ValidationRules } from '@/core/state/state.public.settings'

const userEditorStore = useUserEditorStore()
const uiStore = useUiStore()
const usersSectionStore = useOrgAdminStore()
const publicStore = usePublicSettingsStore()
const { t } = useI18n()
const { firstNameRules, middleNameRules, lastNameRules } = useValidationRules()

const form = ref<any>(null)
const isFormValid = ref(false)
const usernameField = ref<any>(null)
const isSubmitting = ref(false)
const showPassword = ref(false)
const hasInteracted = ref(false)
const showRequiredFieldsWarning = ref(false)
const showPasswordDialog = ref(false)
const showPasswordPoliciesPanel = ref(false)

// Public settings state
const currentPasswordPolicies = ref<PasswordPolicies | null>(null)
const currentValidationRules = ref<ValidationRules | null>(null)
const isLoadingPasswordPolicies = ref(false)
const isLoadingValidationRules = ref(false)

const profileGender = computed({ get: () => userEditorStore.account.gender, set: (value) => userEditorStore.updateUser({ gender: value }) })
const profileMobilePhone = computed({
  get: () => userEditorStore.account.mobile_phone,
  set: (value: string) => {
    const masked = applyPhoneMask(value)
    userEditorStore.updateUser({ mobile_phone: masked })
  }
})

const accountUsername = computed({ get: () => userEditorStore.account.username, set: (value) => userEditorStore.updateUser({ username: value }) })
const accountEmail = computed({ get: () => userEditorStore.account.email, set: (value) => userEditorStore.updateUser({ email: value }) })
const accountFirstName = computed({ get: () => userEditorStore.account.first_name, set: (value) => userEditorStore.updateUser({ first_name: value }) })
const accountMiddleName = computed({ get: () => userEditorStore.account.middle_name, set: (value) => userEditorStore.updateUser({ middle_name: value }) })
const accountLastName = computed({ get: () => userEditorStore.account.last_name, set: (value) => userEditorStore.updateUser({ last_name: value }) })
const accountPassword = computed({ get: () => userEditorStore.account.password, set: (value) => userEditorStore.updateUser({ password: value }) })
const accountPasswordConfirm = computed({ get: () => userEditorStore.account.passwordConfirm, set: (value) => userEditorStore.updateUser({ passwordConfirm: value }) })
const accountStatus = computed({ get: () => userEditorStore.account.account_status, set: (value) => userEditorStore.updateUser({ account_status: value }) })
const accountIsStaff = computed({ get: () => userEditorStore.account.is_staff, set: (value) => userEditorStore.updateUser({ is_staff: value }) })

// System user computed properties
const isSystemUser = computed(() => userEditorStore.account.is_system === true)
const userUuid = computed(() => userEditorStore.account.user_id || '')

const requiredFields = computed(() => ({
  username: userEditorStore.account.username,
  email: userEditorStore.account.email,
  first_name: userEditorStore.account.first_name,
  last_name: userEditorStore.account.last_name,
  password: userEditorStore.account.password,
  passwordConfirm: userEditorStore.account.passwordConfirm
}))

const requiredFieldsFilled = computed(() => Object.values(requiredFields.value).every(field => !!field))

// Check if password policies are ready
const passwordPoliciesReady = computed(() => {
  return !isLoadingPasswordPolicies.value && 
         !publicStore.passwordPoliciesError && 
         currentPasswordPolicies.value !== null
})

// Check if validation rules are ready
const validationRulesReady = computed(() => {
  return !isLoadingValidationRules.value && 
         !publicStore.validationRulesError && 
         currentValidationRules.value !== null
})

/**
 * Dynamic password validation rules based on loaded password policies
 */
const dynamicPasswordRules = computed(() => {
  // Password policies must be loaded and valid
  if (isLoadingPasswordPolicies.value || publicStore.passwordPoliciesError || !currentPasswordPolicies.value) {
    return [
      () => !publicStore.passwordPoliciesError || t('admin.org.editor.validation.password.policiesNotLoaded')
    ]
  }

  const policies = currentPasswordPolicies.value
  const rules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  rules.push((v: string) => !!v || t('admin.org.editor.validation.password.required'))
  
  // Length rules
  rules.push((v: string) => (v && v.length >= policies.minLength) || t('admin.org.editor.validation.password.minLength', { length: policies.minLength }))
  rules.push((v: string) => (v && v.length <= policies.maxLength) || t('admin.org.editor.validation.password.maxLength', { length: policies.maxLength }))
  
  // Character requirements
  if (policies.requireLowercase) {
    rules.push((v: string) => /[a-z]/.test(v) || t('admin.org.editor.validation.password.lowercase'))
  }
  
  if (policies.requireUppercase) {
    rules.push((v: string) => /[A-Z]/.test(v) || t('admin.org.editor.validation.password.uppercase'))
  }
  
  if (policies.requireNumbers) {
    rules.push((v: string) => /[0-9]/.test(v) || t('admin.org.editor.validation.password.numbers'))
  }
  
  if (policies.requireSpecialChars && policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const specialCharsRegex = new RegExp(`[${escapedSpecialChars}]`)
    rules.push((v: string) => specialCharsRegex.test(v) || t('admin.org.editor.validation.password.specialChars'))
  }
  
  // Allowed characters rule - only allowed chars
  if (policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowedCharsRegex = new RegExp(`^[A-Za-z0-9${escapedSpecialChars}]+$`)
    rules.push((v: string) => allowedCharsRegex.test(v) || t('admin.org.editor.validation.password.invalidChars'))
  }
  
  return rules
})

/**
 * Dynamic username validation rules based on loaded validation rules
 */
const dynamicUsernameRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('admin.org.editor.validation.username.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.userName
  const validationRules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  validationRules.push((v: string) => !!v || t('admin.org.editor.validation.username.required'))
  
  // Length rules
  validationRules.push((v: string) => (v && v.length >= rules.minLength) || t('admin.org.editor.validation.username.minLength', { length: rules.minLength }))
  validationRules.push((v: string) => (v && v.length <= rules.maxLength) || t('admin.org.editor.validation.username.maxLength', { length: rules.maxLength }))
  
  // Character requirements
  if (rules.latinOnly) {
    validationRules.push((v: string) => /^[a-zA-Z0-9._-]+$/.test(v) || t('admin.org.editor.validation.username.latinOnly'))
  }
  
  if (!rules.allowNumbers) {
    validationRules.push((v: string) => !/[0-9]/.test(v) || t('admin.org.editor.validation.username.noNumbers'))
  }
  
  if (!rules.allowUsernameChars) {
    validationRules.push((v: string) => !/[._-]/.test(v) || t('admin.org.editor.validation.username.noSpecialChars'))
  }
  
  return validationRules
})

/**
 * Dynamic email validation rules based on loaded validation rules
 */
const dynamicEmailRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('admin.org.editor.validation.email.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.email
  const validationRules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  validationRules.push((v: string) => !!v || t('admin.org.editor.validation.email.required'))
  
  // Regex validation
  try {
    const emailRegex = new RegExp(rules.regex)
    validationRules.push((v: string) => emailRegex.test(v) || t('admin.org.editor.validation.email.format'))
  } catch (error) {
    console.error('Invalid email regex:', rules.regex, error)
    // No fallback - if regex is invalid, form will be disabled by failing validation
    validationRules.push(() => t('admin.org.editor.validation.email.invalidRegex'))
  }
  
  return validationRules
})

/**
 * Dynamic phone validation rules based on loaded validation rules
 */
const dynamicPhoneRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('admin.org.editor.validation.phone.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.telephoneNumber
  const validationRules: Array<(v: string) => string | boolean> = []
  
  // Optional field, but if provided, must match regex from public policies
  if (rules.regex) {
    try {
      const phoneRegex = new RegExp(rules.regex)
      validationRules.push((v: string) => !v || phoneRegex.test(v) || t('admin.org.editor.validation.phone.format'))
    } catch (error) {
      console.error('Invalid phone regex from public policies:', rules.regex, error)
      // No fallback - if regex is invalid, form will be disabled
      validationRules.push(() => t('admin.org.editor.validation.phone.invalidRegex'))
    }
  }
  
  return validationRules
})

watch(hasInteracted, (newValue) => {
  if (newValue && !requiredFieldsFilled.value) {
    showRequiredFieldsWarning.value = true
  }
})

watch(requiredFieldsFilled, (newValue) => {
  if (newValue && showRequiredFieldsWarning.value) {
    showRequiredFieldsWarning.value = false
    uiStore.hideSnackbar()
  }
})

watch(showRequiredFieldsWarning, (newValue) => {
  if (newValue) {
    uiStore.showInfoSnackbar(
      t('admin.org.editor.messages.validation.requiredFields'),
      { timeout: -1 }
    )
  }
})

const resetForm = () => {
  userEditorStore.resetForm()
  form.value?.reset()
  hasInteracted.value = false
  showRequiredFieldsWarning.value = false
}

const saveUser = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.org.editor.messages.validation.formErrors'))
    return
  }
  isSubmitting.value = true
  try {
    const requestData = userEditorStore.prepareRequestData()
    await createUserService.createUser(requestData)
    uiStore.showSuccessSnackbar(t('admin.org.editor.messages.success.created'))
    resetForm()
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.org.editor.messages.error.create'))
  } finally {
    isSubmitting.value = false
  }
}

const updateUser = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.org.editor.messages.validation.formErrors'))
    return
  }
  isSubmitting.value = true
  try {
    const requestData = userEditorStore.prepareUpdateData()
    const userId = (userEditorStore.mode as EditMode).userId
    const success = await updateUserService.updateUser(userId, requestData)
    if (success) {
      // Update original data to reset hasChanges state
      userEditorStore.updateOriginalData()
      uiStore.showSuccessSnackbar(t('admin.org.editor.messages.success.updated'))
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.org.editor.messages.error.update'))
  } finally {
    isSubmitting.value = false
  }
}

const resetPassword = () => { showPasswordDialog.value = true }
const closePasswordDialog = () => { showPasswordDialog.value = false }

const onPasswordFocus = () => { showPasswordPoliciesPanel.value = true }
const onPasswordBlur = () => { showPasswordPoliciesPanel.value = false }

/**
 * Load password policy settings from public API
 */
const loadPasswordPolicies = async () => {
  try {
    isLoadingPasswordPolicies.value = true
    const policies = await fetchPublicPasswordPolicies()
    currentPasswordPolicies.value = policies
  } catch (error) {
    console.error('Failed to load password policies:', error)
    // Error handling is done in the service layer
  } finally {
    isLoadingPasswordPolicies.value = false
  }
}

/**
 * Load validation rules from public API
 */
const loadValidationRules = async () => {
  try {
    isLoadingValidationRules.value = true
    const rules = await fetchPublicValidationRules()
    currentValidationRules.value = rules
  } catch (error) {
    console.error('Failed to load validation rules:', error)
    // Error handling is done in the service layer
  } finally {
    isLoadingValidationRules.value = false
  }
}

/**
 * Apply phone mask in real-time
 */
const applyPhoneMask = (value: string) => {
  if (!currentValidationRules.value?.wellKnownFields?.telephoneNumber?.mask) {
    return value
  }
  
  const mask = currentValidationRules.value.wellKnownFields.telephoneNumber.mask
  let digits = value.replace(/\D/g, '') // Remove all non-digits

  // If the mask contains fixed numeric characters (e.g. country code like '+1'),
  // and the user also typed them, skip those leading digits from the input to avoid duplication.
  // Example: mask '+1 (###) ###-####' and user input '1' -> do not treat that '1' as a digit for '#'.
  let maskIndex = 0
  let digitIndexForSkip = 0
  while (maskIndex < mask.length && digitIndexForSkip < digits.length) {
    const maskChar = mask[maskIndex]
    const inputDigit = digits[digitIndexForSkip]
    if (maskChar === '#') {
      break
    }
    // If mask has a fixed digit and user typed the same digit at the beginning, skip it from input
    if (/\d/.test(maskChar)) {
      if (maskChar === inputDigit) {
        digitIndexForSkip++
      }
    }
    maskIndex++
  }
  if (digitIndexForSkip > 0) {
    digits = digits.slice(digitIndexForSkip)
  }
  
  let maskedValue = ''
  let digitIndex = 0
  
  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '#') {
      maskedValue += digits[digitIndex]
      digitIndex++
    } else {
      maskedValue += mask[i]
    }
  }
  
  return maskedValue
}

/**
 * Phone input masking is applied in computed setter
 */

onMounted(async () => {
  // Load public settings
  await Promise.all([
    loadPasswordPolicies(),
    loadValidationRules()
  ])
  
  if (userEditorStore.mode.mode === 'create') {
    setTimeout(() => { usernameField.value?.focus() }, 100)
  }
})

onBeforeUnmount(() => {
  uiStore.hideSnackbar()
  showRequiredFieldsWarning.value = false
})
</script>

<template>
  <div class="d-flex">
    <div class="flex-grow-1 main-content-area">
      <v-card flat>
        <v-form ref="form" v-model="isFormValid">
          <v-row class="pa-4">
              <!-- User UUID and System User Info (only in edit mode) -->
              <v-col v-if="userEditorStore.mode.mode === 'edit'" cols="12">
                <div class="user-info-container mb-4">
                  <div class="user-info-item">
                    <div class="user-info-label">
                      {{ t('admin.org.editor.details.userUuid') }}:
                    </div>
                    <div class="user-info-value">
                      {{ userUuid }}
                    </div>
                    <div v-if="isSystemUser" class="user-info-value system-user">
                      {{ t('admin.org.editor.details.systemUser') }}
                    </div>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12">
                <div class="card-header">
                  <v-card-title class="text-subtitle-1">{{ t('admin.org.editor.sections.basicInfo') }}</v-card-title>
                  <v-divider class="section-divider" />
                </div>
                <v-row class="pt-3">
                  <v-col cols="12" md="6">
                    <v-text-field 
                      ref="usernameField" 
                      v-model="accountUsername" 
                      :label="t('admin.org.editor.fields.username.label')" 
                      :rules="dynamicUsernameRules" 
                      :loading="isLoadingValidationRules"
                      :disabled="!validationRulesReady || isSystemUser"
                      variant="outlined" 
                      density="comfortable" 
                      :counter="currentValidationRules?.wellKnownFields?.userName?.maxLength" 
                      required 
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field 
                      v-model="accountEmail" 
                      :label="t('admin.org.editor.fields.email.label')" 
                      :rules="dynamicEmailRules" 
                      :loading="isLoadingValidationRules"
                      :disabled="!validationRulesReady"
                      variant="outlined" 
                      density="comfortable" 
                      type="email" 
                      required 
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="accountFirstName" :label="t('admin.org.editor.fields.firstName.label')" :rules="firstNameRules" variant="outlined" density="comfortable" counter="50" required />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="accountMiddleName" :label="t('admin.org.editor.fields.middleName.label')" :rules="middleNameRules" variant="outlined" density="comfortable" counter="50" />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="accountLastName" :label="t('admin.org.editor.fields.lastName.label')" :rules="lastNameRules" variant="outlined" density="comfortable" counter="50" required />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select v-model="profileGender" :label="t('admin.org.editor.fields.gender.label')" variant="outlined" density="comfortable" :items="[
                      { title: t('admin.org.editor.fields.gender.options.male'), value: Gender.MALE },
                      { title: t('admin.org.editor.fields.gender.options.female'), value: Gender.FEMALE },
                      { title: t('admin.org.editor.fields.gender.options.notDefined'), value: Gender.NOT_DEFINED }
                    ]" item-title="title" item-value="value">
                    <template #append-inner>
                      <PhCaretUpDown class="dropdown-icon" />
                    </template>
                  </v-select>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12">
                <div class="card-header mt-6">
                  <v-card-title class="text-subtitle-1">{{ t('admin.org.editor.sections.security') }}</v-card-title>
                  <v-divider class="section-divider" />
                </div>
                <v-row class="pt-3">
                  <template v-if="userEditorStore.mode.mode === 'create'">
                    <v-col cols="12" md="5">
                      <v-text-field 
                        v-model="accountPassword" 
                        :label="t('admin.org.editor.fields.password.label')" 
                        :rules="dynamicPasswordRules"
                        :loading="isLoadingPasswordPolicies"
                        :disabled="!passwordPoliciesReady"
                        variant="outlined" 
                        density="comfortable" 
                        :type="showPassword ? 'text' : 'password'" 
                        :counter="currentPasswordPolicies?.maxLength" 
                        @focus="onPasswordFocus" 
                        @blur="onPasswordBlur" 
                      />
                    </v-col>
                    <v-col cols="12" md="5">
                      <v-text-field 
                        v-model="accountPasswordConfirm" 
                        :label="t('admin.org.editor.fields.password.confirm')" 
                        :rules="[(v) => v === accountPassword || t('admin.org.editor.validation.fields.password.mismatch')]"
                        :loading="isLoadingPasswordPolicies"
                        :disabled="!passwordPoliciesReady"
                        variant="outlined" 
                        density="comfortable" 
                        :type="showPassword ? 'text' : 'password'" 
                        :counter="currentPasswordPolicies?.maxLength" 
                        @focus="onPasswordFocus" 
                        @blur="onPasswordBlur" 
                      />
                    </v-col>
                    <v-col cols="12" md="2" class="d-flex align-center">
                      <v-btn icon variant="text" color="teal" @click="showPassword = !showPassword" class="password-toggle-btn">
                        <PhEye v-if="!showPassword" :size="18" color="teal" />
                        <PhEyeSlash v-else :size="18" color="teal" />
                      </v-btn>
                    </v-col>
                  </template>
                  
                  <!-- Password policies panel -->
                  <v-col v-if="showPasswordPoliciesPanel" cols="12" class="mb-3">
                    <PasswordPoliciesPanel />
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-select 
                      v-model="accountStatus" 
                      :label="t('admin.org.editor.fields.accountStatus.label')" 
                      variant="outlined" 
                      density="comfortable" 
                      :disabled="isSystemUser"
                      :items="[
                        { title: t('admin.org.editor.fields.accountStatus.options.active'), value: AccountStatus.ACTIVE },
                        { title: t('admin.org.editor.fields.accountStatus.options.disabled'), value: AccountStatus.DISABLED },
                        { title: t('admin.org.editor.fields.accountStatus.options.requiresAction'), value: AccountStatus.REQUIRES_USER_ACTION }
                      ]" 
                      item-title="title" 
                      item-value="value"
                    >
                    <template #append-inner>
                      <PhCaretUpDown class="dropdown-icon" />
                    </template>
                  </v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="d-flex align-center">
                      <v-btn
                        icon
                        variant="text"
                        density="comfortable"
                        :aria-pressed="accountIsStaff"
                        @click="accountIsStaff = !accountIsStaff"
                      >
                        <PhCheckSquare v-if="accountIsStaff" :size="18" color="teal" />
                        <PhSquare v-else :size="18" color="grey" />
                      </v-btn>
                      <span style="margin-left: 8px;">{{ t('admin.org.editor.fields.isStaff.label') }}</span>
                    </div>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12">
                <div class="card-header mt-6">
                  <v-card-title class="text-subtitle-1">{{ t('admin.org.editor.sections.additionalInfo') }}</v-card-title>
                  <v-divider class="section-divider" />
                </div>
                <v-row class="pt-3">
                  <v-col cols="12" md="6">
                    <v-text-field 
                      v-model="profileMobilePhone" 
                      :label="t('admin.org.editor.fields.mobilePhone.label')" 
                      :placeholder="currentValidationRules?.wellKnownFields?.telephoneNumber?.mask || t('admin.org.editor.fields.mobilePhone.placeholder')" 
                      :rules="dynamicPhoneRules"
                      :loading="isLoadingValidationRules"
                      :disabled="!validationRulesReady"
                      variant="outlined" 
                      density="comfortable"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
    </div>

    <div class="side-bar-container">
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">{{ t('admin.org.editor.sidebar.actions') }}</h3>
        <v-btn v-if="userEditorStore.mode.mode === 'create'" block color="teal" variant="outlined" :disabled="!isFormValid || isSubmitting" class="mb-3" @click="saveUser">{{ t('admin.org.editor.buttons.create') }}</v-btn>
        <v-btn 
          v-if="userEditorStore.mode.mode === 'edit'" 
          block 
          color="teal" 
          variant="outlined" 
          :disabled="!isFormValid || isSubmitting || !userEditorStore.hasChanges" 
          :class="['mb-3', { 'update-btn-glow': userEditorStore.hasChanges && isFormValid && !isSubmitting }]"
          @click="updateUser"
        >
          {{ t('admin.org.editor.buttons.update') }}
        </v-btn>
        <v-btn v-if="userEditorStore.mode.mode === 'edit'" block color="teal" variant="outlined" class="mb-3" @click="() => showPasswordDialog = true">{{ t('admin.org.editor.buttons.resetPassword') }}</v-btn>
      </div>

      <div class="sidebar-divider" />

      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">{{ t('admin.org.editor.sidebar.selectedItem') }}</h3>
        <v-btn v-if="userEditorStore.mode.mode === 'create'" block variant="outlined" class="mb-3" @click="resetForm">{{ t('admin.org.editor.buttons.reset') }}</v-btn>
      </div>
    </div>

    <v-dialog v-model="showPasswordDialog" max-width="550">
      <ChangePassword :title="t('admin.org.editor.buttons.resetPassword') + ' ' + userEditorStore.account.username" :uuid="userEditorStore.account.user_id || ''" :username="userEditorStore.account.username" :mode="PasswordChangeMode.ADMIN" :on-close="closePasswordDialog" />
    </v-dialog>
  </div>
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

/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Sidebar styles */
.side-bar-container {
  width: 280px;
  min-width: 280px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--v-theme-surface), 1);
  overflow-y: auto;
}

.side-bar-section {
  padding: 16px;
}

.sidebar-divider {
  height: 20px;
  position: relative;
  margin: 0 16px;
}

.sidebar-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.wide-btn { min-width: 240px; }

/* Password toggle button visibility */
.password-toggle-btn {
  color: #14b8a6 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.password-toggle-btn :deep(.v-btn__content) {
  color: #14b8a6 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

/* User info styles - similar to GroupEditorMembers.vue group title */
.user-info-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.user-info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.user-info-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
}

.user-info-value.system-user {
  background-color: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
  color: rgba(255, 152, 0, 0.9);
  font-weight: 500;
}

/* Update button glow animation for unsaved changes */
.update-btn-glow {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
}

@keyframes soft-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px rgba(20, 184, 166, 0.5);
    transform: scale(1.01);
  }
}

</style>
