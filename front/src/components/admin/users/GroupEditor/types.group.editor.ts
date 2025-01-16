/**
 * types.group.editor.ts
 * Type definitions for the group editor component.
 *
 * This module defines TypeScript types and interfaces for:
 * - Component modes and states
 * - Group data structures
 * - Form validation
 * - API interfaces
 */

/**
 * Перечисления
 */
export enum GroupStatus {
    ACTIVE = 'active',
    INACTIVE = 'disabled',
    ARCHIVED = 'archived'
  }
  
  /**
   * Editor mode discriminated union
   */
  export type CreateMode = {
    mode: 'create'
  }
  
  export type EditMode = {
    mode: 'edit'
    groupId: string
  }
  
  export type EditorMode = CreateMode | EditMode
  
  /**
   * Интерфейс базовой информации группы (таблица app.groups)
   */
  export interface IGroupData {
    group_id?: string                  // uuid, опционален т.к. генерируется при создании
    group_name: string                 // character varying(100)
    group_status: GroupStatus          // app.group_status
    group_owner: string                // uuid
    is_system: boolean                 // boolean
  }
  
  /**
   * Интерфейс дополнительной информации группы (таблица app.group_details)
   */
  export interface IGroupDetails {
    group_id?: string                  // uuid связь с app.groups
    group_description: string          // text
    group_email: string                // character varying(255)
  }
  
  /**
   * Интерфейс для UI состояния
   */
  export interface IEditorUIState {
    activeSection: 'details' | 'members'  // активная секция в редакторе
    isSubmitting: boolean                 // флаг отправки формы
    hasInteracted: boolean                // флаг взаимодействия с формой
    isFormChanged: boolean                // для отслеживания изменений формы
    showRequiredFieldsWarning: boolean    // показывать ли предупреждение о незаполненных обязательных полях
  }
  
  /**
   * API request interfaces
   */
  export interface ICreateGroupRequest {
    group_name: string
    group_status: GroupStatus
    group_owner: string
    is_system: boolean
    group_description: string
    group_email: string
  }
  
  export interface IUpdateGroupRequest {
    group_id: string                   // Обязательное поле для обновления
    group_name?: string
    group_status?: GroupStatus
    group_owner?: string
    is_system?: boolean
    group_description?: string
    group_email?: string
  }
  
  /**
   * API response interfaces
   */
  export interface IApiResponse {
    success: boolean
    message: string
  }
  
  export interface ICreateGroupResponse extends IApiResponse {
    groupId: string
    group_name: string
  }
  
  export interface ILoadGroupResponse extends IApiResponse {
    data: {
      group: IGroupData
      details: IGroupDetails
    }
  }
  
  /**
   * Интерфейс ошибки API
   */
  export interface IApiError {
    message: string
    code?: string
    details?: Record<string, unknown>
  }
  
  /**
   * Интерфейс состояния хранилища редактора групп
   */
  export interface GroupEditorState {
    mode: EditorMode
    group: IGroupData
    details: IGroupDetails
    originalData?: {
      group: IGroupData
      details: IGroupDetails
    }
    ui: IEditorUIState
  }
  
  /**
   * Интерфейс геттеров хранилища
   */
  export interface GroupEditorStoreGetters {
    isEditMode: () => boolean
    hasChanges: () => boolean
    getChangedFields: () => Partial<IUpdateGroupRequest>
  }

  /**
 * Интерфейс заголовка таблицы
 */
export interface TableHeader {
  title: string
  key: string
  width?: string
}