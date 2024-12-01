/**
 * usersListState.js
 * Store для управления списком пользователей.
 * Включает функции загрузки, сортировки и пагинации списка пользователей.
 * используется в функции ViewAllUsers.vue
 */

import { defineStore } from 'pinia'
import axios from 'axios'

export const useUsersListStore = defineStore('usersList', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
    totalUsers: 0,
    sortBy: 'username',
    sortDesc: false,
    page: 1,
    itemsPerPage: 25
  }),

  getters: {
    // Получение отсортированного списка пользователей
    sortedUsers: (state) => {
      return [...state.users].sort((a, b) => {
        const sortField = state.sortBy
        const modifier = state.sortDesc ? -1 : 1
        
        if (a[sortField] < b[sortField]) return -1 * modifier
        if (a[sortField] > b[sortField]) return 1 * modifier
        return 0
      })
    }
  },

  actions: {
    // Загрузка пользователей с учетом пагинации и сортировки
    async fetchUsers() {
      this.loading = true
      this.error = null
      
      try {
        // TODO: Здесь будет реальный запрос к API
        const response = await axios.get('/api/users', {
          params: {
            page: this.page,
            items_per_page: this.itemsPerPage,
            sort_by: this.sortBy,
            sort_desc: this.sortDesc
          }
        })
        
        this.users = response.data.users
        this.totalUsers = response.data.total
      } catch (err) {
        this.error = err.message
        console.error('Error fetching users:', err)
      } finally {
        this.loading = false
      }
    },

    // Установка параметров сортировки
    setSorting(field, isDesc) {
      this.sortBy = field
      this.sortDesc = isDesc
      this.fetchUsers()
    },

    // Установка параметров пагинации
    setPagination(page, itemsPerPage) {
      this.page = page
      this.itemsPerPage = itemsPerPage
      this.fetchUsers()
    }
  }
})