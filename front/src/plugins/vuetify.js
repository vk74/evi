// импорт функции createVuetify и стилей Vuetify
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import ru from 'vuetify/lib/locale/ru'
import en from 'vuetify/lib/locale/en'

// импорт иконок из @mdi/js
import { mdiAccount } from '@mdi/js'

// определение кастомизированных переводов для русской локализации
const customRussianTranslations = {
  ...ru,
  $vuetify: {
    ...ru.$vuetify,
    datePicker: {
      title: 'Выберите дату',
      headerTitle: 'Выбор даты',
      prev: 'Предыдущий месяц',
      next: 'Следующий месяц',
      today: 'Сегодня',
      year: 'Год', 
      month: 'Месяц', 
      week: 'Неделя', 
      day: 'День', 
      // добавить другие переводы по необходимости
    }
  }
};

//кастомизированные переводы для английской локализации
const customEnglishTranslations = {
  ...en,
  $vuetify: {
    ...en.$vuetify,
    // здесь будут еще переводы для английской локализации
  }
};

// непосредственный экспорт экземпляра Vuetify с настройками
export default createVuetify({
  locale: {
    defaultLocale: 'ru',
    locales: { 
      ru: customRussianTranslations, 
      en: customEnglishTranslations,
    },
  },
  icons: {
    iconfont: 'mdiSvg',
    values: {
      account: mdiAccount, // добавление иконки account
    },
  },
  // дополнительные настройки Vuetify
});