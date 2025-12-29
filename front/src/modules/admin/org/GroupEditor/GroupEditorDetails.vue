<!--
version: 1.0.2
Frontend file GroupEditorDetails.vue.
Purpose: Renders the group details form (create/edit) and its right-side actions.

Changes in v1.0.2:
- Refactored to use local formData ref and initialGroupData ref for change tracking (same approach as SectionEditor)
- Added local hasChanges computed property that compares formData with initialGroupData
- All form fields now use v-model directly with formData ref for proper Vue reactivity
- This ensures reliable change tracking and activates UPDATE button with glow effect when fields are modified
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGroupEditorStore } from './state.group.editor'
import { useUiStore } from '@/core/state/uistate'
import { GroupStatus, type EditMode, type IGroupData } from './types.group.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import { defineAsyncComponent } from 'vue'
import { fetchGroupService } from './service.fetch.group'
import { PhCaretUpDown } from '@phosphor-icons/vue'

const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '../../../../core/ui/modals/item-selector/ItemSelector.vue'))

const { t } = useI18n()
const groupEditorStore = useGroupEditorStore()
const uiStore = useUiStore()

const {
  generalDescriptionRules
} = useValidationRules()

// Local state
const formRef = ref<any>(null)
const isFormValid = ref(false)
const isSubmitting = ref(false)
const isOwnerSelectorModalOpen = ref(false)

// Local form data for change tracking (same approach as SectionEditor)
const formData = ref({
  group_name: '',
  group_status: GroupStatus.ACTIVE,
  group_description: '',
  group_email: ''
})

// Initial group data for change tracking
const initialGroupData = ref<{
  group_name: string
  group_status: GroupStatus
  group_description: string
  group_email: string
} | null>(null)

const ownerDisplay = computed(() => {
  return groupEditorStore.group.ownerUsername || groupEditorStore.group.group_owner || ''
})

const isAuthorized = computed(() => true) // parent enforces auth; keep buttons enabled based on store if needed

// Change tracking computed property (same approach as SectionEditor)
const hasChanges = computed(() => {
  if (!groupEditorStore.isEditMode || !initialGroupData.value) {
    return false
  }
  
  const initial = initialGroupData.value
  const current = formData.value
  
  return (
    current.group_name !== initial.group_name ||
    current.group_status !== initial.group_status ||
    current.group_description !== initial.group_description ||
    current.group_email !== initial.group_email
  )
})

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

const optionalEmailRules = [
  (v: string) => !v || /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v) || t('admin.groups.editor.validation.invalidEmail')
]

const usernameRules = [
  // Owner is readonly, so validation is minimal
]

async function validate() {
  if (!formRef.value) return false
  const { valid } = await formRef.value.validate()
  return valid
}

// Load group data from API (same approach as SectionEditor.loadSectionData)
const loadGroupData = async () => {
  if (groupEditorStore.isEditMode && (groupEditorStore.mode as EditMode).groupId) {
    try {
      const groupId = (groupEditorStore.mode as EditMode).groupId
      const groupData = await fetchGroupService.fetchGroupById(groupId)
      populateFormWithGroupData(groupData)
      // Also update store for consistency
      groupEditorStore.initEditMode(groupData)
    } catch (error) {
      console.error('Failed to load group data:', error)
    }
  }
}

// Populate form data from group data (same approach as SectionEditor.populateFormWithSection)
const populateFormWithGroupData = (groupData: IGroupData) => {
  const groupFormData = {
    group_name: groupData.group_name || '',
    group_status: groupData.group_status || GroupStatus.ACTIVE,
    group_description: groupData.group_description || '',
    group_email: groupData.group_email || ''
  }
  
  formData.value = groupFormData
  
  // Store initial data for change tracking (same approach as SectionEditor)
  initialGroupData.value = { ...groupFormData }
  
  // Also update store for consistency (but don't trigger watch cycles)
  groupEditorStore.updateGroup(groupFormData)
}

