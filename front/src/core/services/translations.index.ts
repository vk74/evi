import { merge } from 'lodash'

// translations for top level App.vue
import appTranslationsRu from '@/modules/AppTranslationRU.json'
import appTranslationsEn from '@/modules/AppTranslationEN.json'

// core modules
import coreModalsRu from '@/core/ui/modals/translation.modals.ru.json'
import coreModalsEn from '@/core/ui/modals/translation.modals.en.json'

import corePanelsRu from '@/core/ui/panels/translation.panels.ru.json'
import corePanelsEn from '@/core/ui/panels/translation.panels.en.json'

// Account module
import userSelfRegistrationRu from '@/modules/account/translation.account.ru.json'
import userSelfRegistrationEn from '@/modules/account/translation.account.en.json'

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

import settingsRu from '@/modules/admin/settings/translation.settings.ru.json'
import settingsEn from '@/modules/admin/settings/translation.settings.en.json'

import catalogAdminRu from '@/modules/admin/catalog/translation.admin.catalog.ru.json'
import catalogAdminEn from '@/modules/admin/catalog/translation.admin.catalog.en.json'
// 

// validation rules
import validationCommonFieldsRulesRu from '@/core/validation/translation.rules.common.fields.ru.json'
import validationCommonFieldsRulesEn from '@/core/validation/translation.rules.common.fields.en.json'

// translations merge
export default {
    ru: merge({},
      appTranslationsRu,
      coreModalsRu,
      corePanelsRu,
      userSelfRegistrationRu,
      adminModuleRu,
      userEditorRu,
      usersListRu,
      validationCommonFieldsRulesRu,
      groupsListRu,
      groupsEditorRu,
      settingsRu,
      catalogAdminRu
    ),
    en: merge({},
      appTranslationsEn,
      coreModalsEn,
      corePanelsEn,
      userSelfRegistrationEn,
      adminModuleEn,
      userEditorEn,
      usersListEn,
      validationCommonFieldsRulesEn,
      groupsListEn,
      groupsEditorEn,
      settingsEn,
      catalogAdminEn
    )
  }