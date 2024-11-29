<!--
  Компонент для создания и редактирования групп пользователей.
  Поддерживает два режима работы:
  - Создание новой группы
  - Редактирование существующей группы
  
  Позволяет управлять всеми параметрами группы и списком участников.
-->
<template>
    <v-container>
      <!-- Заголовок формы -->
      <v-row>
        <v-col>
          <h2 class="text-h5 font-weight-light mb-6">{{ isEditMode ? 'редактирование группы' : 'создание новой группы' }}</h2>
        </v-col>
      </v-row>
  
      <!-- Форма -->
      <v-form ref="form">
        <!-- основная информация -->
        <div class="form-section">
          <h3 class="text-h6 font-weight-regular text-grey-darken-1 mb-4">основная информация</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="groupData.group_name"
                label="название группы*"
                :rules="[v => !!v || 'название группы обязательно']"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="groupData.group_display_name"
                label="отображаемое название"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="groupData.group_description"
                label="описание группы"
                rows="3"
              />
            </v-col>
          </v-row>
        </div>
  
        <v-divider class="my-4"></v-divider>
  
        <!-- настройки группы -->
      <div class="form-section">
        <h3 class="text-h5 font-weight-regular text-grey-darken-1 mb-4">настройки группы</h3>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="groupData.group_status"
              label="статус"
              :items="[
                { title: 'активна', value: 'active' },
                { title: 'неактивна', value: 'inactive' },
                { title: 'в архиве', value: 'archived' }
              ]"
              item-title="title"
              item-value="value"
              :default="'active'"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-bind="props"
                  v-model="groupData.group_max_members"
                  label="макс. участников"
                  type="number"
                  class="max-width-150"
                  min="0"
                  max="9999999999"
                ></v-text-field>
              </template>
              <span>максимальное количество участников группы</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </div>
  
        <v-divider class="my-4"></v-divider>
  
        <!-- контактная информация -->
        <div class="form-section">
          <h3 class="text-h6 font-weight-regular text-grey-darken-1 mb-4">контактная информация</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="groupData.group_email"
                label="email группы"
                type="email"
              />
            </v-col>
          </v-row>
        </div>
  
        <v-divider class="my-4"></v-divider>
  
        <!-- управление -->
        <div class="form-section">
          <h3 class="text-h6 font-weight-regular text-grey-darken-1 mb-4">управление</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="groupData.group_owner"
                label="владелец группы"
                :items="[]"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="groupData.group_backup_owner"
                label="резервный владелец"
                :items="[]"
              ></v-select>
            </v-col>
          </v-row>
        </div>
      </v-form>
  
      <!-- список участников (только для режима редактирования) -->
      <template v-if="isEditMode">
        <v-divider class="my-4"></v-divider>
        
        <div class="form-section">
          <div class="d-flex align-center mb-4">
            <h3 class="text-h6 font-weight-regular text-grey-darken-1">участники группы</h3>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="showAddMemberDialog">
              добавить участника
            </v-btn>
          </div>
          <!-- здесь будет список участников -->
        </div>
      </template>
  
      <!-- кнопки действий -->
      <v-divider class="my-4"></v-divider>
      
      <v-row>
        <v-col class="d-flex justify-end">
          <v-btn color="grey" class="mr-4" @click="cancel">
            отмена
          </v-btn>
          <v-btn color="primary" @click="saveGroup">
            {{ isEditMode ? 'сохранить' : 'создать' }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <style scoped>
  .max-width-150 {
    max-width: 150px;
  }
  </style>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useGroupStore } from '@/state/groupstate'
  
  // Props
  const props = defineProps({
    mode: {
      type: String,
      required: true,
      validator: (value) => ['create', 'edit'].includes(value)
    },
    groupId: {
      type: String,
      required: false
    }
  })
  
  // Emit events
  const emit = defineEmits(['saved', 'cancelled'])
  
  // Store
  const groupStore = useGroupStore()
  
  // Form reference
  const form = ref(null)
  
  // Computed
  const isEditMode = computed(() => props.mode === 'edit')
  
  // Group data
  const groupData = ref({
    group_name: '',
    group_display_name: '',
    group_description: '',
    group_type: 'users',
    group_status: 'active',
    group_max_members: null,
    group_email: '',
    group_owner: null,
    group_backup_owner: null
  })
  
  // Methods
  const saveGroup = async () => {
    const formValid = await form.value?.validate()
    if (!formValid?.valid) return
  
    try {
      if (isEditMode.value) {
        await groupStore.updateGroup(props.groupId, groupData.value)
      } else {
        await groupStore.createGroup(groupData.value)
      }
      emit('saved')
    } catch (error) {
      console.error('Error saving group:', error)
      // TODO: показать ошибку пользователю
    }
  }
  
  const cancel = () => {
    emit('cancelled')
  }
  
  const showAddMemberDialog = () => {
    // TODO: реализовать диалог добавления участника
  }
  
  // При монтировании компонента
  const initializeComponent = async () => {
    if (isEditMode.value && props.groupId) {
      try {
        const group = await groupStore.fetchGroup(props.groupId)
        groupData.value = { ...group }
        if (isEditMode.value) {
          await groupStore.fetchGroupMembers(props.groupId)
        }
      } catch (error) {
        console.error('Error fetching group data:', error)
        // TODO: показать ошибку пользователю
      }
    }
  }
  
  initializeComponent()
  </script>
  ```