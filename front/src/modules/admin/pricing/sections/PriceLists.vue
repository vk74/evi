<!--
Version: 1.0.0
Price Lists management section.
Frontend file for managing price lists in the pricing admin module.
Filename: PriceLists.vue
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhListChecks } from '@phosphor-icons/vue'

const { t } = useI18n()
const pageTitle = computed(() => t('admin.pricing.sections.priceLists'))
</script>

<template>
  <div class="price-lists-section fill-height">
    <v-container fluid class="pa-6">
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <component :is="PhListChecks" size="32" color="#026c6c" class="mr-3" />
            <h1 class="text-h4">{{ pageTitle }}</h1>
          </div>
        </v-col>
      </v-row>

      <!-- Placeholder content -->
      <v-row>
        <v-col cols="12">
          <v-card elevation="2" class="pa-6">
            <v-card-text>
              <p class="text-body-1">
                Price Lists management interface will be implemented here.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.price-lists-section {
  background-color: #f5f5f5;
}
</style>

