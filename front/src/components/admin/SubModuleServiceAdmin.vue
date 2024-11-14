<template>
  <v-container>
    <v-app-bar app>
      <template v-slot:image>
        <v-img gradient="to top right, rgba(15,70,150,.85), rgba(100,180,170,.6)"></v-img>
      </template>
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="onServiceEditorClick">
            <v-icon left style="color: white;">mdi-file-plus-outline</v-icon>
          </v-btn>
        </template>
        <span>новый сервис</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="onButtonClick">
            <v-icon left style="color: white;">mdi-square-edit-outline</v-icon>
          </v-btn>
        </template>
        <span>редактировать сервис</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="onButtonClick">
            <v-icon left style="color: white;">mdi-delete-outline</v-icon>
          </v-btn>
        </template>
        <span>удалить сервис</span>
      </v-tooltip>
      <v-spacer></v-spacer>
      <v-toolbar-title class="title-padding" style="color: white; text-align: right; margin-right: 20px;">управление сервисами</v-toolbar-title>
    </v-app-bar>
    <v-row>
      <p>Содержимое под-модуля Service Administration</p>
    </v-row>
  </v-container>
</template>

<script>
import { useAdminStore } from '@/state/adminstate';

export default {
  name: 'SubModuleServiceAdmin',
  setup() {
    const adminStore = useAdminStore();

    const onServiceEditorClick = () => {
      adminStore.setActiveSubModule('SubModuleServiceEditor');
    };

    const onButtonClick = () => {
      console.log('Button clicked');
    };

    return {
      onServiceEditorClick,
      onButtonClick
    };
  }
};
</script>

<style scoped>
/* Стилизация компонента */
.title-padding {
  padding-left: 25px;
}

/* Добавляем стиль для отступа первой кнопки */
.v-app-bar :deep(.v-btn:first-of-type) {
  margin-left: 40px; /* или padding-left: 20px; */
}
</style>