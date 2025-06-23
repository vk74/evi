import { merge } from 'lodash'

// translations for top level App.vue
import appTranslationsRu from '@/components/AppTranslationRU.json'
import appTranslationsEn from '@/components/AppTranslationEN.json'

// core modules
import coreModalsRu from '@/core/ui/modals/translation.modals.ru.json'
import coreModalsEn from '@/core/ui/modals/translation.modals.en.json'

// Admin module and sub-modules and functions
import adminModuleRu from '@/components/admin/translation.admin.ru.json'
import adminModuleEn from '@/components/admin/translation.admin.en.json'

import userEditorRu from '@/components/admin/users/UserEditor/translation.user.editor.ru.json'
import userEditorEn from '@/components/admin/users/UserEditor/translation.user.editor.en.json'

import usersListRu from '@/components/admin/users/UsersList/Translation.users.list.ru.json'
import usersListEn from '@/components/admin/users/UsersList/Translation.users.list.en.json'

import groupsListRu from '@/components/admin/users/GroupsList/translation.groups.list.ru.json'
import groupsListEn from '@/components/admin/users/GroupsList/translation.groups.list.en.json'

import groupsEditorEn from '@/components/admin/users/GroupEditor/translation.group.editor.en.json'
import groupsEditorRu from '@/components/admin/users/GroupEditor/translation.group.editor.ru.json'
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