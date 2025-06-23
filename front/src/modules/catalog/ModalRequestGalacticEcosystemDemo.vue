<template>
  <div
    class="modal-overlay"
    @click.self="closeModal"
  >
    <div
      class="modal"
      @click.stop
    >
      <div class="modal-header">
        <h4>демонстрация марсианской системы</h4>
        <span
          class="modal-close"
          @click.stop="closeModal"
        >&times;</span>
      </div> 
      <form
        class="modal-body"
        @submit.prevent="submitForm"
      >
        <div>
          <v-select
            v-model="formData.ecosystemName"
            label="название системы"
            :items="systemNames"
          />
        </div>
        <div>
          <v-text-field
            v-model="formData.name"
            label="заказчик демо"
            required
          />
        </div>
        <div>
          <v-text-field
            v-model="formData.email"
            label="e-mail для подтверждения"
          />
        </div>
        <div>
          <v-text-field
            v-model="formData.phone"
            label="телефон для связи"
            required
          />
        </div>
        <div>
          <v-date-picker />
        </div>
        <button type="submit">
          хочу демо
        </button>
      </form>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      formData: {
        ecosystemName: '',
        name: '',
        email: '',
        phone: '',
      },
      // массив с названиями систем
      systemNames: [
        'антигравитационный танцпол для вечеринок',
        'марсианская климатическая система',
        'квантовый видеомост с землей',
        'кислородный спа-комплекс',
        'голографический зоопарк',
      ]
    }
  },
  methods: {
    changeLocale() {
    this.$vuetify.locale.current = this.$vuetify.locale.current === 'ru' ? 'en' : 'ru';
  },
    closeModal() {
      this.$emit('close');
    },
    submitForm() {
      // ... логика отправки формы
      this.closeModal(); // закрываем модальное окно после успешной отправки
    }
  }
}

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 400px; /* Увеличиваем ширину модального окна */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-close {
  cursor: pointer;
  font-size: 24px;
}

.form-group label {
  display: block;
}

.form-group input {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}
</style>

