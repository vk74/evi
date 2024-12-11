/**
 * @file usersListStateTypes.ts
 * 
 * Типы для хранилища состояния списка пользователей.
 * Определяет интерфейсы для работы со списком пользователей, включая:
 * - Типы данных пользователя
 * - Параметры запросов к API
 * - Интерфейсы состояния хранилища
 * - Интерфейсы для геттеров и действий
 * 
 * Используется совместно с usersListState.ts и ViewAllUsers.vue
 */

import type { User } from './userType'

/** Ответ API при запросе списка пользователей */
export interface UsersResponse {
  /** Массив данных пользователей */
  users: User[];
  /** Общее количество пользователей в системе */
  total: number;
}

/** Параметры запроса для получения списка пользователей */
export interface FetchUsersParams {
  /** Номер текущей страницы (начиная с 1) */
  page: number;
  /** Количество записей на странице */
  items_per_page: number;
  /** Поле для сортировки */
  sort_by: string;
  /** Направление сортировки (true - по убыванию) */
  sort_desc: boolean;
}

/** Состояние хранилища списка пользователей */
export interface UsersListState {
  /** Массив данных пользователей */
  users: User[];
  /** Флаг загрузки данных */
  loading: boolean;
  /** Сообщение об ошибке */
  error: string | null;
  /** Общее количество пользователей */
  totalUsers: number;
  /** Поле, по которому выполняется сортировка */
  sortBy: string;
  /** Направление сортировки */
  sortDesc: boolean;
  /** Текущая страница */
  page: number;
  /** Количество элементов на странице */
  itemsPerPage: number;
}

/** Геттеры хранилища списка пользователей */
export interface UsersListGetters {
  /** Получение отсортированного списка пользователей */
  sortedUsers: (state: UsersListState) => User[];
}

/** Методы хранилища списка пользователей */
export interface UsersListActions {
  /** Загрузка списка пользователей */
  fetchUsers: () => Promise<void>;
  /** Установка параметров сортировки */
  setSorting: (field: string, isDesc: boolean) => void;
  /** Установка параметров пагинации */
  setPagination: (page: number, itemsPerPage: number) => void;
}