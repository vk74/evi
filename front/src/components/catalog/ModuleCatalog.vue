<!--
Модуль каталога сервисов.
Обеспечивает навигацию между разделами каталога сервисов через app bar
и отображает соответствующие подмодули в рабочей области.
-->
<template>
    <div class="module-root">
      <!-- App Bar -->
      <v-app-bar app flat class="app-bar">
        <div style="margin-left: 15px;">
          <v-btn
            v-for="section in sections"
            :key="section.id"
            :class="['section-btn', { 'section-active': activeSection === section.id }]"
            variant="text"
            @click="switchSection(section.id)"
          >
            <v-icon start>{{ section.icon }}</v-icon>
            {{ section.title }}
          </v-btn>
        </div>
        <v-spacer></v-spacer>
      </v-app-bar>
  
      <!-- Working Area -->
      <div class="working-area">
        <SubModuleCatalog v-if="activeSection === 'catalog'" />
        <SubModuleCatalogSection2 v-if="activeSection === 'section2'" />
        <SubModuleCatalogSection3 v-if="activeSection === 'section3'" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useCatalogStore } from '@/state/catalogstate'
  import SubModuleCatalog from './sections/SubModuleCatalog.vue'
  import SubModuleCatalogSection2 from './sections/SubModuleCatalogSection2.vue'
  import SubModuleCatalogSection3 from './sections/SubModuleCatalogSection3.vue'
  
  // Инициализация store
  const catalogStore = useCatalogStore()
  
  // Определение секций
  const sections = [
    { id: 'catalog', title: 'каталог', icon: 'mdi-apps' },
    { id: 'section2', title: 'Section 2', icon: 'mdi-view-grid-plus' },
    { id: 'section3', title: 'Section 3', icon: 'mdi-cog-outline' }
  ]
  
  // Получение активной секции из store
  const activeSection = computed(() => catalogStore.getCurrentSection)
  
  // Переключение секций
  const switchSection = (sectionId) => {
    catalogStore.setActiveSection(sectionId)
  }
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

  </style>