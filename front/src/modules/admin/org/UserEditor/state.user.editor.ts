/**
 * @file state.user.editor.ts
 * Version: 1.0.0
 * Pinia store for managing user editor state.
 * Frontend file that handles form data storage, UI state management, and API data preparation.
 *
 * Functionality:
 * - Store form data in new user creation mode
 * - Manage UI state
 * - Prepare data for API submission
 */

import { defineStore } from 'pinia'
//import { AccountStatus, Gender } from './types.user.editor'
import { Gender } from './types.user.editor'
import type { 
  IUserAccount,
  IUserProfile,
  IEditorUIState,
  ICreateUserRequest,
  IUpdateUserRequest, 
  UserEditorState,
  EditMode,
  IUpdateUserRequestData
} from './types.user.editor'

/**
 * Initial values for account form
 */
const initialAccountState: IUserAccount = {
 username: '',
 email: '',
 password: '',
 passwordConfirm: '',
 is_staff: true,
 account_status: 'active',
 first_name: '',
 middle_name: '', //null,
 last_name: '',
}

/**
 * Initial values for profile form
 */
const initialProfileState: IUserProfile = {
 mobile_phone_number: '', //null,
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
    account: { ...initialAccountState },
    profile: { ...initialProfileState },
    ui: { ...initialUIState },
    mode: {
      mode: 'create'
    },
    originalData: undefined
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

    const currentData = {
      ...this.account,
      ...this.profile
    }

    const originalData = {
      ...this.originalData.account,
      ...this.originalData.profile
    }

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
    if (currentData.mobile_phone_number !== originalData.mobile_phone_number) {
      changes.mobile_phone_number = currentData.mobile_phone_number
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
  }
},

 actions: {
   /**
    * Update account data
    */
   updateAccount(data: Partial<IUserAccount>) {
     console.log('Updating account data:', data)
     this.account = { ...this.account, ...data }
   },

   /**
    * Update profile data
    */
   updateProfile(data: Partial<IUserProfile>) {
     console.log('Updating profile data:', data)
     this.profile = { ...this.profile, ...data }
   },


  // Add new action
  initEditMode(data: { user: IUserAccount; profile: IUserProfile }) {
    console.log('Initializing edit mode with user data')
    
    // Set edit mode
    this.mode = {
      mode: 'edit',
      userId: data.user.user_id as string
    }
    
    // Save original data
    this.originalData = {
      account: { ...data.user },
      profile: { ...data.profile }
    }
    
    // Update current data through existing actions
    this.updateAccount(data.user)
    this.updateProfile(data.profile)
  },
   
   /**
    * Reset form to initial values
    */
   resetForm() {
     console.log('Resetting form to initial state')
     this.account = { ...initialAccountState }
     this.profile = { ...initialProfileState }
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
     const { account, profile } = this
     
     return {
       username: account.username,
       email: account.email,
       password: account.password,
       account_status: account.account_status || 'active',
       is_staff: account.is_staff,
       first_name: account.first_name,
       last_name: account.last_name,
       middle_name: account.middle_name || '',
      gender: profile.gender || 'n',
      mobile_phone_number: profile.mobile_phone_number || ''
     }
   },

  prepareUpdateData(): IUpdateUserRequestData {
    // Use getter to get changes
    const changes = this.getChangedFields

    // Log for debugging
    console.log('Preparing data for update:', changes)

    return changes
  }
 }
})