<template>
  <v-dialog v-model="dialog" width="auto" @click:outside="closeDialog">
    <v-card>
      <v-card-text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" block @click="dialog = false">Close Dialog</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
data () {
  return {
    dialog: true,
  }
},
closeDialog() {
    this.dialog = false;
}    
}
</script>

<style>

</style>