<!-- GroupEditor.vue -->
<!-- Component for creating or editing a group with dynamic form and member management -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGroupEditorStore } from './state.group.editor'
import { useUiStore } from '@/core/state/uistate'
import { GroupStatus } from './types.group.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import type { TableHeader, EditMode } from './types.group.editor'
import { updateGroupService } from './service.update.group' // Import update service
import { fetchGroupService } from './service.fetch.group' // Import fetch service
import { fetchGroupMembersService } from './service.fetch.group.members' // Import members fetch service
import { removeGroupMembers } from './service.delete.group.members' // Import members delete service
const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '../../../../core/ui/modals/item-selector/ItemSelector.vue'))
const GroupEditorDetails = defineAsyncComponent(() => import('./GroupEditorDetails.vue'))
const GroupEditorMembers = defineAsyncComponent(() => import('./GroupEditorMembers.vue'))
import { useUserAuthStore } from '@/core/auth/state.user.auth' // Import for JWT check
import { PhMagnifyingGlass, PhX, PhCheckCircle, PhMinusCircle } from '@phosphor-icons/vue'

// Initialize i18n
const { t } = useI18n()

const groupEditorStore = useGroupEditorStore()
const uiStore = useUiStore()
const userStore = useUserAuthStore()
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
const isSubmitting = ref(false) // Submission state flag
const page = ref(1)
const itemsPerPage = ref(25)
const searchQuery = ref('')
const isItemSelectorModalOpen = ref(false)
const isOwnerSelectorModalOpen = ref(false) // New ref for owner change modal

// Computed property for authorization check
const isAuthorized = computed(() => userStore.isAuthenticated)

// Function to get color based on status (copied from UsersList.vue)
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'teal';
    case 'disabled': return 'error';
    case 'archived': return 'grey';
    case 'requires_user_action': return 'orange';
    default: return 'black';
  }
};

// Helper: resolve member status safely for template type-checking
const getMemberStatus = (member: unknown): string => {
  const m: any = member as any
  return (m?.status ?? m?.user_status ?? m?.state ?? '').toString()
}

// ==================== TABLE CONFIG ====================
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.groups.editor.table.headers.select'), key: 'selection', width: '40px' },
  { title: t('admin.groups.editor.table.headers.id'), key: 'user_id', width: '80px' },
  { title: t('admin.groups.editor.table.headers.username'), key: 'username' },
  { title: t('admin.groups.editor.table.headers.email'), key: 'email' },
  { title: t('admin.groups.editor.table.headers.status'), key: 'status', width: '60px' },
  { title: t('admin.groups.editor.table.headers.staff'), key: 'is_staff', width: '40px' },
  { title: t('admin.groups.editor.table.headers.lastname'), key: 'last_name' },
  { title: t('admin.groups.editor.table.headers.firstname'), key: 'first_name' },
  { title: t('admin.groups.editor.table.headers.middlename'), key: 'middle_name' }
])

// ==================== COMPUTED PROPERTIES FOR MEMBERS ====================
const members = computed(() => groupEditorStore.getGroupMembers)
const membersLoading = computed(() => groupEditorStore.members.loading)
const hasSelectedMembers = computed(() => groupEditorStore.hasSelectedMembers)

// ==================== VALIDATION RULES ====================
const groupNameRules = [
  (v: string) => !!v || t('admin.groups.editor.messages.requiredFields'),
  (v: string) => (v?.length >= 2) || t('admin.groups.editor.validation.minLength', { length: 2 }),
  (v: string) => (v?.length <= 100) || t('admin.groups.editor.validation.maxLength', { length: 100 }),
  (v: string) => /^[a-zA-Z0-9-]+$/.test(v) || t('admin.groups.editor.validation.alphaNumDash')
]

const groupStatusRules = [
  (v: GroupStatus) => !!v || t('admin.groups.editor.messages.requiredFields'),
  (v: GroupStatus) => Object.values(GroupStatus).includes(v) || t('admin.groups.editor.validation.invalidStatus')
]

// ==================== FORM HANDLERS ====================
const validate = async () => {
  if (!formRef.value) return false
  const { valid } = await formRef.value.validate()
  return valid
}

