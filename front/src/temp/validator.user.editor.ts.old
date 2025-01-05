/**
* validator.user.editor.ts
* Validation rules and helpers for user editor forms.
* 
* This module provides:
* - Validation rules for user account fields
* - Validation rules for user profile fields 
* - Regex patterns for field validation
* - Helper functions for field validation
* 
* Used by:
* - UserEditor.vue component
* - state.user.editor.ts store
*/


import type { 
    IValidationResult, 
    IFormValidationResult,
    IRequiredFieldsResult,
    IUserAccount,
    IUserProfile,
    IEditorValidationResult
} from './types.user.editor'

// Логгер для основных операций
const logger = {
    info: (message: string) => console.log(`[UserEditorValidator] ${message}`),
    error: (message: string) => console.error(`[UserEditorValidator] ${message}`)
 }
 
 /**
 * Регулярные выражения для валидации
 */
 const patterns = {
    // Только буквы, пробелы и дефис
    nameRegex: /^[a-zA-Zа-яА-Я\- ]+$/,
    
    // Буквы, цифры, дефис, точка и нижнее подчеркивание
    usernameRegex: /^[a-zA-Zа-яА-Я0-9\-._]+$/,
    
    // Формат email
    emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    
    // Формат телефона (начинается с + и содержит цифры)
    phoneRegex: /^\+[\d\s]{11,15}$/,
    
    // Общие символы для текстовых полей (буквы, цифры, знаки препинания, пробелы)
    generalTextRegex: /^[\p{L}\p{N}\p{P}\p{Z}]+$/u
 }
 
/**
 * Список обязательных полей по секциям
 */
const requiredFields = {
    account: [
        'username',
        'email',
        'password',
        'passwordConfirm',
        'first_name',
        'last_name'
    ],
    profile: [] // в профиле нет обязательных полей
} as const

 /**
 * Правила валидации для учетной записи
 */
 export const accountValidationRules = {
    username: [
        (v: string) => !!v || 'название учетной записи обязательно',
        (v: string) => (v && v.length <= 50) || 'название учетной записи не может быть длиннее 50 символов',
        (v: string) => patterns.usernameRegex.test(v) || 'разрешены только буквы, цифры, дефис, точка и нижнее подчеркивание'
    ],
 
    email: [
        (v: string) => !!v || 'e-mail обязателен',
        (v: string) => patterns.emailRegex.test(v) || 'некорректный e-mail адрес',
        (v: string) => (v && v.length <= 255) || 'e-mail не может быть длиннее 255 символов'
    ],
 
    password: [
        (v: string) => !!v || 'пароль обязателен',
        (v: string) => (v && v.length >= 8) || 'пароль должен быть не короче 8 символов',
        (v: string) => (v && v.length <= 40) || 'пароль не может быть длиннее 40 символов',
        (v: string) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,40}$/.test(v) || 'пароль должен содержать буквы и цифры'
    ],
 
    passwordConfirm: [
        (v: string) => !!v || 'подтверждение пароля обязательно',
        (v: string, password: string) => v === password || 'пароли не совпадают'
    ],
 
    first_name: [
        (v: string) => !!v || 'имя обязательно',
        (v: string) => (v && v.length >= 2) || 'имя должно быть не короче 2 символов',
        (v: string) => (v && v.length <= 50) || 'имя не может быть длиннее 50 символов',
        (v: string) => !v || patterns.nameRegex.test(v) || 'имя может содержать только буквы, пробелы и дефис'
    ],
 
    last_name: [
        (v: string) => !!v || 'фамилия обязательна',
        (v: string) => (v && v.length >= 2) || 'фамилия должна быть не короче 2 символов',
        (v: string) => (v && v.length <= 50) || 'фамилия не может быть длиннее 50 символов',
        (v: string) => !v || patterns.nameRegex.test(v) || 'фамилия может содержать только буквы, пробелы и дефис'
    ],
 
    middle_name: [
        (v: string | null) => !v || v.length <= 50 || 'отчество не может быть длиннее 50 символов',
        (v: string | null) => !v || patterns.nameRegex.test(v) || 'отчество может содержать только буквы, пробелы и дефис'
    ]
 }
 
 /**
 * Правила валидации для профиля
 */
 export const profileValidationRules = {
    phone_number: [
        (v: string | null) => !v || patterns.phoneRegex.test(v) || 'неверный формат телефона'
    ],
 
    address: [
        (v: string | null) => !v || v.length <= 5000 || 'адрес не может быть длиннее 5000 символов',
        (v: string | null) => !v || patterns.generalTextRegex.test(v) || 'адрес содержит недопустимые символы'
    ],
 
    company_name: [
        (v: string | null) => !v || v.length <= 255 || 'название компании не может быть длиннее 255 символов',
        (v: string | null) => !v || patterns.generalTextRegex.test(v) || 'название компании содержит недопустимые символы'
    ],
 
    position: [
        (v: string | null) => !v || v.length <= 255 || 'должность не может быть длиннее 255 символов',
        (v: string | null) => !v || patterns.generalTextRegex.test(v) || 'должность содержит недопустимые символы'
    ],
 
    reserve1: [
        (v: string | null) => !v || v.length <= 50 || 'поле не может быть длиннее 50 символов'
    ],
 
    reserve2: [
        (v: string | null) => !v || v.length <= 50 || 'поле не может быть длиннее 50 символов'
    ],
 
    reserve3: [
        (v: string | null) => !v || v.length <= 50 || 'поле не может быть длиннее 50 символов'
    ]
 }
 
 /**
 * Хелпер для форматирования телефонного номера
 */
 export const phoneNumberHelpers = {
    format: (number: string): string => {
        // Убираем все символы кроме цифр и пробелов
        const cleaned = number.replace(/[^\d\s]/g, '')
        // Добавляем +, если его нет
        return cleaned ? '+' + cleaned : '+'
    },
 
    normalize: (phone: string | null): string | null => {
        if (!phone) return null
        // Оставляем только цифры и добавляем +
        return '+' + phone.replace(/[^\d]/g, '')
    }
 }

