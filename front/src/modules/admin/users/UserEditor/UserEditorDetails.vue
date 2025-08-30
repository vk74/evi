<!--
version: 1.0.0
Frontend file UserEditorDetails.vue.
Purpose: Contains the user details form and right sidebar actions for create/edit modes. Frontend file.
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserEditorStore } from './state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useUsersAdminStore } from '../state.users.admin'
import { AccountStatus, Gender, EditMode } from './types.user.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import ChangePassword from '@/core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '@/core/ui/modals/change-password/types.change.password'
import { createUserService } from './service.create.new.user'
import { updateUserService } from './service.update.user'
import { PhCaretUpDown } from '@phosphor-icons/vue'

const userEditorStore = useUserEditorStore()
const uiStore = useUiStore()
const usersSectionStore = useUsersAdminStore()
const { t } = useI18n()
const { usernameRules, emailRules, mobilePhoneRules, firstNameRules, middleNameRules, lastNameRules } = useValidationRules()

const form = ref<any>(null)
const isFormValid = ref(false)
const usernameField = ref<any>(null)
const isSubmitting = ref(false)
const showPassword = ref(false)
const hasInteracted = ref(false)
const showRequiredFieldsWarning = ref(false)
const showPasswordDialog = ref(false)

const profileGender = computed({ get: () => userEditorStore.profile.gender, set: (value) => userEditorStore.updateProfile({ gender: value }) })
const profileMobilePhone = computed({ get: () => userEditorStore.profile.mobile_phone_number, set: (value) => userEditorStore.updateProfile({ mobile_phone_number: value }) })
const profileAddress = computed({ get: () => userEditorStore.profile.address, set: (value) => userEditorStore.updateProfile({ address: value }) })
const profileCompanyName = computed({ get: () => userEditorStore.profile.company_name, set: (value) => userEditorStore.updateProfile({ company_name: value }) })
const profilePosition = computed({ get: () => userEditorStore.profile.position, set: (value) => userEditorStore.updateProfile({ position: value }) })

const accountUsername = computed({ get: () => userEditorStore.account.username, set: (value) => userEditorStore.updateAccount({ username: value }) })
const accountEmail = computed({ get: () => userEditorStore.account.email, set: (value) => userEditorStore.updateAccount({ email: value }) })
const accountFirstName = computed({ get: () => userEditorStore.account.first_name, set: (value) => userEditorStore.updateAccount({ first_name: value }) })
const accountMiddleName = computed({ get: () => userEditorStore.account.middle_name, set: (value) => userEditorStore.updateAccount({ middle_name: value }) })
const accountLastName = computed({ get: () => userEditorStore.account.last_name, set: (value) => userEditorStore.updateAccount({ last_name: value }) })
const accountPassword = computed({ get: () => userEditorStore.account.password, set: (value) => userEditorStore.updateAccount({ password: value }) })
const accountPasswordConfirm = computed({ get: () => userEditorStore.account.passwordConfirm, set: (value) => userEditorStore.updateAccount({ passwordConfirm: value }) })
const accountStatus = computed({ get: () => userEditorStore.account.account_status, set: (value) => userEditorStore.updateAccount({ account_status: value }) })
const accountIsStaff = computed({ get: () => userEditorStore.account.is_staff, set: (value) => userEditorStore.updateAccount({ is_staff: value }) })

const requiredFields = computed(() => ({
  username: userEditorStore.account.username,
  email: userEditorStore.account.email,
  first_name: userEditorStore.account.first_name,
  last_name: userEditorStore.account.last_name,
  password: userEditorStore.account.password,
  passwordConfirm: userEditorStore.account.passwordConfirm
}))

const requiredFieldsFilled = computed(() => Object.values(requiredFields.value).every(field => !!field))

