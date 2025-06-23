import { merge } from 'lodash'

// translations for top level App.vue
import appTranslationsRu from '@/modules/AppTranslationRU.json'
import appTranslationsEn from '@/modules/AppTranslationEN.json'

// core modules
import coreModalsRu from '@/core/ui/modals/translation.modals.ru.json'
import coreModalsEn from '@/core/ui/modals/translation.modals.en.json'

// Admin module and sub-modules and functions
import adminModuleRu from '@/modules/admin/translation.admin.ru.json'
import adminModuleEn from '@/modules/admin/translation.admin.en.json'

import userEditorRu from '@/modules/admin/users/UserEditor/translation.user.editor.ru.json'
import userEditorEn from '@/modules/admin/users/UserEditor/translation.user.editor.en.json'

import usersListRu from '@/modules/admin/users/UsersList/Translation.users.list.ru.json'
import usersListEn from '@/modules/admin/users/UsersList/Translation.users.list.en.json'

import groupsListRu from '@/modules/admin/users/GroupsList/translation.groups.list.ru.json'
import groupsListEn from '@/modules/admin/users/GroupsList/translation.groups.list.en.json'

import groupsEditorEn from '@/modules/admin/users/GroupEditor/translation.group.editor.en.json'
import groupsEditorRu from '@/modules/admin/users/GroupEditor/translation.group.editor.ru.json'
// 

// validation rules
import validationCommonFieldsRulesRu from '@/core/validation/translation.rules.common.fields.ru.json'
import validationCommonFieldsRulesEn from '@/core/validation/translation.rules.common.fields.en.json'

// translations merge
export default {
    ru: merge({},
      appTranslationsRu,
      coreModalsRu,
      adminModuleRu,
      userEditorRu,
      usersListRu,
      validationCommonFieldsRulesRu,
      groupsListRu,
      groupsEditorRu
    ),
    en: merge({},
      appTranslationsEn,
      coreModalsEn,
      adminModuleEn,
      userEditorEn,
      usersListEn,
      validationCommonFieldsRulesEn,
      groupsListEn,
      groupsEditorEn
    )
  }