/**
* Функции валидации
*/
export const validator = {
    /**
     * Валидация поля учетной записи
     */
    validateAccountField(fieldName: keyof typeof accountValidationRules, value: string, password?: string): IValidationResult {
        const rules = accountValidationRules[fieldName]
        const errors: string[] = []
 
        rules.forEach(rule => {
            // Особая обработка для passwordConfirm, так как ему нужен password
            const result = fieldName === 'passwordConfirm' 
                ? rule(value, password || '')
                : rule(value)
 
            if (result !== true) {
                errors.push(result)
            }
        })
 
        const isValid = errors.length === 0
        logger.info(`Validating account field '${fieldName}': ${isValid ? 'valid' : `invalid with errors: ${errors.join(', ')}`}`)
 
        return { isValid, errors }
    },
 
    /**
     * Валидация поля профиля
     */
    validateProfileField(fieldName: keyof typeof profileValidationRules, value: string | null): IValidationResult {
        const rules = profileValidationRules[fieldName]
        const errors: string[] = []
 
        rules.forEach(rule => {
            const result = rule(value)
            if (result !== true) {
                errors.push(result)
            }
        })
 
        const isValid = errors.length === 0
        logger.info(`Validating profile field '${fieldName}': ${isValid ? 'valid' : `invalid with errors: ${errors.join(', ')}`}`)
 
        return { isValid, errors }
    },
 
    /**
     * Валидация всей формы учетной записи
     */
    validateAccountForm(accountData: IUserAccount): IFormValidationResult {
        const fieldResults: Record<string, IValidationResult> = {}
        let isValid = true
 
        logger.info('Starting account form validation')
 
        for (const fieldName of Object.keys(accountValidationRules)) {
            const value = accountData[fieldName]
            fieldResults[fieldName] = this.validateAccountField(
                fieldName as keyof typeof accountValidationRules,
                value,
                fieldName === 'passwordConfirm' ? accountData.password : undefined
            )
            
            if (!fieldResults[fieldName].isValid) {
                isValid = false
            }
        }
 
        logger.info(`Account form validation completed: ${isValid ? 'valid' : 'invalid'}`)
 
        return { isValid, fieldResults }
    },
 
    /**
     * Валидация всей формы профиля
     */
    validateProfileForm(profileData: IUserProfile): IFormValidationResult {
        const fieldResults: Record<string, IValidationResult> = {}
        let isValid = true
 
        logger.info('Starting profile form validation')
 
        for (const fieldName of Object.keys(profileValidationRules)) {
            const value = profileData[fieldName]
            fieldResults[fieldName] = this.validateProfileField(
                fieldName as keyof typeof profileValidationRules,
                value
            )
            
            if (!fieldResults[fieldName].isValid) {
                isValid = false
            }
        }
 
        logger.info(`Profile form validation completed: ${isValid ? 'valid' : 'invalid'}`)
 
        return { isValid, fieldResults }
    },
 
    /**
     * Проверка заполненности обязательных полей
     */
    checkRequiredFields(accountData: IUserAccount): IRequiredFieldsResult {  // Убираем неиспользуемый параметр profileData
        const emptyFields: string[] = []
        
        requiredFields.account.forEach(fieldName => {
            if (!accountData[fieldName]) {
                emptyFields.push(fieldName)
            }
        })

        if (accountData.password !== accountData.passwordConfirm) {
            if (!emptyFields.includes('passwordConfirm')) {
                emptyFields.push('passwordConfirm')
            }
        }

        const isComplete = emptyFields.length === 0
        logger.info(`Required fields check: ${isComplete ? 'complete' : `incomplete, missing: ${emptyFields.join(', ')}`}`)

        return { isComplete, emptyFields }
    },
 
    /**
     * Полная валидация форм редактора
     */
    validateEditor(accountData: IUserAccount, profileData: IUserProfile): IEditorValidationResult {
        const requiredFieldsResult = this.checkRequiredFields(accountData)
        const accountValidation = this.validateAccountForm(accountData)
        const profileValidation = this.validateProfileForm(profileData)
        
        logger.info(`Editor validation complete: ${JSON.stringify({
            requiredFields: requiredFieldsResult.isComplete,
            accountValid: accountValidation.isValid,
            profileValid: profileValidation.isValid
        })}`)
    
        return {
            requiredFieldsComplete: requiredFieldsResult.isComplete,
            userInputsValidated: accountValidation.isValid && profileValidation.isValid,
            details: {
                requiredFields: requiredFieldsResult,
                account: accountValidation,
                profile: profileValidation
            }
        }
    }
 }

export default {
    accountValidationRules,
    profileValidationRules,
    phoneNumberHelpers,
    patterns,
    validator
}