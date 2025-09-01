<!--
  File: ModuleSessionData.vue
  Version: 1.0.0
  Description: Component for displaying session technical data
  Purpose: Shows user session information in a structured format
  Features:
  - Displays session technical data
  - Expandable/collapsible view
  - Styled similar to UUID display in CatalogSectionEditor
  Type: Frontend file - ModuleSessionData.vue
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import { useUserAccountStore } from '../account/state.user.account'
import type { SessionData } from './types.about'

// Initialize stores and i18n
const { t } = useI18n()
const userAuthStore = useUserAuthStore()
const userAccountStore = useUserAccountStore()

// Computed properties for session data
const sessionData = computed<SessionData>(() => ({
  username: userAuthStore.username,
  jwt: userAuthStore.jwt,
  isLoggedIn: userAuthStore.isAuthenticated,
  userID: userAuthStore.userID,
  issuedAt: userAuthStore.issuedAt ? new Date(userAuthStore.issuedAt * 1000).toLocaleString() : 'N/A',
  issuer: userAuthStore.issuer || 'N/A',
  expiresAt: userAuthStore.tokenExpires ? new Date(userAuthStore.tokenExpires * 1000).toLocaleString() : 'N/A',
  timeUntilExpiry: userAuthStore.timeUntilExpiry
}))

// Update session data in store when component mounts
onMounted(() => {
  userAccountStore.updateSessionData(sessionData.value)
})
</script>

<template>
  <div class="session-data-wrapper">
    <div class="session-data-title">
      <span>{{ t('account.sessionData.title') }}</span>
    </div>
    
    <div class="session-data-container">
      <!-- Username -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.username') }}:
        </div>
        <div class="data-value">
          {{ sessionData.username }}
        </div>
      </div>

      <!-- JWT Token -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.jwt') }}:
        </div>
        <div class="data-value jwt-token">
          {{ sessionData.jwt }}
        </div>
      </div>

      <!-- Is Logged In -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.isLoggedIn') }}:
        </div>
        <div class="data-value">
          <v-chip 
            :color="sessionData.isLoggedIn ? 'teal' : 'grey'" 
            size="x-small"
          >
            {{ sessionData.isLoggedIn ? t('account.sessionData.yes') : t('account.sessionData.no') }}
          </v-chip>
        </div>
      </div>

      <!-- User ID -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.userID') }}:
        </div>
        <div class="data-value uuid-value">
          {{ sessionData.userID }}
        </div>
      </div>

      <!-- Issued At -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.issuedAt') }}:
        </div>
        <div class="data-value">
          {{ sessionData.issuedAt }}
        </div>
      </div>

      <!-- Issuer -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.issuer') }}:
        </div>
        <div class="data-value">
          {{ sessionData.issuer }}
        </div>
      </div>

      <!-- Expires At -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.expiresAt') }}:
        </div>
        <div class="data-value">
          {{ sessionData.expiresAt }}
        </div>
      </div>

      <!-- Time Until Expiry -->
      <div class="data-row">
        <div class="data-label">
          {{ t('account.sessionData.timeUntilExpiry') }}:
        </div>
        <div class="data-value">
          {{ sessionData.timeUntilExpiry }} {{ t('account.sessionData.seconds') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.session-data-wrapper {
  padding: 16px;
}

.session-data-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
}

.session-data-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.data-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.data-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
  min-width: 140px;
  flex-shrink: 0;
}

.data-value {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.87);
  word-break: break-word;
  flex-grow: 1;
}

.uuid-value {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: inline-block;
}

.jwt-token {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.75);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  max-width: 100%;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
