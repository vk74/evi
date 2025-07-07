<!--
  UserEditor.vue
  Component for creating and editing user accounts.
  
  The component operates in two modes:
  1. Create Mode:
     - Creating a new user account with all required fields
     - Setting up initial password
     - Configuring basic user parameters and profile information
     - Form validation with required field checking
  
  2. Edit Mode:
     - Editing an existing user account details
     - Modifying user status and security settings
     - Managing user's profile information
     - Resetting user password (admin functionality)
     - Tracking changes for efficient updates
  
  Common functionality:
  - Two-level form validation:
    * Required fields validation with informational notifications
    * All fields validation based on established rules
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
import { AccountStatus, Gender, EditMode } from './types.user.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import ChangePassword from '@/core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '@/core/ui/modals/change-password/types.change.password'

// ==================== STORES ====================
const userEditorStore = useUserEditorStore()
const uiStore = useUiStore()
const { t } = useI18n()
const {
 usernameRules,
 emailRules,
 passwordRules,
 mobilePhoneRules,
 firstNameRules,
 middleNameRules,
 lastNameRules
} = useValidationRules()

// ==================== REFS & STATE ====================
/**
 * Ссылка на форму и её состояние валидации
 */
const form = ref<any>(null)  // any используем из-за особенностей типизации Vuetify
const isFormValid = ref(false)

/**
 * Ссылка на поле username для автофокуса
 */
const usernameField = ref<any>(null)

/**
 * UI состояния
 */
const isSubmitting = ref(false)       // Флаг отправки формы
const showPassword = ref(false)       // Управление видимостью пароля
const hasInteracted = ref(false)      // Флаг взаимодействия с формой
const showRequiredFieldsWarning = ref(false) // Флаг предупреждения о незаполненных полях
const showPasswordDialog = ref(false) // Флаг отображения диалога сброса пароля

// ==================== COMPUTED ====================
/**
 * Отслеживание заполнения обязательных полей
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

// Computed свойства для полей профиля с правильной реактивностью
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

// Computed свойства для полей аккаунта с правильной реактивностью
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

// ==================== WATCHERS ====================
/**
 * Отслеживание заполнения обязательных полей и управление уведомлениями
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
 * Сброс формы
 */
const resetForm = () => {
  userEditorStore.resetForm()
  form.value?.reset()
  hasInteracted.value = false
  showRequiredFieldsWarning.value = false
  console.log('Form has been reset')
}

/**
 * Отслеживание взаимодействия с полями формы
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
 * Сохранение пользователя
 */
const saveUser = async () => {
  console.log('Starting user creation...')
  
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
* Обновление данных пользователя
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
     // Не вызываем resetForm() чтобы остаться в режиме редактирования
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
* Открытие диалога сброса пароля
*/
const resetPassword = () => {
 showPasswordDialog.value = true
}

/**
* Закрытие диалога сброса пароля
*/
const closePasswordDialog = () => {
 showPasswordDialog.value = false
}

// ==================== LIFECYCLE ====================
onMounted(() => {
  console.log('UserEditor mounted')
  watchFormFields()
  
  // Автофокус на поле username только в режиме создания
  if (userEditorStore.mode.mode === 'create') {
    // Небольшая задержка для корректной работы с Vuetify
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
    <!-- App Bar с фиксированным фоном -->
    <v-app-bar
      flat
      class="editor-app-bar"
    >
      <v-spacer />
      
      <!-- Динамический заголовок в зависимости от режима -->
      <v-toolbar-title class="title-text">
        {{ userEditorStore.mode.mode === 'create' 
          ? t('admin.users.editor.title.create') 
          : t('admin.users.editor.title.edit') 
        }}
      </v-toolbar-title>
    </v-app-bar>

    <!-- Рабочая область с основной формой -->
    <div class="d-flex">
      <!-- Основное содержимое (левая часть) -->
      <div class="flex-grow-1">
        <v-container class="content-container">
          <v-card flat>
            <v-form
              ref="form"
              v-model="isFormValid"
            >
              <v-row>
                <!-- Блок 1: Основная информация -->
                <v-col cols="12">
                  <div class="card-header">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.users.editor.sections.basicInfo') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <!-- Поле UUID (только для режима редактирования) -->
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

                <!-- Временный отладочный вывод 
                <p>Current mode: {{ userEditorStore.mode.mode }}</p> -->

                <!-- Блок 2: Безопасность -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('admin.users.editor.sections.security') }}
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <!-- Поля пароля показываются только в режиме создания -->
                    <template v-if="userEditorStore.mode.mode === 'create'">
                      <v-col
                        cols="12"
                        md="5"
                      >
                        <v-text-field
                          v-model="accountPassword"
                          :label="t('admin.users.editor.fields.password.label')"
                          :rules="passwordRules"
                          variant="outlined"
                          density="comfortable"
                          :type="showPassword ? 'text' : 'password'"
                          counter="40"
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
                          counter="40"
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
                          @click="showPassword = !showPassword"
                        >
                          <v-icon>
                            {{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}
                          </v-icon>
                        </v-btn>
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

                <!-- Блок 3: Дополнительная информация -->
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
      
      <!-- Боковая панель (правая часть) -->
      <div class="side-bar-container">
        <!-- Верхняя часть боковой панели - общие действия -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.users.editor.sidebar.actions') }}
          </h3>
          
          <!-- Кнопка создания (видна только в режиме создания) -->
          <v-btn
            v-if="userEditorStore.mode.mode === 'create'"
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting"
            class="mb-3"
            @click="saveUser"
          >
            {{ t('admin.users.editor.buttons.create') }}
          </v-btn>

          <!-- Кнопка обновления (видна только в режиме редактирования) -->
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
        </div>
        
        <!-- Разделитель между секциями -->
        <div class="sidebar-divider" />
        
        <!-- Нижняя часть боковой панели - действия с формой -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.users.editor.sidebar.formActions') }}
          </h3>
          
          <!-- Кнопка сброса пароля (видна только в режиме редактирования) -->
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

          <!-- Кнопка сброса (видна только в режиме создания) -->
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

    <!-- Диалог сброса пароля -->
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

/* Стили для боковой панели */
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

/* Разделитель между секциями */
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

/* Позволяет кнопке переносить текст на новую строку при необходимости */
.v-btn .v-btn__content {
  white-space: normal !important;
  text-align: center;
  line-height: 1.1;
}
</style>