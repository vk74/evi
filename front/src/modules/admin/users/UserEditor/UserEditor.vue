<!--
  File: UserEditor.vue
  Version: 1.2.0
  Description: User account creation and editing component for frontend
  Purpose: Provides interface for creating new user accounts and editing existing ones with dynamic password validation
  Frontend file that manages user account forms, integrates with password policy settings, and handles validation
  
  The component operates in two modes:
  1. Create Mode:
     - Creating a new user account with all required fields
     - Setting up initial password with dynamic validation based on password policies
     - Configuring basic user parameters and profile information
     - Form validation with required field checking and password policy enforcement
  
  2. Edit Mode:
     - Editing an existing user account details
     - Modifying user status and security settings
     - Managing user's profile information
     - Resetting user password (admin functionality)
     - Tracking changes for efficient updates
  
  Common functionality:
  - Two-level form validation with password policy integration
  - Dynamic password validation rules loaded from Application.Security.PasswordPolicies
  - User interface with clear section organization
  - Responsive design for different screen sizes
-->

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useUserEditorStore } from './state.user.editor'
import { createUserService } from './service.create.new.user'
import { updateUserService } from './service.update.user'
import { useUiStore } from '@/core/state/uistate'
import { useUsersAdminStore } from '../state.users.admin'
import { AccountStatus, Gender, EditMode } from './types.user.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import ChangePassword from '@/core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '@/core/ui/modals/change-password/types.change.password'
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings'
import PasswordPoliciesPanel from '@/core/ui/panels/panel.current.password.policies.vue'

// ==================== STORES ====================
const userEditorStore = useUserEditorStore()
const uiStore = useUiStore()
const usersSectionStore = useUsersAdminStore()
const { t } = useI18n()
const {
 usernameRules,
 emailRules,
 mobilePhoneRules,
 firstNameRules,
 middleNameRules,
 lastNameRules
} = useValidationRules()

// ==================== REFS & STATE ====================
/**
 * Form reference and validation state
 */
const form = ref<any>(null)  // Using any due to Vuetify typing specifics
const isFormValid = ref(false)

/**
 * Username field reference for auto-focus
 */
const usernameField = ref<any>(null)

/**
 * UI state variables
 */
const isSubmitting = ref(false)       // Form submission flag
const showPassword = ref(false)       // Password visibility control
const hasInteracted = ref(false)      // Form interaction flag
const showRequiredFieldsWarning = ref(false) // Required fields warning flag
const showPasswordDialog = ref(false) // Password reset dialog flag

// ==================== PASSWORD POLICY STATE (FOR VALIDATION) ====================
/**
 * Password policy loading state and settings for validation purposes
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
 * Track required fields completion
 */
const requiredFields = computed(() => ({
  username: userEditorStore.account.username,
  email: userEditorStore.account.email,
  first_name: userEditorStore.account.first_name,
  last_name: userEditorStore.account.last_name,
  password: userEditorStore.account.password,
  passwordConfirm: userEditorStore.account.passwordConfirm
}))

const requiredFieldsFilled = computed(() => 
  Object.values(requiredFields.value).every(field => !!field)
)

// Computed properties for profile fields with proper reactivity
const profileGender = computed({
  get: () => userEditorStore.profile.gender,
  set: (value) => userEditorStore.updateProfile({ gender: value })
})

const profileMobilePhone = computed({
  get: () => userEditorStore.profile.mobile_phone_number,
  set: (value) => userEditorStore.updateProfile({ mobile_phone_number: value })
})

const profileAddress = computed({
  get: () => userEditorStore.profile.address,
  set: (value) => userEditorStore.updateProfile({ address: value })
})

const profileCompanyName = computed({
  get: () => userEditorStore.profile.company_name,
  set: (value) => userEditorStore.updateProfile({ company_name: value })
})

const profilePosition = computed({
  get: () => userEditorStore.profile.position,
  set: (value) => userEditorStore.updateProfile({ position: value })
})

// Computed properties for account fields with proper reactivity
const accountUsername = computed({
  get: () => userEditorStore.account.username,
  set: (value) => userEditorStore.updateAccount({ username: value })
})

const accountEmail = computed({
  get: () => userEditorStore.account.email,
  set: (value) => userEditorStore.updateAccount({ email: value })
})

const accountFirstName = computed({
  get: () => userEditorStore.account.first_name,
  set: (value) => userEditorStore.updateAccount({ first_name: value })
})

const accountMiddleName = computed({
  get: () => userEditorStore.account.middle_name,
  set: (value) => userEditorStore.updateAccount({ middle_name: value })
})

