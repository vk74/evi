<!--
  Модуль просмотра всех сервисов.
  Отображает полный список сервисов системы и предоставляет функционал для их управления.
-->
<template>
    <v-container>
      <v-row>
        <v-col>
          <h2>Все сервисы</h2>
          <!-- Здесь будет таблица или список всех сервисов -->
          <p>Модуль находится в разработке</p>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { useAdminStore } from '@/components/admin/adminstate'
  
  // Инициализация store
  const adminStore = useAdminStore()
  </script>
  
  <style scoped>
  h2 {
    color: rgba(0, 0, 0, 0.87);
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1rem;
  }
  </style>