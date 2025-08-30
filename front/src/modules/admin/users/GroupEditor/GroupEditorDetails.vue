<!--
version: 1.0.0
Frontend file GroupEditorDetails.vue.
Purpose: Renders the group details form (create/edit) and its right-side actions.
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGroupEditorStore } from './state.group.editor'
import { useUiStore } from '@/core/state/uistate'
import { GroupStatus, type EditMode } from './types.group.editor'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import { defineAsyncComponent } from 'vue'
import { fetchGroupService } from './service.fetch.group'

const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '../../../../core/ui/modals/item-selector/ItemSelector.vue'))

const { t } = useI18n()
const groupEditorStore = useGroupEditorStore()
const uiStore = useUiStore()

const {
  optionalEmailRules,
  generalDescriptionRules,
  usernameRules
} = useValidationRules()

// Local state
const formRef = ref<any>(null)
const isFormValid = ref(false)
const isFormDirty = ref(false)
const isSubmitting = ref(false)
const isOwnerSelectorModalOpen = ref(false)

// Track changes in store to enable Update button
watch(
  () => [groupEditorStore.group, groupEditorStore.details],
  () => { isFormDirty.value = true },
  { deep: true }
)

const ownerDisplay = computed(() => {
  return groupEditorStore.group.ownerUsername || groupEditorStore.group.group_owner || ''
})

const isAuthorized = computed(() => true) // parent enforces auth; keep buttons enabled based on store if needed

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

async function validate() {
  if (!formRef.value) return false
  const { valid } = await formRef.value.validate()
  return valid
}

async function handleCreateGroup() {
  if (!(await validate())) {
    uiStore.showErrorSnackbar(t('admin.groups.editor.messages.requiredFields'))
    return
  }
  try {
    isSubmitting.value = true
    const response = await groupEditorStore.createNewGroup()
    if (response?.success) {
      groupEditorStore.initEditMode({
        group: { ...groupEditorStore.group, group_id: response.groupId },
        details: { ...groupEditorStore.details }
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

async function handleUpdateGroup() {
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
    const success = await (await import('./service.update.group')).updateGroupService.updateGroup(requestData)
    if (success) {
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.updateSuccess'))
      isFormDirty.value = false
    }
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.groups.editor.messages.updateError'))
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  groupEditorStore.resetForm()
  formRef.value?.reset()
  isFormDirty.value = false
}

const handleChangeOwner = () => {
  isOwnerSelectorModalOpen.value = true
}

const handleOwnerChanged = async (result: any) => {
  if (result && result.success) {
    const groupId = (groupEditorStore.mode as EditMode).groupId
    try {
      const { group, details } = await fetchGroupService.fetchGroupById(groupId)
      groupEditorStore.initEditMode({ group, details })
      uiStore.showSuccessSnackbar(t('admin.groups.editor.messages.ownerChangeSuccess'))
    } catch (error) {
      uiStore.showErrorSnackbar(error instanceof Error ? error.message : t('admin.groups.editor.messages.ownerChangeError'))
    }
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.groups.editor.messages.ownerChangeError'))
  }
}
</script>

<template>
  <div class="d-flex">
    <!-- Main content -->
    <div class="flex-grow-1">
      <v-container class="content-container pa-0">
        <v-card flat>
          <v-form ref="formRef" v-model="isFormValid" @submit.prevent>
            <v-row class="pa-4">
              <v-col v-if="groupEditorStore.isEditMode" cols="12" md="6">
                <v-text-field
                  :model-value="groupEditorStore.mode.mode === 'edit' ? groupEditorStore.mode.groupId : ''"
                  :label="t('admin.groups.editor.form.groupId')"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
              </v-col>

              <v-col cols="12" :md="groupEditorStore.isEditMode ? 6 : 12">
                <v-text-field
                  v-model="groupEditorStore.group.group_name"
                  :label="t('admin.groups.editor.form.name')"
                  :rules="groupNameRules"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="groupEditorStore.group.group_status"
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
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="groupEditorStore.details.group_description"
                  :label="t('admin.groups.editor.form.description')"
                  :rules="generalDescriptionRules"
                  variant="outlined"
                  rows="2"
                  counter="5000"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="groupEditorStore.details.group_email"
                  :label="t('admin.groups.editor.form.email')"
                  :rules="optionalEmailRules"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
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
          :disabled="!isFormValid || !isFormDirty || isSubmitting"
          class="mb-3"
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
.side-bar-container { width: 18%; min-width: 220px; border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); display: flex; flex-direction: column; }
.side-bar-section { padding: 16px; }
.sidebar-divider { height: 20px; position: relative; margin: 0 16px; }
.sidebar-divider::after { content: ''; position: absolute; top: 50%; left: 0; right: 0; border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); }
</style>


