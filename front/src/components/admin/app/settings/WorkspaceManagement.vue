<!--
  File: WorkspaceManagement.vue
  Description: Workspace management settings component
  Purpose: Configure workspace-related settings, layouts, and collaboration features
  
  Updated: Removed card borders and added dividers between sections
-->

<script setup lang="ts">
import { ref } from 'vue';

// Workspace appearance
const workspaceLayout = ref('Standard');
const layoutOptions = ['Standard', 'Compact', 'Expanded', 'Custom'];
const sidebarPosition = ref('Left');
const positionOptions = ['Left', 'Right', 'Hidden'];
const defaultPanel = ref('Dashboard');
const panelOptions = ['Dashboard', 'Projects', 'Analytics', 'Calendar'];
const compactMode = ref(false);
const rememberLayout = ref(true);

// Collaboration settings
const enableCollaboration = ref(true);
const maxCollaborators = ref(10);
const showUserCursors = ref(true);
const showEditHistory = ref(true);
const conflictResolution = ref('Last Write Wins');
const conflictOptions = [
  'Last Write Wins',
  'First Write Wins',
  'Merge Changes',
  'Prompt User'
];

// Workspace templates
const workspaceTemplates = ref([
  {
    id: 1,
    name: 'Blank Workspace',
    description: 'Start with an empty workspace',
    icon: 'mdi-file-outline'
  },
  {
    id: 2,
    name: 'Project Management',
    description: 'Optimized for managing projects and tasks',
    icon: 'mdi-clipboard-text-outline'
  },
  {
    id: 3,
    name: 'Data Analysis',
    description: 'Set up for data analysis and visualization',
    icon: 'mdi-chart-bar'
  },
  {
    id: 4,
    name: 'Development',
    description: 'Tailored for software development',
    icon: 'mdi-code-braces'
  }
]);
const showTemplateSelection = ref(true);

// Widgets
const availableWidgets = ref([
  {
    id: 1,
    name: 'Calendar',
    icon: 'mdi-calendar',
    enabled: true
  },
  {
    id: 2,
    name: 'Task List',
    icon: 'mdi-format-list-checks',
    enabled: true
  },
  {
    id: 3,
    name: 'Notes',
    icon: 'mdi-note-text-outline',
    enabled: true
  },
  {
    id: 4,
    name: 'Analytics',
    icon: 'mdi-chart-line',
    enabled: true
  },
  {
    id: 5,
    name: 'Activity Feed',
    icon: 'mdi-rss',
    enabled: false
  },
  {
    id: 6,
    name: 'Team Chat',
    icon: 'mdi-message-text-outline',
    enabled: true
  }
]);

const defaultWidgets = ref([
  {
    id: 1,
    name: 'Calendar',
    icon: 'mdi-calendar'
  },
  {
    id: 2,
    name: 'Task List',
    icon: 'mdi-format-list-checks'
  },
  {
    id: 4,
    name: 'Analytics',
    icon: 'mdi-chart-line'
  }
]);

// Data & storage
const storageQuota = ref(10);
const autoSaveInterval = ref('1 minute');
const autoSaveIntervals = [
  'Off',
  '30 seconds',
  '1 minute',
  '5 minutes',
  '15 minutes',
  '30 minutes'
];
const keepRevisionHistory = ref(true);
const revisionRetention = ref('30 days');
const revisionRetentionOptions = [
  '7 days',
  '14 days',
  '30 days',
  '90 days',
  '1 year',
  'Forever'
];
</script>

