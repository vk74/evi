import { merge } from 'lodash'

// Импорты базовых переводов приложения
import appTranslationsRu from '@/components/AppTranslationRU.json'
import appTranslationsEn from '@/components/AppTranslationEN.json'

// Импорты переводов административной части
import adminTranslationsRu from '@/components/admin/translation.admin.ru.json'
import adminTranslationsEn from '@/components/admin/translation.admin.en.json'

// Импорты переводов компонента UserEditor
import userEditorTranslationsRu from '@/components/admin/users/UserEditor/translation.user.editor.ru.json'
import userEditorTranslationsEn from '@/components/admin/users/UserEditor/translation.user.editor.en.json'

// Объединяем все переводы
export default {
    ru: merge({},
      appTranslationsRu,
      adminTranslationsRu,
      userEditorTranslationsRu
    ),
    en: merge({},
      appTranslationsEn,
      adminTranslationsEn,
      userEditorTranslationsEn
    )
  }