<template>
  <div class="ModuleWork">
    <h4>Work Module</h4>
    <p>Возможные функции модуля:</p>
    <li>просмотр выполненных ЦП, проверка выданных цен, сроков и пр.</li>
    <li>расчет маржинальности ЦП для Philips и для дистрибьютора (в зависимости от вошедшего пользователя)</li>
    <li><b>подготовки SoW, WBS и других ключевых документов составляющих предложение</b></li>
    <li>выставление статусов работы над предложением (например проведен ли тех аудит для ИККА, получено ли согласование дизайна и пр.)</li>
    <li>нотификации по изменениям</li>
  </div>
</template>

<script>
export default {
  name: 'ModuleWork',
  computed: {
    username() {
      return this.$store.state.username;
    },
    jwt() {
      return this.$store.state.jwt;
    },
    isLoggedIn() {
      return this.$store.state.isLoggedIn;
    }
  },
};
</script>

<style>
.ModuleWork {
  flex-grow: 1;
  background-color: rgb(255, 255, 255);
}
</style>