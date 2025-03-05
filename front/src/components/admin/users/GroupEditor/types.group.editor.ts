/**
 * types.group.editor.ts - frontend
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
  DISABLED = 'disabled',
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
group_owner: string                // username пользователя-владельца группы (UUID)
is_system?: boolean                // boolean, опционально для фронтенда
ownerUsername?: string             // Username of the group owner, optional
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
  //is_system: boolean
  group_description: string
  group_email: string
}

export interface IUpdateGroupRequest {
  group_id: string                   // Обязательное поле для обновления
  group_name?: string
  group_status?: GroupStatus
  group_owner?: string
  //is_system?: boolean
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
 * Интерфейс заголовка таблицы
 */
export interface TableHeader {
  title: string
  key: string
  width?: string
}

/**
 * Интерфейс участника группы
 */
export interface IGroupMember {
  member_id: string            // UUID из group_members
  group_id: string             // UUID связь с app.groups
  user_id: string              // UUID связь с app.users
  joined_at: string            // Дата добавления в группу
  added_by: string             // UUID пользователя, добавившего участника
  is_active: boolean           // Статус активности участника
  left_at: string | null       // Дата выхода из группы (если есть)
  removed_by: string | null    // UUID удалившего (если есть)
  
  // Данные из app.users
  username: string             // Логин пользователя
  email: string                // Email пользователя 
  is_staff: boolean            // Флаг сотрудника
  account_status: string       // Статус учетной записи
  first_name: string           // Имя
  middle_name: string          // Отчество
  last_name: string            // Фамилия

  // Опциональные данные из app.user_profiles
  mobile_phone_number?: string // Мобильный телефон 
  company_name?: string        // Название компании
  position?: string            // Должность
}

/**
 * Интерфейс для состояния участников группы
 */
export interface IGroupMembersState {
  members: IGroupMember[]      // Список участников
  loading: boolean             // Флаг загрузки
  error: string | null         // Ошибка (если есть)
  selectedMembers: string[]    // ID выбранных участников
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
  members: IGroupMembersState  // Добавляем состояние участников группы
}

/**
 * Интерфейс геттеров хранилища
 */
export interface GroupEditorStoreGetters {
  isEditMode: () => boolean
  hasChanges: () => boolean
}

/**
* Интерфейс действий хранилища
*/
export interface GroupEditorStoreActions {
createNewGroup: () => Promise<ICreateGroupResponse>
updateGroup: (data: Partial<IGroupData>) => void
updateDetails: (data: Partial<IGroupDetails>) => void
setActiveSection: (section: 'details' | 'members') => void
setSubmitting: (isSubmitting: boolean) => void
resetForm: () => void
}

/**
* Интерфейс ответа API при получении участников группы
*/
export interface IFetchGroupMembersResponse {
success: boolean
members: IGroupMember[]
message?: string
}

/**
* Интерфейс ответа API при удалении участников группы
*/
export interface IRemoveGroupMembersResponse {
success: boolean
removedCount: number
message?: string
}