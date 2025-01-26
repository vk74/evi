<!-- GroupEditor.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useGroupEditorStore } from './state.group.editor'
import { useUiStore } from '@/core/state/uistate'
import { GroupStatus } from './types.group.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import type { TableHeader } from './types.group.editor'

const groupEditorStore = useGroupEditorStore()
const uiStore = useUiStore()
const { 
  optionalEmailRules,
  generalDescriptionRules,
  usernameRules 
} = useValidationRules()

// ==================== FORM REFS & STATE ====================
const formRef = ref<any>(null)
const isFormValid = ref(false)
const hasInteracted = ref(false)
const selectedMembers = ref<string[]>([])
const page = ref(1)
const itemsPerPage = ref(25)

// ==================== TABLE CONFIG ====================
const headers = ref<TableHeader[]>([
  { title: 'Выбор', key: 'selection', width: '40px' },
  { title: 'ID', key: 'user_id', width: '80px' },
  { title: 'Логин', key: 'username' },
  { title: 'Email', key: 'email' },
  { title: 'Статус', key: 'account_status', width: '60px' },
  { title: 'Персонал', key: 'is_staff', width: '60px' },
  { title: 'Фамилия', key: 'last_name' },
  { title: 'Имя', key: 'first_name' },
  { title: 'Отчество', key: 'middle_name' }
])

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
    const response = await groupEditorStore.createNewGroup()
    if (response?.success) {
      uiStore.showSuccessSnackbar('Группа создана успешно')
      resetForm()
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка создания')
  }
}

const resetForm = () => {
  groupEditorStore.resetForm()
  formRef.value?.reset()
  hasInteracted.value = false
  selectedMembers.value = []
}

// ==================== TABLE HANDLERS ====================
const switchSection = (section: 'details' | 'members') => {
  if (!groupEditorStore.isEditMode && section === 'members') return
  groupEditorStore.ui.activeSection = section
}

const isSelected = (userId: string) => selectedMembers.value.includes(userId)

const onSelectMember = (userId: string, selected: boolean) => {
  selectedMembers.value = selected 
    ? [...selectedMembers.value, userId]
    : selectedMembers.value.filter(id => id !== userId)
}

// ==================== LIFECYCLE ====================
onMounted(() => groupEditorStore.resetForm())
onBeforeUnmount(() => uiStore.hideSnackbar())
</script>

<template>
  <div class="module-root">
    <v-app-bar flat class="app-bar">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': groupEditorStore.ui.activeSection === 'details' }]"
          @click="switchSection('details')"
          variant="text"
        >
          Данные группы
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': groupEditorStore.ui.activeSection === 'members' }]"
          @click="switchSection('members')"
          :disabled="!groupEditorStore.isEditMode"
          variant="text"
        >
          Участники группы
        </v-btn>
      </div>

      <v-spacer />

      <div class="control-buttons">
        <v-btn
          color="teal"
          variant="outlined"
          class="mr-2"
          @click="handleCreateGroup"
          :disabled="!isFormValid"
        >
          Создать группу
        </v-btn>
        
        <v-btn
          variant="outlined"
          @click="resetForm"
        >
          Сбросить
        </v-btn>
      </div>

      <v-spacer />

      <div class="module-title">
        {{ groupEditorStore.isEditMode ? 'Редактирование группы' : 'Создание группы' }}
      </div>
    </v-app-bar>

    <div class="working-area">
      <v-container class="content-container pa-0">
        <v-card v-if="groupEditorStore.ui.activeSection === 'details'" flat>
          <v-form ref="formRef" v-model="isFormValid" @submit.prevent>
            <v-row class="pa-4">
              <!-- Group Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupEditorStore.group.group_name"
                  label="Название*"
                  :rules="groupNameRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>

              <!-- Group Status -->
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

              <!-- Group Description -->
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

              <!-- Group Email -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupEditorStore.details.group_email"
                  label="E-mail"
                  :rules="optionalEmailRules"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <!-- Group Owner -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupEditorStore.group.group_owner"
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

        <!-- Members Table -->
        <v-card v-else flat>
          <v-data-table
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="[]"
            :loading="false"
          >
            <template #item.selection="{ item }">
              <v-checkbox
                :model-value="isSelected(item.user_id)"
                @update:model-value="(val) => onSelectMember(item.user_id, val)"
                density="compact"
                hide-details
              />
            </template>
          </v-data-table>
        </v-card>
      </v-container>
    </div>
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