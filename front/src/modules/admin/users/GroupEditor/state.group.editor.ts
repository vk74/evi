/**
 * @file state.group.editor.ts
 * Version: 1.0.0
 * Pinia store for managing group editor state.
 * Frontend file that handles form data storage, UI state management, and API data preparation.
 *
 * Functionality:
 * - Store form data in new group creation mode
 * - Manage UI state
 * - Prepare data for API submission
 */

import { defineStore } from 'pinia'
import { GroupStatus } from './types.group.editor'
import type { 
  IGroupData,
  IGroupDetails,
  IEditorUIState,
  ICreateGroupRequest,
  IUpdateGroupRequest,
  GroupEditorState,
  EditMode,
  ICreateGroupResponse,
  IGroupMember,
  IGroupMembersState
} from './types.group.editor'
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { createGroupService } from './service.create.group'

/**
 * Initial values for group data
 */
const initialGroupState: IGroupData = {
  group_name: '',
  group_status: GroupStatus.ACTIVE,
  group_owner: '',
  //is_system: false
}

/**
 * Initial values for additional information
 */
const initialDetailsState: IGroupDetails = {
  group_description: '',
  group_email: ''
}

/**
 * Initial values for UI state
 */
const initialUIState: IEditorUIState = {
  activeSection: 'details',
  isSubmitting: false,
  hasInteracted: false,
  isFormChanged: false,
  showRequiredFieldsWarning: false
}

/**
 * Initial values for group members state
 */
const initialMembersState: IGroupMembersState = {
  members: [],
  loading: false,
  error: null,
  selectedMembers: []
}

/**
 * Store definition
 */
