
<template>
  <v-container>
    <v-app-bar app>
      <template v-slot:image>
        <v-img gradient="to top right, rgba(15,70,150,.85), rgba(100,180,170,.6)"></v-img>
      </template>
      <v-spacer></v-spacer>
      <v-toolbar-title style="color: white; text-align: right; margin-right: 20px;">
        форма для создания нового сервиса
      </v-toolbar-title>
    </v-app-bar>

          <v-card class="mt-6 form-card">
            <v-card-text>
              <v-form>

          <!-- Основная информация -->
          <v-sheet class="section-container">
            <h2 class="section-title">основная информация</h2>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  label="название сервиса*"
                  variant="outlined"
                  density="comfortable"
                  hint="от 3 до 250 символов"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  label="статус*"
                  variant="outlined"
                  density="comfortable"
                  :items="[
                    'drafted',
                    'being_developed',
                    'being_tested',
                    'non_compliant',
                    'pending_approval',
                    'in_production',
                    'under_maintenance',
                    'suspended',
                    'being_upgraded',
                    'discontinued'
                  ]"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  label="видимость*"
                  variant="outlined"
                  density="comfortable"
                  :items="['public', 'private']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  label="приоритет*"
                  variant="outlined"
                  density="comfortable"
                  :items="['critical', 'high', 'medium', 'low']"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-textarea
                  label="краткое описание"
                  variant="outlined"
                  rows="3"
                  hint="до 250 символов"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="назначение сервиса"
                  variant="outlined"
                  density="comfortable"
                  hint="до 250 символов"
                  persistent-hint
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  label="подробное описание"
                  variant="outlined"
                  rows="4"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  label="комментарии"
                  variant="outlined"
                  rows="2"
                  hint="до 250 символов"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-sheet>
          <!-- Параметры отображения -->
          <v-sheet class="section-container mt-6">
            <h2 class="section-title">параметры отображения сервиса в каталоге</h2>
            
            <!-- Общий вид -->
            <v-row>
              <v-col cols="12">
                <div class="tile-section-label">общий вид</div>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="ширина*"
                  variant="outlined"
                  type="number"
                  min="1"
                  density="comfortable"
                  hint="ширина плитки в общем виде"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="высота*"
                  variant="outlined"
                  type="number"
                  min="1"
                  density="comfortable"
                  hint="высота плитки в общем виде"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <!-- Развернутый режим -->
            <v-row class="mt-3">
              <v-col cols="12">
                <div class="tile-section-label">развернутый режим</div>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="ширина*"
                  variant="outlined"
                  type="number"
                  min="1"
                  density="comfortable"
                  hint="ширина плитки в развернутом виде"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="высота*"
                  variant="outlined"
                  type="number"
                  min="1"
                  density="comfortable"
                  hint="высота плитки в развернутом виде"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-sheet>

                    <!-- Права доступа -->
          <v-sheet class="section-container mt-6">
            <h2 class="section-title">права доступа</h2>
            
            <!-- Группы с разрешенным доступом -->
            <v-row>
              <v-col cols="12">
                <div class="access-section">
                  <div class="d-flex align-center mb-2">
                    <span class="text-subtitle-2">группы с разрешенным доступом</span>
                    <v-btn
                      variant="text"
                      icon="mdi-plus"
                      size="small"
                      class="ml-2"
                      color="rgba(0, 0, 0, 0.6)"
                    ></v-btn>
                  </div>
                  <div class="selected-items">
                    <v-chip
                      variant="outlined"
                      closable
                      class="ma-1"
                      color="rgba(0, 0, 0, 0.6)"
                    >
                      группа 1
                    </v-chip>
                    <v-chip
                      variant="outlined"
                      closable
                      class="ma-1"
                      color="rgba(0, 0, 0, 0.6)"
                    >
                      группа 2
                    </v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>

            <!-- Группы с запрещенным доступом -->
            <v-row class="mt-3">
              <v-col cols="12">
                <div class="access-section">
                  <div class="d-flex align-center mb-2">
                    <span class="text-subtitle-2">группы с запрещенным доступом</span>
                    <v-btn
                      variant="text"
                      icon="mdi-plus"
                      size="small"
                      class="ml-2"
                      color="rgba(0, 0, 0, 0.6)"
                    ></v-btn>
                  </div>
                  <div class="selected-items">
                    <v-chip
                      variant="outlined"
                      closable
                      class="ma-1"
                      color="rgba(0, 0, 0, 0.6)"
                    >
                      группа 1
                    </v-chip>
                    <v-chip
                      variant="outlined"
                      closable
                      class="ma-1"
                      color="rgba(0, 0, 0, 0.6)"
                    >
                      группа 2
                    </v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>

            <!-- Пользователи с запрещенным доступом -->
            <v-row class="mt-3">
              <v-col cols="12">
                <div class="access-section">
                  <div class="d-flex align-center mb-2">
                    <span class="text-subtitle-2">пользователи с запрещенным доступом</span>
                    <v-btn
                      variant="text"
                      icon="mdi-plus"
                      size="small"
                      class="ml-2"
                      color="rgba(0, 0, 0, 0.6)"
                    ></v-btn>
                  </div>
                  <div class="selected-items">
                    <v-chip
                      variant="outlined"
                      closable
                      class="ma-1"
                      color="rgba(0, 0, 0, 0.6)"
                    >
                      пользователь 1
                    </v-chip>
                    <v-chip
                      variant="outlined"
                      closable
                      class="ma-1"
                      color="rgba(0, 0, 0, 0.6)"
                    >
                      пользователь 2
                    </v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-sheet>                    <!-- Ответственные лица -->
          <v-sheet class="section-container mt-6">
            <h2 class="section-title">ответственные лица</h2>
            <v-row>
              <v-col cols="12" md="6">
                <div class="owner-field">
                  <span class="text-subtitle-2">владелец сервиса*</span>
                  <div class="owner-content">
                    <div v-if="false" class="empty-state">
                      <v-btn
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-account-plus"
                        class="empty-button"
                      >
                        выбрать владельца
                      </v-btn>
                    </div>
                    <div v-else class="selected-owner">
                      <div class="owner-info">
                        <v-avatar size="32" color="primary">
                          <span class="text-h6">ип</span>
                        </v-avatar>
                        <div class="owner-details ml-2">
                          <div class="owner-name">иванов петр</div>
                          <div class="owner-position">разработчик</div>
                        </div>
                      </div>
                      <div class="owner-actions">
                        <v-tooltip text="изменить" location="top">
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              variant="text"
                              icon="mdi-pencil"
                              size="small"
                              color="rgba(0, 0, 0, 0.6)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip text="удалить" location="top">
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              variant="text"
                              icon="mdi-delete"
                              size="small"
                              color="rgba(0, 0, 0, 0.6)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="owner-field">
                  <span class="text-subtitle-2">резервный владелец</span>
                  <div class="owner-content">
                    <div class="empty-state">
                      <v-btn
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-account-plus"
                        class="empty-button"
                      >
                        выбрать владельца
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <div class="owner-field">
                  <span class="text-subtitle-2">технический владелец</span>
                  <div class="owner-content">
                    <div class="empty-state">
                      <v-btn
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-account-plus"
                        class="empty-button"
                      >
                        выбрать владельца
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="owner-field">
                  <span class="text-subtitle-2">диспетчер</span>
                  <div class="owner-content">
                    <div class="empty-state">
                      <v-btn
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-account-plus"
                        class="empty-button"
                      >
                        выбрать диспетчера
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-sheet>

          <!-- Группы поддержки -->
          <v-sheet class="section-container mt-6">
            <h2 class="section-title">группы поддержки</h2>
            <v-row>
              <v-col cols="12" md="4">
                <div class="owner-field">
                  <span class="text-subtitle-2">поддержка 1 линии</span>
                  <div class="owner-content">
                    <div v-if="false" class="empty-state">
                      <v-btn
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-account-group-outline"
                        class="empty-button"
                      >
                        выбрать группу
                      </v-btn>
                    </div>
                    <div v-else class="selected-owner">
                      <div class="owner-info">
                        <v-avatar size="32" color="info">
                          <v-icon>mdi-account-group</v-icon>
                        </v-avatar>
                        <div class="owner-details ml-2">
                          <div class="owner-name">техподдержка L1</div>
                          <div class="owner-position">8 участников</div>
                        </div>
                      </div>
                      <div class="owner-actions">
                        <v-tooltip text="изменить" location="top">
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              variant="text"
                              icon="mdi-pencil"
                              size="small"
                              color="rgba(0, 0, 0, 0.6)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip text="удалить" location="top">
                          <template v-slot:activator="{ props }">
                            <v-btn
                              v-bind="props"
                              variant="text"
                              icon="mdi-delete"
                              size="small"
                              color="rgba(0, 0, 0, 0.6)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <div class="owner-field">
                  <span class="text-subtitle-2">поддержка 2 линии</span>
                  <div class="owner-content">
                    <div class="empty-state">
                      <v-btn
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-account-group-outline"
                        class="empty-button"
                      >
                        выбрать группу
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <div class="owner-field">
                  <span class="text-subtitle-2">поддержка 3 линии</span>
                  <div class="owner-content">
                    <div class="empty-state">
                      <v-btn
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-account-group-outline"
                        class="empty-button"
                      >
                        выбрать группу
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-sheet>

          <!-- Кнопки управления -->
          <v-sheet class="d-flex justify-end mt-6 pa-4">
            <v-btn
              color="grey"
              variant="outlined"
              class="mr-4"
            >
              отмена
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
            >
              создать сервис
            </v-btn>
          </v-sheet>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'SubModuleNewService',
  setup() {
    // Здесь будет логика компонента
    return {};
  }
};
</script>

<style scoped>
.form-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-container {
  padding: 16px;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.section-title {
  color: #1976d2;
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 16px;
}

.tile-section-label {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 8px;
  padding-left: 4px;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}

.access-section, .owner-field {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 12px;
}

.owner-content {
  margin-top: 8px;
}

.empty-state {
  min-height: 48px;
}

.empty-button {
  width: 100%;
}

.selected-items, .selected-owner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  min-height: 40px;
  gap: 8px; /* добавляем отступ между чипами */
}

.owner-info {
  display: flex;
  align-items: center;
}

.owner-details {
  display: flex;
  flex-direction: column;
}

.owner-name {
  font-weight: 500;
  font-size: 0.875rem;
}

.owner-position {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.owner-actions {
  display: flex;
  gap: 4px;
}
</style>