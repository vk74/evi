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

<template>
  <v-container class="pa-0">
    <!-- App Bar с фиксированным фоном -->
    <v-app-bar flat class="editor-app-bar">
      <!-- Секции -->
      <div class="nav-section">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="['section-btn', { 'section-active': activeSection === section.id }]"
          variant="text"
          @click="switchSection(section.id)"
        >
          {{ section.title }}
        </v-btn>
      </div>
      
      <div style="margin-left: 35px;">
        <v-btn
          color="teal"
          variant="outlined"
          @click="saveUser"
          :disabled="!isFormValid || isSubmitting"
          class="mr-2"
        >
          {{ isEditMode ? 'сохранить учетную запись' : 'создать учетную запись' }}
        </v-btn>
        <v-btn
          variant="outlined"
          @click="resetAllForms"
        >
          сбросить поля формы
        </v-btn>
      </div>

      <v-spacer></v-spacer>
      <v-toolbar-title class="title-text">
        {{ isEditMode ? 'редактирование учетной записи' : 'создание учетной записи' }}
      </v-toolbar-title>
    </v-app-bar>
    
    <!-- Рабочая область -->
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
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userData.username"
                    label="название учетной записи*"
                    :rules="usernameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="64"
                    required
                  />
                </v-col>
                <v-col 
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="userData.email"
                    label="e-mail*"
                    :rules="emailRules"
                    variant="outlined"
                    density="comfortable"
                    type="email"
                    required
                  />
                </v-col>

                <v-col 
                  cols="12" 
                  md="6"
                >
                  <v-select
                    v-model="userData.status"
                    label="статус учетной записи"
                    variant="outlined"
                    density="comfortable"
                    :items="[
                      { title: 'активна', value: 'active' },
                      { title: 'отключена', value: 'disabled' },
                      { title: 'требует действия пользователя', value: 'requires_user_action' }
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
                    v-model="userData.is_employee"
                    label="работник организации"
                    color="teal"
                    hide-details
                  />
                </v-col>
                
                <!-- Поля для пароля -->
                <v-col 
                  cols="12" 
                  md="6"
                >
                  <v-text-field
                    v-model="userData.password"
                    label="пароль*"
                    :rules="passwordRules"
                    variant="outlined"
                    density="comfortable"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    counter="40"
                    required
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
                <v-col 
                  cols="12" 
                  md="6"
                >
                  <v-text-field
                    v-model="userData.passwordConfirm"
                    label="подтверждение пароля*"
                    :rules="passwordConfirmRules"
                    variant="outlined"
                    density="comfortable"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    counter="40"
                    required
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>

      <!-- Секция профиля -->
      <v-container 
        v-if="activeSection === 'profile'" 
        class="content-container"
      >
        <v-card flat>
          <!-- Персональные данные -->
          <div class="card-header">
            <v-card-title class="text-subtitle-1">персональные данные</v-card-title>
            <v-divider class="section-divider"></v-divider>
          </div>
          
          <v-card-text class="pt-3">
            <v-form ref="profileForm" v-model="isProfileFormValid">
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userProfile.first_name"
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
                    v-model="userProfile.last_name"
                    label="фамилия*"
                    :rules="lastNameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                    required
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="userProfile.middle_name"
                    label="отчество"
                    :rules="middleNameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="50"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="userProfile.gender"
                    label="пол"
                    variant="outlined"
                    density="comfortable"
                    :items="[
                      { title: 'мужской', value: 'male' },
                      { title: 'женский', value: 'female' }
                    ]"
                    item-title="title"
                    item-value="value"
                  />
                </v-col>
              </v-row>

              <!-- Контактная информация -->
              <div class="card-header mt-6">
                <v-card-title class="text-subtitle-1">контактная информация</v-card-title>
                <v-divider class="section-divider"></v-divider>
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                  v-model="userProfile.phone_number"
                  label="телефон"
                  :rules="phoneRules"
                  variant="outlined"
                  density="comfortable"
                  placeholder="+7 XXX XXX XXXX"
                  @input="handlePhoneInput"
                  @focus="handlePhoneFocus"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="userProfile.address"
                    label="адрес"
                    :rules="addressRules"
                    variant="outlined"
                    rows="3"
                    counter="5000"
                    no-resize
                  />
                </v-col>
              </v-row>

              <!-- Информация о работе -->
              <div class="card-header mt-6">
                <v-card-title class="text-subtitle-1">информация о работе</v-card-title>
                <v-divider class="section-divider"></v-divider>
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.company_name"
                    label="название компании"
                    :rules="companyNameRules"
                    variant="outlined"
                    density="comfortable"
                    counter="255"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="userProfile.position"
                    label="должность"
                    :rules="positionRules"
                    variant="outlined"
                    density="comfortable"
                    counter="255"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>

      <!-- Секция участника групп -->
      <v-container v-if="activeSection === 'groups'" class="content-container">
        <!-- Заглушка для будущей реализации -->
      </v-container>
    </div>
  </v-container>
