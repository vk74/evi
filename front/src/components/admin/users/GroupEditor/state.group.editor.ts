/**
 * state.group.editor.ts
 * Pinia store для управления состоянием редактора групп.
 *
 * Функциональность:
 * - Хранение данных форм в режиме создания новой группы
 * - Управление состоянием UI
 * - Подготовка данных для отправки в API
 */

import { defineStore } from 'pinia'
import { GroupStatus } from './types.group.editor'
import type { 
  IGroupData,
  IGroupDetails,
  IEditorUIState,
  ICreateGroupRequest,
  IUpdateGroupRequest,
  GroupEditorState,
  EditMode,
  ICreateGroupResponse
} from './types.group.editor'
import { useUserStore } from '@/core/state/userstate'
import { createGroupService } from './service.create.group'

/**
 * Начальные значения для данных группы
 */
const initialGroupState: IGroupData = {
  group_name: '',
  group_status: GroupStatus.ACTIVE,
  group_owner: '',
  //is_system: false
}

/**
 * Начальные значения для дополнительной информации
 */
const initialDetailsState: IGroupDetails = {
  group_description: '',
  group_email: ''
}

/**
 * Начальные значения для состояния UI
 */
const initialUIState: IEditorUIState = {
  activeSection: 'details',
  isSubmitting: false,
  hasInteracted: false,
  isFormChanged: false,
  showRequiredFieldsWarning: false
}

/**
 * Определение хранилища
 */
export const useGroupEditorStore = defineStore('groupEditor', {
  state: (): GroupEditorState => {
    const userStore = useUserStore()
    return {
      group: { 
        ...initialGroupState,
        group_owner: userStore.username || ''
      },
      details: { ...initialDetailsState },
      ui: { ...initialUIState },
      mode: {
        mode: 'create'
      },
      originalData: undefined
    }
  },

  getters: {
    isEditMode(): boolean {
      return this.mode.mode === 'edit'
    },

    hasChanges(): boolean {
      if (!this.originalData || this.mode.mode !== 'edit') {
        return false
      }

      // Получаем измененные поля
      const changes = this.getChangedFields
      // Проверяем есть ли изменения помимо group_id
      return Object.keys(changes).length > 1  // > 1 потому что group_id всегда присутствует
    },

    getChangedFields(): IUpdateGroupRequest {
      if (!this.originalData || this.mode.mode !== 'edit') {
        return { group_id: '' }  // Возвращаем пустой объект с обязательным полем
      }

      const changes: IUpdateGroupRequest = {
        group_id: (this.mode as EditMode).groupId
      }

      const currentData = {
        ...this.group,
        ...this.details
      }

      const originalData = {
        ...this.originalData.group,
        ...this.originalData.details
      }

      // Проверяем каждое поле и добавляем только измененные
      if (currentData.group_name !== originalData.group_name) {
        changes.group_name = currentData.group_name
      }
      if (currentData.group_status !== originalData.group_status) {
        changes.group_status = currentData.group_status
      }
      if (currentData.group_owner !== originalData.group_owner) {
        changes.group_owner = currentData.group_owner
      }
      //if (currentData.is_system !== originalData.is_system) {
      //  changes.is_system = currentData.is_system
      //}
      if (currentData.group_description !== originalData.group_description) {
        changes.group_description = currentData.group_description
      }
      if (currentData.group_email !== originalData.group_email) {
        changes.group_email = currentData.group_email
      }

      return changes
    }
  },

  actions: {
    /**
     * Обновление данных группы
     */
    updateGroup(data: Partial<IGroupData>) {
      console.log('Updating group data:', data)
      this.group = { ...this.group, ...data }
    },

    /**
     * Обновление дополнительной информации
     */
    updateDetails(data: Partial<IGroupDetails>) {
      console.log('Updating group details:', data)
      this.details = { ...this.details, ...data }
    },

    /**
     * Инициализация режима редактирования
     */
    initEditMode(data: { group: IGroupData; details: IGroupDetails }) {
      console.log('Initializing edit mode with group data')
      
      // Устанавливаем режим редактирования
      this.mode = {
        mode: 'edit',
        groupId: data.group.group_id as string
      }
      
      // Сохраняем оригинальные данные
      this.originalData = {
        group: { ...data.group },
        details: { ...data.details }
      }
      
      // Обновляем текущие данные через существующие actions
      this.updateGroup(data.group)
      this.updateDetails(data.details)
    },

    /**
     * Установка активной секции
     */
    setActiveSection(section: 'details' | 'members') {
      console.log('[GroupEditor] Setting active section:', section)
      this.ui.activeSection = section
      this.ui.hasInteracted = true
    },

    /**
     * Сброс формы к начальным значениям
     * Работает только в режиме создания группы
     */
    resetForm() {
      if (this.mode.mode === 'edit') {
        console.log('Reset form is not available in edit mode')
        return
      }
    
      console.log('Resetting form to initial state')
      const userStore = useUserStore()
    
      // Сбрасываем все состояния одним действием для предотвращения промежуточных обновлений
      const resetState = {
        group: {
          ...initialGroupState,
          group_status: GroupStatus.ACTIVE,
          group_owner: userStore.username || ''
        },
        details: { ...initialDetailsState },
        ui: { 
          ...initialUIState,
          hasInteracted: false,
          showRequiredFieldsWarning: false
        },
        mode: {
          mode: 'create'
        },
        originalData: undefined
      }
    
      // Применяем все изменения одним действием
      Object.assign(this, resetState)
    },

    /**
     * Установка состояния отправки формы
     */
    setSubmitting(isSubmitting: boolean) {
      console.log('Setting submitting state:', isSubmitting)
      this.ui.isSubmitting = isSubmitting
    },

    /**
     * Подготовка данных для создания группы
     */
    prepareRequestData(): ICreateGroupRequest {
      console.log('Preparing data for API request')
      const { group, details } = this
      
      return {
        group_name: group.group_name,
        group_status: group.group_status,
        group_owner: group.group_owner,
        //is_system: group.is_system,
        group_description: details.group_description,
        group_email: details.group_email
      }
    },

    /**
     * Подготовка данных для обновления группы
     */
    prepareUpdateData(): IUpdateGroupRequest {
      // Используем getter для получения изменений
      const changes = this.getChangedFields

      // Логируем для отладки
      console.log('Preparing data for update:', changes)

      return changes
    },

    /**
     * Создание новой группы
     * @returns Promise<ICreateGroupResponse> - Ответ от сервера с данными созданной группы
     * @throws Error при ошибке создания
     */
    async createNewGroup(): Promise<ICreateGroupResponse> {
      console.log('[GroupEditorStore] Starting group creation')
      
      try {
        this.setSubmitting(true)
        
        // Получаем подготовленные данные
        const requestData = this.prepareRequestData()
        
        // Отправляем запрос через сервис и получаем ответ
        const response = await createGroupService.createGroup(requestData)
        
        console.log('[GroupEditorStore] Group created successfully:', {
          groupId: response.groupId,
          groupName: response.group_name
        })
        
        // Сбрасываем форму после успешного создания
        this.resetForm()
        
        return response
        
      } catch (error) {
        console.error('[GroupEditorStore] Failed to create group:', error)
        throw error
      } finally {
        this.setSubmitting(false)
      }
    }
  }
})

export default useGroupEditorStore