/**
 * state.view.all.users.ts
 * Pinia store for managing users list state.
 * 
 * Functionality:
 * - Cache management for users list
 * - JWT validation with timer-based cache invalidation
 * - Sorting functionality
 * - Display parameters management (items per page, current page)
 * 
 * Used by:
 * - ViewAllUsers.vue component
 * - service.view.all.users.ts service
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/core/state/userstate'
import { 
    IUser, 
    ItemsPerPageOption,
    ISortParams,
    IJWTValidation 
} from './types.view.all.users'

// Logger для основных операций
const logger = {
    info: (message: string) => console.log(`[UsersStore] ${message}`),
    error: (message: string) => console.error(`[UsersStore] ${message}`)
}

export const useStoreViewAllUsers = defineStore('viewAllUsers', () => {
    // State
    const users = ref<IUser[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)
    const page = ref(1)
    const itemsPerPage = ref<ItemsPerPageOption>(25)
    const totalItems = ref(0)
    const sorting = ref<ISortParams>({
        sortBy: '',
        sortDesc: false
    })

    const jwtCheckTimer = ref<ReturnType<typeof setTimeout> | null>(null)

    const selectedUsers = ref<string[]>([])

    // Getters
    const getUsers = computed(() => {
        logger.info('Getting users with current display parameters')
        const start = (page.value - 1) * itemsPerPage.value
        const end = start + itemsPerPage.value

        const result = [...users.value]
        
        // Применяем сортировку если задана
        if (sorting.value.sortBy) {
            result.sort((a, b) => {
                const aValue = a[sorting.value.sortBy as keyof IUser]
                const bValue = b[sorting.value.sortBy as keyof IUser]
                const modifier = sorting.value.sortDesc ? -1 : 1
        
                // Если оба значения undefined, считаем их равными
                if (aValue === undefined && bValue === undefined) return 0
                // Если только aValue undefined, оно "меньше"
                if (aValue === undefined) return -1 * modifier
                // Если только bValue undefined, оно "меньше"
                if (bValue === undefined) return 1 * modifier
        
                // Для boolean значений
                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return (aValue === bValue) ? 0 : (aValue ? modifier : -modifier)
                }
        
                // Для строк делаем регистронезависимое сравнение
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * modifier
                }
        
                // Для всех остальных случаев используем стандартное сравнение
                return aValue > bValue ? modifier : -modifier
            })
        }

        return result.slice(start, end)
    })

    const selectedCount = computed(() => selectedUsers.value.length)

    // Actions
    /**
     * Validates JWT token and returns validation status with expiration time - for use in timer
     */
    function validateJWT(): IJWTValidation {
        const userStore = useUserStore()
        
        // Преобразуем строку в число для tokenExpires
        const tokenExpiresTime = userStore.tokenExpires ? 
            Number(userStore.tokenExpires) : 
            0
            
        return {
            isValid: Boolean(userStore.$state.isLoggedIn && tokenExpiresTime > (Date.now() / 1000)),
            expiresIn: tokenExpiresTime ? 
                tokenExpiresTime - (Date.now() / 1000) : 
                0
        }
    }

    /**
     * Sets up JWT check timer based on token expiration
     */
    function setupJWTCheck() {
        // Очищаем предыдущий таймер если есть
        if (jwtCheckTimer.value) {
            clearTimeout(jwtCheckTimer.value)
            jwtCheckTimer.value = null
        }

        const { isValid, expiresIn } = validateJWT()
        
        if (!isValid) {
            clearCache()
            return
        }

        // Устанавливаем таймер на (срок валидности - 4 секунды)
        const timeoutDuration = (expiresIn - 4) * 1000
        
        jwtCheckTimer.value = setTimeout(() => {
            const validation = validateJWT()
            
            if (validation.expiresIn <= 4) {
                clearCache()
                clearSelection()
            } else {
                // Перезапускаем таймер с обновленным временем
                setupJWTCheck()
            }
        }, timeoutDuration)

        logger.info(`JWT check timer set for ${timeoutDuration}ms`)
    }

    /**
     * Clears cached data and resets store state
     */
    function clearCache() {
        users.value = []
        totalItems.value = 0
        error.value = null
        if (jwtCheckTimer.value) {
            clearTimeout(jwtCheckTimer.value)
            jwtCheckTimer.value = null
        }
        logger.info('Cache cleared')
    }

    /**
     * Updates cache with new users data
     */
    function updateCache(newUsers: IUser[], total: number) {
        users.value = newUsers
        totalItems.value = total
        setupJWTCheck()
        logger.info(`Cache updated with ${newUsers.length} users`)
    }

    /**
     * Updates display parameters
     */
    function updateDisplayParams(newItemsPerPage: ItemsPerPageOption, newPage: number) {
        itemsPerPage.value = newItemsPerPage
        page.value = newPage
        logger.info(`Display params updated: ${newItemsPerPage} items per page, page ${newPage}`)
    }

    /**
     * Updates sorting parameters
     */
    function updateSort(field: keyof IUser) {
        if (sorting.value.sortBy === field) {
            sorting.value.sortDesc = !sorting.value.sortDesc
        } else {
            sorting.value = {
                sortBy: field,
                sortDesc: false
            }
        }
        logger.info(`Sorting updated: ${field} ${sorting.value.sortDesc ? 'DESC' : 'ASC'}`)
    }

    function selectUser(userId: string) {
        if (!selectedUsers.value.includes(userId)) {
            selectedUsers.value.push(userId)
            logger.info(`User ${userId} selected`)
        }
    }

    function deselectUser(userId: string) {
        selectedUsers.value = selectedUsers.value.filter(id => id !== userId)
        logger.info(`User ${userId} deselected`)
    }

    function clearSelection() {
        selectedUsers.value = []
        logger.info('Selection cleared')
    }

    return {
        // State
        users,
        loading,
        error,
        page,
        itemsPerPage,
        totalItems,
        sorting,
        selectedUsers,
        
        // Getters
        getUsers,
        selectedCount,

        // Actions
        updateCache,
        updateDisplayParams,
        updateSort,
        clearCache,
        selectUser,
        deselectUser,
        clearSelection
    }
})