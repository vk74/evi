import { merge } from 'lodash'

// translations for top level App.vue
import appTranslationsRu from '@/modules/AppTranslationRU.json'
import appTranslationsEn from '@/modules/AppTranslationEN.json'

// core modules
import coreModalsRu from '@/core/ui/modals/translation.modals.ru.json'
import coreModalsEn from '@/core/ui/modals/translation.modals.en.json'

import corePanelsRu from '@/core/ui/panels/translation.panels.ru.json'
import corePanelsEn from '@/core/ui/panels/translation.panels.en.json'

// auth module
import authRu from '@/core/auth/translation.auth.ru.json'
import authEn from '@/core/auth/translation.auth.en.json'

// Account module
import userSelfRegistrationRu from '@/modules/account/translation.account.ru.json'
import userSelfRegistrationEn from '@/modules/account/translation.account.en.json'

// Admin module and sub-modules and functions
import adminModuleRu from '@/modules/admin/translation.admin.ru.json'
import adminModuleEn from '@/modules/admin/translation.admin.en.json'

import userEditorRu from '@/modules/admin/org/UserEditor/translation.user.editor.ru.json'
import userEditorEn from '@/modules/admin/org/UserEditor/translation.user.editor.en.json'

import usersListRu from '@/modules/admin/org/UsersList/Translation.users.list.ru.json'
import usersListEn from '@/modules/admin/org/UsersList/Translation.users.list.en.json'

import groupsListRu from '@/modules/admin/org/GroupsList/translation.groups.list.ru.json'
import groupsListEn from '@/modules/admin/org/GroupsList/translation.groups.list.en.json'

import groupsEditorEn from '@/modules/admin/org/GroupEditor/translation.group.editor.en.json'
import groupsEditorRu from '@/modules/admin/org/GroupEditor/translation.group.editor.ru.json'

import orgAdminRu from '@/modules/admin/org/translation.org.admin.ru.json'
import orgAdminEn from '@/modules/admin/org/translation.org.admin.en.json'

import settingsRu from '@/modules/admin/settings/translation.settings.ru.json'
import settingsEn from '@/modules/admin/settings/translation.settings.en.json'

import catalogAdminRu from '@/modules/admin/catalog/translation.admin.catalog.ru.json'
import catalogAdminEn from '@/modules/admin/catalog/translation.admin.catalog.en.json'

// services admin module
import servicesAdminRu from '@/modules/admin/services/translation.services.ru.json'
import servicesAdminEn from '@/modules/admin/services/translation.services.en.json'

// products admin module
import productsAdminRu from '@/modules/admin/products/translation.products.ru.json'
import productsAdminEn from '@/modules/admin/products/translation.products.en.json'

// work module
import workRu from '@/modules/work/translation.work.ru.json'
import workEn from '@/modules/work/translation.work.en.json'

// ar module
import arRu from '@/modules/ar/translation.ar.ru.json'
import arEn from '@/modules/ar/translation.ar.en.json'

// kb module
import kbRu from '@/modules/KB/translation.kb.ru.json'
import kbEn from '@/modules/KB/translation.kb.en.json'

// catalog module (frontend user-facing)
import catalogRu from '@/modules/catalog/translation.catalog.ru.json'
import catalogEn from '@/modules/catalog/translation.catalog.en.json'

// validation rules
import validationCommonFieldsRulesRu from '@/core/validation/translation.rules.common.fields.ru.json'
import validationCommonFieldsRulesEn from '@/core/validation/translation.rules.common.fields.en.json'

// translations merge
export default {
    ru: merge({},
      appTranslationsRu,
      coreModalsRu,
      corePanelsRu,
      authRu,
      userSelfRegistrationRu,
      adminModuleRu,
      userEditorRu,
      usersListRu,
      validationCommonFieldsRulesRu,
      groupsListRu,
      groupsEditorRu,
      orgAdminRu,
      settingsRu,
      catalogAdminRu,
      servicesAdminRu,
      productsAdminRu,
      workRu,
      arRu,
      kbRu,
      catalogRu
    ),
    en: merge({},
      appTranslationsEn,
      coreModalsEn,
      corePanelsEn,
      authEn,
      userSelfRegistrationEn,
      adminModuleEn,
      userEditorEn,
      usersListEn,
      validationCommonFieldsRulesEn,
      groupsListEn,
      groupsEditorEn,
      orgAdminEn,
      settingsEn,
      catalogAdminEn,
      servicesAdminEn,
      productsAdminEn,
      workEn,
      arEn,
      kbEn,
      catalogEn
    )
  }