</template>
  
  <script setup>
// ================== ИМПОРТЫ ==================
import { ref, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/core/state/uistate'
import { useUserStore } from '@/core/state/userstate'
import axios from 'axios'

// ================== ОПРЕДЕЛЕНИЕ PROPS ==================
/**
 * Props определяет режим работы компонента:
 * mode - режим работы (create/edit)
 * userId - ID пользователя (используется только для режима edit)
 */
const props = defineProps({
  mode: {
    type: String,
    required: true,
    default: 'create'
  },
  userId: {
    type: String,
    required: false
  }
})

// События компонента
const emit = defineEmits(['saved'])

// ================== ИНИЦИАЛИЗАЦИЯ ХРАНИЛИЩ ==================
const uiStore = useUiStore()

// ==================== БАЗОВОЕ СОСТОЯНИЕ ====================
/**
* Ссылки на формы компонента и их состояния валидации
*/
const accountForm = ref(null)
const profileForm = ref(null)
const isAccountFormValid = ref(false)
const isProfileFormValid = ref(false)

/**
 * Состояния UI
 */
const isSubmitting = ref(false)         // Флаг отправки формы
const showPassword = ref(false)         // Управление видимостью пароля
const hasInteracted = ref(false)        // Флаг взаимодействия с формой
const activeSection = ref('account')    // Текущая активная секция
const showRequiredFieldsWarning = ref(false) // Флаг предупреждения о незаполненных полях

// ==================== НАЧАЛЬНЫЕ ЗНАЧЕНИЯ ФОРМ ====================
/**
 * Начальные значения для учетной записи пользователя
 */
const initialUserData = {
    username: '',
    email: '',
    status: 'active',
    is_employee: false,
    password: '',
    passwordConfirm: ''
}

/**
 * Начальные значения для профиля пользователя
 */
const initialUserProfile = {
    first_name: '',
    last_name: '',
    middle_name: '',
    phone_number: '',
    address: '',
    company_name: '',
    position: '',
    gender: null
}

// ==================== РЕАКТИВНЫЕ ДАННЫЕ ФОРМ ====================
/**
 * Реактивные объекты данных форм
 * Используются для двустороннего связывания с полями ввода
 */
const userData = ref({ ...initialUserData })
const userProfile = ref({ ...initialUserProfile })

// ==================== ПРАВИЛА ВАЛИДАЦИИ ====================
/**
 * Регулярные выражения для валидации
 */
const nameRegex = /^[a-zA-Zа-яА-Я\- ]+$/

/**
 * Правила валидации для учетной записи
 */
const usernameRules = [
    v => !!v || 'название учетной записи обязательно',
    v => (v && v.length <= 64) || 'название учетной записи не может быть длиннее 64 символов',
    v => /^[a-zA-Zа-яА-Я0-9\-._]+$/.test(v) || 'разрешены только буквы, цифры, дефис, точка и нижнее подчеркивание'
]

const emailRules = [
    v => !!v || 'e-mail обязателен',
    v => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) || 'некорректный e-mail адрес'
]

