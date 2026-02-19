/**
 * version: 1.2.0
 * purpose: Vuetify 3 plugin configuration with locale settings.
 * file: FRONTEND file: vuetify.ts
 * logic: Creates and exports Vuetify instance with Russian/English locale support.
 *        Icons are used directly in components (e.g. Phosphor) and are not configured here.
 *
 * Changes in v1.1.0:
 * - Renamed from vuetify.js to vuetify.ts for consistency
 * - Updated locale imports to use Vite-compatible paths (vuetify/locale)
 *
 * Changes in v1.2.0:
 * - Removed MDI icon set registration; components use Phosphor icons where needed
 */

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import { ru, en } from 'vuetify/locale'

// Custom Russian translations with date picker overrides
const customRussianTranslations = {
  ...ru,
  datePicker: {
    ...(ru?.datePicker || {}),
    title: 'Выберите дату',
    headerTitle: 'Выбор даты',
    prev: 'Предыдущий месяц',
    next: 'Следующий месяц',
    today: 'Сегодня',
    year: 'Год',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День',
    ariaLabel: {
      selectDate: 'Выберите дату'
    }
  }
}

// Custom English translations with date picker overrides
const customEnglishTranslations = {
  ...en,
  datePicker: {
    ...(en?.datePicker || {}),
    ariaLabel: {
      selectDate: 'Select date'
    }
  }
}

export default createVuetify({
  locale: {
    locale: 'ru',
    fallback: 'en',
    messages: {
      ru: customRussianTranslations,
      en: customEnglishTranslations,
    },
  },
})
