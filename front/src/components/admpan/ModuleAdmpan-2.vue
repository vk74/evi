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
                :title="$t('navigation.drawer.services.main')"
                :active="activeSubModule === 'SubModuleServiceAdm'"
                @click="setActiveSubModule('SubModuleServiceAdm', 'all')"
              >
                <v-list-item-title v-if="!drawer" class="hidden-title">
                  {{ $t('navigation.drawer.services.main') }}
                </v-list-item-title>
              </v-list-item>
            </template>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdm', 'all')"
              class="sub-nav-item"
              value="allServices"
              :active="currentFilter === 'all'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-view-list</v-icon>
              </template>
              <v-list-item-title>{{ $t('navigation.drawer.services.all') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdm', 'active')"
              class="sub-nav-item"
              value="activeServices"
              :active="currentFilter === 'active'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-check-circle</v-icon>
              </template>
              <v-list-item-title>{{ $t('navigation.drawer.services.active') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdm', 'planned')"
              class="sub-nav-item"
              value="plannedServices"
              :active="currentFilter === 'planned'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-calendar-clock</v-icon>
              </template>
              <v-list-item-title>{{ $t('navigation.drawer.services.planned') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              @click="setActiveSubModule('SubModuleServiceAdm', 'deactivated')"
              class="sub-nav-item"
              value="deactivatedServices"
              :active="currentFilter === 'deactivated'"
            >
              <template v-slot:prepend>
                <v-icon size="small" class="sub-icon">mdi-close-circle</v-icon>
              </template>
              <v-list-item-title>{{ $t('navigation.drawer.services.deactivated') }}</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <v-list-item 
            @click="setActiveSubModule('SubModuleUserAdm')" 
            class="nav-item" 
            prepend-icon="mdi-account" 
            :title="$t('navigation.drawer.users.main')"
            value="userAdmin"
            :active="activeSubModule === 'SubModuleUserAdm'"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('navigation.drawer.users.main') }}
            </v-list-item-title>
          </v-list-item>

          <v-list-item 
            @click="setActiveSubModule('SubModuleAppAdm')" 
            class="nav-item" 
            prepend-icon="mdi-application" 
            :title="$t('navigation.drawer.settings.main')"
            value="appAdmin"
            :active="activeSubModule === 'SubModuleAppAdm'"
          >
            <v-list-item-title v-if="!drawer" class="hidden-title">
              {{ $t('navigation.drawer.settings.main') }}
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
import { useAdmpanStore } from '@/state/admpanstate';
import { useI18n } from 'vue-i18n';

const SubModuleServiceAdm = defineAsyncComponent(() => import('./SubModuleServiceAdm.vue'));
const SubModuleUserAdm = defineAsyncComponent(() => import('./SubModuleUserAdm.vue'));
const SubModuleAppAdm = defineAsyncComponent(() => import('./SubModuleAppAdm.vue'));
const SubModuleNewService = defineAsyncComponent(() => import('./SubModuleNewService.vue'));

export default {
  name: 'ModuleAdmpan',
  components: {
    SubModuleServiceAdm,
    SubModuleUserAdm,
    SubModuleAppAdm,
    SubModuleNewService,
  },
  setup() {
    const admpanStore = useAdmpanStore();
    const { t } = useI18n();
    const drawer = ref(true);
    const currentFilter = ref('all');

    const activeSubModule = computed(() => admpanStore.activeSubModule);
    const isPinned = computed(() => admpanStore.isPinned);
    
    const currentSubModule = computed(() => {
      switch(activeSubModule.value) {
        case 'SubModuleServiceAdm':
          return SubModuleServiceAdm;
        case 'SubModuleUserAdm':
          return SubModuleUserAdm;
        case 'SubModuleAppAdm':
          return SubModuleAppAdm;
        case 'SubModuleNewService':
          return SubModuleNewService;
        default:
          return SubModuleServiceAdm;
      }
    });

    const setActiveSubModule = (module, filter = null) => {
      admpanStore.setActiveSubModule(module);
      if (filter) {
        currentFilter.value = filter;
      }
    };

    const toggleDrawerPin = () => {
      admpanStore.setIsPinned(!isPinned.value);
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