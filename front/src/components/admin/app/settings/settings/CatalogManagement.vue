<!--
  File: CatalogManagement.vue
  Description: Catalog management settings component
  Purpose: Configure catalog-related settings, categories, taxonomies, and display options
-->

<template>
  <div class="settings-section">
    <h2 class="text-h6 mb-4">Catalog Management</h2>
    
    <!-- Display Settings -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-eye-outline" class="mr-2"></v-icon>
        Display Settings
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="defaultView"
          :items="viewTypes"
          label="Default View Type"
          variant="outlined"
          density="comfortable"
        ></v-select>
        
        <v-select
          v-model="itemsPerPage"
          :items="itemsPerPageOptions"
          label="Items Per Page"
          variant="outlined"
          density="comfortable"
          class="mt-4"
        ></v-select>
        
        <v-select
          v-model="sortOrder"
          :items="sortOptions"
          label="Default Sort Order"
          variant="outlined"
          density="comfortable"
          class="mt-4"
        ></v-select>
        
        <v-switch
          v-model="showOutOfStock"
          color="primary"
          label="Show out-of-stock items"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-switch
          v-model="showFeaturedFirst"
          color="primary"
          label="Show featured items first"
          hide-details
          class="mt-2"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Category Management -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="d-flex align-center text-subtitle-1">
        <v-icon start icon="mdi-tag-multiple-outline" class="mr-2"></v-icon>
        Categories
        <v-spacer></v-spacer>
        <v-btn
          size="small"
          color="primary"
          variant="text"
          prepend-icon="mdi-plus"
        >
          Add
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-list lines="two">
          <v-list-item
            v-for="category in categories"
            :key="category.id"
            :subtitle="`${category.itemCount} items`"
          >
            <template v-slot:prepend>
              <v-icon :icon="category.icon" class="me-3" color="primary"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ category.name }}
            </template>
            
            <template v-slot:append>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    v-bind="props"
                  ></v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item title="Edit"></v-list-item>
                  <v-list-item title="Delete"></v-list-item>
                  <v-list-item title="View items"></v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
        
        <v-switch
          v-model="enableNestedCategories"
          color="primary"
          label="Enable nested categories"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-select
          v-model="categoryDepth"
          :items="categoryDepthOptions"
          label="Maximum Category Nesting Depth"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          :disabled="!enableNestedCategories"
        ></v-select>
      </v-card-text>
    </v-card>
    
    <!-- Product Attributes -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="d-flex align-center text-subtitle-1">
        <v-icon start icon="mdi-format-list-bulleted" class="mr-2"></v-icon>
        Product Attributes
        <v-spacer></v-spacer>
        <v-btn
          size="small"
          color="primary"
          variant="text"
          prepend-icon="mdi-plus"
        >
          Add
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="attribute in productAttributes"
            :key="attribute.id"
          >
            <template v-slot:prepend>
              <v-icon v-if="attribute.type === 'text'" icon="mdi-format-text" class="me-3"></v-icon>
              <v-icon v-else-if="attribute.type === 'number'" icon="mdi-numeric" class="me-3"></v-icon>
              <v-icon v-else-if="attribute.type === 'boolean'" icon="mdi-toggle-switch-outline" class="me-3"></v-icon>
              <v-icon v-else-if="attribute.type === 'multi'" icon="mdi-format-list-checkbox" class="me-3"></v-icon>
              <v-icon v-else icon="mdi-checkbox-blank-circle-outline" class="me-3"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ attribute.name }}
            </template>
            
            <template v-slot:subtitle>
              {{ attribute.type.charAt(0).toUpperCase() + attribute.type.slice(1) }}
            </template>
            
            <template v-slot:append>
              <v-switch
                v-model="attribute.enabled"
                color="primary"
                hide-details
              ></v-switch>
            </template>
          </v-list-item>
        </v-list>
        
        <v-switch
          v-model="useAttributesForFiltering"
          color="primary"
          label="Use attributes for filtering"
          hide-details
          class="mt-4"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Import/Export -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-database-import-outline" class="mr-2"></v-icon>
        Import & Export
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">Import</v-card-title>
              <v-card-text>
                <v-select
                  v-model="importFormat"
                  :items="fileFormats"
                  label="Import Format"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
                
                <v-file-input
                  label="Upload file"
                  variant="outlined"
                  density="comfortable"
                  accept=".csv,.xml,.json"
                  prepend-icon="mdi-file-upload-outline"
                  class="mt-4"
                ></v-file-input>
                
                <v-btn
                  block
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-database-import"
                  class="mt-4"
                >
                  Import Catalog
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">Export</v-card-title>
              <v-card-text>
                <v-select
                  v-model="exportFormat"
                  :items="fileFormats"
                  label="Export Format"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
                
                <v-checkbox
                  v-model="exportImages"
                  label="Include images"
                  color="primary"
                  hide-details
                  class="mt-4"
                ></v-checkbox>
                
                <v-btn
                  block
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-database-export"
                  class="mt-4"
                >
                  Export Catalog
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Display settings
const defaultView = ref('Grid');
const viewTypes = ['Grid', 'List', 'Table'];
const itemsPerPage = ref('24');
const itemsPerPageOptions = ['12', '24', '36', '48', '96'];
const sortOrder = ref('Newest first');
const sortOptions = [
  'Newest first',
  'Oldest first',
  'Price: low to high',
  'Price: high to low',
  'Name: A to Z',
  'Name: Z to A',
  'Most popular'
];
const showOutOfStock = ref(true);
const showFeaturedFirst = ref(true);

// Category settings
const categories = ref([
  {
    id: 1,
    name: 'Electronics',
    icon: 'mdi-laptop',
    itemCount: 128
  },
  {
    id: 2,
    name: 'Clothing',
    icon: 'mdi-tshirt-crew-outline',
    itemCount: 256
  },
  {
    id: 3,
    name: 'Home & Garden',
    icon: 'mdi-sofa-outline',
    itemCount: 193
  },
  {
    id: 4,
    name: 'Books',
    icon: 'mdi-book-open-variant',
    itemCount: 87
  }
]);
const enableNestedCategories = ref(true);
const categoryDepth = ref('3');
const categoryDepthOptions = ['1', '2', '3', '4', '5'];

// Product attributes
const productAttributes = ref([
  {
    id: 1,
    name: 'Color',
    type: 'multi',
    enabled: true
  },
  {
    id: 2,
    name: 'Size',
    type: 'multi',
    enabled: true
  },
  {
    id: 3,
    name: 'Weight',
    type: 'number',
    enabled: true
  },
  {
    id: 4,
    name: 'Material',
    type: 'text',
    enabled: true
  },
  {
    id: 5,
    name: 'Is Featured',
    type: 'boolean',
    enabled: true
  }
]);
const useAttributesForFiltering = ref(true);

// Import/Export settings
const importFormat = ref('CSV');
const exportFormat = ref('CSV');
const fileFormats = ['CSV', 'XML', 'JSON'];
const exportImages = ref(true);
</script>

<style scoped>
.settings-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
</style>