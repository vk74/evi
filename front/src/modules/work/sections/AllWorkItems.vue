/**
 * @file AllWorkItems.vue
 * Version: 1.0.0
 * All work items section component.
 * Frontend file that displays all work items in the work module.
 */
<script setup lang="ts">
// Component logic will be implemented here
</script>

<template>
  <div class="all-work-items">
    <v-card class="pa-4">
      <v-card-title class="text-h5 mb-4">
        {{ $t('work.sections.allWorkItems') }}
      </v-card-title>
      <v-card-text>
        <p>all work items content will be implemented here</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.all-work-items {
  height: 100%;
  padding: 16px;
}
</style>
