<!--
  File: WorkspaceManagement.vue
  Description: Workspace management settings component
  Purpose: Configure workspace-related settings, layouts, and collaboration features
  
  Updated: Replaced card containers with div sections and dividers,
  standardized color scheme to teal-darken-2, and improved section spacing for consistency
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
  <div class="workspace-management-container">
    <h2 class="text-h6 mb-4">workspace management</h2>
    
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4 mt-2"
    >
      компонент находится в разработке
    </v-alert>

    <!-- Workspace Appearance -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-palette-outline" class="mr-2"></v-icon>
        workspace appearance
      </div>
      
      <div class="section-content">
        <v-select
          v-model="workspaceLayout"
          :items="layoutOptions"
          label="default layout"
          variant="outlined"
          density="comfortable"
          color="teal-darken-2"
          style="max-width: 200px;"
        ></v-select>
        
        <v-row class="mt-4">
          <v-col cols="12" sm="6">
            <v-select
              v-model="sidebarPosition"
              :items="positionOptions"
              label="sidebar position"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="6">
            <v-select
              v-model="defaultPanel"
              :items="panelOptions"
              label="default panel"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
            ></v-select>
          </v-col>
        </v-row>
        
        <v-checkbox
          v-model="compactMode"
          label="compact mode"
          color="teal-darken-2"
          hide-details
          class="mt-4"
        ></v-checkbox>
        
        <v-checkbox
          v-model="rememberLayout"
          label="remember user layout preferences"
          color="teal-darken-2"
          hide-details
          class="mt-2"
        ></v-checkbox>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Collaboration -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-account-group-outline" class="mr-2"></v-icon>
        collaboration
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="enableCollaboration"
          color="teal-darken-2"
          label="enable workspace collaboration"
          hide-details
        ></v-switch>
        
        <v-slider
          v-model="maxCollaborators"
          label="maximum collaborators per workspace"
          min="1"
          max="50"
          step="1"
          thumb-label
          class="mt-4"
          :disabled="!enableCollaboration"
          color="teal-darken-2"
        ></v-slider>
        
        <v-switch
          v-model="showUserCursors"
          color="teal-darken-2"
          label="show user cursors in real-time"
          hide-details
          class="mt-4"
          :disabled="!enableCollaboration"
        ></v-switch>
        
        <v-switch
          v-model="showEditHistory"
          color="teal-darken-2"
          label="show edit history"
          hide-details
          class="mt-2"
          :disabled="!enableCollaboration"
        ></v-switch>
        
        <v-select
          v-model="conflictResolution"
          :items="conflictOptions"
          label="conflict resolution strategy"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          :disabled="!enableCollaboration"
          color="teal-darken-2"
          style="max-width: 200px;"
        ></v-select>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Workspace Templates -->
    <div class="settings-section mb-4">
      <div class="section-title d-flex align-center text-subtitle-1 mb-4">
        <v-icon start icon="mdi-checkbox-multiple-blank-outline" class="mr-2"></v-icon>
        workspace templates
        <v-spacer></v-spacer>
        <v-btn
          size="small"
          color="teal-darken-2"
          variant="text"
          prepend-icon="mdi-plus"
        >
          add
        </v-btn>
      </div>
      
      <div class="section-content">
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
              <v-icon :icon="template.icon" class="me-3" color="teal-darken-2"></v-icon>
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
                    color="teal-darken-2"
                  ></v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item title="edit"></v-list-item>
                  <v-list-item title="duplicate"></v-list-item>
                  <v-list-item title="delete"></v-list-item>
                  <v-list-item title="set as default"></v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
        
        <v-switch
          v-model="showTemplateSelection"
          color="teal-darken-2"
          label="show template selection on workspace creation"
          hide-details
          class="mt-4"
        ></v-switch>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Widgets & Modules -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-view-dashboard-outline" class="mr-2"></v-icon>
        widgets & modules
      </div>
      
      <div class="section-content">
        <v-list class="pa-0 bg-transparent">
          <v-list-subheader class="pl-0 text-lowercase">available widgets</v-list-subheader>
          
          <v-list-item
            v-for="widget in availableWidgets"
            :key="widget.id"
            rounded="lg"
            class="mb-1"
          >
            <template v-slot:prepend>
              <v-icon :icon="widget.icon" class="me-3" color="teal-darken-2"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ widget.name }}
            </template>
            
            <template v-slot:append>
              <v-switch
                v-model="widget.enabled"
                color="teal-darken-2"
                hide-details
              ></v-switch>
            </template>
          </v-list-item>
        </v-list>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex align-center mb-4">
          <div class="text-subtitle-2 text-lowercase">default dashboard widgets</div>
          <v-spacer></v-spacer>
          <v-btn
            size="small"
            color="teal-darken-2"
            variant="text"
            prepend-icon="mdi-cog-outline"
          >
            configure
          </v-btn>
        </div>
        
        <v-chip-group>
          <v-chip
            v-for="widget in defaultWidgets"
            :key="widget.id"
            closable
            color="teal-darken-2"
            variant="outlined"
          >
            <v-icon start :icon="widget.icon"></v-icon>
            {{ widget.name }}
          </v-chip>
        </v-chip-group>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Data & Storage -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-database-outline" class="mr-2"></v-icon>
        data & storage
      </div>
      
      <div class="section-content">
        <v-slider
          v-model="storageQuota"
          :label="`storage quota per workspace: ${storageQuota} gb`"
          min="1"
          max="100"
          step="1"
          thumb-label
          color="teal-darken-2"
        ></v-slider>
        
        <div class="d-flex justify-space-between mb-4 mt-4">
          <div>
            <div class="text-body-1">auto-save frequency</div>
            <div class="text-caption text-medium-emphasis">how often to automatically save workspace changes</div>
          </div>
          <v-select
            v-model="autoSaveInterval"
            :items="autoSaveIntervals"
            variant="outlined"
            density="compact"
            hide-details
            class="max-width-select"
            color="teal-darken-2"
          ></v-select>
        </div>
        
        <v-switch
          v-model="keepRevisionHistory"
          color="teal-darken-2"
          label="keep revision history"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-select
          v-model="revisionRetention"
          :items="revisionRetentionOptions"
          label="revision history retention"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          :disabled="!keepRevisionHistory"
          color="teal-darken-2"
          style="max-width: 200px;"
        ></v-select>
        
        <v-btn
          block
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete-outline"
          class="mt-6"
        >
          clear all workspace cache
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-management-container {
  /* Base container styling */
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.section-title {
  font-weight: 500;
}

/* Make dividers more subtle */
:deep(.v-divider) {
  opacity: 0.7;
}

/* Width constraint for select inputs in flex layouts */
.max-width-select {
  max-width: 150px;
}

/* Make v-list items more distinct when hovered */
:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>