const handleCreateGroup = async () => {
  if (!(await validate())) {
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.requiredFields'))
    return
  }

  try {
    isSubmitting.value = true
    const response = await groupEditorStore.createNewGroup()
    if (response?.success) {
      groupEditorStore.initEditMode({
        ...groupEditorStore.group,
        group_id: response.groupId
      })
      isFormDirty.value = false
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.createSuccess'))
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.groups.editor.messages.createError'))
  } finally {
    isSubmitting.value = false
  }
}

const handleUpdateGroup = async () => {
  
  if (!(await validate())) {
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.requiredFields'))
    return
  }

  if (!groupEditorStore.hasChanges) {
    uiStore.showInfoSnackbar(t('admin.groups.editor.messages.noChanges'))
    return
  }

  isSubmitting.value = true

  try {
    const requestData = groupEditorStore.prepareUpdateData()
    const success = await updateGroupService.updateGroup(requestData)

    if (success) {
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.updateSuccess'))
      isFormDirty.value = false // Reset changes flag
    }
  } catch (error) {
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : t('admin.groups.editor.messages.updateError')
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
      uiStore.showErrorSnackbar(t('admin.groups.editor.messages.loadMembersError'))
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

// Обработчик добавления участников
const handleAddMembers = async (result: any) => {
  
  // Проверяем успешность операции
  if (result && result.success) {
    // Обновляем список участников группы
    if (groupEditorStore.isEditMode) {
      const groupId = (groupEditorStore.mode as EditMode).groupId
      try {
        // Просто обновляем список участников
        await fetchGroupMembersService.fetchGroupMembers(groupId)
        // Очищаем выбор
        groupEditorStore.clearGroupMembersSelection()
      } catch (error) {
        
      }
    }
  }
}

const handleRemoveMembers = async () => {
  if (!groupEditorStore.hasSelectedMembers) {
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.noMembersSelected'))
    return
  }
  
  if (!groupEditorStore.isEditMode) {
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.unavailableInCreateMode'))
    return
  }
  
  const groupId = (groupEditorStore.mode as EditMode).groupId
  
  try {
    const removedCount = await removeGroupMembers(
      groupId,
      groupEditorStore.members.selectedMembers
    )
    
    if (removedCount > 0) {
      // After successful removal, update the members list
      await fetchGroupMembersService.fetchGroupMembers(groupId)
      // Clear selection
      groupEditorStore.clearGroupMembersSelection()
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.groups.editor.messages.membersRemoveError'))
  }
}

// ==================== OWNER CHANGE HANDLERS ====================
const handleChangeOwner = () => {
  isOwnerSelectorModalOpen.value = true
}

// Обработчик события смены владельца группы
const handleOwnerChanged = async (result: any) => {
  
  if (result && result.success) {
    // Получаем ID группы
    const groupId = (groupEditorStore.mode as EditMode).groupId
    
    try {
      // Обновляем данные группы из бэкенда
      const { group, details } = await fetchGroupService.fetchGroupById(groupId)
      
      // Обновляем данные в хранилище
      groupEditorStore.initEditMode({ group, details })
      
      // Показываем сообщение об успехе
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.ownerChangeSuccess'))
    } catch (error) {
      uiStore.showErrorSnackbar(
        error instanceof Error ? error.message : t('admin.groups.editor.messages.ownerChangeError')
      )
    }
  } else {
    // Показываем сообщение об ошибке
    uiStore.showErrorSnackbar(
      result?.message || t('admin.groups.editor.messages.ownerChangeError')
    )
  }
}

// ==================== DISPLAY LOGIC FOR OWNER ====================
const ownerDisplay = computed(() => {
  return groupEditorStore.group.ownerUsername || groupEditorStore.group.group_owner || ''
})

// ==================== WATCH FORM CHANGES ====================
watch(
  () => [groupEditorStore.group],
  () => {
    if (!isInitialLoad.value) {
      isFormDirty.value = true
    }
  },
  { deep: true }
)

// ==================== LIFECYCLE ====================
onMounted(() => {
  // Check JWT validation on initialization
  if (!userStore.isAuthenticated) {
    // Make all app-bar buttons unavailable
    // (we use isAuthorized in the template)
    
    // Reset Pinia cache
    groupEditorStore.$reset()
    uiStore.$reset()
    userStore.$reset()

    // Show toast message
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.notLoggedIn'))
  }

  // Only reset form when not in edit mode to preserve loaded data and members
  if (!groupEditorStore.isEditMode) {
    groupEditorStore.resetForm()
  }
  isFormDirty.value = false // Form starts clean
  isInitialLoad.value = true // Mark as initial load
  setTimeout(() => { isInitialLoad.value = false }, 0) // Simulate async loading
})

onBeforeUnmount(() => {
  uiStore.hideSnackbar()
  // Preserve members across navigation; do not reset here
})
</script>

<template>
  <div class="module-root">
    <div class="internal-app-bar d-flex align-center">
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': groupEditorStore.ui.activeSection === 'details' }]"
          :disabled="!isAuthorized"
          variant="text"
          @click="switchSection('details')"
        >
          {{ t('admin.groups.editor.sections.details') }}
        </v-btn>
        <v-btn
          :class="['section-btn', { 'section-active': groupEditorStore.ui.activeSection === 'members' }]"
          :disabled="!isAuthorized || !groupEditorStore.isEditMode"
          variant="text"
          @click="switchSection('members')"
        >
          {{ t('admin.groups.editor.sections.members') }}
        </v-btn>
      </div>

      <v-spacer />

      <div class="module-title">
        {{ groupEditorStore.isEditMode 
          ? t('admin.groups.editor.title.edit') 
          : t('admin.groups.editor.title.create') }}
      </div>
    </div>

    <div class="working-area">
      <GroupEditorDetails v-if="groupEditorStore.ui.activeSection === 'details'" />
      <GroupEditorMembers v-else />
    </div>

    <!-- Модальное окно для добавления участников -->
    <v-dialog
      v-model="isItemSelectorModalOpen"
      max-width="700"
    >
      <ItemSelector 
        :title="t('admin.groups.editor.itemSelector.title')"
        search-service="searchUsers"
        action-service="addUsersToGroup"
        :max-results="40"
        :max-items="20"
        :action-button-text="t('admin.groups.editor.itemSelector.addMembers')"
        @close="isItemSelectorModalOpen = false" 
        @actionPerformed="handleAddMembers"
      />
    </v-dialog>

    <!-- Модальное окно для смены владельца группы -->
    <v-dialog
      v-model="isOwnerSelectorModalOpen"
      max-width="700"
    >
      <ItemSelector 
        :title="t('admin.groups.editor.itemSelector.ownerTitle')"
        search-service="searchUsers"
        action-service="changeGroupOwner"
        :max-results="20"
        :max-items="1"
        :action-button-text="t('admin.groups.editor.buttons.changeOwner')"
        @close="isOwnerSelectorModalOpen = false" 
        @actionPerformed="handleOwnerChanged"
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

/* Internal app bar styling so it sits inside the working area */
.internal-app-bar {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* Стили для боковой панели */
.side-bar-container {
  width: 18%;
  min-width: 220px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
}

.side-bar-section {
  padding: 16px;
}

/* Разделитель между секциями */
.sidebar-divider {
  height: 20px;
  position: relative;
  margin: 0 16px;
}

.sidebar-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>