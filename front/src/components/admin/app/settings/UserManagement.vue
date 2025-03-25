<!--
  File: UserManagement.vue
  Description: User management settings component
  Purpose: Configure user profiles and group management settings
  
  Updated: 
  - Standardized divider colors to match other settings components
  - Used standard border-color rgba(0, 0, 0, 0.12) with opacity 1
-->

<script setup lang="ts">
import { ref } from 'vue';

// User profile settings
const allowUserToChangeOwnProfile = ref(true);

// Group management settings
const allowAddDisabledAndArchivedUsersToGroups = ref(false);
</script>

<template>
  <div class="user-management-container">
    <h2 class="text-h6 mb-4">настройки пользователей</h2>
    
    <!-- User Profiles -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-account-edit-outline" class="mr-2"></v-icon>
        user profiles
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="allowUserToChangeOwnProfile"
          color="teal-darken-2"
          label="allow user to update own profile"
          hide-details
        ></v-switch>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Group Management -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-account-group-outline" class="mr-2"></v-icon>
        group management
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="allowAddDisabledAndArchivedUsersToGroups"
          color="teal-darken-2"
          label="allow only users with status 'active' to be added to groups"
          hide-details
        ></v-switch>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-management-container {
  /* Base container styling */
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.section-title {
  font-weight: 500;
}

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style>