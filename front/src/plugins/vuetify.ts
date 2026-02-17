/**
 * version: 1.1.0
 * purpose: Vuetify 3 plugin configuration with locale and icon settings.
 * file: FRONTEND file: vuetify.ts
 * logic: Creates and exports Vuetify instance with Russian/English locale support
 *        and MDI SVG icon set configuration.
 *
 * Changes in v1.1.0:
 * - Renamed from vuetify.js to vuetify.ts for consistency
 * - Updated locale imports to use Vite-compatible paths (vuetify/locale)
 */

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import { ru, en } from 'vuetify/locale'
import { aliases as mdiAliases, mdi } from 'vuetify/iconsets/mdi-svg'

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
    defaultLocale: 'ru',
    messages: {
      ru: customRussianTranslations,
      en: customEnglishTranslations,
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases: mdiAliases,
    sets: { mdi },
  },
})
