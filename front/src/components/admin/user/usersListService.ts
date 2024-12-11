/**
 * @file usersListService.ts
 * 
 * Сервис для работы со списком пользователей через API.
 * Предоставляет методы для получения и обработки данных пользователей.
 * Работает в паре с хранилищем usersListState.
 * 
 * Основные функции:
 * - Получение списка пользователей с пагинацией и сортировкой
 * - Трансформация и валидация данных от API
 * - Обработка ошибок при запросах
 * 
 * @example
 * // Получение списка пользователей
 * const service = new UsersListService();
 * const users = await service.getUsersList({
 *   page: 1,
 *   items_per_page: 25,
 *   sort_by: 'username',
 *   sort_desc: false
 * });
 */

import axios, { AxiosError } from 'axios';
import { User } from './userType';

/** Интерфейс ответа API при запросе списка пользователей */
export interface UsersListResponse {
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

/**
 * Сервис для работы со списком пользователей
 */
export class UsersListService {
  /** Базовый URL для API запросов */
  private readonly BASE_URL = '/api/admin/users';

  /**
   * Получение списка пользователей с пагинацией и сортировкой
   * @param params - Параметры запроса (пагинация, сортировка)
   * @returns Promise с данными пользователей и общим количеством
   * @throws Error при проблемах с запросом или ответом сервера
   */
  async getUsersList(params: FetchUsersParams): Promise<UsersListResponse> {
    try {
      console.log('Fetching users list with params:', params);
      const response = await axios.get<UsersListResponse>(
        `${this.BASE_URL}/getuserslist`, 
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching users list:', error);
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Обработка ошибок API
   * Преобразует ошибки axios в более понятный формат для фронтенда
   * 
   * @param error - Исходная ошибка axios
   * @returns Обработанная ошибка с понятным описанием
   */
  private handleError(error: AxiosError): Error {
    if (error.response) {
      return new Error(`API Error: ${error.response.status} - ${error.response.data}`);
    }
    return new Error(`Network error: ${error.message}`);
  }
}

// Экспорт инстанса сервиса для использования в компонентах
export const usersListService = new UsersListService();