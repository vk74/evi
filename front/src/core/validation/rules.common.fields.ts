/**
 * rules.common.fields.ts - frontend validation rules
 * Common validation rules for frequently used form fields.
 * Used across multiple components to ensure consistent validation behavior.
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
      usernameRules: [
        v => !!v || t('validation.username.required'),
        v => (v && v.length >= 2) || t('validation.username.minLength'),
        v => (v && v.length <= 25) || t('validation.username.maxLength'),
        v => /^[a-zA-Z0-9]+$/.test(v) || t('validation.username.format'),
        v => /[a-zA-Z]/.test(v) || t('validation.username.requireLetter')
      ],
      
      passwordRules: [
        v => !!v || t('validation.password.required'),
        v => (v && v.length >= 8) || t('validation.password.minLength'),
        v => (v && v.length <= 40) || t('validation.password.maxLength'),
        v => /^[A-Za-z0-9!"#$%&'()*+,.-/:;<=>?@[\]^_`{|}~]+$/.test(v) || t('validation.password.format'),
        v => /[A-Za-z]/.test(v) || t('validation.password.requireLetter'),
        v => /[0-9]/.test(v) || t('validation.password.requireNumber')
       ],
      
       emailRules: [
        v => !!v || t('validation.email.required'),
        v => {
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
          return emailRegex.test(v) || t('validation.email.format')
        }
       ],

       optionalEmailRules: [
        v => {
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
          return !v || emailRegex.test(v) || t('validation.email.format')
        }
      ],

       mobilePhoneRules: [
        v => {
          if (!v || v === '' || v === '+') return true
          const phoneRegex = /^\+?[\d\s.()-]{10,15}$/
          return phoneRegex.test(v.trim()) || t('validation.mobilePhone.format')
        }
       ],

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
         v => !v || v.length <= 5000 || t('validation.generalDescription.maxLength'),
         v => !v || /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/.test(v) || t('validation.generalDescription.format'),
       ]
    }
  }