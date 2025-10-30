/**
 * @file state.user.editor.ts
 * Version: 1.0.3
 * Pinia store for managing user editor state and form data synchronization.
 * Frontend file that handles form data storage, UI state management, and API data preparation.
 *
 * Functionality:
 * - Store form data in create and edit modes
 * - Manage UI state and form validation
 * - Track changes for update operations
 * - Prepare data for API submission
 * - Handle original data synchronization after successful updates
 */

import { defineStore } from 'pinia'
//import { AccountStatus, Gender } from './types.user.editor'
import { Gender } from './types.user.editor'
import type { 
  IUserAccount,
  IEditorUIState,
  ICreateUserRequest,
  IUpdateUserRequest, 
  UserEditorState,
  EditMode,
  IUpdateUserRequestData
} from './types.user.editor'

/**
 * Initial values for user
 */
const initialUserState: IUserAccount = {
 username: '',
 email: '',
 password: '',
 passwordConfirm: '',
 is_staff: false,
 account_status: 'active',
 first_name: '',
 middle_name: '', //null,
 last_name: '',

 mobile_phone: '', //null,
 gender: 'n' //null,
}

/**
 * Initial values for UI state
 */
const initialUIState: IEditorUIState = {
  activeSection: 'details',
  showPassword: false,
  isSubmitting: false,
  hasInteracted: false,
  isFormChanged: false,
}

/**
 * Store definition
 */
export const useUserEditorStore = defineStore('userEditor', {
  state: (): UserEditorState => ({
    account: { ...initialUserState },
    ui: { ...initialUIState },
    mode: {
      mode: 'create'
    },
    originalData: undefined,
    groups: {
      selectedGroups: []
    }
  }),

// getters
getters: {
  isEditMode(): boolean {
    return this.mode.mode === 'edit'
  },
  
  getChangedFields(): IUpdateUserRequestData {
    if (!this.originalData || this.mode.mode !== 'edit') {
      return {}  // Return empty object
    }

    const changes: IUpdateUserRequestData = {}

    const currentData = this.account

    const originalData = this.originalData.account

    // Check each field and add only changed ones
    if (currentData.username !== originalData.username) {
      changes.username = currentData.username
    }
    if (currentData.email !== originalData.email) {
      changes.email = currentData.email
    }
    if (currentData.account_status !== originalData.account_status) {
      changes.account_status = currentData.account_status
    }
    if (currentData.is_staff !== originalData.is_staff) {
      changes.is_staff = currentData.is_staff
    }
    if (currentData.first_name !== originalData.first_name) {
      changes.first_name = currentData.first_name
    }
    if (currentData.last_name !== originalData.last_name) {
      changes.last_name = currentData.last_name
    }
    if (currentData.middle_name !== originalData.middle_name) {
      changes.middle_name = currentData.middle_name
    }
    if (currentData.gender !== originalData.gender) {
      changes.gender = currentData.gender as 'm' | 'f' | 'n'
    }
    if (currentData.mobile_phone !== originalData.mobile_phone) {
      changes.mobile_phone = currentData.mobile_phone
    }

    return changes
  },

  hasChanges(): boolean {
    if (!this.originalData || this.mode.mode !== 'edit') {
      return false
    }
    
    // Get changed fields
    const changes = this.getChangedFields
    // Check if there are changes
    return Object.keys(changes).length > 0
  },

  hasSelectedGroups(): boolean {
    return this.groups.selectedGroups.length > 0
  }
},

 actions: {
  /**
   * Normalize phone value for API submission (digits only)
   */
  normalizePhoneForApi(value?: string): string {
    if (!value) return ''
    const hasPlus = /^\s*\+/.test(value)
    const digits = value.replace(/\D/g, '')
    return hasPlus ? `+${digits}` : digits
  },
   /**
    * Update user data
    */
   updateUser(data: Partial<IUserAccount>) {
     console.log('Updating user data:', data)
     this.account = { ...this.account, ...data }
   },


  // Add new action
  initEditMode(data: { user: IUserAccount }) {
    console.log('Initializing edit mode with user data')
    
    // Set edit mode
    this.mode = {
      mode: 'edit',
      userId: data.user.user_id as string
    }
    
    // Save original data
    this.originalData = {
      account: { ...data.user }
    }
    
    // Update current data
    this.account = { ...data.user }
  },
   
   /**
    * Reset form to initial values
    */
   resetForm() {
     console.log('Resetting form to initial state')
     this.account = { ...initialUserState }
     this.ui = { ...initialUIState }
   },

   /**
    * Switch active UI section
    */
   setActiveSection(section: 'details' | 'groups') {
     this.ui.activeSection = section
     this.ui.hasInteracted = true
   },

   /**
    * Set form submission state
    */
   setSubmitting(isSubmitting: boolean) {
     console.log('Setting submitting state:', isSubmitting)
     this.ui.isSubmitting = isSubmitting
   },

   /**
    * Prepare data for API submission
    */
   prepareRequestData(): ICreateUserRequest {
     console.log('Preparing data for API request')
     const { account } = this
     
     return {
       username: account.username,
       email: account.email,
       password: account.password,
       account_status: account.account_status || 'active',
       is_staff: account.is_staff,
       first_name: account.first_name,
       last_name: account.last_name,
       middle_name: account.middle_name || '',
       gender: account.gender || 'n',
      mobile_phone: this.normalizePhoneForApi(account.mobile_phone)
     }
   },

  prepareUpdateData(): IUpdateUserRequestData {
    // Use getter to get changes
    const changes = this.getChangedFields

    // Log for debugging
    console.log('Preparing data for update:', changes)

    // Normalize fields for API
    if (typeof changes.mobile_phone === 'string') {
      changes.mobile_phone = this.normalizePhoneForApi(changes.mobile_phone)
    }

    return changes
  },

  /**
   * Toggle group selection
   */
  toggleGroupSelection(groupId: string, selected: boolean) {
    if (selected) {
      if (!this.groups.selectedGroups.includes(groupId)) {
        this.groups.selectedGroups.push(groupId)
      }
    } else {
      this.groups.selectedGroups = this.groups.selectedGroups.filter(id => id !== groupId)
    }
  },

  /**
   * Clear all selected groups
   */
  clearGroupsSelection() {
    this.groups.selectedGroups = []
  },

  /**
   * Update original data after successful update
   * This resets the hasChanges state by syncing originalData with current data
   */
  updateOriginalData() {
    console.log('Updating original data after successful update')
    this.originalData = {
      account: { ...this.account }
    }
  }
 }
})