/**
 * state.user.editor.ts
 * Pinia store for managing user editor state.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
    IUserAccount, 
    IUserProfile,
    EditorMode
} from './types.user.editor'
import { AccountStatus, Gender } from './types.user.editor'  // Добавлен импорт Gender

// Logger для основных операций
const logger = {
    info: (message: string, meta?: object) => console.log(`[UserEditorStore] ${message}`, meta || ''),
    error: (message: string, error?: unknown) => console.error(`[UserEditorStore] ${message}`, error || '')
}

export const useUserEditorStore = defineStore('userEditor', () => {
    // State
    const editorMode = ref<EditorMode>({ mode: 'create' })
    const loading = ref<boolean>(false)
    const error = ref<string | null>(null)
    
    // Form data
    const userAccount = ref<IUserAccount>({
        username: '',
        email: '',
        password: '',
        passwordConfirm: '',  // Добавлено для валидации
        is_staff: false,
        account_status: AccountStatus.ACTIVE,
        first_name: '',
        middle_name: null,
        last_name: '',
    })

    const userProfile = ref<IUserProfile>({
        phone_number: null,
        address: null,
        company_name: null,
        position: null,
        gender: null,
        reserve1: null,
        reserve2: null,
        reserve3: null
    })

    // Form validation states
    const isAccountFormValid = ref<boolean>(false)
    const isProfileFormValid = ref<boolean>(false)
    const hasInteracted = ref<boolean>(false)
    const showRequiredFieldsWarning = ref<boolean>(false)
    const isSubmitting = ref<boolean>(false)

    // Form validation results from validator
    const requiredFieldsComplete = ref<boolean>(false)
    const userInputsValidated = ref<boolean>(false)

    // Computed
    const isEditMode = computed(() => editorMode.value.mode === 'edit')
    
    const requiredFieldsFilled = computed(() => {
        const account = userAccount.value
        return Boolean(
            account.username &&
            account.email &&
            account.password &&
            account.passwordConfirm &&
            account.password === account.passwordConfirm &&
            account.first_name &&
            account.last_name
        )
    })

    const isFormValid = computed(() => {
        return isAccountFormValid.value && 
               isProfileFormValid.value && 
               requiredFieldsFilled.value &&
               requiredFieldsComplete.value &&
               userInputsValidated.value
    })

    // Actions
    function initializeEditor(mode: EditorMode) {
        editorMode.value = mode
        logger.info(`Editor initialized in ${mode.mode} mode`, 
            mode.mode === 'edit' ? { userId: mode.userId } : undefined
        )
    }

    function resetForms() {
        userAccount.value = {
            username: '',
            email: '',
            password: '',
            passwordConfirm: '',
            is_staff: false,
            account_status: AccountStatus.ACTIVE,
            first_name: '',
            middle_name: null,
            last_name: ''
        }

        userProfile.value = {
            phone_number: null,
            address: null,
            company_name: null,
            position: null,
            gender: null,
            reserve1: null,
            reserve2: null,
            reserve3: null
        }

        isAccountFormValid.value = false
        isProfileFormValid.value = false
        hasInteracted.value = false
        showRequiredFieldsWarning.value = false
        error.value = null

        logger.info('Forms reset to initial state')
    }

    function setFormValidation(form: 'account' | 'profile', isValid: boolean) {
        if (form === 'account') {
            isAccountFormValid.value = isValid
        } else {
            isProfileFormValid.value = isValid
        }
        logger.info(`${form} form validation state updated`, { isValid })
    }

    function updateAccountData(data: Partial<IUserAccount>) {
        userAccount.value = { ...userAccount.value, ...data }
        logger.info('Account data updated')
    }

    function updateProfileData(data: Partial<IUserProfile>) {
        userProfile.value = { ...userProfile.value, ...data }
        // Валидация значения gender при обновлении
        if (data.gender !== undefined && data.gender !== null) {
            if (![Gender.MALE, Gender.FEMALE, null].includes(data.gender)) {
                logger.error('Invalid gender value provided')
                return
            }
        }
        logger.info('Profile data updated')
    }

    function setRequiredFieldsComplete(isComplete: boolean) {
        requiredFieldsComplete.value = isComplete
        logger.info('Required fields completion status updated:', { isComplete })
    }
    
    function setUserInputsValidated(isValid: boolean) {
        userInputsValidated.value = isValid
        logger.info('User inputs validation status updated:', { isValid })
    }

    return {
        // State
        editorMode,
        loading,
        error,
        userAccount,
        userProfile,
        isAccountFormValid,
        isProfileFormValid,
        hasInteracted,
        showRequiredFieldsWarning,
        isSubmitting,
        requiredFieldsComplete,
        userInputsValidated,

        // Computed
        isEditMode,
        requiredFieldsFilled,
        isFormValid,

        // Actions
        initializeEditor,
        resetForms,
        setFormValidation,
        updateAccountData,
        updateProfileData,
        setRequiredFieldsComplete,
        setUserInputsValidated,
    }
})