async function handleCreateGroup() {
  if (!(await validate())) {
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.requiredFields'))
    return
  }
  try {
    isSubmitting.value = true
    // Update store with form data before creating
    groupEditorStore.updateGroup(formData.value)
    const response = await groupEditorStore.createNewGroup()
    if (response?.success) {
      const groupData: IGroupData = {
        ...formData.value,
        group_id: response.groupId,
        group_owner: groupEditorStore.group.group_owner
      }
      groupEditorStore.initEditMode(groupData)
      populateFormWithGroupData(groupData)
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.createSuccess'))
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.groups.editor.messages.createError'))
  } finally {
    isSubmitting.value = false
  }
}

async function handleUpdateGroup() {
  if (!(await validate())) {
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.requiredFields'))
    return
  }
  if (!hasChanges.value) {
    uiStore.showInfoSnackbar(t('admin.groups.editor.messages.noChanges'))
    return
  }
  isSubmitting.value = true
  try {
    // Prepare update data from local formData
    const groupId = (groupEditorStore.mode as EditMode).groupId
    const requestData = {
      group_id: groupId,
      group_name: formData.value.group_name,
      group_status: formData.value.group_status,
      group_description: formData.value.group_description,
      group_email: formData.value.group_email
    }
    const success = await (await import('./service.update.group')).updateGroupService.updateGroup(requestData)
    if (success) {
      // Update initial data after successful update to reset change tracking (same approach as SectionEditor)
      if (initialGroupData.value) {
        initialGroupData.value = {
          group_name: formData.value.group_name,
          group_status: formData.value.group_status,
          group_description: formData.value.group_description,
          group_email: formData.value.group_email
        }
      }
      // Also update store for consistency
      groupEditorStore.updateGroup(formData.value)
      groupEditorStore.updateOriginalData()
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.updateSuccess'))
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.groups.editor.messages.updateError'))
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  groupEditorStore.resetForm()
  formData.value = {
    group_name: '',
    group_status: GroupStatus.ACTIVE,
    group_description: '',
    group_email: ''
  }
  initialGroupData.value = null
  formRef.value?.reset()
}

const handleChangeOwner = () => {
  isOwnerSelectorModalOpen.value = true
}

const handleOwnerChanged = async (result: any) => {
  if (result && result.success) {
    const groupId = (groupEditorStore.mode as EditMode).groupId
    try {
      const groupData = await fetchGroupService.fetchGroupById(groupId)
      populateFormWithGroupData(groupData)
      groupEditorStore.initEditMode(groupData)
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.ownerChangeSuccess'))
    } catch (error) {
      uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.groups.editor.messages.ownerChangeError'))
    }
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.groups.editor.messages.ownerChangeError'))
  }
}

// Initialize form data on mount (same approach as SectionEditor.onMounted)
onMounted(() => {
  if (groupEditorStore.isEditMode) {
    loadGroupData()
  } else {
    // In create mode, initialize from store
    formData.value = {
      group_name: groupEditorStore.group.group_name || '',
      group_status: groupEditorStore.group.group_status || GroupStatus.ACTIVE,
      group_description: groupEditorStore.group.group_description || '',
      group_email: groupEditorStore.group.group_email || ''
    }
  }
})
</script>

<template>
  <div class="d-flex">
    <!-- Main content -->
    <div class="flex-grow-1">
      <v-container class="content-container pa-0">
        <v-card flat>
          <!-- Group UUID Display -->
          <div v-if="groupEditorStore.isEditMode" class="group-uuid-container pa-4 pb-0">
            <div class="group-uuid-label">
              {{ t('admin.groups.editor.form.groupId') }}:
            </div>
            <div class="group-uuid-value">
              {{ groupEditorStore.group.group_id || '-' }}
            </div>
          </div>

          <v-form ref="formRef" v-model="isFormValid" @submit.prevent>
            <v-row class="pa-4">
              <v-col cols="12" md="9">
                <v-text-field
                  v-model="formData.group_name"
                  :label="t('admin.groups.editor.form.name')"
                  :rules="groupNameRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="formData.group_status"
                  :label="t('admin.groups.editor.form.status')"
                  :items="[
                    { title: t('admin.groups.editor.status.active'), value: GroupStatus.ACTIVE },
                    { title: t('admin.groups.editor.status.disabled'), value: GroupStatus.DISABLED },
                    { title: t('admin.groups.editor.status.archived'), value: GroupStatus.ARCHIVED }
                  ]"
                  item-title="title"
                  item-value="value"
                  :rules="groupStatusRules"
                  variant="outlined"
                  density="comfortable"
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.group_description"
                  :label="t('admin.groups.editor.form.description')"
                  :rules="generalDescriptionRules"
                  variant="outlined"
                  rows="2"
                  counter="5000"
                />
              </v-col>

              <v-col cols="12" md="8">
                <v-text-field
                  v-model="formData.group_email"
                  :label="t('admin.groups.editor.form.email')"
                  :rules="optionalEmailRules"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model="ownerDisplay"
                  :label="t('admin.groups.editor.form.owner')"
                  :rules="usernameRules"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-container>
    </div>

    <!-- Right sidebar -->
    <div class="side-bar-container">
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">{{ t('admin.groups.editor.sidebar.actions') }}</h3>
        <v-btn
          v-if="!groupEditorStore.isEditMode"
          block
          color="teal"
          variant="outlined"
          :disabled="!isFormValid || isSubmitting"
          class="mb-3"
          @click="handleCreateGroup"
        >
          {{ t('admin.groups.editor.buttons.create') }}
        </v-btn>
        <v-btn
          v-if="groupEditorStore.isEditMode"
          block
          color="teal"
          variant="outlined"
          :disabled="!isFormValid || !hasChanges || isSubmitting"
          :class="['mb-3', { 'update-btn-glow': hasChanges && isFormValid && !isSubmitting }]"
          @click="handleUpdateGroup"
        >
          {{ t('admin.groups.editor.buttons.update') }}
        </v-btn>
      </div>

      <div class="sidebar-divider" />

      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">{{ t('admin.groups.editor.sidebar.selectedItem') }}</h3>
        <v-btn
          v-if="!groupEditorStore.isEditMode"
          block
          variant="outlined"
          class="mb-3"
          @click="resetForm"
        >
          {{ t('admin.groups.editor.buttons.reset') }}
        </v-btn>
        <v-btn
          v-if="groupEditorStore.isEditMode"
          block
          color="teal"
          variant="outlined"
          class="mb-3"
          @click="handleChangeOwner"
        >
          {{ t('admin.groups.editor.buttons.changeOwner') }}
        </v-btn>
      </div>
    </div>
  </div>

  <!-- Owner change dialog -->
  <v-dialog v-model="isOwnerSelectorModalOpen" max-width="700">
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
</template>

<style scoped>
/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Group UUID display styles - similar to GroupEditorMembers.vue */
.group-uuid-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}

.group-uuid-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
}

.group-uuid-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
}

.side-bar-container { width: 18%; min-width: 220px; border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); display: flex; flex-direction: column; }
.side-bar-section { padding: 16px; }
.sidebar-divider { height: 20px; position: relative; margin: 0 16px; }
.sidebar-divider::after { content: ''; position: absolute; top: 50%; left: 0; right: 0; border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); }

/* Update button glow animation for unsaved changes */
.update-btn-glow {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
}

@keyframes soft-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px rgba(20, 184, 166, 0.5);
    transform: scale(1.01);
  }
}
</style>


