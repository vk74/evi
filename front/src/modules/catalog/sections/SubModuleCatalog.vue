<!--
Подмодуль каталога сервисов.
Отображает список доступных сервисов в виде карточек.
Позволяет просматривать информацию о сервисах и доступных услугах.
Обеспечивает интерактивное взаимодействие с карточками сервисов.
-->
<template>
  <div class="content-container">
    <!-- Заголовок и разделитель -->
    <h2 class="text-h5 mb-2">
      каталог
    </h2>
    <v-divider class="mb-4" />
 
    <!-- Индикатор загрузки -->
    <div
      v-if="catalogStore.isLoading"
      class="d-flex justify-center"
    >
      <v-progress-circular
        indeterminate
        color="primary"
      />
    </div>
 
    <!-- Сообщение об ошибке -->
    <v-alert
      v-if="catalogStore.error"
      type="error"
      class="mb-4"
    >
      {{ catalogStore.error }}
    </v-alert>
 
    <!-- Список сервисов или сообщение об их отсутствии -->
    <div v-else>
      <div
        v-if="!catalogStore.services.length"
        class="d-flex justify-center align-center pa-4"
      >
        <v-alert
          type="info"
          class="mb-0"
        >
          В данный момент нет доступных сервисов
        </v-alert>
      </div>
      
      <!-- Список карточек сервисов -->
      <div
        v-else
        class="d-flex flex-column gap-4"
      >
        <ServiceCard
          v-for="service in catalogStore.services"
          :key="service.service_id"
          :service-id="service.service_id"
          :service-icon="'mdi-file-document-outline'"
          :service-name="service.service_name"
          :service-short-description="service.service_description_short"
        />
      </div>
    </div>
  </div>
</template>
 
 <script setup>
 import { onMounted } from 'vue';
 import { useCatalogStore } from '../catalogstate';
 import ServiceCard from './ServiceCard.vue';
 
 // Получаем store
 const catalogStore = useCatalogStore();
 
 // Загрузка сервисов при монтировании компонента
 onMounted(async () => {
  console.log('Catalog: Component mounted, starting services load');
  try {
    await catalogStore.loadServices();
    console.log('Catalog: Services loaded successfully');
  } catch (error) {
    console.error('Catalog: Error in loadServices:', error);
  }
 });
 </script>
 
 <style scoped>
 .content-container {
  margin-top: 5px;
  margin-left: 15px;
  margin-right: 15px;
  padding: 5px 0 0 0;
 }
 
 .gap-4 {
  gap: 1rem;
 }
 </style>