const passwordRules = [
    v => !!v || 'пароль обязателен',
    v => (v && v.length >= 8) || 'пароль должен быть не короче 8 символов',
    v => (v && v.length <= 40) || 'пароль не может быть длиннее 40 символов',
    v => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,40}$/.test(v) || 'пароль должен содержать буквы и цифры'
]

const passwordConfirmRules = [
    v => !!v || 'подтверждение пароля обязательно',
    v => v === userData.value.password || 'пароли не совпадают'
]

/**
 * Правила валидации для профиля
 */
const firstNameRules = [
    v => !!v || 'имя обязательно',
    v => (v && v.length >= 2) || 'имя должно быть не короче 2 символов',
    v => (v && v.length <= 50) || 'имя не может быть длиннее 50 символов',
    v => !v || nameRegex.test(v) || 'имя может содержать только буквы, пробелы и дефис'
]

const lastNameRules = [
    v => !!v || 'фамилия обязательна',
    v => (v && v.length >= 2) || 'фамилия должна быть не короче 2 символов',
    v => (v && v.length <= 50) || 'фамилия не может быть длиннее 50 символов',
    v => !v || nameRegex.test(v) || 'фамилия может содержать только буквы, пробелы и дефис'
]

const middleNameRules = [
    v => !v || v.length <= 50 || 'отчество не может быть длиннее 50 символов',
    v => !v || nameRegex.test(v) || 'отчество может содержать только буквы, пробелы и дефис'
]

const phoneRules = [
    v => !v || /^\+[\d\s]{11,15}$/.test(v) || 'неверный формат телефона'
]

const addressRules = [
    v => !v || v.length <= 5000 || 'адрес не может быть длиннее 5000 символов',
    v => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || 'адрес содержит недопустимые символы'
]

const companyNameRules = [
    v => !v || v.length <= 255 || 'название компании не может быть длиннее 255 символов',
    v => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || 'название компании содержит недопустимые символы'
]

const positionRules = [
    v => !v || v.length <= 255 || 'должность не может быть длиннее 255 символов',
    v => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || 'должность содержит недопустимые символы'
]

// ==================== COMPUTED PROPERTIES ====================
/**
 * Определение режима работы компонента
 */
 const isEditMode = computed(() => props.mode === 'edit')

/**
 * Формирование списка доступных секций
 * В режиме создания убираем секцию групп
 */
const sections = computed(() => {
    const baseSections = [
        { id: 'account', title: 'учетная запись' },
        { id: 'profile', title: 'профиль' }
    ]
    
    if (isEditMode.value) {
        baseSections.push({ id: 'groups', title: 'участник групп' })
    }
    
    return baseSections
})

/**
 * Проверка заполненности обязательных полей
 */
const requiredFieldsFilled = computed(() => {
    const accountRequired = [
        userData.value.username,
        userData.value.email,
        userData.value.password,
        userData.value.passwordConfirm
    ].every(field => !!field)

    const profileRequired = [
        userProfile.value.first_name,
        userProfile.value.last_name
    ].every(field => !!field)

    return accountRequired && profileRequired
})

/**
 * Общая валидность формы
 */
const isFormValid = computed(() => {
    if (!isAccountFormValid.value) return false
    if (activeSection.value === 'profile' && !isProfileFormValid.value) return false
    if (!requiredFieldsFilled.value) return false
    return true
})

/**
 * Нормализация значения пола для API
 */
const normalizedGender = computed(() => {
    if (!userProfile.value.gender) return null
    return userProfile.value.gender === 'male' ? 'm' : 'f'
})

// ==================== МЕТОДЫ ====================
/**
 * Методы для работы с телефонным номером
 */
