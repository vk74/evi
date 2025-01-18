/**
 * GroupEditor.vue
 * Component for group creation and editing
 */

<script setup lang="ts">
import { useGroupEditorStore } from './state.group.editor'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GroupStatus } from './types.group.editor'
import type { TableHeader } from './types.group.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import { createGroupService } from './service.create.group'

 // ==================== STORES ====================
const { t } = useI18n()
const groupEditorStore = useGroupEditorStore()

 // ==================== COMPUTED ====================
// Computed properties for active section
const isDetailsActive = computed(() => groupEditorStore.ui.activeSection === 'details')
const isMembersActive = computed(() => groupEditorStore.ui.activeSection === 'members')

// Computed property для определения режима работы
const isEditMode = computed(() => groupEditorStore.isEditMode)

// Computed property для заголовка модуля
const moduleTitle = computed(() => 
  isEditMode.value ? 'редактирование группы' : 'создание группы'
)

// Table parameters
const page = ref(1)
const itemsPerPage = ref(25)
const selectedMembers = ref<string[]>([])

// Handler for section switching
const switchSection = (section: 'details' | 'members') => {
  // В режиме создания не позволяем переключаться на секцию участников
  if (!isEditMode.value && section === 'members') {
    console.log('[GroupEditor] Cannot switch to members section in create mode')
    return
  }
  
  console.log('[GroupEditor] Switching to section:', section)
  groupEditorStore.setActiveSection(section)
}

// Table headers configuration
const headers = computed<TableHeader[]>(() => [
  { 
    title: t('list.table.headers.select'), 
    key: 'selection',
    width: '40px'
  },
  { 
    title: t('list.table.headers.id'), 
    key: 'user_id',
    width: '80px'
  },
  { 
    title: t('list.table.headers.username'), 
    key: 'username'
  },
  { 
    title: t('list.table.headers.email'), 
    key: 'email'
  },
  { 
    title: t('list.table.headers.isStaff'), 
    key: 'is_staff',
    width: '60px'
  },
  { 
    title: t('list.table.headers.status'), 
    key: 'account_status',
    width: '60px'
  },
  { 
    title: t('list.table.headers.lastName'), 
    key: 'last_name'
  },
  { 
    title: t('list.table.headers.firstName'), 
    key: 'first_name'
  },
  { 
    title: t('list.table.headers.middleName'), 
    key: 'middle_name'
  }
])

// ==================== VALIDATION RULES ====================
const { emailRules } = useValidationRules()

const groupNameRules = [
 v => !!v || 'Название группы обязательно',
 v => (v && v.length >= 2) || 'Минимальная длина названия 2 символа', 
 v => (v && v.length <= 100) || 'Максимальная длина названия 100 символов',
 v => /^[a-zA-Z0-9\-]+$/.test(v) || 'Разрешены только латинские буквы, цифры и дефис'
]

const groupStatusRules = [
 v => !!v || 'Статус обязателен',
 v => Object.values(GroupStatus).includes(v) || 'Недопустимый статус'
]

const { generalDescriptionRules } = useValidationRules()

const { usernameRules } = useValidationRules()

// Handlers for table interactions
const onSelectMember = (userId: string, selected: boolean) => {
  console.log('[GroupEditor] Member selection changed:', { userId, selected })
  // To be implemented with service
}

const isSelected = (userId: string) => {
  return selectedMembers.value.includes(userId)
}

/**
 * Обработчик создания новой группы
 */
 const handleCreateGroup = async () => {
  console.log('[GroupEditor] Calling group creation')
  try {
    const response = await groupEditorStore.createNewGroup()
    console.log('[GroupEditor] Group created:', response)
  } catch (error) {
    console.error('[GroupEditor] Error creating group:', error)
    // TODO: добавить обработку ошибок в UI
  }
}

const handleReset = () => {
  groupEditorStore.resetForm()
}
</script>

