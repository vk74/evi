<template>
    <v-container>
      <v-app-bar app>
        <template v-slot:image>
          <v-img gradient="to top right, rgba(15,70,150,.85), rgba(100,180,170,.6)"></v-img>
        </template>
        <v-spacer></v-spacer>
        <v-toolbar-title class="title-padding" style="color: white; text-align: right; margin-right: 20px;">создание нового сервиса</v-toolbar-title>
      </v-app-bar>
      <v-row>
        <p>Форма создания нового сервиса</p>
      </v-row>
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
  </style>