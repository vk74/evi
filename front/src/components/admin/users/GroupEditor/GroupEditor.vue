<!-- GroupEditor.vue -->
<!-- Component for creating or editing a group with dynamic form and member management -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useGroupEditorStore } from './state.group.editor'
import { useUiStore } from '@/core/state/uistate'
import { GroupStatus } from './types.group.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import type { TableHeader, EditMode } from './types.group.editor'
import { updateGroupService } from './service.update.group' // Импорт сервиса обновления
import { fetchGroupMembersService } from './service.fetch.group.members' // Импорт сервиса получения участников
import { removeGroupMembers } from './service.delete.group.members' // Импорт сервиса удаления участников
import ItemSelector from '../../../../core/ui/modals/item-selector/ItemSelector.vue'
import { useUserStore } from '@/core/state/userstate' // Импорт для проверки JWT

const groupEditorStore = useGroupEditorStore()
const uiStore = useUiStore()
const userStore = useUserStore() // Хранилище для проверки авторизации
const { 
  optionalEmailRules,
  generalDescriptionRules,
  usernameRules 
} = useValidationRules()

// ==================== FORM REFS & STATE ====================
const formRef = ref<any>(null)
const isFormValid = ref(false)
const isFormDirty = ref(false) // Tracks if form has changed in edit mode
const isInitialLoad = ref(true) // Prevents watch from firing on initial load
const isSubmitting = ref(false) // Флаг состояния отправки
const page = ref(1)
const itemsPerPage = ref(25)
const searchQuery = ref('')
const isItemSelectorModalOpen = ref(false)

// Computed property for authorization check
const isAuthorized = computed(() => userStore.isLoggedIn)

// ==================== TABLE CONFIG ====================
const headers = ref<TableHeader[]>([
  { title: 'выбор', key: 'selection', width: '40px' },
  { title: 'id', key: 'user_id', width: '80px' },
  { title: 'логин', key: 'username' },
  { title: 'e-mail', key: 'email' },
  { title: 'статус', key: 'account_status', width: '60px' },
  { title: 'сотрудник', key: 'is_staff', width: '60px' },
  { title: 'фамилия', key: 'last_name' },
  { title: 'имя', key: 'first_name' },
  { title: 'отчество', key: 'middle_name' }
])

// ==================== COMPUTED PROPERTIES FOR MEMBERS ====================
const members = computed(() => groupEditorStore.getGroupMembers)
const membersLoading = computed(() => groupEditorStore.members.loading)
const hasSelectedMembers = computed(() => groupEditorStore.hasSelectedMembers)

// ==================== VALIDATION RULES ====================
const groupNameRules = [
  (v: string) => !!v || 'Название группы обязательно',
  (v: string) => (v?.length >= 2) || 'Минимальная длина 2 символа',
  (v: string) => (v?.length <= 100) || 'Максимальная длина 100 символов',
  (v: string) => /^[a-zA-Z0-9-]+$/.test(v) || 'Только латиница, цифры и дефис'
]

const groupStatusRules = [
  (v: GroupStatus) => !!v || 'Выберите статус',
  (v: GroupStatus) => Object.values(GroupStatus).includes(v) || 'Недопустимый статус'
]

// ==================== FORM HANDLERS ====================
const validate = async () => {
  if (!formRef.value) return false
  const { valid } = await formRef.value.validate()
  return valid
}

