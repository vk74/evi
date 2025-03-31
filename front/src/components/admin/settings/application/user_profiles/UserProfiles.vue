<!--
  File: UserProfiles.vue
  Description: User profiles management component
  Purpose: Configure user profile settings and permissions
-->

<script setup lang="ts">
import { ref } from 'vue';

// User profile settings
const allowUserToChangeOwnProfile = ref(true);
const allowUserToUploadAvatar = ref(true);
const maxUserProfilePhotoSize = ref(1024); // Size in KB
</script>

<template>
  <div class="user-profiles-container">
    <h2 class="text-h6 mb-4">управление профилями пользователей</h2>
    
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-account-edit-outline" class="mr-2"></v-icon>
        Профили
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="allowUserToChangeOwnProfile"
          color="teal-darken-2"
          label="allow user to update own profile"
          hide-details
          class="mb-3"
        ></v-switch>
        
        <v-switch
          v-model="allowUserToUploadAvatar"
          color="teal-darken-2"
          label="allow users to upload profile photos"
          hide-details
          class="mb-3"
        ></v-switch>
        
        <v-slider
          v-model="maxUserProfilePhotoSize"
          :disabled="!allowUserToUploadAvatar"
          min="256"
          max="5120"
          step="256"
          thumb-label
          :label="`Maximum profile photo size (${maxUserProfilePhotoSize} KB)`"
          color="teal-darken-2"
        >
          <template v-slot:append>
            <v-text-field
              v-model="maxUserProfilePhotoSize"
              :disabled="!allowUserToUploadAvatar"
              density="compact"
              style="width: 80px"
              hide-details
              variant="outlined"
              type="number"
              min="256"
              max="5120"
              step="256"
            ></v-text-field>
          </template>
        </v-slider>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profiles-container {
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