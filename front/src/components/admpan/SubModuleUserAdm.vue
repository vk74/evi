<template>
  <v-container>
    <v-app-bar app>
      <template v-slot:image>
        <v-img gradient="to top right, rgba(30,50,100,.85), rgba(0,128,128,.8)"></v-img>
      </template>
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="onButtonClick">
              <v-icon left style="color: white;">mdi-account-plus-outline</v-icon>
            </v-btn>
          </template>
          <span>добавить пользователя</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="onButtonClick">
              <v-icon left style="color: white;">mdi-account-edit-outline</v-icon>
            </v-btn>
          </template>
          <span>редактировать пользователя</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="onButtonClick">
              <v-icon left style="color: white;">mdi-account-minus-outline</v-icon>
            </v-btn>
          </template>
          <span>удалить пользователя</span>
        </v-tooltip>
        <v-spacer></v-spacer>
        <v-toolbar-title class="title-padding" style="color: white; text-align: right; margin-right: 20px;">управление пользователями</v-toolbar-title>
    </v-app-bar>
    <v-row>
      <p>Содержимое под-модуля User Administration</p>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'SubModuleServiceAdm',
  methods: {
    onButtonClick() {
      console.log('Button clicked');
    },
  },
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