const handleCreateGroup = async () => {
  if (!(await validate())) {
    uiStore.showErrorSnackbar('Заполните обязательные поля')
    return
  }

  try {
    isSubmitting.value = true
    const response = await groupEditorStore.createNewGroup()
    if (response?.success) {
      groupEditorStore.initEditMode({
        group: {
          ...groupEditorStore.group,
          group_id: response.groupId
        },
        details: {
          ...groupEditorStore.details
        }
      })
      isFormDirty.value = false
      uiStore.showSuccessSnackbar('Группа создана успешно')
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка создания')
  } finally {
    isSubmitting.value = false
  }
}

const handleUpdateGroup = async () => {
  console.log('Starting group update...')
  
  if (!(await validate())) {
    uiStore.showErrorSnackbar('Заполните обязательные поля')
    return
  }

  if (!groupEditorStore.hasChanges) {
    uiStore.showInfoSnackbar('Нет изменений для сохранения')
    return
  }

  isSubmitting.value = true

  try {
    const requestData = groupEditorStore.prepareUpdateData()
    const success = await updateGroupService.updateGroup(requestData)

    if (success) {
      console.log('Group updated successfully')
      uiStore.showSuccessSnackbar('Группа обновлена успешно')
      isFormDirty.value = false // Сбрасываем флаг изменений
    }
  } catch (error) {
    console.error('Error updating group:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка обновления группы'
    )
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  groupEditorStore.resetForm()
  formRef.value?.reset()
  isFormDirty.value = false // Reset dirty state on form reset
  isInitialLoad.value = true // Reset initial load state
}

// ==================== TABLE HANDLERS ====================
const switchSection = async (section: 'details' | 'members') => {
  if (!groupEditorStore.isEditMode && section === 'members') return
  
  groupEditorStore.setActiveSection(section)
  
  // Load members data when switching to the members tab
  if (section === 'members' && groupEditorStore.isEditMode) {
    const groupId = (groupEditorStore.mode as EditMode).groupId
    try {
      await fetchGroupMembersService.fetchGroupMembers(groupId)
    } catch (error) {
      console.error('Error loading group members:', error)
      uiStore.showErrorSnackbar('Ошибка загрузки участников группы')
    }
  }
}

const isSelected = (userId: string) => groupEditorStore.members.selectedMembers.includes(userId)

const onSelectMember = (userId: string, selected: boolean) => {
  groupEditorStore.toggleGroupMemberSelection(userId, selected)
}

const openItemSelectorModal = () => {
  isItemSelectorModalOpen.value = true
}

const handleAddMembers = async (selectedItemIds: string[]) => {
  if (!selectedItemIds || selectedItemIds.length === 0) {
    uiStore.showErrorSnackbar('Не выбрано ни одного участника')
    return
  }

  try {
    await addGroupMembers(selectedItemIds)
    uiStore.showSuccessSnackbar('Участники добавлены успешно')
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка добавления участников')
  }
}

const handleRemoveMembers = async () => {
  if (!groupEditorStore.hasSelectedMembers) {
    uiStore.showErrorSnackbar('Не выбрано ни одного участника для удаления')
    return
  }
  
  if (!groupEditorStore.isEditMode) {
    uiStore.showErrorSnackbar('Недоступно в режиме создания группы')
    return
  }
  
  const groupId = (groupEditorStore.mode as EditMode).groupId
  
  try {
    const removedCount = await removeGroupMembers(
      groupId,
      groupEditorStore.members.selectedMembers
    )
    
    if (removedCount > 0) {
      // После успешного удаления, обновляем список участников
      await fetchGroupMembersService.fetchGroupMembers(groupId)
      // Очищаем выделение
      groupEditorStore.clearGroupMembersSelection()
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка удаления участников')
  }
}

// Placeholder для сервиса (будет реализован отдельно)
async function addGroupMembers(userIds: string[]) {
  console.log('Adding members with IDs:', userIds)
}

// ==================== DISPLAY LOGIC FOR OWNER ====================
const ownerDisplay = computed(() => {
  return groupEditorStore.group.ownerUsername || groupEditorStore.group.group_owner || ''
})

// ==================== WATCH FORM CHANGES ====================
watch(
  () => [groupEditorStore.group, groupEditorStore.details],
  () => {
    if (!isInitialLoad.value) {
      isFormDirty.value = true
    }
  },
  { deep: true }
)

// ==================== LIFECYCLE ====================
onMounted(() => {
  // Проверка валидности JWT при инициализации
  if (!userStore.isLoggedIn) {
    // Сделать все кнопки в app-bar недоступными
    // (используем isAuthorized в шаблоне)
    
    // Сброс кэша Pinia
    groupEditorStore.$reset()
    uiStore.$reset()
    userStore.$reset()

    // Вывод тост-сообщения
    uiStore.showErrorSnackbar('Пользователь не вошел в систему')
  }

  groupEditorStore.resetForm()
  isFormDirty.value = false // Form starts clean
  isInitialLoad.value = true // Mark as initial load
  setTimeout(() => { isInitialLoad.value = false }, 0) // Имитация асинхронной загрузки
})

onBeforeUnmount(() => {
  uiStore.hideSnackbar()
  groupEditorStore.resetMembersState() // Очистка состояния участников при выходе из компонента
})
</script>

<template>
  <div class="module-root">
    <v-app-bar flat class="app-bar">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': groupEditorStore.ui.activeSection === 'details' }]"
          :disabled="!isAuthorized"
          @click="switchSection('details')"
          variant="text"
        >
          данные группы
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': groupEditorStore.ui.activeSection === 'members' }]"
          :disabled="!isAuthorized || !groupEditorStore.isEditMode"
          @click="switchSection('members')"
          variant="text"
        >
          участники группы
        </v-btn>
      </div>

      <v-spacer />

      <div class="control-buttons">
        <template v-if="!groupEditorStore.isEditMode">
          <v-btn
            color="teal"
            variant="outlined"
            class="mr-2"
            :disabled="!isAuthorized || !isFormValid || isSubmitting"
            @click="handleCreateGroup"
          >
            Создать группу
          </v-btn>
          <v-btn
            variant="outlined"
            :disabled="!isAuthorized"
            @click="resetForm"
          >
            Сбросить
          </v-btn>
        </template>
        <template v-else-if="groupEditorStore.ui.activeSection === 'details'">
          <v-btn
            color="teal"
            variant="outlined"
            class="mr-2"
            :disabled="!isAuthorized || !isFormValid || !isFormDirty || isSubmitting"
            @click="handleUpdateGroup"
          >
            Обновить данные группы
          </v-btn>
        </template>
        <template v-else-if="groupEditorStore.ui.activeSection === 'members'">
          <v-btn
            color="teal"
            variant="outlined"
            class="mr-2"
            :disabled="!isAuthorized"
            @click="openItemSelectorModal"
          >
            Добавить участника
          </v-btn>
          <v-btn
            color="red"
            variant="outlined"
            :disabled="!isAuthorized || !hasSelectedMembers"
            @click="handleRemoveMembers"
          >
            Удалить участника из группы
          </v-btn>
        </template>
      </div>

      <v-spacer />

      <div class="module-title">
        {{ groupEditorStore.isEditMode ? 'редактирование группы' : 'создание группы' }}
      </div>
    </v-app-bar>

    <div class="working-area">
      <v-container class="content-container pa-0">
        <v-card v-if="groupEditorStore.ui.activeSection === 'details'" flat>
          <v-form ref="formRef" v-model="isFormValid" @submit.prevent>
            <v-row class="pa-4">
              <v-col v-if="groupEditorStore.isEditMode" cols="12" md="6">
                <v-text-field
                  :model-value="groupEditorStore.mode.mode === 'edit' ? groupEditorStore.mode.groupId : ''"
                  label="UUID группы"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
              </v-col>

              <v-col cols="12" :md="groupEditorStore.isEditMode ? 6 : 12">
                <v-text-field
                  v-model="groupEditorStore.group.group_name"
                  label="Название*"
                  :rules="groupNameRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="groupEditorStore.group.group_status"
                  label="Статус*"
                  :items="[
                    { title: 'Активна', value: GroupStatus.ACTIVE },
                    { title: 'Отключена', value: GroupStatus.DISABLED },
                    { title: 'В архиве', value: GroupStatus.ARCHIVED }
                  ]"
                  item-title="title"
                  item-value="value"
                  :rules="groupStatusRules"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="groupEditorStore.details.group_description"
                  label="Описание"
                  :rules="generalDescriptionRules"
                  variant="outlined"
                  rows="2"
                  counter="5000"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupEditorStore.details.group_email"
                  label="E-mail"
                  :rules="optionalEmailRules"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="ownerDisplay"
                  label="Владелец*"
                  :rules="usernameRules"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card>

        <v-card v-else flat>
          <v-container class="pa-4">
            <h4 class="mb-2">группа: {{ groupEditorStore.group.group_name || 'Без названия' }}</h4><br>
            <v-text-field
              v-model="searchQuery"
              label="поиск в таблице участников группы"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-magnify"
              clearable
              class="mb-4"
            />
          </v-container>
          <v-data-table
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="members"
            :loading="membersLoading"
            :search="searchQuery"
          >
            <template v-slot:item.selection="{ item }">
              <v-checkbox
                :model-value="isSelected(item.user_id)"
                @update:model-value="(val) => onSelectMember(item.user_id, val)"
                density="compact"
                hide-details
                :disabled="!isAuthorized"
              />
            </template>
            <template v-slot:item.account_status="{ item }">
              <v-chip 
                :color="item.account_status === 'active' ? 'green' : 'red'" 
                size="x-small">
                {{ item.account_status }}
              </v-chip>
            </template>
            <template v-slot:item.is_staff="{ item }">
              <v-icon
                :color="item.is_staff ? 'teal' : 'grey'"
                :icon="item.is_staff ? 'mdi-check-circle' : 'mdi-minus-circle'"
                size="x-small"
              />
            </template>
            <template v-slot:no-data>
              <div class="pa-4 text-center">
                {{ groupEditorStore.members.error || 'Нет данных для отображения' }}
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-container>
    </div>

    <v-dialog v-model="isItemSelectorModalOpen" max-width="600">
      <ItemSelector 
        :title="'добавление пользователей в группу'" 
        operation-type="add-users-to-group" 
        search-type="user-account"
        :max-items="20" 
        @close="isItemSelectorModalOpen = false" 
        @actionPerformed="handleAddMembers"
        :disabled="!isAuthorized"
      />
    </v-dialog>
  </div>
</template>

<style scoped>
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
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}

.module-title {
  margin-right: 15px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
}

.control-buttons {
  display: flex;
  align-items: center;
}
</style>