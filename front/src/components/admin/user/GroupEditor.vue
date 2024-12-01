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
          <v-icon start>{{ section.icon }}</v-icon>
          {{ section.title }}
        </v-btn>
      </div>
      
      <div style="margin-left: 35px;">
        <v-btn
          color="teal"
          variant="outlined"
          @click="saveGroup"
          :disabled="!isFormValid"
        >
          {{ isEditMode ? 'сохранить' : 'создать группу' }}
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          class="mx-4"
          :disabled="activeSection !== 'members'"
        >
          добавить участника
        </v-btn>
        <v-btn
          variant="outlined"
          @click="resetForm"
          :disabled="activeSection !== 'groupData'"
        >
          сбросить поля формы
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-toolbar-title class="title-text">
        {{ isEditMode ? 'редактирование группы' : 'создание группы' }}
      </v-toolbar-title>
    </v-app-bar>
    
    <!-- Working Area - сюда вставляются секции в зависимости от activeSection -->
    <div class="working-area">
      <!-- Секция данных группы -->
      <v-container v-if="activeSection === 'groupData'" class="content-container">
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

      <!-- Секция участников -->
      <v-container v-if="activeSection === 'members'" class="content-container">
        <v-card flat>
          <v-data-table
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="members"
            :loading="loading"
            :items-length="totalItems"
            :items-per-page-options="[10, 25, 50, 100]"
            class="members-table"
          >
            <!-- Шаблон для статуса пользователя -->
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.raw.status)"
                size="small"
              >
                {{ item.raw.status }}
              </v-chip>
            </template>

            <!-- Шаблон для действий -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  variant="text"
                  @click="editMember(item.raw)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  color="error"
                  variant="text"
                  @click="confirmDelete(item.raw)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Диалог подтверждения удаления -->
        <v-dialog v-model="deleteDialog" max-width="400">
          <v-card>
            <v-card-title class="text-subtitle-1">
              подтверждение удаления
            </v-card-title>
            <v-card-text>
              вы действительно хотите удалить участника {{ selectedMember?.username }} из группы?
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="grey"
                variant="text"
                @click="deleteDialog = false"
              >
                отмена
              </v-btn>
              <v-btn
                color="error"
                variant="text"
                @click="deleteMember"
              >
                удалить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </div>
  </v-container>
</template>

<script setup>
// Импорты необходимых зависимостей
import { ref, computed, watch } from 'vue'
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

// Определение секций навигации
const sections = [
  { id: 'groupData', title: 'данные группы' },
  { id: 'members', title: 'участники группы' }
]

// Активная секция по умолчанию
const activeSection = ref('groupData')

// Метод переключения секций
const switchSection = (sectionId) => {
  if (sections.some(section => section.id === sectionId)) {
    activeSection.value = sectionId
  }
}

// Наблюдаем за изменением секции для дополнительных действий
watch(activeSection, (newSection) => {
  // Здесь можно добавить дополнительную логику при смене секции
  console.log('Активная секция:', newSection)
})

// Переменные для таблицы участников
const page = ref(1)
const itemsPerPage = ref(25)
const totalItems = ref(0)
const loading = ref(false)
const members = ref([])
const deleteDialog = ref(false)
const selectedMember = ref(null)

// Заголовки таблицы
const headers = [
  { title: 'username', key: 'username', sortable: true },
  { title: 'email', key: 'email', sortable: true },
  { title: 'статус', key: 'status', sortable: true },
  { title: 'действия', key: 'actions', sortable: false }
]

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

// Метод определения цвета статуса пользователя
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'disabled': return 'error'
    default: return 'grey'
  }
}

// Методы для работы с участниками
const editMember = (member) => {
  // TODO: реализовать переход к редактированию пользователя
  console.log('Edit member:', member)
}

const confirmDelete = (member) => {
  selectedMember.value = member
  deleteDialog.value = true
}

const deleteMember = async () => {
  try {
    // TODO: реализовать удаление участника
    console.log('Delete member:', selectedMember.value)
    deleteDialog.value = false
    selectedMember.value = null
  } catch (error) {
    console.error('Error deleting member:', error)
  }
}

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

/* Стили для секций в AppBar */
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
  min-width: 120px;  /* Добавим минимальную ширину для кнопок */
}

.section-active {
  border-bottom: 2px solid teal;      /* Используем teal для соответствия общему стилю */
  color: rgba(0, 0, 0, 0.87) !important;  /* Более темный цвет для активной секции */
  font-weight: 500;
}

/* Добавим hover эффект для кнопок секций */
.section-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
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

/* Стиль для ограничения ширины поля с максимальным количеством участников  */
.max-width-150 {
  max-width: 150px;
}
</style>