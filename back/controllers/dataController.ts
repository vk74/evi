// types.ts
type Operation = 'create' | 'read' | 'update' | 'delete' | 'list';

interface DataRequest {
  entity: string;          // Название таблицы/сущности
  operation: Operation;    // Тип операции
  payload?: any;          // Данные для create/update
  filters?: QueryFilter[]; // Фильтры для read/list/delete
  fields?: string[];      // Запрашиваемые поля
  sorting?: SortOption[]; // Параметры сортировки
  pagination?: {          // Пагинация
    page: number;
    pageSize: number;
  };
}

// controller.ts
import { Router } from 'express';
import { pool } from '../db/connection';
import { validateSchema } from '../validators/schemaValidator';
import { buildQuery } from '../utils/queryBuilder';

export class DataController {
  private router = Router();
  
  constructor() {
    this.router.post('/data', this.handleDataRequest);
  }

  private handleDataRequest = async (req, res) => {
    try {
      const request: DataRequest = req.body;
      
      // Валидация запроса
      if (!this.validateRequest(request)) {
        return res.status(400).json({ error: 'Invalid request format' });
      }

      // Проверка прав доступа к сущности
      if (!this.checkPermissions(req.user, request.entity, request.operation)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Валидация схемы данных
      if (request.payload && !await validateSchema(request.entity, request.payload)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // Построение и выполнение запроса
      const query = buildQuery(request);
      const result = await pool.query(query);

      // Форматирование ответа
      const response = this.formatResponse(result, request);
      
      res.json(response);

    } catch (error) {
      console.error(`Data operation error: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Пример построителя запросов
  private buildQuery = (request: DataRequest): string => {
    const { entity, operation, payload, filters } = request;
    
    switch (operation) {
      case 'create':
        return {
          text: `INSERT INTO app.${entity} ($1:name) VALUES ($2:csv) RETURNING *`,
          values: [Object.keys(payload), Object.values(payload)]
        };
        
      case 'read':
        return {
          text: `SELECT ${request.fields?.join(',') || '*'} 
                 FROM app.${entity} 
                 WHERE ${this.buildWhereClause(filters)}`,
          values: filters.map(f => f.value)
        };
        
      case 'update':
        return {
          text: `UPDATE app.${entity} 
                 SET ${Object.keys(payload).map((k, i) => `${k} = $${i + 1}`)} 
                 WHERE ${this.buildWhereClause(filters, Object.keys(payload).length)}
                 RETURNING *`,
          values: [...Object.values(payload), ...filters.map(f => f.value)]
        };
        
      case 'delete':
        return {
          text: `DELETE FROM app.${entity} 
                 WHERE ${this.buildWhereClause(filters)} 
                 RETURNING *`,
          values: filters.map(f => f.value)
        };
        
      case 'list':
        const { page = 1, pageSize = 10 } = request.pagination || {};
        const offset = (page - 1) * pageSize;
        
        return {
          text: `SELECT ${request.fields?.join(',') || '*'}
                 FROM app.${entity}
                 WHERE ${this.buildWhereClause(filters)}
                 ${this.buildSortClause(request.sorting)}
                 LIMIT ${pageSize} OFFSET ${offset}`,
          values: filters.map(f => f.value)
        };
    }
  }
}

// Пример использования на фронтенде
// api.ts
export const dataApi = {
  async request(data: DataRequest) {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// Пример компонента Vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dataApi } from '@/api';

const users = ref([]);

const fetchUsers = async () => {
  const result = await dataApi.request({
    entity: 'users',
    operation: 'list',
    filters: [
      { field: 'status', operator: 'eq', value: 'active' }
    ],
    sorting: [
      { field: 'created_at', direction: 'desc' }
    ],
    pagination: {
      page: 1,
      pageSize: 10
    }
  });
  users.value = result.data;
};

onMounted(fetchUsers);
</script>