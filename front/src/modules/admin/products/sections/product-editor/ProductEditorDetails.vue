<!--
  File: ProductEditorDetails.vue
  Version: 1.4.2
  Description: Component for product details form and actions
  Purpose: Provides interface for creating and editing product details with dynamic validation
  Frontend file - ProductEditorDetails.vue
  
  Changes in v1.2.0:
  - Added dynamic validation for owner, backupOwner, and specialistsGroups fields
  - Validation rules loaded from public API (/api/public/validation-rules)
  - In CREATE mode: all fields validated according to loaded rules
  - In EDIT mode: only changed fields are validated
  - Buttons disabled if validation rules not loaded or fields invalid
  
  Changes in v1.3.0:
  - Added hasChanges tracking for UPDATE button state
  - UPDATE button disabled when no changes detected
  - Added glow effect for active UPDATE button
  - Update service now sends only changed fields
  
  Changes in v1.3.1:
  - Replaced static glow effect with dynamic animation for UPDATE button
  - Animation matches the style used in UserEditorDetails component
  
  Changes in v1.4.0:
  - Added status_code dropdown field after productCode
  - Statuses loaded from API response and stored in store
  - Added statusCode validation (required field)
  - StatusCode included in create and update operations
  
  Changes in v1.4.1:
  - Added translations for status dropdown options
  - Status options now display translated labels based on current language
  - Added locale reactivity to statusOptions computed property
  
  Changes in v1.4.2:
  - Added normalizeStatusCodeForTranslation helper function
  - Status codes with spaces (e.g., "on hold") are normalized to underscores (e.g., "on_hold") for translation keys
  - Fixed issue where status codes with spaces were not displaying translations correctly
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductsAdminStore } from '../../state.products.admin'
import { useUiStore } from '@/core/state/uistate'
import { defineAsyncComponent } from 'vue'
import { serviceCreateProduct } from '../../service.create.product'
import { serviceFetchSingleProduct } from '../../service.fetch.single.product'
import { serviceUpdateProduct } from '../../service.update.product'
import { fetchPublicValidationRules } from '@/core/services/service.fetch.public.validation.rules'
import { usePublicSettingsStore, type ValidationRules } from '@/core/state/state.public.settings'
import type { ProductStatus } from '../../types.products.admin'

const ItemSelector = defineAsyncComponent(() => import(/* webpackChunkName: "ui-item-selector" */ '@/core/ui/modals/item-selector/ItemSelector.vue'))
const DataLoading = defineAsyncComponent(() => import(/* webpackChunkName: "ui-data-loading" */ '@/core/ui/loaders/DataLoading.vue'))

import { PhMagnifyingGlass, PhX, PhPlus, PhCaretUpDown, PhImage } from '@phosphor-icons/vue'

// Initialize stores and i18n
const { t, locale } = useI18n()
const productsStore = useProductsAdminStore()
const uiStore = useUiStore()
const publicStore = usePublicSettingsStore()

// Form reference and validation state
const form = ref<any>(null)
const isFormValid = ref(false)

// UI state variables
const isSubmitting = ref(false)
const isLoadingProduct = ref(false)

// Validation rules state
const currentValidationRules = ref<ValidationRules | null>(null)

// Initial values for tracking changes in edit mode
const initialOwner = ref<string>('')
const initialBackupOwner = ref<string>('')
const initialSpecialistsGroups = ref<string[]>([])

// ItemSelector state
const showOwnerSelector = ref(false)
const showBackupOwnerSelector = ref(false)
const showSpecialistsGroupsSelector = ref(false)

// Picture picker state
const showPicturePicker = ref(false)

// Form data - now using store
const formData = computed(() => productsStore.formData)

// Computed properties
const isCreationMode = computed(() => productsStore.editorMode === 'creation')
const isEditMode = computed(() => productsStore.editorMode === 'edit')
const editingProductId = computed(() => productsStore.editingProductId)
const hasChanges = computed(() => productsStore.hasChanges)
const isUpdateButtonEnabled = computed(() => {
  return isFormValid.value && 
         !isSubmitting.value && 
         validationRulesReady.value && 
         hasChanges.value &&
         isOwnerValid.value && 
         isBackupOwnerValid.value && 
         areSpecialistsGroupsValid.value
})

// Language options from system_language_code
const languageOptions = computed(() => [
  { title: t('admin.products.editor.languages.english'), value: 'en' },
  { title: t('admin.products.editor.languages.russian'), value: 'ru' }
])

// Helper function to normalize status code for translation key
const normalizeStatusCodeForTranslation = (statusCode: string): string => {
  // Replace spaces with underscores for translation keys
  return statusCode.replace(/\s+/g, '_')
}

