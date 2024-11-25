<!--
Подмодуль каталога сервисов.
Отображает список доступных сервисов в виде карточек.
Позволяет просматривать информацию о сервисах и доступных услугах.
Обеспечивает интерактивное взаимодействие с карточками сервисов.
-->
<template>
  <div class="content-container">
    <!-- Заголовок и разделитель -->
    <h2 class="text-h5 mb-2">каталог</h2>
    <v-divider class="mb-4"></v-divider>

    <!-- Индикатор загрузки -->
    <div v-if="catalogStore.isLoading" class="d-flex justify-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
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
      <div v-if="!catalogStore.services.length" class="d-flex justify-center align-center pa-4">
        <v-alert
          type="info"
          class="mb-0"
        >
          В данный момент нет доступных сервисов
        </v-alert>
      </div>
      <ServiceCard
        v-else
        v-for="service in catalogStore.services"
        :key="service.service_id"
        :serviceIcon="'mdi-file-document-outline'"
        :serviceName="service.service_name"
        :serviceShortDescription="service.service_description_short"
        :serviceLongDescription="''"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCatalogStore } from '../../../state/catalogstate';
import ServiceCard from './ServiceCard.vue';

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
</style>