/*
* GroupEditor.vue - componen is used for setting and editing group details
*/

<script lang="ts" setup>
</script>

<template>
  <div class="module-root">
    <!-- App Bar -->
    <v-app-bar 
      flat 
      class="app-bar"
    >
      <!-- Навигация по секциям -->
      <div class="nav-section">
        <v-btn
          :class="['section-btn', { 'section-active': true }]"
          variant="text"
        >
          данные группы
        </v-btn>
        <v-btn
          :class="['section-btn']"
          variant="text"
        >
          участники группы
        </v-btn>
      </div>

      <v-spacer />

      <div class="control-buttons">
        <v-btn
          color="teal"
          variant="outlined"
          class="mr-2 control-btn"
        >
          создать группу
        </v-btn>

        <v-btn
          color="teal"
          variant="outlined"
          class="mr-2 control-btn"
        >
          обновить данные группы
        </v-btn>

        <v-btn 
          variant="outlined"
          class="control-btn"
        >
          Сбросить
        </v-btn>
      </div>

      <v-spacer />
      
      <div class="module-title">
        создание группы
      </div>
    </v-app-bar>

    <!-- Рабочая область -->
    <div class="working-area">
      <v-container class="content-container pa-0">
        <v-card flat>
          <v-form class="px-4">
            <v-row>
              <v-col cols="12">
                <v-row class="pt-3">
                  <v-col cols="12" md="6">
                    <v-text-field
                      label="Название группы"
                      variant="outlined"
                      density="comfortable"
                      counter="255"
                      required
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-select
                      label="Статус группы"
                      variant="outlined"
                      density="comfortable"
                      :items="[
                        { title: 'Активна', value: 'active' },
                        { title: 'Отключена', value: 'disabled' }
                      ]"
                      item-title="title"
                      item-value="value"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      label="Описание группы"
                      variant="outlined"
                      rows="3"
                      counter="5000"
                      no-resize
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      label="Владелец группы"
                      variant="outlined"
                      density="comfortable"
                      readonly
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.nav-section {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.section-btn {
  text-transform: none;
  font-weight: 400;
  height: 64px;
  border-radius: 0;
  color: rgba(0, 0, 0, 0.6) !important;
}

.section-active {
  border-bottom: 2px solid #009688;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87) !important;
}

.module-title {
  margin-right: 15px;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
}

.control-buttons {
  display: flex;
  align-items: center;
}

</style>