// Product status options from store with translations
const statusOptions = computed(() => {
  locale.value // Ensure reactivity to language changes
  if (!productsStore.statuses || productsStore.statuses.length === 0) {
    return []
  }
  return productsStore.statuses.map((status: ProductStatus) => {
    const normalizedKey = normalizeStatusCodeForTranslation(status.status_code)
    return {
      title: t(`admin.products.editor.basic.status.options.${normalizedKey}`),
      value: status.status_code
    }
  })
})

// Product type options
const productTypeOptions = computed(() => [
  { title: t('admin.products.editor.basic.type.product'), value: 'product' },
  { title: t('admin.products.editor.basic.type.productAndOption'), value: 'product_and_option' },
  { title: t('admin.products.editor.basic.type.option'), value: 'option' }
])

// Computed property for product type with two-way binding
const productType = computed({
  get: () => {
    if (formData.value.optionOnly) return 'option'
    if (formData.value.canBeOption) return 'product_and_option'
    return 'product'
  },
  set: (value: string) => {
    switch (value) {
      case 'product':
        formData.value.canBeOption = false
        formData.value.optionOnly = false
        break
      case 'product_and_option':
        formData.value.canBeOption = true
        formData.value.optionOnly = false
        break
      case 'option':
        formData.value.canBeOption = true
        formData.value.optionOnly = true
        break
    }
  }
})

// Selected language for translations
const selectedLanguage = ref('en')

// Get selected picture component (placeholder for now)
const selectedPictureComponent = computed(() => {
  // TODO: Implement picture selection logic
  return null
})

// Validation rules ready check
const validationRulesReady = computed(() => {
  return !publicStore.isLoadingValidationRules && 
         !publicStore.validationRulesError && 
         currentValidationRules.value !== null
})

// Check if fields changed (for edit mode)
const isOwnerChanged = computed(() => {
  return formData.value.owner !== initialOwner.value
})

const isBackupOwnerChanged = computed(() => {
  return formData.value.backupOwner !== initialBackupOwner.value
})

const areSpecialistsGroupsChanged = computed(() => {
  const current = formData.value.specialistsGroups
  const initial = initialSpecialistsGroups.value
  
  if (current.length !== initial.length) return true
  
  // Check if arrays have same elements (order doesn't matter)
  const currentSorted = [...current].sort()
  const initialSorted = [...initial].sort()
  
  return !currentSorted.every((val, idx) => val === initialSorted[idx])
})

// Helper function to validate a single username
const validateSingleUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return { isValid: false, error: t('admin.products.editor.validation.rulesNotLoaded') }
  }

  if (!username || username.trim().length === 0) {
    return { isValid: false, error: t('admin.products.editor.validation.owner.required') }
  }

  const rules = currentValidationRules.value.wellKnownFields.userName

  // Check length
  if (username.length < rules.minLength) {
    return { isValid: false, error: t('admin.products.editor.validation.owner.minLength', { length: rules.minLength }) }
  }
  if (username.length > rules.maxLength) {
    return { isValid: false, error: t('admin.products.editor.validation.owner.maxLength', { length: rules.maxLength }) }
  }

  // Check latinOnly
  if (rules.latinOnly) {
    const basePattern = rules.allowNumbers 
      ? (rules.allowUsernameChars ? '[a-zA-Z0-9._-]' : '[a-zA-Z0-9]')
      : (rules.allowUsernameChars ? '[a-zA-Z._-]' : '[a-zA-Z]')
    const latinRegex = new RegExp(`^${basePattern}+$`)
    if (!latinRegex.test(username)) {
      return { isValid: false, error: t('admin.products.editor.validation.owner.latinOnly') }
    }
  }

  // Check allowNumbers
  if (!rules.allowNumbers && /[0-9]/.test(username)) {
    return { isValid: false, error: t('admin.products.editor.validation.owner.noNumbers') }
  }

  // Check allowUsernameChars
  if (!rules.allowUsernameChars && /[._-]/.test(username)) {
    return { isValid: false, error: t('admin.products.editor.validation.owner.noSpecialChars') }
  }

  return { isValid: true }
}

// Helper function to validate a single group name
const validateSingleGroupName = (groupName: string): { isValid: boolean; error?: string } => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return { isValid: false, error: t('admin.products.editor.validation.rulesNotLoaded') }
  }

  if (!groupName || groupName.trim().length === 0) {
    return { isValid: false, error: t('admin.products.editor.validation.specialistsGroups.required') }
  }

  const rules = currentValidationRules.value.wellKnownFields.groupName

  // Check length
  if (groupName.length < rules.minLength) {
    return { isValid: false, error: t('admin.products.editor.validation.specialistsGroups.minLength', { length: rules.minLength }) }
  }
  if (groupName.length > rules.maxLength) {
    return { isValid: false, error: t('admin.products.editor.validation.specialistsGroups.maxLength', { length: rules.maxLength }) }
  }

  // Check latinOnly
  if (rules.latinOnly) {
    const basePattern = rules.allowNumbers 
      ? (rules.allowUsernameChars ? '[a-zA-Z0-9._-]' : '[a-zA-Z0-9]')
      : (rules.allowUsernameChars ? '[a-zA-Z._-]' : '[a-zA-Z]')
    const latinRegex = new RegExp(`^${basePattern}+$`)
    if (!latinRegex.test(groupName)) {
      return { isValid: false, error: t('admin.products.editor.validation.specialistsGroups.latinOnly') }
    }
  }

  // Check allowNumbers
  if (!rules.allowNumbers && /[0-9]/.test(groupName)) {
    return { isValid: false, error: t('admin.products.editor.validation.specialistsGroups.noNumbers') }
  }

  // Check allowUsernameChars
  if (!rules.allowUsernameChars && /[._-]/.test(groupName)) {
    return { isValid: false, error: t('admin.products.editor.validation.specialistsGroups.noSpecialChars') }
  }

  return { isValid: true }
}

