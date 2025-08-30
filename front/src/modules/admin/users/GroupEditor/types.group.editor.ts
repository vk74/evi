/**
 * @file types.group.editor.ts
 * Version: 1.0.0
 * Frontend type definitions for the group editor component.
 * Frontend file that defines TypeScript types and interfaces for group editor functionality.
 *
 * This module defines TypeScript types and interfaces for:
 * - Component modes and states
 * - Group data structures
 * - Form validation
 * - API interfaces
 */

/**
 * Enums
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
 * Interface for basic group information (app.groups table)
 */
export interface IGroupData {
group_id?: string                  // uuid, optional as it's generated during creation
group_name: string                 // character varying(100)
group_status: GroupStatus          // app.group_status
group_owner: string                // username of group owner (UUID)
is_system?: boolean                // boolean, optional for frontend
ownerUsername?: string             // Username of the group owner, optional
}

/**
 * Interface for additional group information (app.group_details table)
 */
export interface IGroupDetails {
  group_id?: string                  // uuid link to app.groups
  group_description: string          // text
  group_email: string                // character varying(255)
}

/**
 * Interface for UI state
 */
export interface IEditorUIState {
  activeSection: 'details' | 'members'  // active section in editor
  isSubmitting: boolean                 // form submission flag
  hasInteracted: boolean                // form interaction flag
  isFormChanged: boolean                // for tracking form changes
  showRequiredFieldsWarning: boolean    // whether to show warning about unfilled required fields
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
  group_id: string                   // Required field for updates
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
 * Interface for API error
 */
export interface IApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Interface for table header
 */
export interface TableHeader {
  title: string
  key: string
  width?: string
}

/**
 * Interface for group member
 */
export interface IGroupMember {
  member_id: string            // UUID from group_members
  group_id: string             // UUID link to app.groups
  user_id: string              // UUID link to app.users
  joined_at: string            // Date added to group
  added_by: string             // UUID of user who added member
  is_active: boolean           // Member activity status
  left_at: string | null       // Date left group (if any)
  removed_by: string | null    // UUID of remover (if any)
  
  // Data from app.users
  username: string             // User login
  email: string                // User email
  is_staff: boolean            // Staff flag
  account_status: string       // Account status
  first_name: string           // First name
  middle_name: string          // Middle name
  last_name: string            // Last name

  // Optional data from app.user_profiles
  mobile_phone_number?: string // Mobile phone
  company_name?: string        // Company name
  position?: string            // Position
}

/**
 * Interface for group members state
 */
export interface IGroupMembersState {
  members: IGroupMember[]      // Members list
  loading: boolean             // Loading flag
  error: string | null         // Error (if any)
  selectedMembers: string[]    // Selected member IDs
}

/**
 * Interface for group editor store state
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
  members: IGroupMembersState  // Add group members state
  // Cache to preserve fetched members per group across navigation between sections
  membersCache: Record<string, IGroupMember[]>
}

/**
 * Interface for store getters
 */
export interface GroupEditorStoreGetters {
  isEditMode: () => boolean
  hasChanges: () => boolean
}

/**
* Interface for store actions
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
* Interface for API response when fetching group members
*/
export interface IFetchGroupMembersResponse {
  success: boolean
  message?: string
  data?: {
    members: IGroupMember[]
    total: number
  }
}

/**
* Interface for API response when removing group members
*/
export interface IRemoveGroupMembersResponse {
success: boolean
removedCount: number
message?: string
}