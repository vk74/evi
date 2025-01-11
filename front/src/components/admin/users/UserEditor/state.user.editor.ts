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
  UserEditorState
} from './types.user.editor'

/**
* Начальные значения для формы аккаунта
*/
const initialAccountState: IUserAccount = {
 username: '',
 email: '',
 password: '',
 passwordConfirm: '',
 is_staff: false,
 account_status: '',  // AccountStatus.ACTIVE,
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
 gender: null,
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
       account_status: account.account_status,
       is_staff: account.is_staff,
       first_name: account.first_name,
       last_name: account.last_name,
       middle_name: account.middle_name,
       gender: profile.gender === Gender.MALE ? 'm' : 
               profile.gender === Gender.FEMALE ? 'f' : null,
       mobile_phone_number: profile.mobile_phone_number,
       address: profile.address,
       company_name: profile.company_name,
       position: profile.position
     }
   }
 }
})