// Dynamic validation rules for owner
const dynamicOwnerRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('admin.products.editor.validation.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.userName
  const validationRules: Array<(v: string) => string | boolean> = []

  // Required field
  validationRules.push((v: string) => !!v || t('admin.products.editor.validation.owner.required'))

  // Length rules
  validationRules.push((v: string) => (v && v.length >= rules.minLength) || t('admin.products.editor.validation.owner.minLength', { length: rules.minLength }))
  validationRules.push((v: string) => (v && v.length <= rules.maxLength) || t('admin.products.editor.validation.owner.maxLength', { length: rules.maxLength }))

  // Character requirements
  if (rules.latinOnly) {
    const basePattern = rules.allowNumbers 
      ? (rules.allowUsernameChars ? '[a-zA-Z0-9._-]' : '[a-zA-Z0-9]')
      : (rules.allowUsernameChars ? '[a-zA-Z._-]' : '[a-zA-Z]')
    const latinRegex = new RegExp(`^${basePattern}+$`)
    validationRules.push((v: string) => latinRegex.test(v) || t('admin.products.editor.validation.owner.latinOnly'))
  }

  if (!rules.allowNumbers) {
    validationRules.push((v: string) => !/[0-9]/.test(v) || t('admin.products.editor.validation.owner.noNumbers'))
  }

  if (!rules.allowUsernameChars) {
    validationRules.push((v: string) => !/[._-]/.test(v) || t('admin.products.editor.validation.owner.noSpecialChars'))
  }

  return validationRules
})

// Dynamic validation rules for backup owner (optional field)
const dynamicBackupOwnerRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('admin.products.editor.validation.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.userName
  const validationRules: Array<(v: string) => string | boolean> = []

  // Optional field - only validate if not empty
  validationRules.push((v: string) => !v || (v.length >= rules.minLength) || t('admin.products.editor.validation.backupOwner.minLength', { length: rules.minLength }))
  validationRules.push((v: string) => !v || (v.length <= rules.maxLength) || t('admin.products.editor.validation.backupOwner.maxLength', { length: rules.maxLength }))

  // Character requirements
  if (rules.latinOnly) {
    const basePattern = rules.allowNumbers 
      ? (rules.allowUsernameChars ? '[a-zA-Z0-9._-]' : '[a-zA-Z0-9]')
      : (rules.allowUsernameChars ? '[a-zA-Z._-]' : '[a-zA-Z]')
    const latinRegex = new RegExp(`^${basePattern}+$`)
    validationRules.push((v: string) => !v || latinRegex.test(v) || t('admin.products.editor.validation.backupOwner.latinOnly'))
  }

  if (!rules.allowNumbers) {
    validationRules.push((v: string) => !v || !/[0-9]/.test(v) || t('admin.products.editor.validation.backupOwner.noNumbers'))
  }

  if (!rules.allowUsernameChars) {
    validationRules.push((v: string) => !v || !/[._-]/.test(v) || t('admin.products.editor.validation.backupOwner.noSpecialChars'))
  }

  return validationRules
})

// Validation rules (keeping existing non-owner rules)
const productCodeRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.productCode.required'),
  (v: string) => (v && v.length >= 3) || t('admin.products.editor.validation.productCode.minLength')
])

const productTypeRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.productType.required')
])

const statusRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.status.required')
])

const nameRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.name.required'),
  (v: string) => (v && v.length >= 2) || t('admin.products.editor.validation.name.minLength')
])

const shortDescRules = computed(() => [
  (v: string) => !!v || t('admin.products.editor.validation.shortDesc.required'),
  (v: string) => (v && v.length >= 10) || t('admin.products.editor.validation.shortDesc.minLength')
])

// Computed properties for field validity with mode awareness
const isOwnerValid = computed(() => {
  // In CREATE mode, always validate
  if (isCreationMode.value) {
    const result = validateSingleUsername(formData.value.owner)
    return result.isValid
  }
  
  // In EDIT mode, only validate if changed
  if (isEditMode.value) {
    if (!isOwnerChanged.value) {
      return true // Not changed, consider valid
    }
    const result = validateSingleUsername(formData.value.owner)
    return result.isValid
  }
  
  return false
})