const formatPhoneNumber = (number) => {
    // Убираем все символы кроме цифр и пробелов
    const cleaned = number.replace(/[^\d\s]/g, '')
    // Добавляем +, если его нет
    return cleaned ? '+' + cleaned : '+'
}

const normalizePhoneNumber = (phone) => {
    if (!phone) return null
    // Оставляем только цифры и добавляем +
    return '+' + phone.replace(/[^\d]/g, '')
}

const handlePhoneInput = (event) => {
    const input = event.target.value
    if (input.startsWith('+')) {
        userProfile.value.phone_number = formatPhoneNumber(input.slice(1))
    } else {
        userProfile.value.phone_number = formatPhoneNumber(input)
    }
}

const handlePhoneFocus = () => {
    if (!userProfile.value.phone_number) {
        userProfile.value.phone_number = '+'
    }
}

/**
 * Переключение секций формы
 */
const switchSection = (sectionId) => {
    if (sections.value.some(section => section.id === sectionId)) {
        activeSection.value = sectionId
    }
}

/**
 * Отслеживание заполнения полей формы
 */
const watchFormFields = () => {
    const fieldsToWatch = [
        () => userData.value.username,
        () => userData.value.email,
        () => userData.value.password,
        () => userData.value.passwordConfirm,
        () => userProfile.value.first_name,
        () => userProfile.value.last_name
    ]

    fieldsToWatch.forEach(field => {
        watch(field, () => {
            if (!hasInteracted.value) {
                hasInteracted.value = true
            }
        })
    })
}

/**
 * Сброс всех форм
 */
const resetAllForms = () => {
    userData.value = { ...initialUserData }
    userProfile.value = { ...initialUserProfile }
    showPassword.value = false
    accountForm.value?.reset()
    profileForm.value?.reset()
    console.log('All forms have been reset')
}

/**
 * Сохранение данных пользователя
 */
const saveUser = async () => {
    console.log('Starting saveUser method...')
    isSubmitting.value = true
    
    try {
        const userStore = useUserStore()
        const token = userStore.jwt
        
        if (!token) {
            throw new Error('Отсутствует токен авторизации')
        }

        const requestData = {
            username: userData.value.username,
            email: userData.value.email,
            password: userData.value.password,
            account_status: userData.value.status,
            is_staff: userData.value.is_employee,
            first_name: userProfile.value.first_name,
            last_name: userProfile.value.last_name,
            middle_name: userProfile.value.middle_name || null,
            gender: normalizedGender.value,
            phone_number: normalizePhoneNumber(userProfile.value.phone_number),
            address: userProfile.value.address || null,
            company_name: userProfile.value.company_name || null,
            position: userProfile.value.position || null
        }
        
        console.log('Sending request with data:', requestData)
        
        const response = await axios.post(
            'http://localhost:3000/api/admin/user/newuser', 
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        
        console.log('Server response:', response.data)
        uiStore.showSuccessSnackbar('учетная запись пользователя создана')
        resetAllForms()
        emit('saved')
        
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        })
        
        uiStore.showErrorSnackbar(
            error.response?.data?.message || 
            error.message || 
            'ошибка создания учетной записи'
        )
    } finally {
        isSubmitting.value = false
    }
}

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
            'заполните обязательные поля в секциях "учетная запись" и "профиль"', 
            { timeout: -1 }
        )
    }
})

// ==================== LIFECYCLE HOOKS ====================
/**
 * Инициализация компонента
 */
const initializeComponent = async () => {
    // Загрузка данных пользователя в режиме редактирования
    if (isEditMode.value && props.userId) {
        try {
            // TODO: Загрузить данные пользователя и профиля
            console.log('Loading user data for:', props.userId)
        } catch (error) {
            console.error('Error fetching user data:', error)
            // TODO: показать ошибку пользователю
        }
    }
}

/**
 * Хук жизненного цикла: монтирование компонента
 */
onMounted(() => {
    console.log('UserEditor mounted, initializing...')
    initializeComponent()
    watchFormFields()
})
</script>
  
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

.section-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
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