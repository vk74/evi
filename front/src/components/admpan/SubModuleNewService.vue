<template>
  <v-container class="pa-0">
    <v-app-bar app flat class="app-bar">
      <div style="margin-left: 15px;">
        <v-btn
          v-for="section in sections"
          :key="section.id"
          :class="['section-btn', { 'section-active': activeSection === section.id }]"
          variant="text"
          @click="activeSection = section.id"
        >
          <v-icon start>{{ section.icon }}</v-icon>
          {{ section.title }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-toolbar-title class="title-text">создание сервиса</v-toolbar-title>
    </v-app-bar>

    <!-- Временный контейнер для проверки расположения -->
    <v-container class="mt-15 pt-10">
      <v-card>
        <v-card-text>
          активная секция: {{ activeSection }}
        </v-card-text>
      </v-card>
    </v-container>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const sections = [
  { id: 'description', title: 'описание', icon: 'mdi-book-open-page-variant-outline' },
  { id: 'visualization', title: 'визуализация', icon: 'mdi-pencil-ruler' },
  { id: 'access', title: 'доступ', icon: 'mdi-shield-outline' },
  { id: 'management', title: 'управление', icon: 'mdi-account-cog-outline' }
]

const activeSection = ref('description')
</script>

<style scoped>
.app-bar {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
}

.title-text {
  margin-right: 15px;
  text-align: right;
  font-family: 'Roboto', sans-serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.6);
}
</style>