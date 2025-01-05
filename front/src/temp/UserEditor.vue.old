
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AccountStatus, Gender } from './types.user.editor'
import type { 
  IUserAccount, 
  IUserProfile, 
  ISection 
} from './types.user.editor'
import { useUserEditorStore } from './state.user.editor'
import { validator } from './validator.user.editor'

// Store
const store = useUserEditorStore()

// UI состояния
const activeSection = ref<'account' | 'profile'>('account')
const showPassword = ref(false)
const isSubmitting = ref(false)
const accountForm = ref()
const isAccountFormValid = ref(false)

// Данные пользователя
const userAccount = ref<IUserAccount>({
  username: '',
  email: '',
  password: '',
  passwordConfirm: '',
  is_staff: false,
  account_status: AccountStatus.ACTIVE,
  first_name: '',
  middle_name: null,
  last_name: '',
})

// UI состояния
const profileForm = ref()
const isProfileFormValid = ref(false)

// Данные профиля пользователя
const userProfile = ref<IUserProfile>({
  phone_number: null,
  address: null,
  company_name: null,
  position: null,
  gender: null,
  reserve1: null,
  reserve2: null,
  reserve3: null
})

// Добавить в вычисляемые свойства
const genderItems = computed(() => [
  { title: 'мужской', value: Gender.MALE },
  { title: 'женский', value: Gender.FEMALE }
])

// Вычисляемые свойства
const sections = computed<ISection[]>(() => [
  { id: 'account', title: 'учетная запись' },
  { id: 'profile', title: 'профиль' }
])

const accountStatusItems = computed(() => [
  { title: 'активна', value: AccountStatus.ACTIVE },
  { title: 'отключена', value: AccountStatus.DISABLED },
  { title: 'требует действия пользователя', value: AccountStatus.REQUIRES_USER_ACTION }
])

const isFormValid = computed(() => 
  store.isFormValid && isAccountFormValid.value
)

// Validation watchers
watch(
  [userAccount, userProfile],
  () => {
    const validationResult = validator.validateEditor(userAccount.value, userProfile.value)
    
    // Обновляем состояние в store
    store.setRequiredFieldsComplete(validationResult.requiredFieldsComplete)
    store.setUserInputsValidated(validationResult.userInputsValidated)
  },
  { deep: true }
)
</script>

<template>
  <v-container class="pa-0">
    <!-- App Bar с заголовком и кнопками -->
    <v-app-bar 
      flat
      class="editor-app-bar"
    >
      <!-- Секции -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="['section-btn', { 'section-active': activeSection === section.id }]"
          variant="text"
          @click="activeSection = section.id"
        >
          {{ section.title }}
        </v-btn>
      </div>
      
      <div class="ml-8">
        <v-btn
          color="teal"
          variant="outlined"
          :disabled="!isFormValid || isSubmitting"
          class="mr-2"
        >
          создать учетную запись
        </v-btn>
        <v-btn variant="outlined">
          сбросить поля формы
        </v-btn>
      </div>

      <v-spacer />
      <v-toolbar-title class="title-text">
        создание учетной записи
      </v-toolbar-title>
    </v-app-bar>

    <!-- Основная форма -->
    <div class="working-area">
      <!-- Секция учетной записи -->
      <v-container v-if="activeSection === 'account'" class="content-container">
        <v-card flat>
          <div class="card-header">
            <v-card-title class="text-subtitle-1">основная информация</v-card-title>
            <v-divider class="section-divider"></v-divider>
          </div>
          
          <v-card-text class="pt-3">
            <v-form ref="accountForm" v-model="isAccountFormValid">
              <v-row>
                <!-- Базовая информация -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userAccount.username"
                    label="название учетной записи*"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userAccount.email"
                    label="e-mail*"
                    variant="outlined"
                    density="comfortable"
                    type="email"
                    required
                  />
                </v-col>
                
                <!-- Пароль -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userAccount.password"
                    label="пароль*"
                    variant="outlined"
                    density="comfortable"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    counter="40"
                    required
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userAccount.passwordConfirm"
                    label="подтверждение пароля*"
                    variant="outlined"
                    density="comfortable"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    counter="40"
                    required
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>

                <!-- ФИО -->
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userAccount.first_name"
                    label="имя*"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userAccount.last_name"
                    label="фамилия*"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userAccount.middle_name"
                    label="отчество"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                  />
                </v-col>

                <!-- Статус и роль -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="userAccount.account_status"
                    label="статус учетной записи"
                    variant="outlined"
                    density="comfortable"
                    :items="accountStatusItems"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox
                    v-model="userAccount.is_staff"
                    label="работник организации"
                    color="teal"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>

      <!-- Секция профиля -->
      <v-container v-if="activeSection === 'profile'" class="content-container">
        <v-card flat>
          <div class="card-header">
            <v-card-title class="text-subtitle-1">контактная информация</v-card-title>
            <v-divider class="section-divider"></v-divider>
          </div>
          
          <v-card-text class="pt-3">
            <v-form ref="profileForm" v-model="isProfileFormValid">
              <v-row>
                <!-- Контактные данные -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.phone_number"
                    label="телефон"
                    variant="outlined"
                    density="comfortable"
                    placeholder="+7 XXX XXX XXXX"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="userProfile.address"
                    label="адрес"
                    variant="outlined"
                    rows="3"
                    counter="5000"
                    no-resize
                  />
                </v-col>

                <!-- Данные о работе -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.company_name"
                    label="название компании"
                    variant="outlined"
                    density="comfortable"
                    counter="255"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.position"
                    label="должность"
                    variant="outlined"
                    density="comfortable"
                    counter="255"
                  />
                </v-col>

                <!-- Дополнительная информация -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="userProfile.gender"
                    label="пол"
                    variant="outlined"
                    density="comfortable"
                    :items="genderItems"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>
    </div>
  </v-container>
</template>

<style scoped>
.editor-app-bar {
  background-color: #FFFFFF !important;
}

.nav-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
  min-width: 120px;
}

.section-active {
  border-bottom: 2px solid teal;
  color: rgba(0, 0, 0, 0.87) !important;
  font-weight: 500;
}

.title-text {
  margin-right: 15px;
  text-align: right;
  font-family: 'Roboto', sans-serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.6);
}

.content-container {
  margin-top: 5px;
  padding-left: 5px;
  padding-top: 0;
  padding-right: 0;
  padding-bottom: 0;
  height: 100%;
}

.card-header {
  padding: 5px 5px 0 10px;
}

.section-divider {
  border-color: rgba(0, 0, 0, 0.999) !important;
  margin-top: 5px;
  margin-bottom: 5px;
}
</style>