<!--
version: 1.1.0
Frontend file ProductContacts.vue.
Purpose: Displays product owner information and specialist groups.
Filename: ProductContacts.vue

Changes in v1.1.0:
- Added isVisibleOwner and isVisibleGroups props to control visibility of owner and groups sections
- Owner contact item conditionally rendered based on isVisibleOwner prop
- Specialist groups item conditionally rendered based on isVisibleGroups prop
- Default to true if props are not provided (backward compatibility)
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  ownerFirstName?: string | null
  ownerLastName?: string | null
  specialistGroups?: string[]
  isVisibleOwner?: boolean
  isVisibleGroups?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isVisibleOwner: true,
  isVisibleGroups: true
})

const { t } = useI18n()

// Computed property for full owner name
const ownerFullName = computed(() => {
  const firstName = props.ownerFirstName?.trim() || ''
  const lastName = props.ownerLastName?.trim() || ''
  if (!firstName && !lastName) {
    return null
  }
  return [firstName, lastName].filter(Boolean).join(' ') || null
})

// Computed property for specialist groups list
const hasSpecialistGroups = computed(() => {
  return props.specialistGroups && props.specialistGroups.length > 0
})
</script>

<template>
  <div class="product-contacts">
    <div class="contacts-block">
      <div v-if="isVisibleOwner" class="contact-item">
        <div class="contact-label">{{ t('catalog.productDetails.contactInfo.owner') }}</div>
        <div class="contact-value">
          {{ ownerFullName || t('catalog.productDetails.contactInfo.notSpecified') }}
        </div>
      </div>
      
      <div v-if="isVisibleGroups" class="contact-item">
        <div class="contact-label">{{ t('catalog.productDetails.contactInfo.specialistGroups') }}</div>
        <div class="contact-value">
          <div v-if="hasSpecialistGroups" class="groups-list">
            <div v-for="(group, index) in specialistGroups" :key="index" class="group-item">
              {{ group }}
            </div>
          </div>
          <div v-else class="no-groups">
            {{ t('catalog.productDetails.contactInfo.noGroups') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-contacts {
  padding: 8px 0;
}

.contacts-block {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  font-size: 14px;
}

.contact-value {
  color: rgba(0, 0, 0, 0.6);
  font-size: 14px;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
  padding: 4px 0;
}

.no-groups {
  font-style: italic;
  color: rgba(0, 0, 0, 0.4);
}
</style>