export const useGroupEditorStore = defineStore('groupEditor', {
  state: (): GroupEditorState => {
    const userStore = useUserAuthStore()
    return {
      group: { 
        ...initialGroupState,
        group_owner: userStore.username || ''
      },
      details: { ...initialDetailsState },
      ui: { ...initialUIState },
      mode: {
        mode: 'create'
      },
      originalData: undefined,
      members: { ...initialMembersState }
    }
  },

  getters: {
    isEditMode(): boolean {
      return this.mode.mode === 'edit'
    },

    hasChanges(): boolean {
      if (!this.originalData || this.mode.mode !== 'edit') {
        return false
      }

      // Get changed fields
      const changes = this.getChangedFields
      // Check if there are changes besides group_id
      return Object.keys(changes).length > 1  // > 1 because group_id is always present
    },

    getChangedFields(): IUpdateGroupRequest {
      if (!this.originalData || this.mode.mode !== 'edit') {
        return { group_id: '' }  // Return empty object with required field
      }

      const changes: IUpdateGroupRequest = {
        group_id: (this.mode as EditMode).groupId
      }

      const currentData = {
        ...this.group,
        ...this.details
      }

      const originalData = {
        ...this.originalData.group,
        ...this.originalData.details
      }

      // Check each field and add only changed ones
      if (currentData.group_name !== originalData.group_name) {
        changes.group_name = currentData.group_name
      }
      if (currentData.group_status !== originalData.group_status) {
        changes.group_status = currentData.group_status
      }
      if (currentData.group_owner !== originalData.group_owner) {
        changes.group_owner = currentData.group_owner
      }
      //if (currentData.is_system !== originalData.is_system) {
      //  changes.is_system = currentData.is_system
      //}
      if (currentData.group_description !== originalData.group_description) {
        changes.group_description = currentData.group_description
      }
      if (currentData.group_email !== originalData.group_email) {
        changes.group_email = currentData.group_email
      }

      return changes
    },

    /**
     * Get group members list
     */
    getGroupMembers(): IGroupMember[] {
      return this.members.members
    },

    /**
     * Number of selected members
     */
    selectedMembersCount(): number {
      return this.members.selectedMembers.length
    },

    /**
     * Whether any members are selected
     */
    hasSelectedMembers(): boolean {
      return this.selectedMembersCount > 0
    }
  },

  actions: {
    /**
     * Update group data
     */
    updateGroup(data: Partial<IGroupData>) {
      console.log('Updating group data:', data)
      this.group = { ...this.group, ...data }
    },

    /**
     * Update additional information
     */
    updateDetails(data: Partial<IGroupDetails>) {
      console.log('Updating group details:', data)
      this.details = { ...this.details, ...data }
    },

    /**
     * Initialize edit mode
     */
    initEditMode(data: { group: IGroupData; details: IGroupDetails }) {
      console.log('Initializing edit mode with group data')
      
      // Set edit mode
      this.mode = {
        mode: 'edit',
        groupId: data.group.group_id as string
      }
      
      // Save original data
      this.originalData = {
        group: { ...data.group },
        details: { ...data.details }
      }
      
      // Update current data through existing actions
      this.updateGroup(data.group)
      this.updateDetails(data.details)
    },

    /**
     * Set active section
     */
    setActiveSection(section: 'details' | 'members') {
      console.log('[GroupEditor] Setting active section:', section)
      this.ui.activeSection = section
      this.ui.hasInteracted = true
    },

    /**
     * Reset form to initial values
     * Works only in group creation mode
     */
    // state.group.editor.ts
    resetForm() {
      if (this.mode.mode === 'edit') return
      
      // Use Object.assign for reactivity
      Object.assign(this.group, {
        ...initialGroupState,
        group_owner: useUserAuthStore().username || ''
      })
      
      Object.assign(this.details, initialDetailsState)
      Object.assign(this.ui, initialUIState)
      
      // Reset group members state
      this.resetMembersState()
    },

    /**
     * Set form submission state
     */
    setSubmitting(isSubmitting: boolean) {
      console.log('Setting submitting state:', isSubmitting)
      this.ui.isSubmitting = isSubmitting
    },

    /**
     * Prepare data for group creation
     */
    prepareRequestData(): ICreateGroupRequest {
      console.log('Preparing data for API request')
      const { group, details } = this
      
      return {
        group_name: group.group_name,
        group_status: group.group_status,
        group_owner: group.group_owner,
        //is_system: group.is_system,
        group_description: details.group_description,
        group_email: details.group_email
      }
    },

    /**
     * Prepare data for group update
     */
    prepareUpdateData(): IUpdateGroupRequest {
      // Use getter to get changes
      const changes = this.getChangedFields

      // Log for debugging
      console.log('Preparing data for update:', changes)

      return changes
    },

    /**
     * Create new group
     * @returns Promise<ICreateGroupResponse> - Server response with created group data
     * @throws Error when creation fails
     */
    async createNewGroup(): Promise<ICreateGroupResponse> {
      console.log('[GroupEditorStore] Starting group creation')
      
      try {
        this.setSubmitting(true)
        
        // Get prepared data
        const requestData = this.prepareRequestData()
        
        // Send request through service and get response
        const response = await createGroupService.createGroup(requestData)
        
        console.log('[GroupEditorStore] Group created successfully:', {
          groupId: response.groupId,
          groupName: response.group_name
        })
        
        // Reset form after successful creation
        // this.resetForm()
        
        return response
        
      } catch (error) {
        console.error('[GroupEditorStore] Failed to create group:', error)
        throw error
      } finally {
        this.setSubmitting(false)
      }
    },

    /**
     * Actions for working with group members
     */

    /**
     * Update group members list
     */
    updateGroupMembers(members: IGroupMember[]) {
      console.log('[GroupEditorStore] Updating group members list:', members.length)
      this.members.members = members
    },

    /**
     * Set loading state for group members
     */
    setMembersLoading(loading: boolean) {
      this.members.loading = loading
    },

    /**
     * Set error for group members
     */
    setMembersError(error: string | null) {
      this.members.error = error
    },

    /**
     * Select group member
     */
    selectGroupMember(userId: string) {
      if (!this.members.selectedMembers.includes(userId)) {
        this.members.selectedMembers.push(userId)
        console.log('[GroupEditorStore] Member selected:', userId)
      }
    },

    /**
     * Deselect group member
     */
    deselectGroupMember(userId: string) {
      this.members.selectedMembers = this.members.selectedMembers.filter(id => id !== userId)
      console.log('[GroupEditorStore] Member deselected:', userId)
    },

    /**
     * Toggle group member selection
     */
    toggleGroupMemberSelection(userId: string, selected: boolean) {
      if (selected) {
        this.selectGroupMember(userId)
      } else {
        this.deselectGroupMember(userId)
      }
    },

    /**
     * Clear group members selection
     */
    clearGroupMembersSelection() {
      this.members.selectedMembers = []
      console.log('[GroupEditorStore] Members selection cleared')
    },

    /**
     * Reset group members state
     */
    resetMembersState() {
      Object.assign(this.members, initialMembersState)
      console.log('[GroupEditorStore] Members state reset')
    }
  }
})

export default useGroupEditorStore