/**
* state.user.editor.ts
* Pinia store для управления состоянием редактора пользователей.
*
* Функциональность:
* - Хранение данных форм в режиме создания нового пользователя
* - Управление состоянием UI
* - Подготовка данных для отправки в API
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
  EditMode
} from './types.user.editor'

/**
* Начальные значения для формы аккаунта
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
* Начальные значения для формы профиля
*/
const initialProfileState: IUserProfile = {
 mobile_phone_number: '', //null,
 address: '', //null,
 company_name: '', //null,
 position: '', //null,
 gender: 'n' //null,
}

/**
* Начальные значения для состояния UI
*/
const initialUIState: IEditorUIState = {
 activeSection: 'account',
 showPassword: false,
 isSubmitting: false,
 hasInteracted: false,
 isFormChanged: false,
}

/**
* Определение хранилища
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
  
  getChangedFields(): IUpdateUserRequest {
    if (!this.originalData || this.mode.mode !== 'edit') {
      return { user_id: '' }  // Возвращаем пустой объект с обязательным полем
    }

    const changes: IUpdateUserRequest = {
      user_id: (this.mode as EditMode).userId
    }

    const currentData = {
      ...this.account,
      ...this.profile
    }

    const originalData = {
      ...this.originalData.account,
      ...this.originalData.profile
    }

    // Проверяем каждое поле и добавляем только измененные
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
    if (currentData.address !== originalData.address) {
      changes.address = currentData.address
    }
    if (currentData.company_name !== originalData.company_name) {
      changes.company_name = currentData.company_name
    }
    if (currentData.position !== originalData.position) {
      changes.position = currentData.position
    }

    return changes
  },

  hasChanges(): boolean {
    if (!this.originalData || this.mode.mode !== 'edit') {
      return false
    }
    
    // Получаем измененные поля
    const changes = this.getChangedFields
    // Проверяем есть ли изменения помимо user_id
    return Object.keys(changes).length > 1  // > 1 потому что user_id всегда присутствует
  }
},

 actions: {
   /**
    * Обновление данных аккаунта
    */
   updateAccount(data: Partial<IUserAccount>) {
     console.log('Updating account data:', data)
     this.account = { ...this.account, ...data }
   },

   /**
    * Обновление данных профиля
    */
   updateProfile(data: Partial<IUserProfile>) {
     console.log('Updating profile data:', data)
     this.profile = { ...this.profile, ...data }
   },


  // Добавляем новый action
  initEditMode(data: { user: IUserAccount; profile: IUserProfile }) {
    console.log('Initializing edit mode with user data')
    
    // Устанавливаем режим редактирования
    this.mode = {
      mode: 'edit',
      userId: data.user.user_id as string
    }
    
    // Сохраняем оригинальные данные
    this.originalData = {
      account: { ...data.user },
      profile: { ...data.profile }
    }
    
    // Обновляем текущие данные через существующие actions
    this.updateAccount(data.user)
    this.updateProfile(data.profile)
  },
   
   /**
    * Сброс формы к начальным значениям
    */
   resetForm() {
     console.log('Resetting form to initial state')
     this.account = { ...initialAccountState }
     this.profile = { ...initialProfileState }
     this.ui = { ...initialUIState }
   },

   /**
    * Установка состояния отправки формы
    */
   setSubmitting(isSubmitting: boolean) {
     console.log('Setting submitting state:', isSubmitting)
     this.ui.isSubmitting = isSubmitting
   },

   /**
    * Подготовка данных для отправки в API
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
       mobile_phone_number: profile.mobile_phone_number || '',
       address: profile.address || '',
       company_name: profile.company_name || '',
       position: profile.position || ''
     }
   },

  prepareUpdateData(): IUpdateUserRequest {
    // Используем getter для получения изменений
    const changes = this.getChangedFields

    // Логируем для отладки
    console.log('Preparing data for update:', changes)

    return changes
  }
 }
})