/**
 * Common validation rules for frequently used form fields.
 * Used across multiple components to ensure consistent validation behavior.
 * Contains rules for username, password, email and mobile phone fields.
 */

type ValidationRule = (value: string) => string | boolean

export const usernameRules: ValidationRule[] = [
    v => !!v || 'Username is required',
    v => (v && v.length >= 3) || 'Minimum length is 3 characters',
    v => (v && v.length <= 25) || 'Maximum length is 25 characters',
    v => /^[a-zA-Z0-9]+$/.test(v) || 'Only Latin letters and numbers are allowed',
    v => /[a-zA-Z]/.test(v) || 'Username must contain at least one letter'
]

export const passwordRules: ValidationRule[] = [
    v => !!v || 'Password is required',
    v => (v && v.length >= 8) || 'Minimum length is 8 characters',
    v => (v && v.length <= 40) || 'Maximum length is 40 characters',
    v => /^[A-Za-z0-9!"#$%&'()*+,.-/:;<=>?@[\]^_`{|}~]+$/.test(v) || 
        'Password may contain Latin letters, numbers and common special characters',
    v => /[A-Za-z]/.test(v) || 'Password must contain at least one letter',
    v => /[0-9]/.test(v) || 'Password must contain at least one number'
]

export const emailRules: ValidationRule[] = [
    v => !!v || 'Email is required',
    v => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        return emailRegex.test(v) || 'Invalid email address'
    }
]

export const mobilePhoneRules: ValidationRule[] = [
    v => {
        if (!v || v === '' || v === '+') return true
        const phoneRegex = /^\+?[\d\s.()-]{10,15}$/
        return phoneRegex.test(v.trim()) || 'Invalid mobile phone number'
    }
]