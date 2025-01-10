<!--
  UserEditor.vue
  Компонент для создания и редактирования учетных записей пользователей.
  
  Функциональность:
  - Создание новой учетной записи пользователя
  - Редактирование существующей учетной записи
  - Управление основными параметрами пользователя
  - Двухуровневая валидация формы:
    * Контроль заполнения обязательных полей с информационным уведомлением
    * Валидация всех полей по установленным правилам
  - Управление участием пользователя в группах (только в режиме редактирования)
-->

 <script setup lang="ts">
 import { ref, computed, onMounted, watch } from 'vue'
 import { useUserEditorStore } from './state.user.editor'
 import { createUserService } from './service.create.new.user'
 import { useUiStore } from '@/core/state/uistate'
 import { AccountStatus, Gender } from './types.user.editor'
 import { usernameRules, emailRules, passwordRules, mobilePhoneRules } from '@/core/validation/rules.common.fields'
 
 // ==================== STORES ====================
 const userEditorStore = useUserEditorStore()
 const uiStore = useUiStore()
 
 // ==================== REFS & STATE ====================
 /**
  * Ссылка на форму и её состояние валидации
  */
 const form = ref<any>(null)  // any используем из-за особенностей типизации Vuetify
 const isFormValid = ref(false)
 
 /**
  * UI состояния
  */
 const isSubmitting = ref(false)       // Флаг отправки формы
 const showPassword = ref(false)       // Управление видимостью пароля
 const hasInteracted = ref(false)      // Флаг взаимодействия с формой
 const showRequiredFieldsWarning = ref(false) // Флаг предупреждения о незаполненных полях
 
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
 
 // ==================== VALIDATION RULES ====================
 /**
  * Регулярные выражения для валидации
  */
 const nameRegex = /^[a-zA-Zа-яА-Я\- ]+$/

 const firstNameRules = [
   (v: string) => !!v || 'имя обязательно',
   (v: string) => (v && v.length >= 2) || 'имя должно быть не короче 2 символов',
   (v: string) => (v && v.length <= 50) || 'имя не может быть длиннее 50 символов',
   (v: string) => !v || nameRegex.test(v) || 'имя может содержать только буквы, пробелы и дефис'
 ]
 
 const middleNameRules = [
   (v: string) => !v || v.length <= 50 || 'отчество не может быть длиннее 50 символов',
   (v: string) => !v || nameRegex.test(v) || 'отчество может содержать только буквы, пробелы и дефис'
 ]
 
 const lastNameRules = [
   (v: string) => !!v || 'фамилия обязательна',
   (v: string) => (v && v.length >= 2) || 'фамилия должна быть не короче 2 символов',
   (v: string) => (v && v.length <= 50) || 'фамилия не может быть длиннее 50 символов',
   (v: string) => !v || nameRegex.test(v) || 'фамилия может содержать только буквы, пробелы и дефис'
 ]
 
 const addressRules = [
   (v: string) => !v || v.length <= 5000 || 'адрес не может быть длиннее 5000 символов',
   (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || 'адрес содержит недопустимые символы'
 ]
 
 const companyNameRules = [
   (v: string) => !v || v.length <= 255 || 'название компании не может быть длиннее 255 символов',
   (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || 'название компании содержит недопустимые символы'
 ]
 
 const positionRules = [
   (v: string) => !v || v.length <= 255 || 'должность не может быть длиннее 255 символов',
   (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || 'должность содержит недопустимые символы'
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
       'заполните обязательные поля, отмеченные звездочкой (*)', 
       { timeout: -1 }
     )
   }
 })
 
 // ==================== METHODS ====================
 /**
  * Форматирование и обработка телефонного номера
  */
 const formatPhoneNumber = (number: string): string => {
   const cleaned = number.replace(/[^\d\s]/g, '')
   return cleaned ? '+' + cleaned : '+'
 }
 
 /*
 const normalizePhoneNumber = (phone: string | null): string | null => {
   if (!phone) return null
   return '+' + phone.replace(/[^\d]/g, '')
 }
 
 const handlePhoneInput = (event: Event) => {
   const input = (event.target as HTMLInputElement).value
   userEditorStore.updateProfile({
     phone_number: formatPhoneNumber(input.startsWith('+') ? input.slice(1) : input)
   })
 }
 
 const handlePhoneFocus = () => {
   if (!userEditorStore.profile.phone_number) {
     userEditorStore.updateProfile({ phone_number: '+' })
   }
 }
 */

  /**
   * Загрузка данных пользователя для редактирования
   */
  const loadUserData = async (userId: string) => {
    try {
      await loadUserService.fetchUserById(userId)
    } catch (error) {
      uiStore.showErrorSnackbar(
        error instanceof Error ? error.message : 'Ошибка загрузки данных пользователя',
        { timeout: 15000 }
      )
    }
  }


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
     uiStore.showErrorSnackbar('пожалуйста, проверьте правильность заполнения полей')
     return
   }
 
   isSubmitting.value = true
   
   try {
     const requestData = userEditorStore.prepareRequestData()
     const userId = await createUserService.createUser(requestData)
     
     console.log('User created successfully:', userId)
     uiStore.showSuccessSnackbar('учетная запись пользователя создана')
     resetForm()
     
   } catch (error) {
     console.error('Error creating user:', error)
     uiStore.showErrorSnackbar(
       error instanceof Error ? error.message : 'ошибка создания учетной записи'
     )
   } finally {
     isSubmitting.value = false
   }
 }
 
 // ==================== LIFECYCLE ====================
 onMounted(() => {
   console.log('UserEditor mounted')
   watchFormFields()
 })
 </script>

