<!--
Компонент карточки сервиса.
Отображает информацию о сервисе в компактном или развернутом виде.
Поддерживает переключение состояний по клику и закрытие при клике вне карточки.
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
        <!-- Секция описания сервиса -->
        <v-card-item>
          <v-card-title class="text-h5 mb-2">
            {{ serviceName }}
          </v-card-title>
          <v-card-text>{{ serviceLongDescription }}</v-card-text>
        </v-card-item>
  
        <!-- Секция предлагаемых услуг -->
        <v-card-item>
          <v-card-title class="text-h6">
            Предлагаемые услуги
          </v-card-title>
          <v-card-text>
            <!-- Заглушка для будущих карточек заявок -->
            <div class="text-body-2">
              Здесь будут отображаться доступные услуги
            </div>
          </v-card-text>
        </v-card-item>
      </div>
    </v-expand-transition>
  </v-card>
</template>
  
  <script setup>
  import { ref } from 'vue';
  
  // Определение входных параметров компонента
  const props = defineProps({
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
    },
    serviceLongDescription: {
      type: String,
      required: true
    }
  });
  
  // Состояние развернутости карточки
  const expanded = ref(false);
  
  // Обработчик клика по карточке
  const handleCardClick = () => {
    if (!expanded.value) {
      expanded.value = true;
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