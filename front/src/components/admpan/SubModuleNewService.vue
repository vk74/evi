<template>
  <v-container>
    <v-app-bar app>
      <template v-slot:image>
        <v-img gradient="to top right, rgba(15,70,150,.85), rgba(100,180,170,.6)"></v-img>
      </template>
      <v-spacer></v-spacer>
      <v-toolbar-title class="title-padding" style="color: white; text-align: right; margin-right: 20px;">
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
                <v-textarea
                  label="краткое описание"
                  variant="outlined"
                  rows="3"
                  hint="до 250 символов"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  label="видимость*"
                  variant="outlined"
                  density="comfortable"
                  :items="['public', 'private']"
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

          <!-- Детальная информация -->
          <v-sheet class="section-container mt-6">
            <h2 class="section-title">детальная информация</h2>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  label="приоритет*"
                  variant="outlined"
                  density="comfortable"
                  :items="['critical', 'high', 'medium', 'low']"
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

          <!-- Права доступа -->
          <v-sheet class="section-container mt-6">
            <h2 class="section-title">права доступа</h2>
            
            <!-- Группы с разрешенным доступом -->
            <v-row>
              <v-col cols="12">
                <div class="access-section">
                  <div class="d-flex align-center mb-2">
                    <span class="text-subtitle-2">группы с разрешенным доступом</span>
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn
                          variant="text"
                          icon="mdi-plus"
                          size="small"
                          class="ml-2"
                          v-bind="props"
                        ></v-btn>
                      </template>
                      <v-card min-width="300">
                        <v-card-text>
                          <v-text-field
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            placeholder="поиск группы"
                            prepend-inner-icon="mdi-magnify"
                          ></v-text-field>
                          <v-list density="compact" class="mt-2">
                            <v-list-item value="1">группа разработчиков</v-list-item>
                            <v-list-item value="2">группа тестирования</v-list-item>
                            <v-list-item value="3">группа аналитиков</v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-menu>
                  </div>
                  <div class="selected-items">
                    <v-chip
                      v-for="n in 2"
                      :key="n"
                      class="ma-1"
                      closable
                    >
                      группа {{ n }}
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
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn
                          variant="text"
                          icon="mdi-plus"
                          size="small"
                          class="ml-2"
                          v-bind="props"
                        ></v-btn>
                      </template>
                      <v-card min-width="300">
                        <v-card-text>
                          <v-text-field
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            placeholder="поиск группы"
                            prepend-inner-icon="mdi-magnify"
                          ></v-text-field>
                          <v-list density="compact" class="mt-2">
                            <v-list-item value="1">группа 1</v-list-item>
                            <v-list-item value="2">группа 2</v-list-item>
                            <v-list-item value="3">группа 3</v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-menu>
                  </div>
                  <div class="selected-items">
                    <v-chip
                      v-for="n in 2"
                      :key="n"
                      class="ma-1"
                      closable
                    >
                      группа {{ n }}
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
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn
                          variant="text"
                          icon="mdi-plus"
                          size="small"
                          class="ml-2"
                          v-bind="props"
                        ></v-btn>
                      </template>
                      <v-card min-width="300">
                        <v-card-text>
                          <v-text-field
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            placeholder="поиск пользователя"
                            prepend-inner-icon="mdi-magnify"
                          ></v-text-field>
                          <v-list density="compact" class="mt-2">
                            <v-list-item value="1">пользователь 1</v-list-item>
                            <v-list-item value="2">пользователь 2</v-list-item>
                            <v-list-item value="3">пользователь 3</v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-menu>
                  </div>
                  <div class="selected-items">
                    <v-chip
                      v-for="n in 2"
                      :key="n"
                      class="ma-1"
                      closable
                    >
                      пользователь {{ n }}
                    </v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-sheet>

          <!-- Ответственные лица -->
          <v-sheet class="section-container mt-6">
            <h2 class="section-title">ответственные лица</h2>
            <v-row>
              <v-col cols="12" md="6">
                <div class="owner-field">
                  <span class="text-subtitle-2">владелец сервиса*</span>
                  <div class="owner-content">
                    <div v-if="false" class="d-flex align-center empty-state">
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
                          <span class="text-h6">ИП</span>
                        </v-avatar>
                        <div class="owner-details ml-2">
                          <div class="owner-name">Иванов Петр</div>
                          <div class="owner-position">разработчик</div>
                        </div>
                      </div>
                      <div class="owner-actions">
                        <v-btn
                          variant="text"
                          icon="mdi-pencil"
                          size="small"
                          color="primary"
                        ></v-btn>
                        <v-btn
                          variant="text"
                          icon="mdi-delete"
                          size="small"
                          color="error"
                        ></v-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <div class="owner-field">
                  <span class="text-subtitle-2">резервный владелец</span>
                  <div class="owner-content">
                    <div class="d-flex align-center empty-state">
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
                    <div class="d-flex align-center empty-state">
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
                    <div class="d-flex align-center empty-state">
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
                    <div v-if="false" class="d-flex align-center empty-state">
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
                        <v-btn
                          variant="text"
                          icon="mdi-pencil"
                          size="small"
                          color="primary"
                        ></v-btn>
                        <v-btn
                          variant="text"
                          icon="mdi-delete"
                          size="small"
                          color="error"
                        ></v-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <div class="owner-field">
                  <span class="text-subtitle-2">поддержка 2 линии</span>
                  <div class="owner-content">
                    <div class="d-flex align-center empty-state">
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
                    <div class="d-flex align-center empty-state">
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
.title-padding {
  padding-left: 25px;
}

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
  text-transform: lowercase;
}

.tile-section-label {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 8px;
  padding-left: 4px;
}

.v-text-field,
.v-select,
.v-textarea {
  margin-bottom: 8px;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}

.access-section {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 12px;
}

.selected-items {
  min-height: 40px;
  padding: 4px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.owner-field {
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

.selected-owner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
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