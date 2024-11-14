<!-- components/admpan/SubModuleAppAdm.vue -->
<template>
  <v-container>
    <v-row>
      <v-btn @click="onButtonClick">K1</v-btn>
      <v-btn @click="onButtonClick">K2</v-btn>
      <v-btn @click="onButtonClick">K3</v-btn>
    </v-row>
    <v-row>
      <p>Содержимое под-модуля App Administration</p>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'SubModuleAppAdm',
  methods: {
    onButtonClick() {
      console.log('Button clicked');
    },
  },
};
</script>

<style scoped>
/* Стилизация компонента */
</style>