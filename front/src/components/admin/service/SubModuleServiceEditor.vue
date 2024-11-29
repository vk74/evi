<template>
  <v-container class="pa-0">
    <v-app-bar app flat class="app-bar">
      <div style="margin-left: 15px;">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="['section-btn', { 'section-active': activeSection === section.id }]"
          variant="text"
          @click="activeSection = section.id"
        >
          <v-icon start>{{ section.icon }}</v-icon>
          {{ section.title }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-toolbar-title class="title-text">создание сервиса</v-toolbar-title>
    </v-app-bar>

    <v-container class="content-container">

      <!-- Секция Описание -->
      <v-card v-if="activeSection === 'description'" flat>
        <div class="card-header">
          <v-card-title class="text-subtitle-1">основные данные сервиса</v-card-title>
          <v-divider class="section-divider"></v-divider>
        </div>
        <v-card-text class="pt-3">
          <v-row>
            <v-col cols="12" md="6">
              <v-tooltip text="от 3 до 250 символов" location="top">
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    v-model="serviceName"
                    label="название сервиса*"
                    variant="outlined"
                    density="comfortable"
                  />
                </template>
              </v-tooltip>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="status"
                label="статус*"
                variant="outlined"
                density="comfortable"
                :items="statusItems"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="visibility"
                label="видимость*"
                variant="outlined"
                density="comfortable"
                :items="visibilityItems"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="priority"
                label="приоритет*"
                variant="outlined"
                density="comfortable"
                :items="priorityItems"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" md="6">
              <v-tooltip text="для отображения на плитке каталога в свернутом виде" location="top">
                <template v-slot:activator="{ props }">
                  <v-textarea
                    v-bind="props"
                    v-model="shortDescription"
                    label="краткое описание"
                    variant="outlined"
                    rows="3"
                  />
                </template>
              </v-tooltip>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="purpose"
                label="назначение сервиса"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-tooltip text="для отображения на плитке каталога в развернутом виде" location="top">
                <template v-slot:activator="{ props }">
                  <v-textarea
                    v-bind="props"
                    v-model="fullDescription"
                    label="подробное описание"
                    variant="outlined"
                    rows="4"
                  />
                </template>
              </v-tooltip>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="comments"
                label="комментарии"
                variant="outlined"
                rows="2"
              />
            </v-col>
          </v-row>
          <!-- Кнопка сохранения -->
          <v-row class="mt-4">
            <v-col cols="12" class="d-flex">
              <v-btn
                color="teal"
                variant="elevated"
                size="large"
                prepend-icon="mdi-content-save-outline"
                @click="submitDescriptionSection"
                :loading="isSaving"
                :disabled="isSaving"
              >
                {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Секция Визуализация -->
      <v-card v-if="activeSection === 'visualization'" flat>
        <div class="card-header">
          <v-card-title class="text-subtitle-1">отображение карточки сервиса в каталоге</v-card-title>
          <v-divider class="section-divider"></v-divider>
        </div>
        <v-card-text class="pt-3">
          <v-row>
            <v-col cols="12">
              <div class="tile-section-label">плитка сервиса в закрытом состоянии</div>
            </v-col>
            <v-col cols="12">
              <div class="dimensions-group">
                <v-tooltip text="ширина плитки в закрытом виде" location="top">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="closedWidth"
                      label="ширина*"
                      variant="outlined"
                      type="number"
                      density="comfortable"
                      class="number-field"
                      :rules="[rules.required, rules.integer, rules.range]"
                      :error-messages="closedWidthError"
                      @input="validateField('closedWidth')"
                      min="0"
                      max="99"
                    />
                  </template>
                </v-tooltip>
                
                <v-tooltip text="высота плитки в закрытом виде" location="top" class="ml-4">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="closedHeight"
                      label="высота*"
                      variant="outlined"
                      type="number"
                      density="comfortable"
                      class="number-field"
                      :rules="[rules.required, rules.integer, rules.range]"
                      :error-messages="closedHeightError"
                      @input="validateField('closedHeight')"
                      min="0"
                      max="99"
                    />
                  </template>
                </v-tooltip>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <div class="tile-section-label">плитка сервиса в раскрытом состоянии</div>
            </v-col>
            <v-col cols="12">
              <div class="dimensions-group">
                <v-tooltip text="ширина плитки в раскрытом виде" location="top">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="openWidth"
                      label="ширина*"
                      variant="outlined"
                      type="number"
                      density="comfortable"
                      class="number-field"
                      :rules="[rules.required, rules.integer, rules.range]"
                      :error-messages="openWidthError"
                      @input="validateField('openWidth')"
                      min="0"
                      max="99"
                    />
                  </template>
                </v-tooltip>
                
                <v-tooltip text="высота плитки в раскрытом виде" location="top" class="ml-4">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="openHeight"
                      label="высота*"
                      variant="outlined"
                      type="number"
                      density="comfortable"
                      class="number-field"
                      :rules="[rules.required, rules.integer, rules.range]"
                      :error-messages="openHeightError"
                      @input="validateField('openHeight')"
                      min="0"
                      max="99"
                    />
                  </template>
                </v-tooltip>
              </div>
            </v-col>
          </v-row>

          <!-- Кнопка сохранения -->
          <v-row class="mt-4">
            <v-col cols="12" class="d-flex">
              <v-btn
                color="teal"
                variant="elevated"
                size="large"
                prepend-icon="mdi-content-save-outline"
              >
                сохранить
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Секция Доступ -->
      <v-card v-if="activeSection === 'access'" flat>
        <div class="card-header">
          <v-card-title class="text-subtitle-1">контроль доступа для сервиса</v-card-title>
          <v-divider class="section-divider"></v-divider>
        </div>
        <v-card-text class="pt-3">
          <v-row>
            <v-col cols="12">
              <div class="access-section">
                <div class="d-flex align-center mb-2">
                  <span class="text-subtitle-2">группы с разрешенным доступом</span>
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-account-multiple-plus-outline"
                    class="ml-4"
                    color="rgba(0, 0, 0, 0.6)"
                    density="comfortable"
                  >
                    добавить группу
                  </v-btn>
                </div>
                <div class="selected-items">
                  <v-chip
                    v-for="(group, index) in allowedGroups"
                    :key="index"
                    variant="outlined"
                    closable
                    class="ma-1"
                    color="rgba(0, 0, 0, 0.6)"
                    @click:close="removeAllowedGroup(index)"
                  >
                    {{ group }}
                  </v-chip>
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <div class="access-section">
                <div class="d-flex align-center mb-2">
                  <span class="text-subtitle-2">группы с запрещенным доступом</span>
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-account-multiple-plus-outline"
                    class="ml-4"
                    color="rgba(0, 0, 0, 0.6)"
                    density="comfortable"
                  >
                    добавить группу
                  </v-btn>
                </div>
                <div class="selected-items">
                  <v-chip
                    v-for="(group, index) in deniedGroups"
                    :key="index"
                    variant="outlined"
                    closable
                    class="ma-1"
                    color="rgba(0, 0, 0, 0.6)"
                    @click:close="removeDeniedGroup(index)"
                  >
                    {{ group }}
                  </v-chip>
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <div class="access-section">
                <div class="d-flex align-center mb-2">
                  <span class="text-subtitle-2">пользователи с запрещенным доступом</span>
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-account-plus-outline"
                    class="ml-4"
                    color="rgba(0, 0, 0, 0.6)"
                    density="comfortable"
                  >
                    добавить пользователя
                  </v-btn>
                </div>
                <div class="selected-items">
                  <v-chip
                    v-for="(user, index) in deniedUsers"
                    :key="index"
                    variant="outlined"
                    closable
                    class="ma-1"
                    color="rgba(0, 0, 0, 0.6)"
                    @click:close="removeDeniedUser(index)"
                  >
                    {{ user }}
                  </v-chip>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Кнопка сохранения -->
          <v-row class="mt-4">
            <v-col cols="12" class="d-flex">
              <v-btn
                color="teal"
                variant="elevated"
                size="large"
                prepend-icon="mdi-content-save-outline"
              >
                сохранить
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Секция Управление -->
      <v-card v-if="activeSection === 'management'" flat>
      <div class="card-header">
        <v-card-title class="text-subtitle-1">ответственные лица</v-card-title>
        <v-divider class="section-divider"></v-divider>
      </div>
      <v-card-text class="pt-3">
        <v-row>
          <v-col cols="12">
            <div class="access-section">
              <div class="d-flex align-center mb-2">
                <span class="text-subtitle-2">владелец сервиса*</span>
                <v-btn
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-account-plus-outline"
                  class="ml-4"
                  color="rgba(0, 0, 0, 0.6)"
                  density="comfortable"
                >
                  выбрать владельца
                </v-btn>
              </div>
              <div class="selected-items">
                <v-chip
                  v-if="serviceOwner"
                  variant="outlined"
                  closable
                  class="ma-1"
                  color="rgba(0, 0, 0, 0.6)"
                  @click:close="removeServiceOwner"
                >
                  <template v-slot:prepend>
                    <v-avatar size="24" color="primary" class="mr-1">
                      <span class="text-caption">{{ getInitials(serviceOwner.name) }}</span>
                    </v-avatar>
                  </template>
                  {{ serviceOwner.name }}
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <div class="access-section">
              <div class="d-flex align-center mb-2">
                <span class="text-subtitle-2">резервный владелец</span>
                <v-btn
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-account-plus-outline"
                  class="ml-4"
                  color="rgba(0, 0, 0, 0.6)"
                  density="comfortable"
                >
                  выбрать владельца
                </v-btn>
              </div>
              <div class="selected-items">
                <v-chip
                  v-if="backupOwner"
                  variant="outlined"
                  closable
                  class="ma-1"
                  color="rgba(0, 0, 0, 0.6)"
                  @click:close="removeBackupOwner"
                >
                  <template v-slot:prepend>
                    <v-avatar size="24" color="primary" class="mr-1">
                      <span class="text-caption">{{ getInitials(backupOwner.name) }}</span>
                    </v-avatar>
                  </template>
                  {{ backupOwner.name }}
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <div class="access-section">
              <div class="d-flex align-center mb-2">
                <span class="text-subtitle-2">технический владелец</span>
                <v-btn
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-account-plus-outline"
                  class="ml-4"
                  color="rgba(0, 0, 0, 0.6)"
                  density="comfortable"
                >
                  выбрать владельца
                </v-btn>
              </div>
              <div class="selected-items">
                <v-chip
                  v-if="technicalOwner"
                  variant="outlined"
                  closable
                  class="ma-1"
                  color="rgba(0, 0, 0, 0.6)"
                  @click:close="removeTechnicalOwner"
                >
                  <template v-slot:prepend>
                    <v-avatar size="24" color="primary" class="mr-1">
                      <span class="text-caption">{{ getInitials(technicalOwner.name) }}</span>
                    </v-avatar>
                  </template>
                  {{ technicalOwner.name }}
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <div class="access-section">
              <div class="d-flex align-center mb-2">
                <span class="text-subtitle-2">диспетчер</span>
                <v-btn
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-account-plus-outline"
                  class="ml-4"
                  color="rgba(0, 0, 0, 0.6)"
                  density="comfortable"
                >
                  выбрать диспетчера
                </v-btn>
              </div>
              <div class="selected-items">
                <v-chip
                  v-if="dispatcher"
                  variant="outlined"
                  closable
                  class="ma-1"
                  color="rgba(0, 0, 0, 0.6)"
                  @click:close="removeDispatcher"
                >
                  <template v-slot:prepend>
                    <v-avatar size="24" color="primary" class="mr-1">
                      <span class="text-caption">{{ getInitials(dispatcher.name) }}</span>
                    </v-avatar>
                  </template>
                  {{ dispatcher.name }}
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Кнопка сохранения -->
        <v-row class="mt-4">
          <v-col cols="12" class="d-flex">
            <v-btn
              color="teal"
              variant="elevated"
              size="large"
              prepend-icon="mdi-content-save-outline"
            >
              сохранить
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      </v-card>

    </v-container>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/state/userstate'
import { useUiStore } from '@/state/uistate'

// Инициализируем store в начале, до использования
const userStore = useUserStore()
const uiStore = useUiStore()

const sections = [
  { id: 'description', title: 'описание', icon: 'mdi-book-open-page-variant-outline' },
  { id: 'visualization', title: 'визуализация', icon: 'mdi-pencil-ruler' },
  { id: 'access', title: 'доступ', icon: 'mdi-shield-outline' },
  { id: 'management', title: 'управление', icon: 'mdi-account-cog-outline' }
]

// Section Navigation
const activeSection = ref('description')

// Form Items
const statusItems = [
  'drafted',
  'being_developed',
  'being_tested',
  'non_compliant',
  'pending_approval',
  'in_production',
  'under_maintenance',
  'suspended',
  'being_upgraded',
  'discontinued'
]
const visibilityItems = ['public', 'private']
const priorityItems = ['critical', 'high', 'medium', 'low']

// Form Validation Rules
const rules = {
  required: v => !!v || 'поле обязательно для заполнения',
  integer: v => Number.isInteger(Number(v)) || 'введите целое число',
  range: v => (v >= 0 && v <= 99) || 'введите значение от 0 до 99'
}

// Description Section Refs
const serviceName = ref('')
const status = ref('')
const visibility = ref('')
const priority = ref('')
const shortDescription = ref('')
const purpose = ref('')
const fullDescription = ref('')
const comments = ref('')
const isSaving = ref(false)

// Visualization Section Refs
const closedWidth = ref('')
const closedHeight = ref('')
const openWidth = ref('')
const openHeight = ref('')
const closedWidthError = ref('')
const closedHeightError = ref('')
const openWidthError = ref('')
const openHeightError = ref('')

// Validation Method
const validateField = (field) => {
  const value = eval(field).value
  const errorField = eval(field + 'Error')
  
  if (!value) {
    errorField.value = 'введите цифровое значение в заданном диапазоне'
    return
  }

  const numValue = Number(value)
  if (!Number.isInteger(numValue) || numValue < 0 || numValue > 99) {
    errorField.value = 'введите цифровое значение в заданном диапазоне'
  } else {
    errorField.value = ''
  }
}

// Save Description Section Data Method
const submitDescriptionSection = async () => {
  console.log('Save button clicked - Description Section')
  console.log('Current form values:', {
    name: serviceName.value,
    status: status.value,
    visibility: visibility.value,
    priority: priority.value,
    shortDescription: shortDescription.value,
    purpose: purpose.value,
    fullDescription: fullDescription.value,
    comments: comments.value
  })

  try {
    isSaving.value = true
    
    // Валидация обязательных полей
    if (!serviceName.value || !status.value || !visibility.value || !priority.value) {
      throw new Error('Пожалуйста, заполните все обязательные поля')
    }

    // Валидация длины названия сервиса
    if (serviceName.value.length < 3 || serviceName.value.length > 250) {
      throw new Error('Название сервиса должно содержать от 3 до 250 символов')
    }

    // Получаем JWT токен из userStore
    const jwt = userStore.jwt
    if (!jwt) {
      throw new Error('Необходима авторизация')
    }

    const payload = {
      name: serviceName.value,
      status: status.value,
      visibility: visibility.value,
      priority: priority.value,
      shortDescription: shortDescription.value,
      purpose: purpose.value,
      fullDescription: fullDescription.value,
      comments: comments.value
    }

    console.log('Sending payload to backend:', payload)
    console.log('Authorization JWT:', jwt)

    const response = await fetch('http://localhost:3000/api/admin/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Ошибка сохранения данных')
    }

    const result = await response.json()
    console.log('Backend response:', result)

    // Показываем уведомление об успехе
    uiStore.showSuccessSnackbar('Данные сервиса успешно сохранены')
    
    return { success: true, data: result }
    
  } catch (error) {
    console.error('Save description section error:', error)
    
    // Показываем уведомление об ошибке с детальным сообщением
    uiStore.showErrorSnackbar(error.message || 'Произошла ошибка при сохранении данных')
    
    return { success: false, error: error.message }
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.app-bar {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
}

.section-active {
  border-bottom: 2px solid #009688;
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
}

.card-header {
  padding: 5px 5px 0 10px;
}

.section-divider {
  border-color: rgba(0, 0, 0, 0.999) !important;
  margin-top: 5px;
  margin-bottom: 5px;
}

.number-field {
  max-width: 120px;
}

.dimensions-group {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
</style>