const accountLastName = computed({
  get: () => userEditorStore.account.last_name,
  set: (value) => userEditorStore.updateAccount({ last_name: value })
})

const accountPassword = computed({
  get: () => userEditorStore.account.password,
  set: (value) => userEditorStore.updateAccount({ password: value })
})

const accountPasswordConfirm = computed({
  get: () => userEditorStore.account.passwordConfirm,
  set: (value) => userEditorStore.updateAccount({ passwordConfirm: value })
})

const accountStatus = computed({
  get: () => userEditorStore.account.account_status,
  set: (value) => userEditorStore.updateAccount({ account_status: value })
})

const accountIsStaff = computed({
  get: () => userEditorStore.account.is_staff,
  set: (value) => userEditorStore.updateAccount({ is_staff: value })
})

// ==================== DYNAMIC PASSWORD VALIDATION ====================
/**
 * Dynamic password validation rules based on loaded password policies
 */
const dynamicPasswordRules = computed(() => {
  // If password policies are not loaded or there's an error, return blocking rules
  if (isLoadingPasswordPolicies.value || passwordPolicyError.value || 
      passwordMinLength.value === null || passwordMaxLength.value === null ||
      requireLowercase.value === null || requireUppercase.value === null ||
      requireNumbers.value === null || requireSpecialChars.value === null ||
      allowedSpecialChars.value === null) {
    return [
      (v: string) => !!v || 'пароль обязателен',
      () => !passwordPolicyError.value || 'настройки политики паролей не загружены - создание заблокировано'
    ]
  }

  const rules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  rules.push((v: string) => !!v || 'пароль обязателен')
  
  // Length rules
  rules.push((v: string) => (v && v.length >= passwordMinLength.value!) || `пароль должен содержать минимум ${passwordMinLength.value} символов`)
  rules.push((v: string) => (v && v.length <= passwordMaxLength.value!) || `пароль не должен превышать ${passwordMaxLength.value} символов`)
  
  // Character requirements
  if (requireLowercase.value) {
    rules.push((v: string) => /[a-z]/.test(v) || 'пароль должен содержать строчные буквы')
  }
  
  if (requireUppercase.value) {
    rules.push((v: string) => /[A-Z]/.test(v) || 'пароль должен содержать заглавные буквы')
  }
  
  if (requireNumbers.value) {
    rules.push((v: string) => /[0-9]/.test(v) || 'пароль должен содержать цифры')
  }
  
  if (requireSpecialChars.value && allowedSpecialChars.value) {
    const escapedSpecialChars = allowedSpecialChars.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const specialCharsRegex = new RegExp(`[${escapedSpecialChars}]`)
    rules.push((v: string) => specialCharsRegex.test(v) || 'пароль должен содержать специальные символы')
  }
  
  // Allowed characters rule - only allowed chars
  if (allowedSpecialChars.value) {
    const escapedSpecialChars = allowedSpecialChars.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowedCharsRegex = new RegExp(`^[A-Za-z0-9${escapedSpecialChars}]+$`)
    rules.push((v: string) => allowedCharsRegex.test(v) || 'пароль содержит недопустимые символы')
  }
  
  return rules
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

// ==================== VALIDATION RULES ====================
const addressRules = [
 (v: string) => !v || v.length <= 5000 || t('admin.users.editor.validation.fields.address.length'),
 (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || t('admin.users.editor.validation.fields.address.format')
]

const companyNameRules = [
 (v: string) => !v || v.length <= 255 || t('admin.users.editor.validation.fields.company.length'),
 (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || t('admin.users.editor.validation.fields.company.format')
]

const positionRules = [
 (v: string) => !v || v.length <= 255 || t('admin.users.editor.validation.fields.position.length'),
 (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || t('admin.users.editor.validation.fields.position.format')
]

// ==================== PASSWORD POLICY METHODS (FOR VALIDATION) ====================
/**
 * Load password policy settings from backend for validation purposes
 */
const loadPasswordPolicies = async () => {
  isLoadingPasswordPolicies.value = true
  passwordPolicyError.value = false
  
  try {
    console.log('Loading password policy settings for UserEditor validation')
    
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
      
      console.log('Password policies loaded successfully for validation:', {
        minLength: passwordMinLength.value,
        maxLength: passwordMaxLength.value,
        requireLowercase: requireLowercase.value,
        requireUppercase: requireUppercase.value,
        requireNumbers: requireNumbers.value,
        requireSpecialChars: requireSpecialChars.value,
        allowedSpecialChars: allowedSpecialChars.value
      })
    } else {
      throw new Error('No password policy settings found')
    }
  } catch (error) {
    console.error('Failed to load password policies for validation:', error)
    passwordPolicyError.value = true
    uiStore.showErrorSnackbar('ошибка загрузки настроек политики паролей - создание пользователя заблокировано')
  } finally {
    isLoadingPasswordPolicies.value = false
  }
}

// ==================== WATCHERS ====================
/**
 * Track required fields completion and manage notifications
 */
watch(hasInteracted, (newValue) => {
  if (newValue && !requiredFieldsFilled.value) {
    showRequiredFieldsWarning.value = true
  }
}, { immediate: false })

watch(requiredFieldsFilled, (newValue) => {
  if (newValue && showRequiredFieldsWarning.value) {
    showRequiredFieldsWarning.value = false
    uiStore.hideSnackbar()
  }
}, { immediate: false })

watch(showRequiredFieldsWarning, (newValue) => {
  if (newValue) {
    uiStore.showInfoSnackbar(
      t('admin.users.editor.messages.validation.requiredFields'),  
      { timeout: -1 }
    )
  }
})

// ==================== METHODS ====================

/**
 * Reset form to initial state
 */
const resetForm = () => {
  userEditorStore.resetForm()
  form.value?.reset()
  hasInteracted.value = false
  showRequiredFieldsWarning.value = false
  console.log('Form has been reset')
}

/**
 * Setup form field interaction watchers
 */
const watchFormFields = () => {
  const fieldsToWatch = Object.keys(requiredFields.value)
  fieldsToWatch.forEach(field => {
    watch(() => requiredFields.value[field], () => {
      if (!hasInteracted.value) {
        hasInteracted.value = true
      }
    })
  })
}

/**
 * Save new user account
 */
const saveUser = async () => {
  console.log('Starting user creation...')
  
  // Check if password policies are ready
  if (!passwordPoliciesReady.value) {
    uiStore.showErrorSnackbar('настройки политики паролей не загружены - создание заблокировано')
    return
  }
  
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.users.editor.messages.validation.formErrors'))
    return
  }

  isSubmitting.value = true
  
  try {
    const requestData = userEditorStore.prepareRequestData()
    const userId = await createUserService.createUser(requestData)
    
    console.log('User created successfully:', userId)
    uiStore.showSuccessSnackbar(t('admin.users.editor.messages.success.created'))
    resetForm()
    
  } catch (error) {
    console.error('Error creating user:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : t('admin.users.editor.messages.error.create')
    )
  } finally {
    isSubmitting.value = false
  }
}

/**
* Update existing user data
*/
const updateUser = async () => {
 console.log('Starting user update...')
 
 if (!form.value?.validate()) {
   uiStore.showErrorSnackbar(t('admin.users.editor.messages.validation.formErrors'))
   return
 }

 isSubmitting.value = true
 
 try {
   const requestData = userEditorStore.prepareUpdateData()
   const userId = (userEditorStore.mode as EditMode).userId
   const success = await updateUserService.updateUser(userId, requestData)
   
   if (success) {
     console.log('User updated successfully')
     uiStore.showSuccessSnackbar(t('admin.users.editor.messages.success.updated'))
     // Don't call resetForm() to stay in edit mode
   }
   
 } catch (error) {
   console.error('Error updating user:', error)
   uiStore.showErrorSnackbar(
     error instanceof Error ? error.message : t('admin.users.editor.messages.error.update')
   )
 } finally {
   isSubmitting.value = false
 }
}

/**
* Open password reset dialog
*/
const resetPassword = () => {
 showPasswordDialog.value = true
}

/**
* Close password reset dialog
*/
const closePasswordDialog = () => {
 showPasswordDialog.value = false
}

/**
* Cancel editing and return to users list
*/
const cancelEdit = () => {
  // Reset form to initial state
  resetForm()
  // Set mode back to create
  userEditorStore.mode = { mode: 'create' }
  // Switch to users list
  usersSectionStore.setActiveSection('users-proto')
  console.log('Edit cancelled, returning to users list')
}

// ==================== LIFECYCLE ====================
onMounted(() => {
  console.log('UserEditor mounted')
  watchFormFields()
  
  // Load password policies for create mode
  if (userEditorStore.mode.mode === 'create') {
    loadPasswordPolicies()
  }
  
  // Auto-focus on username field only in create mode
  if (userEditorStore.mode.mode === 'create') {
    // Small delay for proper Vuetify integration
    setTimeout(() => {
      usernameField.value?.focus()
    }, 100)
  }
})

onBeforeUnmount(() => {
 uiStore.hideSnackbar()
 showRequiredFieldsWarning.value = false
})
</script>

<template>
  <v-container class="pa-0">
    <!-- App Bar with fixed background -->
    <v-app-bar
      flat
      class="editor-app-bar"
    >
      <v-spacer />
      
      <!-- Dynamic title based on mode -->
      <v-toolbar-title class="title-text">
        {{ userEditorStore.mode.mode === 'create' 
          ? t('admin.users.editor.title.create') 
          : t('admin.users.editor.title.edit') 
        }}
      </v-toolbar-title>
    </v-app-bar>

    <!-- Work area with main form -->
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1">
        <v-container class="content-container">
          <v-card flat>
            <v-form
              ref="form"
              v-model="isFormValid"
            >
              <v-row>
                <!-- Block 1: Basic information -->
                <v-col cols="12">
                  <div class="card-header">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.users.editor.sections.basicInfo') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <!-- UUID field (only for edit mode) -->
                    <v-col
                      v-if="userEditorStore.mode.mode === 'edit'"
                      cols="12"
                      md="12"
                    >
                      <v-text-field
                        v-model="userEditorStore.account.user_id"
                        :label="t('admin.users.editor.fields.uuid.label')"
                        variant="outlined"
                        density="comfortable"
                        readonly
                        disabled
                      />
                    </v-col>

                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        ref="usernameField"
                        v-model="accountUsername"
                        :label="t('admin.users.editor.fields.username.label')"
                        :rules="usernameRules"
                        variant="outlined"
                        density="comfortable"
                        counter="25"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="accountEmail"
                        :label="t('admin.users.editor.fields.email.label')"
                        :rules="emailRules"
                        variant="outlined"
                        density="comfortable"
                        type="email"
                        required
                      />
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="accountFirstName"
                        :label="t('admin.users.editor.fields.firstName.label')"
                        :rules="firstNameRules"
                        variant="outlined"
                        density="comfortable"
                        counter="50"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="accountMiddleName"
                        :label="t('admin.users.editor.fields.middleName.label')"
                        :rules="middleNameRules"
                        variant="outlined"
                        density="comfortable"
                        counter="50"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="accountLastName"
                        :label="t('admin.users.editor.fields.lastName.label')"
                        :rules="lastNameRules"
                        variant="outlined"
                        density="comfortable"
                        counter="50"
                        required
                      />
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-select
                        v-model="profileGender"
                        :label="t('admin.users.editor.fields.gender.label')"
                        variant="outlined"
                        density="comfortable"
                        :items="[
                          { title: t('admin.users.editor.fields.gender.options.male'), value: Gender.MALE },
                          { title: t('admin.users.editor.fields.gender.options.female'), value: Gender.FEMALE },
                          { title: t('admin.users.editor.fields.gender.options.notDefined'), value: Gender.NOT_DEFINED }
                        ]"
                        item-title="title"
                        item-value="value"
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Block 2: Security -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.users.editor.sections.security') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <!-- Password fields shown only in create mode -->
                    <template v-if="userEditorStore.mode.mode === 'create'">
                      <v-col
                        cols="12"
                        md="5"
                      >
                        <v-text-field
                          v-model="accountPassword"
                          :label="t('admin.users.editor.fields.password.label')"
                          :rules="dynamicPasswordRules"
                          variant="outlined"
                          density="comfortable"
                          :type="showPassword ? 'text' : 'password'"
                          :counter="passwordMaxLength || 40"
                          :loading="isLoadingPasswordPolicies"
                          :disabled="!passwordPoliciesReady"
                          required
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="5"
                      >
                        <v-text-field
                          v-model="accountPasswordConfirm"
                          :label="t('admin.users.editor.fields.password.confirm')"
                          :rules="[(v) => v === accountPassword || t('admin.users.editor.validation.fields.password.mismatch')]"
                          variant="outlined"
                          density="comfortable"
                          :type="showPassword ? 'text' : 'password'"
                          :counter="passwordMaxLength || 40"
                          :loading="isLoadingPasswordPolicies"
                          :disabled="!passwordPoliciesReady"
                          required
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="2"
                        class="d-flex align-center"
                      >
                        <v-btn
                          icon
                          variant="text"
                          class="ml-n2"
                          :disabled="!passwordPoliciesReady"
                          @click="showPassword = !showPassword"
                        >
                          <v-icon>
                            {{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}
                          </v-icon>
                        </v-btn>
                      </v-col>
                      
                      <!-- Password policy information panel -->
                      <v-col
                        cols="12"
                        class="pt-0"
                      >
                        <PasswordPoliciesPanel class="mt-2" />
                      </v-col>
                    </template>
                    
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="accountStatus"
                        :label="t('admin.users.editor.fields.accountStatus.label')"
                        variant="outlined"
                        density="comfortable"
                        :items="[
                          { title: t('admin.users.editor.fields.accountStatus.options.active'), value: AccountStatus.ACTIVE },
                          { title: t('admin.users.editor.fields.accountStatus.options.disabled'), value: AccountStatus.DISABLED },
                          { title: t('admin.users.editor.fields.accountStatus.options.requiresAction'), value: AccountStatus.REQUIRES_USER_ACTION }
                        ]"
                        item-title="title"
                        item-value="value"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-checkbox
                        v-model="accountIsStaff"
                        :label="t('admin.users.editor.fields.isStaff.label')"
                        color="teal"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Block 3: Additional information -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.users.editor.sections.additionalInfo') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profileMobilePhone"
                        :label="t('admin.users.editor.fields.mobilePhone.label')"
                        :placeholder="t('admin.users.editor.fields.mobilePhone.placeholder')"
                        :rules="mobilePhoneRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="profileAddress"
                        :label="t('admin.users.editor.fields.address.label')"
                        :rules="addressRules"
                        variant="outlined"
                        rows="3"
                        counter="5000"
                        no-resize
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profileCompanyName"
                        :label="t('admin.users.editor.fields.company.label')"
                        :rules="companyNameRules"
                        variant="outlined"
                        density="comfortable"
                        readonly
                        counter="255"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profilePosition"
                        :label="t('admin.users.editor.fields.position.label')"
                        :rules="positionRules"
                        variant="outlined"
                        density="comfortable"
                        readonly
                        counter="255"
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-form>
          </v-card>
        </v-container>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Upper part of sidebar - general actions -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.users.editor.sidebar.actions') }}
          </h3>
          
          <!-- Create button (visible only in create mode) -->
          <v-btn
            v-if="userEditorStore.mode.mode === 'create'"
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting || !passwordPoliciesReady"
            class="mb-3"
            @click="saveUser"
          >
            {{ t('admin.users.editor.buttons.create') }}
          </v-btn>

          <!-- Update button (visible only in edit mode) -->
          <v-btn
            v-if="userEditorStore.mode.mode === 'edit'"
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting || !userEditorStore.hasChanges"
            class="mb-3"
            @click="updateUser"
          >
            {{ t('admin.users.editor.buttons.update') }}
          </v-btn>

          <!-- Cancel edit button (visible only in edit mode) -->
          <v-btn
            v-if="userEditorStore.mode.mode === 'edit'"
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="cancelEdit"
          >
            {{ t('admin.users.editor.buttons.cancelEdit') }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Lower part of sidebar - form actions -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.users.editor.sidebar.formActions') }}
          </h3>
          
          <!-- Password reset button (visible only in edit mode) -->
          <v-btn
            v-if="userEditorStore.mode.mode === 'edit'"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            @click="resetPassword"
          >
            {{ t('admin.users.editor.buttons.resetPassword') }}
          </v-btn>

          <!-- Reset button (visible only in create mode) -->
          <v-btn
            v-if="userEditorStore.mode.mode === 'create'"
            block
            variant="outlined"
            class="mb-3 wide-btn"
            @click="resetForm"
          >
            {{ t('admin.users.editor.buttons.reset') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Password reset dialog -->
    <v-dialog
      v-model="showPasswordDialog"
      max-width="550"
    >
      <ChangePassword
        :title="t('admin.users.editor.buttons.resetPassword') + ' ' + userEditorStore.account.username"
        :uuid="userEditorStore.account.user_id || ''"
        :username="userEditorStore.account.username"
        :mode="PasswordChangeMode.ADMIN"
        :on-close="closePasswordDialog"
      />
    </v-dialog>
  </v-container>
</template>

<style scoped>
.title-text {
margin-right: 15px;
text-align: right;
font-family: 'Roboto', sans-serif;
font-size: 1.1rem;
font-weight: 300;
letter-spacing: 0.5px;
color: rgba(0, 0, 0, 0.6);
}

/* Sidebar styles */
.side-bar-container {
  width: 18%;
  min-width: 220px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
}

.side-bar-section {
  padding: 16px;
}

/* Divider between sections */
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

.wide-btn {
  min-width: 240px;
}

/* Allow button to wrap text to new line when needed */
.v-btn .v-btn__content {
  white-space: normal !important;
  text-align: center;
  line-height: 1.1;
}
</style>