import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    message: {
      hello: 'Hello world',
      // здесь будут другие строки ключ: значение на английском языке
    }
  },
  ru: {
    message: {
      hello: 'Привет мир',
      // здесь будут другие строки на русском
    }
  }
};

const i18n = createI18n({
    legacy: false, // Отключаем режим совместимости для Vue 2
    locale: 'ru', // язык по умолчанию
    fallbackLocale: 'en', // язык, на который будет переключаться, если не найдена локализация
    messages, // установка сообщений локализаций
  });
  

export default i18n;