const isBackupOwnerValid = computed(() => {
  // In CREATE mode, validate if not empty
  if (isCreationMode.value) {
    if (!formData.value.backupOwner || formData.value.backupOwner.trim().length === 0) {
      return true // Empty is valid for optional field
    }
    const result = validateSingleUsername(formData.value.backupOwner)
    return result.isValid
  }
  
  // In EDIT mode, only validate if changed
  if (isEditMode.value) {
    if (!isBackupOwnerChanged.value) {
      return true // Not changed, consider valid
    }
    if (!formData.value.backupOwner || formData.value.backupOwner.trim().length === 0) {
      return true // Empty is valid for optional field
    }
    const result = validateSingleUsername(formData.value.backupOwner)
    return result.isValid
  }
  
  return false
})

const areSpecialistsGroupsValid = computed(() => {
  // In CREATE mode, always validate
  if (isCreationMode.value) {
    // Array must not be empty
    if (!formData.value.specialistsGroups || formData.value.specialistsGroups.length === 0) {
      return false
    }
    // Every group name must be valid
    return formData.value.specialistsGroups.every(groupName => {
      const result = validateSingleGroupName(groupName)
      return result.isValid
    })
  }
  
  // In EDIT mode, only validate if changed
  if (isEditMode.value) {
    if (!areSpecialistsGroupsChanged.value) {
      return true // Not changed, consider valid
    }
    // Array must not be empty
    if (!formData.value.specialistsGroups || formData.value.specialistsGroups.length === 0) {
      return false
    }
    // Every group name must be valid
    return formData.value.specialistsGroups.every(groupName => {
      const result = validateSingleGroupName(groupName)
      return result.isValid
    })
  }
  
  return false
})

// Helper function to generate UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Load validation rules from public API
const loadValidationRules = async () => {
  try {
    console.log('[ProductEditorDetails] Loading validation rules...')
    const rules = await fetchPublicValidationRules()
    currentValidationRules.value = rules
    console.log('[ProductEditorDetails] Validation rules loaded successfully:', rules)
  } catch (error) {
    console.error('[ProductEditorDetails] Failed to load validation rules:', error)
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.validation.rulesLoadError'))
  }
}

// Methods
const createProduct = async () => {
  // Check if validation rules are loaded
  if (!validationRulesReady.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.validation.rulesNotLoaded'))
    return
  }

  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.validation.fillRequired'))
    return
  }

  isSubmitting.value = true
  
  try {
    // Debug: Log formData before preparing API data
    console.log('[ProductEditorDetails] Full formData.value:', formData.value)
    console.log('[ProductEditorDetails] formData.value.translations:', JSON.stringify(formData.value.translations, null, 2))
    console.log('[ProductEditorDetails] formData.value.translations.en:', JSON.stringify(formData.value.translations?.en, null, 2))
    console.log('[ProductEditorDetails] formData.value.translations.ru:', JSON.stringify(formData.value.translations?.ru, null, 2))
    console.log('[ProductEditorDetails] formData.value.specialistsGroups:', JSON.stringify(formData.value.specialistsGroups, null, 2))
    // isPublished removed from product creation

    // Prepare data for API - only send filled languages
    const translations: any = {}
    
    // Check if English is filled
    if (formData.value.translations.en && 
        formData.value.translations.en.name && 
        formData.value.translations.en.name.trim().length > 0 &&
        formData.value.translations.en.shortDesc && 
        formData.value.translations.en.shortDesc.trim().length > 0) {
      translations.en = formData.value.translations.en
    }
    
    // Check if Russian is filled
    if (formData.value.translations.ru && 
        formData.value.translations.ru.name && 
        formData.value.translations.ru.name.trim().length > 0 &&
        formData.value.translations.ru.shortDesc && 
        formData.value.translations.ru.shortDesc.trim().length > 0) {
      translations.ru = formData.value.translations.ru
    }

    // Generate translationKey if not provided
    const translationKey = formData.value.translationKey || generateUUID()

    const productData = {
      productCode: formData.value.productCode,
      translationKey: translationKey,
      statusCode: formData.value.statusCode || 'draft',
      canBeOption: formData.value.canBeOption,
      optionOnly: formData.value.optionOnly,
      owner: formData.value.owner,
      backupOwner: formData.value.backupOwner,
      specialistsGroups: formData.value.specialistsGroups,
      translations: translations
    }

    // Debug: Log prepared productData
    console.log('[ProductEditorDetails] Prepared productData:', JSON.stringify(productData, null, 2))

    // Call service to create product
    const result = await serviceCreateProduct.createProduct(productData)
    
    if (result.success && result.data?.id) {
      // Switch to edit mode with the newly created product
      productsStore.openProductEditorForEdit(result.data.id)
      
      // Load the newly created product data
      await loadProductData()
    }
    
  } catch (error) {
    // Error messages are handled by the service
    console.error('Error creating product:', error)
  } finally {
    isSubmitting.value = false
  }
}

