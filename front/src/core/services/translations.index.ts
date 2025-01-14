import { merge } from 'lodash'

// Импорты переводов App.vue
import appTranslationsRu from '@/components/AppTranslationRU.json'
import appTranslationsEn from '@/components/AppTranslationEN.json'

// Admin module and sub-modules and functions
import adminModuleRu from '@/components/admin/translation.admin.ru.json'
import adminModuleEn from '@/components/admin/translation.admin.en.json'

import userEditorRu from '@/components/admin/users/UserEditor/translation.user.editor.ru.json'
import userEditorEn from '@/components/admin/users/UserEditor/translation.user.editor.en.json'

import usersListRu from '@/components/admin/users/UsersList/translation.users.list.ru.json'
import usersListEn from '@/components/admin/users/UsersList/translation.users.list.en.json'

// translations merge
export default {
    ru: merge({},
      appTranslationsRu,
      adminModuleRu,
      userEditorRu,
      usersListRu
    ),
    en: merge({},
      appTranslationsEn,
      adminModuleEn,
      userEditorEn,
      usersListEn
    )
  }