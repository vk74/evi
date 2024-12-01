<!--
  GroupEditor.vue
  Компонент для создания и редактирования групп пользователей.
  
  Функциональность:
  - Создание новой группы пользователей
  - Редактирование существующей группы
  - Управление основными параметрами группы
  - Валидация полей формы с отображением ошибок
-->
<template>
  <v-container class="pa-0">
    <!-- App Bar с фиксированным серым фоном -->
    <v-app-bar flat class="editor-app-bar">
      <div style="margin-left: 35px;">
        <v-btn
          variant="outlined"
          class="mr-4"
          @click="resetForm"
        >
          сбросить поля формы
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          @click="saveGroup"
          :disabled="!isFormValid"
        >
          {{ isEditMode ? 'сохранить' : 'создать группу' }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-toolbar-title class="title-text">
        {{ isEditMode ? 'редактирование группы' : 'создание группы' }}
      </v-toolbar-title>
    </v-app-bar>

    <!-- Основной контейнер с контентом -->
    <v-container class="content-container">
      <!-- Форма группы -->
      <v-card flat>
        <!-- Секция основной информации -->
        <div class="card-header">
          <v-card-title class="text-subtitle-1">основная информация</v-card-title>
          <v-divider class="section-divider"></v-divider>
        </div>
        <v-card-text class="pt-3">
          <v-form ref="form" v-model="isFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupData.group_name"
                  label="название группы*"
                  :rules="groupNameRules"
                  variant="outlined"
                  density="comfortable"
                  counter="64"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupData.group_display_name"
                  label="отображаемое название*"
                  :rules="displayNameRules"
                  variant="outlined"
                  density="comfortable"
                  counter="100"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="groupData.group_description"
                  label="описание группы"
                  variant="outlined"
                  rows="4"
                  class="description-field"
                  :rules="descriptionRules"
                  counter="1000"
                  no-resize
                />
              </v-col>
            </v-row>

            <!-- Секция настроек группы -->
            <v-row>
              <v-col cols="12">
                <div class="card-header">
                  <v-card-title class="text-subtitle-1">настройки группы</v-card-title>
                  <v-divider class="section-divider"></v-divider>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="groupData.group_status"
                  label="статус"
                  variant="outlined"
                  density="comfortable"
                  :items="[
                    { title: 'активна', value: 'active' },
                    { title: 'неактивна', value: 'inactive' },
                    { title: 'в архиве', value: 'archived' }
                  ]"
                  item-title="title"
                  item-value="value"
                  :default="'active'"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      v-model="groupData.group_max_members"
                      label="макс. участников"
                      variant="outlined"
                      density="comfortable"
                      type="number"
                      class="max-width-150"
                      :rules="maxMembersRules"
                      min="0"
                      max="1024"
                    />
                  </template>
                  <span>максимальное количество участников группы (0-1024)</span>
                </v-tooltip>
              </v-col>
            </v-row>

            <!-- Секция контактной информации -->
            <v-row>
              <v-col cols="12">
                <div class="card-header">
                  <v-card-title class="text-subtitle-1">контактная информация</v-card-title>
                  <v-divider class="section-divider"></v-divider>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupData.group_email"
                  label="email группы"
                  variant="outlined"
                  density="comfortable"
                  type="email"
                  :rules="emailRules"
                />
              </v-col>
            </v-row>

            <!-- Секция управления -->
            <v-row>
              <v-col cols="12">
                <div class="card-header">
                  <v-card-title class="text-subtitle-1">управление</v-card-title>
                  <v-divider class="section-divider"></v-divider>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="groupData.group_owner"
                  label="владелец группы"
                  variant="outlined"
                  density="comfortable"
                  :items="[]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="groupData.group_backup_owner"
                  label="резервный владелец"
                  variant="outlined"
                  density="comfortable"
                  :items="[]"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup>
// Импорты необходимых зависимостей
import { ref, computed } from 'vue'
import { useGroupStore } from '@/state/groupstate'

// Определение props компонента
const props = defineProps({
  // Режим работы компонента: создание или редактирование
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'edit'].includes(value)
  },
  // ID группы (требуется только в режиме редактирования)
  groupId: {
    type: String,
    required: false
  }
})

// События, которые может испускать компонент
const emit = defineEmits(['saved'])

// Инициализация хранилища
const groupStore = useGroupStore()