const updateProduct = async () => {
  // Check if validation rules are loaded
  if (!validationRulesReady.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.validation.rulesNotLoaded'))
    return
  }

  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.validation.fillRequired'))
    return
  }

  if (!editingProductId.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.update.noProductId'))
    return
  }

  if (!hasChanges.value) {
    uiStore.showErrorSnackbar(t('admin.products.editor.messages.update.noChanges'))
    return
  }

  isSubmitting.value = true
  
  try {
    // Use service method that sends only changed fields
    const result = await serviceUpdateProduct.updateProductFromForm()
    
    if (result.success) {
      // Product was updated successfully, data is already updated in store
      // Original data is also updated in store to reset change tracking
      console.log('Product updated successfully:', result)
    }
    
  } catch (error) {
    // Error messages are handled by the service
    console.error('Error updating product:', error)
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  productsStore.closeProductEditor()
}

// Helper method for updating translation fields
const updateTranslationField = (fieldName: string, value: any) => {
  if (!formData.value.translations[selectedLanguage.value]) {
    formData.value.translations[selectedLanguage.value] = {
      name: '', shortDesc: '', longDesc: '', techSpecs: {}, areaSpecifics: {}, industrySpecifics: {}, keyFeatures: {}, productOverview: {}
    }
  }
  formData.value.translations[selectedLanguage.value][fieldName] = value
}

// Helper method for updating JSONB fields
const updateJsonbField = (fieldName: string, event: Event) => {
  const target = event.target as HTMLTextAreaElement
  try {
    const parsed = JSON.parse(target.value)
    if (formData.value.translations[selectedLanguage.value]) {
      formData.value.translations[selectedLanguage.value][fieldName] = parsed
    }
  } catch (error) {
    // Invalid JSON, keep the current value
    console.warn('Invalid JSON for field:', fieldName)
  }
}

// ItemSelector handlers
const handleOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.owner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.owner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.products.editor.messages.owner.error'))
  }
  showOwnerSelector.value = false
}

const handleBackupOwnerSelected = async (result: any) => {
  if (result && result.success && result.selectedUser && result.selectedUser.name) {
    formData.value.backupOwner = result.selectedUser.name
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.backupOwner.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.products.editor.messages.backupOwner.error'))
  }
  showBackupOwnerSelector.value = false
}

const handleSpecialistsGroupsSelected = async (result: any) => {
  if (result && result.success && result.selectedItems) {
    // Handle multiple selected groups - add to existing ones
    const newGroupNames = result.selectedItems.map((item: any) => item.name).filter(Boolean)
    
    // Add new groups to existing ones, avoiding duplicates
    newGroupNames.forEach(groupName => {
      if (!formData.value.specialistsGroups.includes(groupName)) {
        formData.value.specialistsGroups.push(groupName)
      }
    })
    
    uiStore.showSuccessSnackbar(t('admin.products.editor.messages.specialistsGroups.selected'))
  } else {
    uiStore.showErrorSnackbar(result?.message || t('admin.products.editor.messages.specialistsGroups.error'))
  }
  showSpecialistsGroupsSelector.value = false
}

// Helper methods for managing specialists groups
const removeSpecialistsGroup = (groupName: string) => {
  const index = formData.value.specialistsGroups.indexOf(groupName)
  if (index > -1) {
    formData.value.specialistsGroups.splice(index, 1)
  }
}

// Picture picker methods
const openPicturePicker = () => {
  showPicturePicker.value = true
}

const handlePictureSelected = (pictureData: any) => {
  // TODO: Implement picture selection logic
  console.log('Picture selected:', pictureData)
  uiStore.showSuccessSnackbar(t('admin.products.editor.messages.picture.selected'))
}

const clearPicture = () => {
  // TODO: Implement picture clearing logic
  uiStore.showSuccessSnackbar(t('admin.products.editor.messages.picture.cleared'))
}

// Load product data when in edit mode
const loadProductData = async () => {
  if (isEditMode.value && editingProductId.value) {
    isLoadingProduct.value = true
    
    try {
      const productData = await serviceFetchSingleProduct.fetchProduct(editingProductId.value)
      
      if (productData) {
        // Update store with fetched data
        productsStore.setEditingProductData(productData)
        
        // Save initial values for tracking changes
        initialOwner.value = formData.value.owner || ''
        initialBackupOwner.value = formData.value.backupOwner || ''
        initialSpecialistsGroups.value = [...(formData.value.specialistsGroups || [])]
        
        uiStore.showSuccessSnackbar(t('admin.products.editor.messages.data.loaded'))
      } else {
        uiStore.showErrorSnackbar(t('admin.products.editor.messages.data.loadError'))
        // Close editor if product not found
        productsStore.closeProductEditor()
      }
    } catch (error) {
      console.error('Error loading product data:', error)
      uiStore.showErrorSnackbar(t('admin.products.editor.messages.data.loadError'))
      // Close editor on error
      productsStore.closeProductEditor()
    } finally {
      isLoadingProduct.value = false
    }
  }
}

