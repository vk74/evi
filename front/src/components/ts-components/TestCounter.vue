<template>
    <div class="counter-wrapper">
      <h3>{{ title }}</h3>
      <div class="counter">
        <button @click="decrement">-</button>
        <span>{{ count }}</span>
        <button @click="increment">+</button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  
  interface CounterData {
    count: number
    title: string
  }
  
  export default defineComponent({
    name: 'TestCounter',
    data(): CounterData {
      return {
        count: 0,
        title: 'TypeScript Counter'
      }
    },
    methods: {
      increment(): void {
        this.count++
      },
      decrement(): void {
        this.count--
      }
    }
  })
  </script>
  
  <style scoped>
  .counter-wrapper {
    padding: 20px;
    text-align: center;
  }
  
  .counter {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }
  
  button {
    padding: 5px 10px;
  }
  </style>