<template>
  <v-container class="pa-0">
    <!-- App Bar с фиксированным фоном -->
    <v-app-bar flat class="editor-app-bar">
      <div style="margin-left: 15px;">
        <!-- Кнопка создания (видна только в режиме создания) -->
        <v-btn
          v-if="userEditorStore.mode.mode === 'create'"
          color="teal"
          variant="outlined"
          @click="saveUser"
          :disabled="!isFormValid || isSubmitting"
          class="mr-2"
        >
          создать
        </v-btn>

        <!-- Кнопка обновления (видна только в режиме редактирования) -->
        <v-btn
          v-if="userEditorStore.mode.mode === 'edit'"
          color="teal"
          variant="outlined"
          @click="updateUser"
          :disabled="!isFormValid || isSubmitting"
          class="mr-2"
        >
          обновить данные пользователя
        </v-btn>

        <!-- Кнопка сброса (видна всегда) -->
        <v-btn
          variant="outlined"
          @click="resetForm"
        >
          сбросить поля формы
        </v-btn>
      </div>

      <v-spacer></v-spacer>
      
      <!-- Динамический заголовок в зависимости от режима -->
      <v-toolbar-title class="title-text">
        {{ userEditorStore.mode.mode === 'create' ? 'создание учетной записи' : 'редактирование учетной записи' }}
      </v-toolbar-title>
    </v-app-bar>

    <!-- Рабочая область с основной формой -->
    <v-container class="content-container">
      <v-card flat>
        <v-form ref="form" v-model="isFormValid">
          <v-row>
            <!-- Блок 1: Основная информация -->
            <v-col cols="12">
              <div class="card-header">
                <v-card-title class="text-subtitle-1">основная информация</v-card-title>
                <v-divider class="section-divider"></v-divider>
              </div>

              <v-row class="pt-3">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userEditorStore.account.username"
                    label="название учетной записи*"
                    :rules="usernameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="25"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userEditorStore.account.email"
                    label="e-mail*"
                    :rules="emailRules"
                    variant="outlined"
                    density="comfortable"
                    type="email"
                    required
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userEditorStore.account.first_name"
                    label="имя*"
                    :rules="firstNameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userEditorStore.account.middle_name"
                    label="отчество"
                    :rules="middleNameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userEditorStore.account.last_name"
                    label="фамилия*"
                    :rules="lastNameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                    required
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="userEditorStore.profile.gender"
                    label="пол"
                    variant="outlined"
                    density="comfortable"
                    :items="[
                      { title: 'мужской', value: Gender.MALE },
                      { title: 'женский', value: Gender.FEMALE }
                    ]"
                    item-title="title"
                    item-value="value"
                  />
                </v-col>
              </v-row>
            </v-col>

            <!-- Блок 2: Безопасность -->
            <v-col cols="12">
              <div class="card-header mt-6">
                <v-card-title class="text-subtitle-1">безопасность</v-card-title>
                <v-divider class="section-divider"></v-divider>
              </div>

              <v-row class="pt-3">
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="userEditorStore.account.password"
                    label="пароль*"
                    :rules="passwordRules"
                    variant="outlined"
                    density="comfortable"
                    :type="showPassword ? 'text' : 'password'"
                    counter="40"
                    required
                  />
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field
                    v-model="userEditorStore.account.passwordConfirm"
                    label="подтверждение пароля*"
                    :rules="[(v) => v === userEditorStore.account.password || 'пароли не совпадают']"
                    variant="outlined"
                    density="comfortable"
                    :type="showPassword ? 'text' : 'password'"
                    counter="40"
                    required
                  />
                </v-col>
                <v-col cols="12" md="2" class="d-flex align-center">
                  <v-btn
                    icon
                    variant="text"
                    @click="showPassword = !showPassword"
                    class="ml-n2"
                  >
                    <v-icon>
                      {{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}
                    </v-icon>
                  </v-btn>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="userEditorStore.account.account_status"
                    label="статус учетной записи"
                    variant="outlined"
                    density="comfortable"
                    :items="[
                      { title: 'активна', value: AccountStatus.ACTIVE },
                      { title: 'отключена', value: AccountStatus.DISABLED },
                      { title: 'требует действия пользователя', value: AccountStatus.REQUIRES_USER_ACTION }
                    ]"
                    item-title="title"
                    item-value="value"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="userEditorStore.account.is_staff"
                    label="работник организации"
                    color="teal"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-col>

            <!-- Блок 3: Дополнительная информация -->
            <v-col cols="12">
              <div class="card-header mt-6">
                <v-card-title class="text-subtitle-1">дополнительная информация</v-card-title>
                <v-divider class="section-divider"></v-divider>
              </div>

              <v-row class="pt-3">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userEditorStore.profile.mobile_phone_number"
                    label="мобильный телефон"
                    :rules="mobilePhoneRules"
                    variant="outlined"
                    density="comfortable"
                    placeholder="+7 XXX XXX XXXX"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="userEditorStore.profile.address"
                    label="адрес"
                    :rules="addressRules"
                    variant="outlined"
                    rows="3"
                    counter="5000"
                    no-resize
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userEditorStore.profile.company_name"
                    label="название компании"
                    :rules="companyNameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="255"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userEditorStore.profile.position"
                    label="должность"
                    :rules="positionRules"
                    variant="outlined"
                    density="comfortable"
                    counter="255"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </v-container>
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
</style>