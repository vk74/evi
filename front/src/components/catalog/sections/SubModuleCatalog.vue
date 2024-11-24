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

    <ServiceCard
      serviceIcon="mdi-file-document-outline"
      serviceName="Тестовый сервис"
      serviceShortDescription="Краткое описание тестового сервиса для демонстрации функционала карточки"
      serviceLongDescription="Подробное описание тестового сервиса. Здесь может быть размещена детальная информация о сервисе, его возможностях и особенностях использования. Описание может включать несколько предложений для полного представления функционала сервиса."
    />
  </div>
</template>

<script setup>
import ServiceCard from './ServiceCard.vue';
</script>

<style scoped>
.content-container {
  margin-top: 5px; /* отступ под app bar */
  margin-left: 15px; /* отступ слева, как у кнопок в app bar */
  margin-right: 15px;
  padding: 5px 0 0 0; /* дополнительный отступ сверху внутри контейнера */
}
</style>