// Watch for changes in editingProductId to reload data when needed
watch(editingProductId, (newProductId, oldProductId) => {
  if (newProductId && newProductId !== oldProductId && isEditMode.value) {
    // Check if we need to load data
    if (productsStore.needsProductDataLoad(newProductId)) {
      loadProductData()
    }
  }
}, { immediate: false })

// Watch for changes in editor mode
watch(isEditMode, (newMode) => {
  if (newMode && editingProductId.value) {
    // Check if we need to load data
    if (productsStore.needsProductDataLoad(editingProductId.value)) {
      loadProductData()
    }
  }
}, { immediate: false })

// Initialize form data on mount
onMounted(async () => {
  // Load validation rules first
  await loadValidationRules()
  
  if (isCreationMode.value) {
    // Set default product type
    productType.value = 'product'
    
    // Set default status if not set
    if (!formData.value.statusCode && statusOptions.value.length > 0) {
      // Use 'draft' if available, otherwise first status
      const draftStatus = statusOptions.value.find((s: any) => s.value === 'draft')
      formData.value.statusCode = draftStatus ? draftStatus.value : statusOptions.value[0].value
    }
    
    // Initialize empty initial values for creation mode
    initialOwner.value = ''
    initialBackupOwner.value = ''
    initialSpecialistsGroups.value = []
  } else if (isEditMode.value && editingProductId.value) {
    // Check if we need to load data
    if (productsStore.needsProductDataLoad(editingProductId.value)) {
      // Load product data for editing
      await loadProductData()
    } else {
      // Data already loaded, just save initial values
      initialOwner.value = formData.value.owner || ''
      initialBackupOwner.value = formData.value.backupOwner || ''
      initialSpecialistsGroups.value = [...(formData.value.specialistsGroups || [])]
    }
  }
})
</script>

