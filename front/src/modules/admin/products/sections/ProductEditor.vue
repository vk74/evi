/**
 * @file ProductEditor.vue
 * Version: 1.1.0
 * Product editor section component.
 * Frontend file that provides product editing interface for admin users.
 */
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const ProductEditorMain = defineAsyncComponent(() => import('./product-editor/ProductEditor.vue'))
</script>

<template>
  <ProductEditorMain />
</template>
