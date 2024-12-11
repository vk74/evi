<template>
    <v-container class="pa-0">
      <v-card flat>
        <div class="card-header">
          <v-card-title class="text-subtitle-1">Section 2 Content</v-card-title>
          <v-divider class="section-divider"></v-divider>
        </div>
        <v-card-text class="pt-3">
          <!-- Content will be added later -->
        </v-card-text>
      </v-card>
    </v-container>
  </template>
  
  <script setup>
  import { onMounted } from 'vue'
  import { useCatalogStore } from '../catalogstate'
  
  // Инициализация store
  const catalogStore = useCatalogStore()
  
  onMounted(() => {
    console.log('Section 1 mounted')
  })
  </script>
  
  <style scoped>
  .card-header {
    padding: 5px 5px 0 10px;
  }
  
  .section-divider {
    border-color: rgba(0, 0, 0, 0.999) !important;
    margin-top: 5px;
    margin-bottom: 5px;
  }
  </style>