// Ссылка на форму для валидации
const form = ref(null)
const isFormValid = ref(false)

// Вычисляемое свойство для определения режима работы
const isEditMode = computed(() => props.mode === 'edit')

// Начальные значения для формы группы
const initialGroupData = {
  group_name: '',
  group_display_name: '',
  group_description: '',
  group_type: 'users',
  group_status: 'active',
  group_max_members: null,
  group_email: '',
  group_owner: null,
  group_backup_owner: null
}

// Данные группы с начальными значениями
const groupData = ref({ ...initialGroupData })

// Правила валидации для названия группы
const groupNameRules = [
  v => !!v || 'название группы обязательно',
  v => (v && v.length <= 64) || 'название группы не может быть длиннее 64 символов',
  v => /^[a-zA-Zа-яА-Я0-9\-. _]+$/.test(v) || 'разрешены только буквы, цифры, дефис, точка, пробел и нижнее подчеркивание'
]

// Правила валидации для отображаемого названия
const displayNameRules = [
  v => !!v || 'отображаемое название обязательно',
  v => (v && v.length <= 100) || 'отображаемое название не может быть длиннее 100 символов',
  v => /^[a-zA-Zа-яА-Я0-9\-. _]+$/.test(v) || 'разрешены только буквы, цифры, дефис, точка, пробел и нижнее подчеркивание'
]

// Правила валидации для описания группы
const descriptionRules = [
  v => !v || v.length <= 1000 || 'описание не может быть длиннее 1000 символов',
  v => !v || /^[a-zA-Zа-яА-Я0-9\-.,!? ]+$/.test(v) || 'разрешены только буквы, цифры и базовая пунктуация'
]

// Правила валидации для максимального количества участников
const maxMembersRules = [
  v => !v || (v >= 0 && v <= 1024) || 'значение должно быть от 0 до 1024'
]

// Правила валидации для email
const emailRules = [
  v => !v || /^[a-zA-Zа-яА-Я0-9._%+-]+@[a-zA-Zа-яА-Я0-9.-]+\.[a-zA-Zа-яА-Я]{2,6}$/.test(v) || 'некорректный email адрес'
]

// Метод сохранения группы
const saveGroup = async () => {
  // Проверяем валидность формы
  const formValid = await form.value?.validate()
  if (!formValid?.valid) return

  try {
    // В зависимости от режима вызываем соответствующий метод store
    if (isEditMode.value) {
      await groupStore.updateGroup(props.groupId, groupData.value)
    } else {
      await groupStore.createGroup(groupData.value)
    }
    emit('saved')
  } catch (error) {
    console.error('Error saving group:', error)
    // TODO: показать ошибку пользователю
  }
}

// Метод для сброса формы к начальным значениям
const resetForm = () => {
  groupData.value = { ...initialGroupData }
  form.value?.reset()
}

// Инициализация компонента
const initializeComponent = async () => {
  // Если режим редактирования, загружаем данные группы
  if (isEditMode.value && props.groupId) {
    try {
      const group = await groupStore.fetchGroup(props.groupId)
      groupData.value = { ...group }
    } catch (error) {
      console.error('Error fetching group data:', error)
      // TODO: показать ошибку пользователю
    }
  }
}

// Запускаем инициализацию при монтировании компонента
initializeComponent()
</script>

<style scoped>
/* Стили для AppBar */
.editor-app-bar {
  background-color: #FFFFFF !important;
}

/* Стили для заголовка в AppBar */
.title-text {
  margin-right: 15px;
  text-align: right;
  font-family: 'Roboto', sans-serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.6);
}

/* Основной контейнер для контента */
.content-container {
  margin-top: 5px;
  padding-left: 5px;
  padding-top: 0;
  padding-right: 0;
  padding-bottom: 0;
  height: 100%;
}

/* Стили для заголовка карточки и разделителя */
.card-header {
  padding: 5px 5px 0 10px;
}

.section-divider {
  border-color: rgba(0, 0, 0, 0.999) !important;
  margin-top: 5px;
  margin-bottom: 5px;
}

/* Стили для поля описания */
:deep(.description-field) {
  & .v-field__input {
    height: 150px !important;
  }
  
  & textarea {
    height: 100% !important;
    overflow-y: auto !important;
  }
}

/* Дополнительные стили */
.max-width-150 {
  max-width: 150px;
}
</style>