<template>
  <div class="d-flex">
    <!-- Loading indicator -->
    <DataLoading v-if="isLoadingProduct" :loading="true" />
    
    <!-- Main content (left part) -->
    <div v-else class="flex-grow-1 main-content-area">
      <div class="px-4 pt-4">
        <v-form
          ref="form"
          v-model="isFormValid"
          @submit.prevent="isCreationMode ? createProduct() : updateProduct()"
        >
        <!-- Basic Information Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.basic.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <!-- Product Type Selector and Published Switch -->
            <v-row class="pt-3">
              <v-col
                cols="12"
                md="6"
              >
                <v-btn-toggle
                  v-model="productType"
                  mandatory
                  color="teal"
                  class="product-type-toggle-group"
                  density="compact"
                  variant="outlined"
                >
                  <v-btn
                    value="product"
                    size="small"
                  >
                    {{ t('admin.products.editor.basic.type.product') }}
                  </v-btn>
                  <v-btn
                    value="product_and_option"
                    size="small"
                  >
                    {{ t('admin.products.editor.basic.type.productAndOption') }}
                  </v-btn>
                  <v-btn
                    value="option"
                    size="small"
                  >
                    {{ t('admin.products.editor.basic.type.option') }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <!-- Published switch removed - will be moved to ProductEditorCatalogPublication.vue -->
              </v-col>
            </v-row>

            <!-- Product Code -->
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="formData.productCode"
                  :label="t('admin.products.editor.basic.productCode.label')"
                  :rules="productCodeRules"
                  variant="outlined"
                  color="teal"
                  required
                />
              </v-col>
              <v-col
                cols="12"
                md="3"
              >
                <v-select
                  v-model="formData.statusCode"
                  :items="statusOptions"
                  :label="t('admin.products.editor.basic.status.label')"
                  :rules="statusRules"
                  variant="outlined"
                  color="teal"
                  required
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <div class="picture-placeholder">
                  <div 
                    class="picture-placeholder-content"
                    style="cursor: pointer;"
                    @click="openPicturePicker"
                  >
                    <component 
                      :is="selectedPictureComponent"
                      v-if="selectedPictureComponent"
                      :size="48"
                      color="rgb(20, 184, 166)"
                      class="placeholder-picture"
                    />
                    <div 
                      v-else
                      class="empty-placeholder"
                    >
                      <PhImage :size="48" color="rgb(20, 184, 166)" />
                      <div class="placeholder-text">
                        {{ t('admin.products.editor.basic.picture.placeholder') }}
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Contacts Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.contacts.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <!-- Owner and Backup Owner -->
            <v-row class="pt-3">
              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="formData.owner"
                    :label="t('admin.products.editor.contacts.owner.label')"
                    :rules="dynamicOwnerRules"
                    readonly
                    variant="outlined"
                    color="teal"
                    required
                  >
                    <template #append-inner>
                      <div style="cursor: pointer" @click="showOwnerSelector = true">
                        <PhMagnifyingGlass />
                      </div>
                    </template>
                  </v-text-field>
                </div>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <div class="d-flex align-center">
                  <v-text-field
                    v-model="formData.backupOwner"
                    :label="t('admin.products.editor.contacts.backupOwner.label')"
                    :rules="dynamicBackupOwnerRules"
                    readonly
                    variant="outlined"
                    color="teal"
                  >
                    <template #append-inner>
                      <div style="cursor: pointer" @click="showBackupOwnerSelector = true">
                        <PhMagnifyingGlass />
                      </div>
                    </template>
                  </v-text-field>
                </div>
              </v-col>
            </v-row>

            <!-- Specialists Groups -->
            <v-row>
              <v-col
                cols="12"
              >
                <div class="access-control-field">
                  <v-label class="text-body-2 mb-2">
                    {{ t('admin.products.editor.contacts.specialists.label') }}
                  </v-label>
                  <div class="chips-container">
                    <v-chip
                      v-for="group in formData.specialistsGroups"
                      :key="group"
                      color="teal"
                      variant="outlined"
                      size="small"
                      class="ma-1 d-flex align-center"
                    >
                      <span class="mr-2">{{ group }}</span>
                      <v-btn
                        icon
                        variant="text"
                        density="compact"
                        color="teal"
                        @click="removeSpecialistsGroup(group)"
                      >
                        <PhX :size="12" />
                      </v-btn>
                    </v-chip>
                    <v-btn
                      v-if="formData.specialistsGroups.length === 0"
                      variant="outlined"
                      color="teal"
                      size="small"
                      class="ma-1"
                      @click="showSpecialistsGroupsSelector = true"
                    >
                      <template #prepend>
                        <PhPlus />
                      </template>
                      {{ t('admin.products.editor.contacts.addGroups') }}
                    </v-btn>
                    <v-btn
                      v-else
                      variant="text"
                      color="teal"
                      size="small"
                      class="ma-1"
                      @click="showSpecialistsGroupsSelector = true"
                    >
                      <template #prepend>
                        <PhPlus />
                      </template>
                      {{ t('admin.products.editor.contacts.addGroups') }}
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Description Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.description.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <v-row class="pt-3">
              <v-col
                cols="12"
                md="3"
              >
                <v-select
                  v-model="selectedLanguage"
                  :items="languageOptions"
                  :label="t('admin.products.editor.description.language.label')"
                  variant="outlined"
                  color="teal"
                >
                  <template #append-inner>
                    <PhCaretUpDown class="dropdown-icon" />
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  :model-value="formData.translations[selectedLanguage]?.name || ''"
                  @update:model-value="(value) => updateTranslationField('name', value)"
                  :label="t('admin.products.editor.description.name.label')"
                  :rules="nameRules"
                  variant="outlined"
                  color="teal"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  :model-value="formData.translations[selectedLanguage]?.shortDesc || ''"
                  @update:model-value="(value) => updateTranslationField('shortDesc', value)"
                  :label="t('admin.products.editor.description.shortDesc.label')"
                  :rules="shortDescRules"
                  variant="outlined"
                  rows="3"
                  counter="250"
                  no-resize
                  color="teal"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  :model-value="formData.translations[selectedLanguage]?.longDesc || ''"
                  @update:model-value="(value) => updateTranslationField('longDesc', value)"
                  :label="t('admin.products.editor.description.longDesc.label')"
                  variant="outlined"
                  rows="5"
                  counter="10000"
                  no-resize
                  color="teal"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- JSONB Fields Section -->
        <v-row>
          <v-col cols="12">
            <div class="card-header mt-6">
              <v-card-title class="text-subtitle-1">
                {{ t('admin.products.editor.jsonb.title').toLowerCase() }}
              </v-card-title>
              <v-divider class="section-divider" />
            </div>

            <v-row class="pt-3">
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage]?.techSpecs, null, 2)"
                  :label="t('admin.products.editor.jsonb.techSpecs.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('techSpecs', $event)"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage]?.areaSpecifics, null, 2)"
                  :label="t('admin.products.editor.jsonb.areaSpecifics.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('areaSpecifics', $event)"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage]?.industrySpecifics, null, 2)"
                  :label="t('admin.products.editor.jsonb.industrySpecifics.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('industrySpecifics', $event)"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage]?.keyFeatures, null, 2)"
                  :label="t('admin.products.editor.jsonb.keyFeatures.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('keyFeatures', $event)"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  :model-value="JSON.stringify(formData.translations[selectedLanguage]?.productOverview, null, 2)"
                  :label="t('admin.products.editor.jsonb.productOverview.label')"
                  variant="outlined"
                  rows="4"
                  color="teal"
                  @input="updateJsonbField('productOverview', $event)"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>


        </v-form>
      </div>
    </div>
    
    <!-- Sidebar (right part) -->
    <div class="side-bar-container">
      <!-- Actions section -->
      <div class="side-bar-section">
        <h3 class="text-subtitle-2 px-2 py-2">
          {{ t('admin.products.editor.actions.title').toLowerCase() }}
        </h3>
        
        <!-- Picture picker button -->
        <div class="picture-picker-sidebar mb-3">
          <v-btn
            block
            variant="outlined"
            color="teal"
            class="select-picture-btn-sidebar"
            @click="openPicturePicker"
          >
            <template #prepend>
              <PhImage />
            </template>
            {{ t('admin.products.editor.basic.picture.select') }}
          </v-btn>
        </div>
        
        <!-- Create button (visible only in creation mode) -->
        <v-btn
          v-if="isCreationMode"
          block
          color="teal"
          variant="outlined"
          :disabled="!isFormValid || isSubmitting || !validationRulesReady || !isOwnerValid || !isBackupOwnerValid || !areSpecialistsGroupsValid"
          class="mb-3"
          @click="createProduct"
        >
          {{ t('admin.products.editor.actions.create').toUpperCase() }}
        </v-btn>

        <!-- Update button (visible only in edit mode) -->
        <v-btn
          v-if="isEditMode"
          block
          color="teal"
          variant="outlined"
          :disabled="!isUpdateButtonEnabled"
          :class="['mb-3', { 'btn-glow-active': isUpdateButtonEnabled && !isSubmitting }]"
          @click="updateProduct"
        >
          {{ t('admin.products.editor.actions.update').toUpperCase() }}
        </v-btn>

        <!-- Cancel button (visible always) -->
        <v-btn
          block
          color="grey"
          variant="outlined"
          class="mb-3"
          @click="cancelEdit"
        >
          {{ t('admin.products.editor.actions.cancel').toUpperCase() }}
        </v-btn>
      </div>
    </div>
  </div>

  <!-- ItemSelector Modals -->
  <v-dialog
    v-model="showOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.products.editor.contacts.owner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.products.editor.actions.save')"
      @close="showOwnerSelector = false" 
      @action-performed="handleOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showBackupOwnerSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.products.editor.contacts.backupOwner.select')"
      search-service="searchUsers"
      action-service="returnSelectedUsername"
      :max-results="20"
      :max-items="1"
      :action-button-text="t('admin.products.editor.actions.save')"
      @close="showBackupOwnerSelector = false" 
      @action-performed="handleBackupOwnerSelected"
    />
  </v-dialog>

  <v-dialog
    v-model="showSpecialistsGroupsSelector"
    max-width="700"
  >
    <ItemSelector 
      :title="t('admin.products.editor.contacts.specialists.select')"
      search-service="searchGroups"
      action-service="returnMultipleGroups"
      :max-results="20"
      :max-items="10"
      :action-button-text="t('admin.products.editor.actions.save')"
      @close="showSpecialistsGroupsSelector = false" 
      @action-performed="handleSpecialistsGroupsSelected"
    />
  </v-dialog>
