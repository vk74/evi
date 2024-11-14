<template>
  <v-container fluid>
    <v-row>
      <v-navigation-drawer 
        v-model="drawer" 
        app 
        :expand-on-hover="!isPinned"
        :rail="!isPinned"
        elevation="5"
        class="drawer-container"
      >
        <!-- Область-кнопка на всю ширину без иконки -->
        <div class="full-width-toggle" @click="toggleDrawerPin"></div>

        <!-- Оригинальная кнопка справа -->
        <div class="chevron-button">
          <v-btn
            variant="text"
            @click="toggleDrawerPin"
            :icon="isPinned ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right'"
            size="small"
            class="chevron-icon"
            color="grey-darken-1"
          ></v-btn>
        </div>
      
        <v-list density="compact" nav class="navigation-list">
          <v-list-group>
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                class="nav-item"
                prepend-icon="mdi-room-service"
                :title="$t('admin.nav.services.main')"
                :active="activeSubModule === 'SubModuleServiceAdmin'"
                @click="setActiveSubModule('SubModuleServiceAdmin', 'all')"
              >
                <v-list-item-title v-if="!drawer" class="hidden-title">
                  {{ $t('admin.nav.services.main') }}
                </v-list-item-title>
              </v-list-item>
            </template>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdmin', 'all')"
              class="sub-nav-item"
              value="allServices"
              :active="currentFilter === 'all'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-view-list</v-icon>
              </template>
              <v-list-item-title>{{ $t('admin.nav.services.items.all') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdmin', 'active')"
              class="sub-nav-item"
              value="activeServices"
              :active="currentFilter === 'active'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-check-circle</v-icon>
              </template>
              <v-list-item-title>{{ $t('admin.nav.services.items.active') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdmin', 'planned')"
              class="sub-nav-item"
              value="plannedServices"
              :active="currentFilter === 'planned'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-calendar-clock</v-icon>
              </template>
              <v-list-item-title>{{ $t('admin.nav.services.items.planned') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdmin', 'deactivated')"
              class="sub-nav-item"
              value="deactivatedServices"
              :active="currentFilter === 'deactivated'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-close-circle</v-icon>
              </template>
              <v-list-item-title>{{ $t('admin.nav.services.items.deactivated') }}</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <v-list-item 
            @click="setActiveSubModule('SubModuleUserAdmin')" 
            class="nav-item" 
            prepend-icon="mdi-account" 
            :title="$t('admin.nav.users.main')"
            value="userAdmin"
            :active="activeSubModule === 'SubModuleUserAdmin'"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('admin.nav.users.main') }}
            </v-list-item-title>
          </v-list-item>

          <v-list-item 
            @click="setActiveSubModule('SubModuleAppAdmin')" 
            class="nav-item" 
            prepend-icon="mdi-application" 
            :title="$t('admin.nav.settings.main')"
            value="appAdmin"
            :active="activeSubModule === 'SubModuleAppAdmin'"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('admin.nav.settings.main') }}
            </v-list-item-title>
          </v-list-item>

          <v-divider class="border-opacity-25"></v-divider>
        </v-list>
      </v-navigation-drawer>
      
      <v-col cols="11">
        <component :is="currentSubModule" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, defineAsyncComponent } from 'vue';
import { useAdminStore } from '@/state/adminstate';
import { useI18n } from 'vue-i18n';

const SubModuleServiceAdmin = defineAsyncComponent(() => import('./SubModuleServiceAdmin.vue'));
const SubModuleUserAdmin = defineAsyncComponent(() => import('./SubModuleUserAdmin.vue'));
const SubModuleAppAdmin = defineAsyncComponent(() => import('./SubModuleAppAdmin.vue'));
const SubModuleServiceEditor = defineAsyncComponent(() => import('./SubModuleServiceEditor.vue'));

export default {
  name: 'ModuleAdmin',
  components: {
    SubModuleServiceAdmin,
    SubModuleUserAdmin,
    SubModuleAppAdmin,
    SubModuleServiceEditor,
  },
  setup() {
    const adminStore = useAdminStore();
    const { t } = useI18n();
    const drawer = ref(true);
    const currentFilter = ref('all');

    const activeSubModule = computed(() => adminStore.activeSubModule);
    const isPinned = computed(() => adminStore.isPinned);
    
    const currentSubModule = computed(() => {
      switch(activeSubModule.value) {
        case 'SubModuleServiceAdmin':
          return SubModuleServiceAdmin;
        case 'SubModuleUserAdmin':
          return SubModuleUserAdmin;
        case 'SubModuleAppAdmin':
          return SubModuleAppAdmin;
        case 'SubModuleServiceEditor':
          return SubModuleServiceEditor;
        default:
          return SubModuleServiceAdmin;
      }
    });

    const setActiveSubModule = (module, filter = null) => {
      adminStore.setActiveSubModule(module);
      if (filter) {
        currentFilter.value = filter;
      }
    };

    const toggleDrawerPin = () => {
      adminStore.setIsPinned(!isPinned.value);
    };

    return {
      activeSubModule,
      currentSubModule,
      setActiveSubModule,
      drawer,
      isPinned,
      toggleDrawerPin,
      currentFilter,
      t
    };
  },
};
</script>

<style scoped>
.drawer-container {
  position: relative;
}

.full-width-toggle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background-color: rgb(var(--v-theme-surface));
  cursor: pointer;
  z-index: 99;
  transition: background-color 0.2s ease;
}

.full-width-toggle:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.chevron-button {
  position: absolute;
  right: -16px;
  top: 0px;
  z-index: 100;
}

.chevron-icon {
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  border-radius: 0 4px 4px 0;
  height: 32px;
  width: 24px;
  padding: 0;
  opacity: 0.6;
}

.navigation-list {
  margin-top: 48px;
}

.nav-item {
  min-height: 56px;
}

.sub-nav-item {
  min-height: 40px;
  padding-left: 8px !important;
}

.sub-icon {
  margin-left: 8px !important;
}

:deep(.v-list--rail) {
  .sub-nav-item {
    padding-left: 0 !important;
    
    .sub-icon {
      margin-left: 8px !important;
      opacity: 1 !important;
    }
  }
}

.v-list-item__icon {
  min-width: 56px;
}

.v-list-item__content {
  align-items: center;
}

.hidden-title {
  display: none;
}
</style>