<!--
  GroupEditor.vue
  Компонент для создания и редактирования групп пользователей.
  
  Функциональность:
  - Создание новой группы пользователей
  - Редактирование существующей группы
  - Управление основными параметрами группы
  - Управление списком участников группы (в режиме редактирования)
  - Установка владельцев группы
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
          <v-form ref="form">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupData.group_name"
                  label="название группы*"
                  :rules="[v => !!v || 'название группы обязательно']"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupData.group_display_name"
                  label="отображаемое название"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="groupData.group_description"
                  label="описание группы"
                  variant="outlined"
                  rows="4"
                  class="description-field"
                  :rules="[
                    v => !v || v.length <= 1000 || 'Максимальная длина описания - 1000 символов'
                  ]"
                  counter
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
                      min="0"
                      max="9999999999"
                    />
                  </template>
                  <span>максимальное количество участников группы</span>
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

      <!-- Секция участников группы (только для режима редактирования) -->
      <v-card v-if="isEditMode" flat class="mt-4">
        <div class="card-header">
          <v-card-title class="text-subtitle-1">участники группы</v-card-title>
          <v-divider class="section-divider"></v-divider>
        </div>
        <v-card-text class="pt-3">
          <div class="d-flex justify-end mb-4">
            <v-btn
              color="teal"
              variant="outlined"
              @click="showAddMemberDialog"
            >
              добавить участника
            </v-btn>
          </div>
          <!-- Здесь будет список участников -->
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

// Вычисляемое свойство для определения режима работы
const isEditMode = computed(() => props.mode === 'edit')

// Данные группы с начальными значениями
const groupData = ref({
  group_name: '',
  group_display_name: '',
  group_description: '',
  group_type: 'users',
  group_status: 'active',
  group_max_members: null,
  group_email: '',
  group_owner: null,
  group_backup_owner: null
})

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
  groupData.value = {
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
  // Сбрасываем валидацию формы, если она была
  form.value?.reset()
}

// Метод для показа диалога добавления участника
const showAddMemberDialog = () => {
  // TODO: реализовать диалог добавления участника
}

// Инициализация компонента
const initializeComponent = async () => {
  // Если режим редактирования, загружаем данные группы
  if (isEditMode.value && props.groupId) {
    try {
      const group = await groupStore.fetchGroup(props.groupId)
      groupData.value = { ...group }
      if (isEditMode.value) {
        await groupStore.fetchGroupMembers(props.groupId)
      }
    } catch (error) {
      console.error('Error fetching group data:', error)
      // TODO: показать ошибку пользователю
    }
  }
}

// Запускаем инициализацию при монтировании компонента
initializeComponent()

// Делаем методы доступными для шаблона
defineExpose({
  resetForm,
  saveGroup,
  showAddMemberDialog
})
</script>

<style scoped>
/* Стили для AppBar */
.editor-app-bar {
  background-color: rgb(242, 242, 242) !important;
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