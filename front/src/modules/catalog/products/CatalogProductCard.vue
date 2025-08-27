<!--
version: 1.0.0
Frontend file for catalog product card component.
Displays product information in a card format.
File: CatalogProductCard.vue
-->
<script setup lang="ts">
import type { CatalogProduct } from './types.products';

// ==================== PROPS ====================
interface Props {
  product: CatalogProduct;
}

const props = defineProps<Props>();
</script>

<template>
  <v-card
    class="product-card"
    elevation="2"
    hover
  >
    <v-card-title class="d-flex align-center">
      <v-icon
        :icon="product.image"
        :color="product.color"
        class="me-3"
        size="large"
      />
      <div class="flex-grow-1">
        <div class="text-h6">
          {{ product.name }}
        </div>
        <div class="text-caption text-grey">
          {{ product.category }}
          <span v-if="product.subcategory"> / {{ product.subcategory }}</span>
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <p class="text-body-2 mb-3">
        {{ product.description }}
      </p>

      <!-- Product-specific info -->
      <div class="mb-2">
        <div class="text-caption text-grey mb-1">
          SKU: {{ product.sku }}
        </div>
        <div class="text-h6 text-teal-darken-2">
          {{ product.price }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.product-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: rgb(242, 242, 242);
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(0, 0, 0, 0.24);
}

.product-card .v-card-title {
  padding-bottom: 8px;
}

.product-card .v-card-text {
  flex-grow: 1;
  padding-top: 0;
}
</style> 