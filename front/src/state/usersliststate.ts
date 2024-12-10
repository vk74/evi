/**
 * @file usersListState.ts
 * 
 * Store для управления списком пользователей в Vue 3 приложении с использованием Pinia.
 * 
 * Основные функции:
 * - Загрузка списка пользователей с сервера
 * - Сортировка пользователей по различным полям
 * - Пагинация списка
 * - Обработка ошибок при загрузке
 * 
 * Используется совместно с компонентом ViewAllUsers.vue
 */

// Интерфейсы и типы данных
/** Интерфейс для объекта пользователя */
interface User {
    id: number;
    username: string;
    [key: string]: any; // Для дополнительных свойств пользователя
  }
  
  /** Интерфейс ответа API при запросе пользователей */
  interface UsersResponse {
    users: User[];
    total: number;
  }
  
  /** Интерфейс состояния store */
  interface UsersListState {
    users: User[];
    loading: boolean;
    error: string | null;
    totalUsers: number;
    sortBy: string;
    sortDesc: boolean;
    page: number;
    itemsPerPage: number;
  }
  
  /** Интерфейс параметров запроса для получения пользователей */
  interface FetchUsersParams {
    page: number;
    items_per_page: number;
    sort_by: string;
    sort_desc: boolean;
  }
  
  import { defineStore } from 'pinia';
  import axios, { AxiosError } from 'axios';
  
  export const useUsersListStore = defineStore('usersList', {
    // Начальное состояние store
    state: (): UsersListState => ({
      users: [],         // Список пользователей
      loading: false,    // Флаг загрузки данных
      error: null,       // Сообщение об ошибке
      totalUsers: 0,     // Общее количество пользователей
      sortBy: 'username', // Поле для сортировки
      sortDesc: false,    // Направление сортировки
      page: 1,           // Текущая страница
      itemsPerPage: 25   // Количество элементов на странице
    }),
  
    // Геттеры store
    getters: {
      // Получение отсортированного списка пользователей
      sortedUsers: (state: UsersListState): User[] => {
        return [...state.users].sort((a: User, b: User) => {
          const sortField = state.sortBy;
          const modifier = state.sortDesc ? -1 : 1;
  
          if (a[sortField] < b[sortField]) return -1 * modifier;
          if (a[sortField] > b[sortField]) return 1 * modifier;
          return 0;
        });
      }
    },
  
    // Действия store
    actions: {
      // Загрузка пользователей с учетом пагинации и сортировки
      async fetchUsers(): Promise<void> {
        this.loading = true;
        this.error = null;
  
        try {
          // Формирование параметров запроса
          const params: FetchUsersParams = {
            page: this.page,
            items_per_page: this.itemsPerPage,
            sort_by: this.sortBy,
            sort_desc: this.sortDesc
          };
  
          // Выполнение запроса к API
          const response = await axios.get<UsersResponse>('/api/users', { params });
          this.users = response.data.users;
          this.totalUsers = response.data.total;
        } catch (err) {
          const error = err as AxiosError;
          this.error = error.message;
          console.error('Error fetching users:', error);
        } finally {
          this.loading = false;
        }
      },
  
      // Установка параметров сортировки и обновление списка
      setSorting(field: string, isDesc: boolean): void {
        this.sortBy = field;
        this.sortDesc = isDesc;
        this.fetchUsers();
      },
  
      // Установка параметров пагинации и обновление списка
      setPagination(page: number, itemsPerPage: number): void {
        this.page = page;
        this.itemsPerPage = itemsPerPage;
        this.fetchUsers();
      }
    }
  });