<template>
  <div class="module-root">
    <!-- App Bar -->
    <v-app-bar flat class="app-bar">
      <!-- Навигация по секциям -->
      <div class="nav-section">
        <v-btn
          :class="[
            'section-btn',
            { 'section-active': isDetailsActive }
          ]"
          variant="text"
          @click="switchSection('details')"
        >
          данные группы
        </v-btn>
        <v-btn
          :class="[
            'section-btn',
            { 'section-active': isMembersActive }
          ]"
          :disabled="!isEditMode"
          variant="text"
          @click="switchSection('members')"
        >
          участники группы
        </v-btn>
      </div>

      <v-spacer />

      <!-- Control buttons -->
      <div class="control-buttons">
        <v-btn
          v-if="!isEditMode"
          color="teal"
          variant="outlined"
          class="mr-2 control-btn"
          :loading="groupEditorStore.ui.isSubmitting"
          :disabled="groupEditorStore.ui.isSubmitting"
          @click="handleCreateGroup"
        >
          создать группу
        </v-btn>
        <v-btn
          v-else
          color="teal"
          variant="outlined"
          class="mr-2 control-btn"
        >
          обновить данные группы
        </v-btn>
        <v-btn
          v-if="!isEditMode"
          variant="outlined"
          class="control-btn"
          @click="handleReset"
        >
          сбросить
        </v-btn>
      </div>

      <v-spacer />

      <!-- Title -->
      <div class="module-title">
        {{ moduleTitle }}
      </div>
    </v-app-bar>

    <!-- Рабочая область -->
    <div class="working-area">
      <v-container class="content-container pa-0">
        <!-- Group Details Form -->
        <v-card
          v-if="isDetailsActive"
          flat
        >
          <v-form class="px-4">
            <v-row>
              <v-col cols="12">
                <v-row class="pt-3">
                  <!-- Group Name -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="groupEditorStore.group.group_name"
                      label="название*"
                      variant="outlined"
                      density="comfortable"
                      counter="100"
                      required
                      :rules="groupNameRules"
                    />
                  </v-col>

                  <!-- Group Status -->
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="groupEditorStore.group.group_status"
                      label="статус"
                      variant="outlined"
                      density="comfortable"
                      :items="[
                        { title: 'активна', value: GroupStatus.ACTIVE },
                        { title: 'отключена', value: GroupStatus.DISABLED },
                        { title: 'в архиве', value: GroupStatus.ARCHIVED }
                      ]"
                      item-title="title"
                      item-value="value"
                      :rules="groupStatusRules"
                    />
                  </v-col>

                  <!-- Group Description -->
                  <v-col cols="12">
                    <v-textarea
                      v-model="groupEditorStore.details.group_description"
                      label="описание"
                      variant="outlined"
                      rows="2"
                      counter="5000"
                      no-resize
                      :rules="generalDescriptionRules"
                    />
                  </v-col>

                  <!-- Group email -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="groupEditorStore.details.group_email"
                      label="e-mail"
                      variant="outlined"
                      density="comfortable"
                      :rules="emailRules"
                    />
                  </v-col>

                  <!-- Group Owner -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="groupEditorStore.group.group_owner"
                      label="владелец*"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      :rules="usernameRules"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card>

        <!-- Group Members Table -->
        <v-card
          v-else-if="isMembersActive"
          flat
        >
          <v-data-table
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="[]"
            :loading="false"
            :items-per-page-options="[10, 25, 50, 100]"
          >
            <!-- Selection Column Template -->
            <template #[`item.selection`]="{ item }">
              <v-checkbox
                :model-value="isSelected(item.user_id)"
                density="compact"
                hide-details
                @update:model-value="(value) => onSelectMember(item.user_id, Boolean(value))"
              />
            </template>

            <!-- User ID Column Template -->
            <template #[`item.user_id`]="{ item }">
              <span>{{ item.user_id }}</span>
            </template>

            <!-- Account Status Column Template -->
            <template #[`item.account_status`]="{ item }">
              <v-chip size="x-small">
                {{ item.account_status }}
              </v-chip>
            </template>

            <!-- Staff Status Column Template -->
            <template #[`item.is_staff`]="{ item }">
              <v-icon
                :color="item.is_staff ? 'teal' : 'red-darken-4'"
                :icon="item.is_staff ? 'mdi-check-circle' : 'mdi-minus-circle'"
                size="x-small"
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

.section-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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