</template>

<style scoped>
/* Card header styles */
.card-header {
  margin-bottom: 16px;
}

.section-divider {
  margin-top: 8px;
}

/* UUID display styles */
.uuid-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.uuid-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Access control field styles */
.access-control-field {
  width: 100%;
}

.chips-container {
  min-height: 40px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background-color: rgba(var(--v-theme-surface), 1);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.chips-container:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.chips-container:focus-within {
  border-color: rgba(var(--v-theme-primary), 1);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

/* Gap utility */
.gap-2 {
  gap: 8px;
}

/* Product type toggle group styling */
.product-type-toggle-group {
  width: 100%;
}

.product-type-toggle-group :deep(.v-btn) {
  flex: 1;
  text-transform: none;
  font-weight: 400;
}

/* Published switch container styling */
.published-switch-container {
  margin-left: 25px;
  height: 40px; /* Match the height of the toggle group */
  align-items: center;
}

/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Sidebar styles */
.side-bar-container {
  width: 280px;
  min-width: 280px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--v-theme-surface), 1);
  overflow-y: auto;
}

.side-bar-section {
  padding: 16px;
}

/* Picture picker sidebar styles */
.picture-picker-sidebar {
  width: 100%;
}

.select-picture-btn-sidebar {
  height: 40px;
  min-width: 240px;
}

/* Sidebar button styles */
.side-bar-section .v-btn {
  min-width: 240px;
}

/* Picture placeholder styles */
.picture-placeholder {
  width: 100%;
  max-width: 300px;
}

/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.picture-placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 1);
  transition: border-color 0.2s ease;
}

.picture-placeholder-content:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.placeholder-picture {
  color: rgba(var(--v-theme-primary), 1);
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 8px;
}

.placeholder-text {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
}

/* Update button glow animation for unsaved changes */
.btn-glow-active {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
}

@keyframes soft-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px rgba(20, 184, 166, 0.5);
    transform: scale(1.01);
  }
}
</style>