/**
 * rules.common.fields.ts - frontend validation rules
 * Version: 1.0.1
 * Common validation rules for frequently used form fields.
 * Frontend file that provides static validation rules for FIO fields.
 * 
 * Note: username, email, mobilePhone, and password validation rules have been removed
 * as they now use dynamic validation from public policies.
 * Only FIO (firstName, middleName, lastName) rules remain here.
 */
import { useI18n } from 'vue-i18n'

// const { t } = useI18n()

// type ValidationRule = (value: string) => string | boolean

/**
 * Regular expression for validating person names
 * Allows letters, spaces and hyphens
 */
const nameRegex = /^[a-zA-Zа-яА-Я\- ]+$/

export function useValidationRules() {
    const { t } = useI18n()
    
    return {
      // Removed usernameRules, emailRules, mobilePhoneRules - now using dynamic validation from public policies
      // Removed passwordRules - now using dynamic validation from public policies
      
       firstNameRules: [
        v => !!v || t('validation.firstName.required'),
        v => (v && v.length >= 2) || t('validation.firstName.minLength'),
        v => (v && v.length <= 50) || t('validation.firstName.maxLength'),
        v => !v || nameRegex.test(v) || t('validation.firstName.format')
       ],
       
       middleNameRules: [
        v => !v || v.length <= 50 || t('validation.middleName.maxLength'),
        v => !v || nameRegex.test(v) || t('validation.middleName.format')
       ],
       
       lastNameRules: [
        v => !!v || t('validation.lastName.required'),
        v => (v && v.length >= 2) || t('validation.lastName.minLength'),
        v => (v && v.length <= 50) || t('validation.lastName.maxLength'),
        v => !v || nameRegex.test(v) || t('validation.lastName.format')
       ],

       generalDescriptionRules: [
         v => !v || v.length <= 2000 || t('validation.generalDescription.maxLength'),
         v => !v || /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/.test(v) || t('validation.generalDescription.format'),
       ]
    }
  }