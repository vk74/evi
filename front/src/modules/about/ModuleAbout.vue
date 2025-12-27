<!--
  File: ModuleAbout.vue
  Version: 1.0.0
  Description: Landing page component for displaying organization information
  Purpose: Shows information about the organization, its services and products
  Features:
  - Organization description section
  - Services and products section
  - Contacts section (optional)
  - Styled consistently with other about components
  Type: Frontend file - ModuleAbout.vue
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Initialize i18n
const { t, tm } = useI18n()

// Landing page data
const landingData = computed(() => {
  // Get services items as array using tm() for object/array translations
  let servicesItems: string[] = [];
  try {
    const items = tm('about.landing.services.items');
    // tm() should return the array directly
    if (Array.isArray(items)) {
      servicesItems = items;
    } else {
      // Fallback if not an array
      servicesItems = [];
    }
  } catch (error) {
    console.warn('[ModuleAbout] Failed to load services items:', error);
    servicesItems = [];
  }
  
  return {
    title: t('about.landing.title'),
    organization: {
      title: t('about.landing.organization.title'),
      description: t('about.landing.organization.description')
    },
    services: {
      title: t('about.landing.services.title'),
      items: servicesItems
    },
    contacts: {
      title: t('about.landing.contacts.title'),
      description: t('about.landing.contacts.description')
    }
  };
})
</script>

<template>
  <div class="about-wrapper">
    <!-- Organization Section -->
    <div class="section">
      <h2 class="section-title">{{ landingData.organization.title }}</h2>
      <div class="section-content">
        <p class="description-text">{{ landingData.organization.description }}</p>
      </div>
    </div>

    <!-- Services Section -->
    <div class="section">
      <h2 class="section-title">{{ landingData.services.title }}</h2>
      <div class="section-content">
        <div class="services-list">
          <div 
            v-for="(service, index) in landingData.services.items" 
            :key="`service-${index}`"
            class="service-item"
          >
            {{ service }}
          </div>
        </div>
      </div>
    </div>

    <!-- Contacts Section -->
    <div class="section">
      <h2 class="section-title">{{ landingData.contacts.title }}</h2>
      <div class="section-content">
        <p class="description-text">{{ landingData.contacts.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-wrapper {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 32px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(19, 84, 122, 0.3);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.description-text {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.6;
  margin: 0;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-item {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  border-left: 4px solid rgba(19, 84, 122, 0.4);
  transition: all 0.2s ease;
}

.service-item:hover {
  background-color: rgba(19, 84, 122, 0.05);
  border-left-color: rgba(19, 84, 122, 0.6);
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .about-wrapper {
    padding: 16px;
  }

  .section {
    padding: 16px;
  }

  .section-title {
    font-size: 1.25rem;
  }
}
</style>