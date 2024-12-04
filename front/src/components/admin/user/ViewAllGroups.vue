<template>
    <div>
      <TestCounter />
      <!-- Тут может быть основной контент ViewAllGroups -->
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  import TestCounter from '@/components/ts-components/TestCounter.vue'
  
  export default defineComponent({
    name: 'ViewAllGroups',
    components: {
      TestCounter
    }
  })
  </script>