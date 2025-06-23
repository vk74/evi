<!--
Компонент карточки сервиса.
Отображает информацию о сервисе в компактном или развернутом виде.
Поддерживает переключение состояний по клику и закрытие при клике вне карточки.
Загружает детальную информацию при открытии карточки.
-->
<template>
  <v-card
    v-click-outside="collapse"
    :elevation="expanded ? 8 : 2"
    :class="['service-card', { 'card-expanded': expanded }]"
    @click="handleCardClick"
  >
    <!-- Компактный вид -->
    <div
      v-if="!expanded"
      class="d-flex align-center pa-4"
    >
      <v-icon
        size="large"
        class="mr-4"
      >
        {{ serviceIcon }}
      </v-icon>
      <div class="card-content">
        <v-card-title>{{ serviceName }}</v-card-title>
        <v-card-text>{{ serviceShortDescription }}</v-card-text>
      </div>
    </div>
   
    <!-- Развернутый вид -->
    <v-expand-transition>
      <div v-if="expanded">
        <!-- Индикатор загрузки -->
        <div
          v-if="isLoadingDetails"
          class="d-flex justify-center pa-4"
        >
          <v-progress-circular
            indeterminate
            color="primary"
          />
        </div>
   
        <!-- Сообщение об ошибке -->
        <v-alert
          v-else-if="detailsError"
          type="error"
          class="ma-4"
        >
          {{ detailsError }}
        </v-alert>
   
        <!-- Контент развернутой карточки -->
        <div v-else>
          <!-- Секция описания сервиса -->
          <v-card-item>
            <v-card-title class="text-h5 mb-2">
              {{ serviceName }}
            </v-card-title>
            <v-card-text>
              <div
                v-if="serviceDetails"
                class="text-body-1"
              >
                {{ serviceDetails.service_description_long || serviceShortDescription }}
              </div>
            </v-card-text>
          </v-card-item>
   
          <!-- Секция предлагаемых услуг -->
          <v-card-item>
            <v-card-title class="text-h6">
              Предлагаемые услуги
            </v-card-title>
            <v-card-text>
              <div
                v-if="serviceDetails && serviceDetails.service_options"
                class="text-body-2"
              >
                {{ serviceDetails.service_options }}
              </div>
              <div
                v-else
                class="text-body-2"
              >
                Информация о доступных услугах отсутствует
              </div>
            </v-card-text>
          </v-card-item>
        </div>
      </div>
    </v-expand-transition>
  </v-card>
</template>
   
   <script setup>
   import { ref, onMounted } from 'vue';
   import { useCatalogStore } from '../catalogstate';
   
   // Определение входных параметров компонента
   const props = defineProps({
    serviceId: {
      type: String,
      required: true
    },
    serviceIcon: {
      type: String,
      required: true
    },
    serviceName: {
      type: String,
      required: true
    },
    serviceShortDescription: {
      type: String,
      required: true
    }
   });
   
   // Состояния компонента
   const expanded = ref(false);
   const isLoadingDetails = ref(false);
   const detailsError = ref(null);
   const serviceDetails = ref(null);
   
   // Получаем store
   const catalogStore = useCatalogStore();
   
   // Обработчик клика по карточке
   const handleCardClick = async () => {
    if (!expanded.value) {
      expanded.value = true;
      await loadDetails();
    }
   };
   
   // Загрузка деталей сервиса
   const loadDetails = async () => {
    if (serviceDetails.value) return; // Если детали уже загружены
   
    isLoadingDetails.value = true;
    detailsError.value = null;
   
    try {
      console.log('ServiceCard: Loading details for service:', props.serviceId);
      const details = await catalogStore.loadServiceDetails(props.serviceId);
      serviceDetails.value = details;
      console.log('ServiceCard: Details loaded successfully');
    } catch (error) {
      console.error('ServiceCard: Error loading details:', error);
      detailsError.value = 'Не удалось загрузить детальную информацию о сервисе';
    } finally {
      isLoadingDetails.value = false;
    }
   };
   
   // Обработчик клика вне карточки
   const collapse = () => {
    if (expanded.value) {
      expanded.value = false;
    }
   };
   </script>
   
   <style scoped>
   .service-card {
    transition: all 0.3s ease-in-out;
    max-width: 800px; /* примерная ширина для 150 символов */
   }
   
   .card-expanded {
    max-width: none; /* в развернутом состоянии занимает всю доступную ширину */
   }
   
   .card-content {
    white-space: normal;
    overflow-wrap: break-word;
    word-wrap: break-word;
   }
   </style>