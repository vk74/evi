<!--
  File: ModuleComponents.vue
  Version: 1.0.0
  Description: Component for displaying system components information
  Purpose: Shows information about technologies used in EVI software
  Features:
  - Displays frontend, backend, and database technologies
  - Lists all major libraries and frameworks
  - Styled consistently with other about components
  Type: Frontend file - ModuleComponents.vue
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ComponentsData } from './types.about'

// Initialize i18n
const { t } = useI18n()

// Components data with all technologies
const componentsData = computed<ComponentsData>(() => ({
  title: t('about.components.title'),
  frontend: [
    'Vue.js 3.2.13 - Progressive JavaScript framework',
    'Vuetify 3.5.3 - Material Design component library',
    'TypeScript 5.7.2 - Typed JavaScript',
    'Pinia 2.1.7 - State management',
    'Vue I18n 9.9.1 - Internationalization',
    'Axios 1.6.6 - HTTP client',
    'Phosphor Icons 2.2.1 - Icon library',
    'VueUse 13.1.0 - Vue composition utilities',
    'JWT Decode 4.0.0 - JWT token handling',
    'JSON Web Token 9.0.2 - JWT library',
    'Core.js 3.8.3 - JavaScript polyfills',
    'Roboto Fontface - Typography'
  ],
  backend: [
    'Node.js - JavaScript runtime',
    'Express.js 4.18.2 - Web framework',
    'TypeScript 5.7.2 - Typed JavaScript',
    'PostgreSQL 8.11.3 - Database driver',
    'JSON Web Token 9.0.2 - Authentication',
    'Bcrypt 5.1.1 - Password hashing',
    'CORS 2.8.5 - Cross-origin resource sharing',
    'Body Parser 1.20.2 - Request parsing',
    'Cookie Parser 1.4.7 - Cookie handling',
    'UUID 9.0.1 - Unique identifier generation',
    'Ajv 8.17.1 - JSON schema validator'
  ],
  database: [
    'PostgreSQL 17 - Primary database',
    'pg_cron extension - Scheduled tasks',
    'PostgreSQL Contrib - Additional extensions',
    'Docker containerization - Database deployment'
  ]
}))
</script>

<template>
  <div class="components-wrapper">
    <div class="components-title">
      <span>{{ componentsData.title }}</span>
    </div>
    
    <div class="components-container">
      <!-- Frontend Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.frontend') }}</h3>
        <div class="component-list">
          <div 
            v-for="(component, index) in componentsData.frontend" 
            :key="`frontend-${index}`"
            class="component-item"
          >
            {{ component }}
          </div>
        </div>
      </div>

      <!-- Backend Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.backend') }}</h3>
        <div class="component-list">
          <div 
            v-for="(component, index) in componentsData.backend" 
            :key="`backend-${index}`"
            class="component-item"
          >
            {{ component }}
          </div>
        </div>
      </div>

      <!-- Database Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.database') }}</h3>
        <div class="component-list">
          <div 
            v-for="(component, index) in componentsData.database" 
            :key="`database-${index}`"
            class="component-item"
          >
            {{ component }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.components-wrapper {
  padding: 16px;
}

.components-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
}

.components-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.component-section {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-item {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.4;
  padding: 6px 0;
  border-left: 3px solid rgba(19, 84, 122, 0.2);
  padding-left: 12px;
}
</style>
