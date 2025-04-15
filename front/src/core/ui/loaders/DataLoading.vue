<!--
  File: DataLoading.vue
  Description: Generic loading indicator component
  Purpose: Provides a consistent loading indicator that can be used across the application
-->

<script setup lang="ts">
import { defineProps } from 'vue';

// Component props
interface Props {
  /**
   * Whether the component is in loading state
   */
  loading: boolean;

  /**
   * Text to display while loading
   */
  loadingText?: string;

  /**
   * Size of the loading indicator (small, medium, large)
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Color of the loading indicator
   * @default 'primary'
   */
  color?: string;

  /**
   * Whether to show a linear progress indicator instead of circular
   * @default false
   */
  linear?: boolean;

  /**
   * Whether to overlay the loading indicator on its parent
   * @default false
   */
  overlay?: boolean;

  /**
   * Height of the indicator container
   * Only applied when not in overlay mode
   */
  height?: string | number;
}

// Define props with default values
const props = withDefaults(defineProps<Props>(), {
  loadingText: 'Загрузка данных...',
  size: 'medium',
  color: 'primary',
  linear: false,
  overlay: false,
  height: 'auto',
});

// Size mappings
const sizeMap = {
  small: {
    spinner: 24,
    linear: 2,
    textClass: 'text-caption',
  },
  medium: {
    spinner: 36,
    linear: 4,
    textClass: 'text-body-2',
  },
  large: {
    spinner: 48,
    linear: 6,
    textClass: 'text-body-1',
  }
};

// Calculate the proper size values based on prop
const currentSize = sizeMap[props.size];

// Log component initialization
console.log('DataLoading component initialized');
</script>

<template>
  <div
    v-if="loading"
    :class="[
      'data-loading',
      { 'data-loading--overlay': overlay }
    ]"
    :style="{ height: overlay ? '100%' : height }"
  >
    <div class="data-loading__content">
      <v-progress-circular
        v-if="!linear"
        :size="currentSize.spinner"
        :color="color"
        indeterminate
      ></v-progress-circular>

      <v-progress-linear
        v-else
        :height="currentSize.linear"
        :color="color"
        indeterminate
      ></v-progress-linear>

      <div v-if="loadingText" :class="['data-loading__text', currentSize.textClass]">
        {{ loadingText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-loading {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-height: 80px;
}

.data-loading--overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 5;
}

.data-loading__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.data-loading__text {
  margin-top: 8px;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
}
</style>