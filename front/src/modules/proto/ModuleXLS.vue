<template>
  <div class="pt-3 pl-3">
    <v-card
      max-width="600px"
      color="grey lighten-4"
    >
      <v-card-title class="text-h5">
        модуль для прототипирования функций excel
      </v-card-title>
      <v-card-text>
        <form @submit.prevent="handleSubmit">
          <div>
            <label for="textField">Название организации:</label>
            <input
              id="orgname"
              v-model="formData.orgname"
              type="text"
            >
          </div>
          <div>
            <label for="regionSelect">Страна / Регион:</label>
            <select
              id="regionSelect"
              v-model="formData.region"
            >
              <option
                disabled
                value=""
              >
                Выберите один вариант
              </option>
              <option>регион А</option>
              <option>регион Б</option>
              <option>страна X</option>
              <option>страна Z</option>
            </select>
          </div>
          <div>
            <label for="locationSelect">Локация:</label>
            <select
              id="locationSelect"
              v-model="formData.location"
            >
              <option
                v-for="location in locations"
                :key="location.id"
                :value="location.name"
              >
                {{ location.name }}
              </option>
            </select>
          </div>
          <div>
            <input
              id="checkbox"
              v-model="formData.checkbox"
              type="checkbox"
            >
            <label for="checkbox">станция мониторинга уже развернута</label>
          </div>
          <div>
            <input
              id="radio1"
              v-model="formData.radio"
              type="radio"
              value="Option 1"
            >
            <label for="radio1">опция 1</label>
            <input
              id="radio2"
              v-model="formData.radio"
              type="radio"
              value="Option 2"
            >
            <label for="radio2">опция 2</label>
          </div>
          <div>
            <label for="datePicker">Дата заполнения:</label>
            <Datepicker
              id="datePicker"
              v-model="formData.date"
              format="yyyy-MM-dd"
            />
          </div>
          <br>
          <br>
          <br>
          <v-btn
            color="teal darken-2"
            type="button"
            @click="generateExcelFile"
          >
            Сгенерировать файл Excel
          </v-btn><br><br>
          <v-btn
            color="teal"
            type="submit"
          >
            записать в бд
          </v-btn><br><br>
          <v-btn
            color="teal"
            density="compact"
            elevation="20"
          >
            компактная кнопка
          </v-btn><br>
          <!-- <button type="submit">&nbsp;record to DB&nbsp;</button> -->
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>
  
<script>
import axios from 'axios';
import Datepicker from 'vue3-datepicker';

export default {
  name: 'ModuleXLS',
  components: {
    Datepicker
  },
  data() {
    return {
      formData: {
        orgname: '',
        region: '',
        location: '', // Выбранная локация
        checkbox: false,
        radio: '',
        date: new Date()
      },
      locations: [] // Список локаций из базы данных
    };
  },
  created() {
    this.fetchLocations();
  },
  
  methods: {
  // получить список локаций
    async fetchLocations() {
      try {
        const response = await axios.get('http://localhost:3000/protolocations');
        this.locations = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке локаций:', error);
      }
    },

  // записать данные в postgres
    async handleSubmit() {
      try {
        const response = await axios.post('http://localhost:3000/protosubmit', this.formData);
        console.log('Ответ сервера:', response.data); // Вывод в консоль ответа сервера
      } catch (error) {
        console.error('Ошибка при отправке данных:', error);
      }
    },
  
  // сгенерировать файл эксель и заполнить его данными формы при нажатии кнопки generate
  

  // вариант с запросом пользователя куда файл должен быть сохранен
  async generateExcelFile() {
    console.log("Генерация файла Excel начата.");
  try {
    const response = await axios.post('http://localhost:3000/proto-generate-excel', this.formData, {
      responseType: 'blob' // Указываем, что ожидаем ответ в формате Blob
    });

    // Создаем URL для скачивания файла
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'estimatorFile.xlsx'); // Устанавливаем имя файла для скачивания
    document.body.appendChild(link);
    link.click();
    link.remove(); // Удаляем ссылку после скачивания
    window.URL.revokeObjectURL(url); // Освобождаем память, используемую URL
  } catch (error) {
    console.error('Ошибка при генерации файла Excel:', error);
  }
}

  /*   метод с сохранением эксел файла в директорию в бекэнд
  async generateExcelFile() {
    try {
      const response = await axios.post('http://localhost:3000/proto-generate-excel', this.formData);
      console.log('Файл Excel успешно сгенерирован:', response.data);
    } catch (error) {
      console.error('Ошибка при генерации файла Excel:', error);
    }
  },
  */

  // остальные методы  

  }
};

</script>

<style>

</style>