<template>
  <div class="settings-section workspace-management">
    <h2 class="text-h6 mb-4">Workspace Management</h2>
    
    <!-- Workspace Appearance -->
    <v-card class="mb-4 pa-4 section-card" elevation="0">
      <v-card-title class="text-subtitle-1 px-0">
        <v-icon start icon="mdi-palette-outline" class="mr-2"></v-icon>
        Workspace Appearance
      </v-card-title>
      <v-card-text class="px-0">
        <v-select
          v-model="workspaceLayout"
          :items="layoutOptions"
          label="Default Layout"
          variant="outlined"
          density="comfortable"
        ></v-select>
        
        <v-row class="mt-4">
          <v-col cols="12" sm="6">
            <v-select
              v-model="sidebarPosition"
              :items="positionOptions"
              label="Sidebar Position"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-select
              v-model="defaultPanel"
              :items="panelOptions"
              label="Default Panel"
              variant="outlined"
              density="comfortable"
            ></v-select>
          </v-col>
        </v-row>
        
        <v-checkbox
          v-model="compactMode"
          label="Compact mode"
          color="primary"
          hide-details
          class="mt-4"
        ></v-checkbox>
        
        <v-checkbox
          v-model="rememberLayout"
          label="Remember user layout preferences"
          color="primary"
          hide-details
          class="mt-2"
        ></v-checkbox>
      </v-card-text>
      <v-divider class="mt-4"></v-divider>
    </v-card>
    
    <!-- Collaboration -->
    <v-card class="mb-4 pa-4 section-card" elevation="0">
      <v-card-title class="text-subtitle-1 px-0">
        <v-icon start icon="mdi-account-group-outline" class="mr-2"></v-icon>
        Collaboration
      </v-card-title>
      <v-card-text class="px-0">
        <v-switch
          v-model="enableCollaboration"
          color="primary"
          label="Enable workspace collaboration"
          hide-details
        ></v-switch>
        
        <v-slider
          v-model="maxCollaborators"
          label="Maximum collaborators per workspace"
          min="1"
          max="50"
          step="1"
          thumb-label
          class="mt-4"
          :disabled="!enableCollaboration"
        ></v-slider>
        
        <v-switch
          v-model="showUserCursors"
          color="primary"
          label="Show user cursors in real-time"
          hide-details
          class="mt-4"
          :disabled="!enableCollaboration"
        ></v-switch>
        
        <v-switch
          v-model="showEditHistory"
          color="primary"
          label="Show edit history"
          hide-details
          class="mt-2"
          :disabled="!enableCollaboration"
        ></v-switch>
        
        <v-select
          v-model="conflictResolution"
          :items="conflictOptions"
          label="Conflict Resolution Strategy"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          :disabled="!enableCollaboration"
        ></v-select>
      </v-card-text>
      <v-divider class="mt-4"></v-divider>
    </v-card>
    
    <!-- Workspace Templates -->
    <v-card class="mb-4 pa-4 section-card" elevation="0">
      <v-card-title class="d-flex align-center text-subtitle-1 px-0">
        <v-icon start icon="mdi-checkbox-multiple-blank-outline" class="mr-2"></v-icon>
        Workspace Templates
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
      <v-card-text class="px-0">
        <v-list select-strategy="single-select" class="pa-0 bg-transparent">
          <v-list-item
            v-for="template in workspaceTemplates"
            :key="template.id"
            :value="template.id"
            :subtitle="template.description"
            rounded="lg"
            class="mb-1"
          >
            <template v-slot:prepend>
              <v-icon :icon="template.icon" class="me-3" color="primary"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ template.name }}
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
                  <v-list-item title="Duplicate"></v-list-item>
                  <v-list-item title="Delete"></v-list-item>
                  <v-list-item title="Set as default"></v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
        
        <v-switch
          v-model="showTemplateSelection"
          color="primary"
          label="Show template selection on workspace creation"
          hide-details
          class="mt-4"
        ></v-switch>
      </v-card-text>
      <v-divider class="mt-4"></v-divider>
    </v-card>
    
    <!-- Widgets & Modules -->
    <v-card class="mb-4 pa-4 section-card" elevation="0">
      <v-card-title class="text-subtitle-1 px-0">
        <v-icon start icon="mdi-view-dashboard-outline" class="mr-2"></v-icon>
        Widgets & Modules
      </v-card-title>
      <v-card-text class="px-0">
        <v-list class="pa-0 bg-transparent">
          <v-list-subheader class="pl-0">Available Widgets</v-list-subheader>
          
          <v-list-item
            v-for="widget in availableWidgets"
            :key="widget.id"
            rounded="lg"
            class="mb-1"
          >
            <template v-slot:prepend>
              <v-icon :icon="widget.icon" class="me-3"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ widget.name }}
            </template>
            
            <template v-slot:append>
              <v-switch
                v-model="widget.enabled"
                color="primary"
                hide-details
              ></v-switch>
            </template>
          </v-list-item>
        </v-list>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex align-center mb-4">
          <div class="text-subtitle-2">Default Dashboard Widgets</div>
          <v-spacer></v-spacer>
          <v-btn
            size="small"
            color="primary"
            variant="text"
            prepend-icon="mdi-cog-outline"
          >
            Configure
          </v-btn>
        </div>
        
        <v-chip-group>
          <v-chip
            v-for="widget in defaultWidgets"
            :key="widget.id"
            closable
          >
            <v-icon start :icon="widget.icon"></v-icon>
            {{ widget.name }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
      <v-divider class="mt-4"></v-divider>
    </v-card>
    
    <!-- Data & Storage -->
    <v-card class="mb-4 pa-4 section-card" elevation="0">
      <v-card-title class="text-subtitle-1 px-0">
        <v-icon start icon="mdi-database-outline" class="mr-2"></v-icon>
        Data & Storage
      </v-card-title>
      <v-card-text class="px-0">
        <v-slider
          v-model="storageQuota"
          label="Storage Quota per Workspace (GB)"
          min="1"
          max="100"
          step="1"
          thumb-label
        ></v-slider>
        
        <div class="d-flex justify-space-between mb-4 mt-4">
          <div>
            <div class="text-body-1">Auto-Save Frequency</div>
            <div class="text-caption text-medium-emphasis">How often to automatically save workspace changes</div>
          </div>
          <v-select
            v-model="autoSaveInterval"
            :items="autoSaveIntervals"
            variant="outlined"
            density="compact"
            hide-details
            class="max-width-select"
          ></v-select>
        </div>
        
        <v-switch
          v-model="keepRevisionHistory"
          color="primary"
          label="Keep revision history"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-select
          v-model="revisionRetention"
          :items="revisionRetentionOptions"
          label="Revision History Retention"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          :disabled="!keepRevisionHistory"
        ></v-select>
        
        <v-btn
          block
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete-outline"
          class="mt-6"
        >
          Clear All Workspace Cache
        </v-btn>
      </v-card-text>
      <v-divider class="mt-4"></v-divider>
    </v-card>
  </div>
</template>

<style scoped>
/* Styling for section cards */
.section-card {
  background-color: transparent !important;
  transition: background-color 0.2s ease;
}

.section-card:hover {
  background-color: rgba(0, 0, 0, 0.02) !important;
}

/* Remove default padding from v-card */
.section-card :deep(.v-card-text) {
  padding-bottom: 0;
}

/* Width constraint for select inputs in flex layouts */
.max-width-select {
  max-width: 150px;
}

/* Make v-list items more distinct when hovered */
:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

/* Style the dividers to be subtle */
:deep(.v-divider) {
  opacity: 0.7;
}
</style>