const dynamicPasswordRules = computed(() => [
  (v: string) => !!v || 'пароль обязателен'
])

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
      t('admin.users.editor.messages.validation.requiredFields'),
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
    uiStore.showErrorSnackbar(t('admin.users.editor.messages.validation.formErrors'))
    return
  }
  isSubmitting.value = true
  try {
    const requestData = userEditorStore.prepareRequestData()
    await createUserService.createUser(requestData)
    uiStore.showSuccessSnackbar(t('admin.users.editor.messages.success.created'))
    resetForm()
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.users.editor.messages.error.create'))
  } finally {
    isSubmitting.value = false
  }
}

const updateUser = async () => {
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
      uiStore.showSuccessSnackbar(t('admin.users.editor.messages.success.updated'))
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.users.editor.messages.error.update'))
  } finally {
    isSubmitting.value = false
  }
}

const resetPassword = () => { showPasswordDialog.value = true }
const closePasswordDialog = () => { showPasswordDialog.value = false }

onMounted(() => {
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
    <div class="flex-grow-1">
      <v-container class="content-container">
        <v-card flat>
          <v-form ref="form" v-model="isFormValid">
            <v-row>
              <v-col cols="12">
                <div class="card-header">
                  <v-card-title class="text-subtitle-1">{{ t('admin.users.editor.sections.basicInfo') }}</v-card-title>
                  <v-divider class="section-divider" />
                </div>
                <v-row class="pt-3">
                  <v-col v-if="userEditorStore.mode.mode === 'edit'" cols="12" md="12">
                    <v-text-field v-model="userEditorStore.account.user_id" :label="t('admin.users.editor.fields.uuid.label')" variant="outlined" density="comfortable" readonly disabled />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field ref="usernameField" v-model="accountUsername" :label="t('admin.users.editor.fields.username.label')" :rules="usernameRules" variant="outlined" density="comfortable" counter="25" required />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="accountEmail" :label="t('admin.users.editor.fields.email.label')" :rules="emailRules" variant="outlined" density="comfortable" type="email" required />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="accountFirstName" :label="t('admin.users.editor.fields.firstName.label')" :rules="firstNameRules" variant="outlined" density="comfortable" counter="50" required />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="accountMiddleName" :label="t('admin.users.editor.fields.middleName.label')" :rules="middleNameRules" variant="outlined" density="comfortable" counter="50" />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="accountLastName" :label="t('admin.users.editor.fields.lastName.label')" :rules="lastNameRules" variant="outlined" density="comfortable" counter="50" required />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select v-model="profileGender" :label="t('admin.users.editor.fields.gender.label')" variant="outlined" density="comfortable" :items="[
                      { title: t('admin.users.editor.fields.gender.options.male'), value: Gender.MALE },
                      { title: t('admin.users.editor.fields.gender.options.female'), value: Gender.FEMALE },
                      { title: t('admin.users.editor.fields.gender.options.notDefined'), value: Gender.NOT_DEFINED }
                    ]" item-title="title" item-value="value">
                    <template #append-inner>
                      <PhCaretUpDown />
                    </template>
                  </v-select>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12">
                <div class="card-header mt-6">
                  <v-card-title class="text-subtitle-1">{{ t('admin.users.editor.sections.security') }}</v-card-title>
                  <v-divider class="section-divider" />
                </div>
                <v-row class="pt-3">
                  <template v-if="userEditorStore.mode.mode === 'create'">
                    <v-col cols="12" md="5">
                      <v-text-field v-model="accountPassword" :label="t('admin.users.editor.fields.password.label')" variant="outlined" density="comfortable" :type="showPassword ? 'text' : 'password'" :counter="40" />
                    </v-col>
                    <v-col cols="12" md="5">
                      <v-text-field v-model="accountPasswordConfirm" :label="t('admin.users.editor.fields.password.confirm')" :rules="[(v) => v === accountPassword || t('admin.users.editor.validation.fields.password.mismatch')]" variant="outlined" density="comfortable" :type="showPassword ? 'text' : 'password'" :counter="40" />
                    </v-col>
                    <v-col cols="12" md="2" class="d-flex align-center">
                      <v-btn icon variant="text" class="ml-n2" @click="showPassword = !showPassword"><v-icon>{{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon></v-btn>
                    </v-col>
                  </template>
                  <v-col cols="12" md="6">
                    <v-select v-model="accountStatus" :label="t('admin.users.editor.fields.accountStatus.label')" variant="outlined" density="comfortable" :items="[
                      { title: t('admin.users.editor.fields.accountStatus.options.active'), value: AccountStatus.ACTIVE },
                      { title: t('admin.users.editor.fields.accountStatus.options.disabled'), value: AccountStatus.DISABLED },
                      { title: t('admin.users.editor.fields.accountStatus.options.requiresAction'), value: AccountStatus.REQUIRES_USER_ACTION }
                    ]" item-title="title" item-value="value">
                    <template #append-inner>
                      <PhCaretUpDown />
                    </template>
                  </v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-checkbox v-model="accountIsStaff" :label="t('admin.users.editor.fields.isStaff.label')" color="teal" hide-details />
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12">
                <div class="card-header mt-6">
                  <v-card-title class="text-subtitle-1">{{ t('admin.users.editor.sections.additionalInfo') }}</v-card-title>
                  <v-divider class="section-divider" />
                </div>
                <v-row class="pt-3">
                  <v-col cols="12" md="6">
                    <v-text-field v-model="profileMobilePhone" :label="t('admin.users.editor.fields.mobilePhone.label')" :placeholder="t('admin.users.editor.fields.mobilePhone.placeholder')" :rules="mobilePhoneRules" variant="outlined" density="comfortable" />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea v-model="profileAddress" :label="t('admin.users.editor.fields.address.label')" :rules="[]" variant="outlined" rows="3" counter="5000" no-resize />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="profileCompanyName" :label="t('admin.users.editor.fields.company.label')" :rules="[]" variant="outlined" density="comfortable" readonly counter="255" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="profilePosition" :label="t('admin.users.editor.fields.position.label')" :rules="[]" variant="outlined" density="comfortable" readonly counter="255" />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-container>
    </div>

    <div class="side-bar-container">
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">{{ t('admin.users.editor.sidebar.actions') }}</h3>
        <v-btn v-if="userEditorStore.mode.mode === 'create'" block color="teal" variant="outlined" :disabled="!isFormValid || isSubmitting" class="mb-3" @click="saveUser">{{ t('admin.users.editor.buttons.create') }}</v-btn>
        <v-btn v-if="userEditorStore.mode.mode === 'edit'" block color="teal" variant="outlined" :disabled="!isFormValid || isSubmitting || !userEditorStore.hasChanges" class="mb-3" @click="updateUser">{{ t('admin.users.editor.buttons.update') }}</v-btn>
        <v-btn v-if="userEditorStore.mode.mode === 'edit'" block color="teal" variant="outlined" class="mb-3" @click="() => showPasswordDialog = true">{{ t('admin.users.editor.buttons.resetPassword') }}</v-btn>
        <v-btn v-if="userEditorStore.mode.mode === 'create'" block variant="outlined" class="mb-3 wide-btn" @click="resetForm">{{ t('admin.users.editor.buttons.reset') }}</v-btn>
      </div>
    </div>

    <v-dialog v-model="showPasswordDialog" max-width="550">
      <ChangePassword :title="t('admin.users.editor.buttons.resetPassword') + ' ' + userEditorStore.account.username" :uuid="userEditorStore.account.user_id || ''" :username="userEditorStore.account.username" :mode="PasswordChangeMode.ADMIN" :on-close="closePasswordDialog" />
    </v-dialog>
  </div>
</template>

<style scoped>
.side-bar-container { width: 18%; min-width: 220px; border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); display: flex; flex-direction: column; }
.side-bar-section { padding: 16px; }
.wide-btn { min-width: 240px; }
</style>
