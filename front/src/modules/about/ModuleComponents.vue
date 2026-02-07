<!--
  File: ModuleComponents.vue
  Version: 1.1.0
  Description: Component for displaying system components information
  Purpose: Shows information about technologies used in evi software
  Features:
  - Displays frontend, backend, database, host os, reverse-proxy, admin tools
  - Lists all major libraries and frameworks with source links
  - Styled consistently with other about components
  Type: Frontend file - ModuleComponents.vue

  Changes in v1.1.0:
  - Added ComponentItem structure with source URL for each component
  - Updated versions from package-lock.json and env files
  - Added hostOs, reverseProxy, adminTools sections
  - Component name is clickable link to official resource
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ComponentsData } from './types.about'

// Initialize i18n
const { t } = useI18n()

// Components data with all technologies and source URLs (versions from package-lock.json, env, Containerfiles)
const componentsData = computed<ComponentsData>(() => ({
  title: t('about.components.title'),
  frontend: [
    { name: 'Vue 3.5.21 - progressive javascript framework', url: 'https://vuejs.org' },
    { name: 'Vuetify 3.9.7 - Material Design component library', url: 'https://vuetifyjs.com' },
    { name: 'TypeScript 5.9.2 - typed javascript', url: 'https://www.typescriptlang.org' },
    { name: 'Pinia 3.0.3 - state management', url: 'https://pinia.vuejs.org' },
    { name: 'pinia-plugin-persistedstate 4.5.0 - pinia persistence', url: 'https://github.com/prazdevs/pinia-plugin-persistedstate' },
    { name: 'Vue I18n 11.1.12 - internationalization', url: 'https://vue-i18n.intlify.dev' },
    { name: 'Axios 1.11.0 - HTTP client', url: 'https://github.com/axios/axios' },
    { name: 'Phosphor Icons 2.2.1 - icon library', url: 'https://phosphoricons.com' },
    { name: 'VueUse 13.9.0 - vue composition utilities', url: 'https://vueuse.org' },
    { name: 'jwt-decode 4.0.0 - JWT token handling', url: 'https://github.com/auth0/jwt-decode' },
    { name: 'jsonwebtoken 9.0.2 - JWT library', url: 'https://github.com/auth0/node-jsonwebtoken' },
    { name: 'core-js 3.45.1 - javascript polyfills', url: 'https://github.com/zloirock/core-js' },
    { name: 'roboto-fontface 0.10.0 - typography', url: 'https://github.com/choffmeister/roboto-fontface' },
    { name: 'ExcelJS 4.4.0 - excel export', url: 'https://github.com/exceljs/exceljs' }
  ],
  backend: [
    { name: 'Node.js - javascript runtime', url: 'https://nodejs.org' },
    { name: 'Express 4.21.2 - web framework', url: 'https://expressjs.com' },
    { name: 'TypeScript 5.9.2 - typed javascript', url: 'https://www.typescriptlang.org' },
    { name: 'pg 8.16.3 - PostgreSQL driver', url: 'https://github.com/brianc/node-postgres' },
    { name: 'jsonwebtoken 9.0.2 - authentication', url: 'https://github.com/auth0/node-jsonwebtoken' },
    { name: 'bcrypt 6.0.0 - password hashing', url: 'https://github.com/kelektiv/node.bcrypt.js' },
    { name: 'cors 2.8.5 - cross-origin resource sharing', url: 'https://github.com/expressjs/cors' },
    { name: 'body-parser 1.20.3 - request parsing', url: 'https://github.com/expressjs/body-parser' },
    { name: 'cookie-parser 1.4.7 - cookie handling', url: 'https://github.com/expressjs/cookie-parser' },
    { name: 'uuid 9.0.1 - unique identifier generation', url: 'https://github.com/uuidjs/uuid' },
    { name: 'ajv 8.17.1 - JSON schema validator', url: 'https://github.com/ajv-validator/ajv' },
    { name: 'zod 4.1.5 - schema validation', url: 'https://zod.dev' },
    { name: 'dotenv 17.2.3 - environment config', url: 'https://github.com/motdotla/dotenv' }
  ],
  database: [
    { name: 'PostgreSQL 17 - primary database', url: 'https://www.postgresql.org' },
    { name: 'pg_cron extension - scheduled tasks', url: 'https://github.com/citusdata/pg_cron' },
    { name: 'PostgreSQL Contrib - additional extensions', url: 'https://www.postgresql.org/docs/current/contrib.html' }
  ],
  hostOs: [
    { name: 'Podman - container runtime', url: 'https://podman.io' },
    { name: 'curl - HTTP client for scripts', url: 'https://curl.se' },
    { name: 'OpenSSL - TLS/crypto utilities', url: 'https://www.openssl.org' }
  ],
  reverseProxy: [
    { name: 'Caddy 2.8-alpine - reverse proxy and TLS termination', url: 'https://caddyserver.com' }
  ],
  adminTools: [
    { name: 'pgAdmin 4.8 - database admin GUI (optional)', url: 'https://www.pgadmin.org' },
    { name: 'Cockpit + cockpit-podman - container monitoring (optional)', url: 'https://cockpit-project.org' }
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
            v-for="(item, index) in componentsData.frontend"
            :key="`frontend-${index}`"
            class="component-item"
          >
            <a :href="item.url" target="_blank" rel="noopener" class="component-link">{{ item.name }}</a>
          </div>
        </div>
      </div>

      <!-- Backend Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.backend') }}</h3>
        <div class="component-list">
          <div
            v-for="(item, index) in componentsData.backend"
            :key="`backend-${index}`"
            class="component-item"
          >
            <a :href="item.url" target="_blank" rel="noopener" class="component-link">{{ item.name }}</a>
          </div>
        </div>
      </div>

      <!-- Database Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.database') }}</h3>
        <div class="component-list">
          <div
            v-for="(item, index) in componentsData.database"
            :key="`database-${index}`"
            class="component-item"
          >
            <a :href="item.url" target="_blank" rel="noopener" class="component-link">{{ item.name }}</a>
          </div>
        </div>
      </div>

      <!-- Host OS Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.hostOs') }}</h3>
        <div class="component-list">
          <div
            v-for="(item, index) in componentsData.hostOs"
            :key="`hostOs-${index}`"
            class="component-item"
          >
            <a :href="item.url" target="_blank" rel="noopener" class="component-link">{{ item.name }}</a>
          </div>
        </div>
      </div>

      <!-- Reverse Proxy Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.reverseProxy') }}</h3>
        <div class="component-list">
          <div
            v-for="(item, index) in componentsData.reverseProxy"
            :key="`reverseProxy-${index}`"
            class="component-item"
          >
            <a :href="item.url" target="_blank" rel="noopener" class="component-link">{{ item.name }}</a>
          </div>
        </div>
      </div>

      <!-- Admin Tools Section -->
      <div class="component-section">
        <h3 class="section-title">{{ t('about.components.adminTools') }}</h3>
        <div class="component-list">
          <div
            v-for="(item, index) in componentsData.adminTools"
            :key="`adminTools-${index}`"
            class="component-item"
          >
            <a :href="item.url" target="_blank" rel="noopener" class="component-link">{{ item.name }}</a>
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

.component-link {
  color: rgba(19, 84, 122, 0.9);
  text-decoration: none;
}

.component-link:hover {
  text-decoration: underline;
}
</style>
