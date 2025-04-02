<!--
  File: GroupsManagement.vue
  Description: Groups management settings component
  Purpose: Configure group related settings
-->

<script setup lang="ts">
import { ref } from 'vue';

// Group management settings
const allowAddDisabledAndArchivedUsersToGroups = ref(false);
</script>

<template>
  <div class="groups-management-container">
    <h2 class="text-h6 mb-4">управление группами</h2>
    
    <div class="settings-section">
      <div class="section-content">
        <v-switch
          v-model="allowAddDisabledAndArchivedUsersToGroups"
          color="teal-darken-2"
          label="allow only users with 'active' status to be added to groups"
          hide-details
        ></v-switch>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groups-management-container {
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