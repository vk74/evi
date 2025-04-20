/**
 * Объединенный экспорт всех кодов событий
 */
import { GroupEvents } from './admin/users';
import { SystemEvents } from './admin/system';
import { CatalogEvents } from './admin/catalog';
import { ServicesEvents } from './admin/services';
import { ItemSelectorEvents } from '../codes/core/item-selector/item.selector';
import { SettingsEvents } from '../codes/core/settings/settings';
import { ServerEvents } from '../codes/core/server/server';
import { GET_USER_ACCOUNT_STATUS } from '../codes/core/helpers/get.user.account.status';
import { GET_UUID_BY_GROUP_NAME } from '../codes/core/helpers/get.uuid.by.group.name';
import { EventCode } from '../logger.types';

/**
 * Объединенная структура всех кодов событий
 */
export const Events = {
  ADMIN: {
    USERS: GroupEvents,
    SYSTEM: SystemEvents,
    CATALOG: CatalogEvents,
    SERVICES: ServicesEvents
  },
  CORE: {
    ITEM_SELECTOR: ItemSelectorEvents,
    SETTINGS: SettingsEvents,
    SERVER: ServerEvents,
    HELPERS: {
      GET_USER_ACCOUNT_STATUS,
      GET_UUID_BY_GROUP_NAME
    }
  }
};

// Кэш для быстрого поиска описаний по коду
const descriptionCache: Record<string, string> = {};

/**
 * Заполняет кэш описаний из объекта с кодами событий
 * @param eventsObj Объект с кодами событий
 */
function populateCache(eventsObj: any) {
  if (eventsObj.code && eventsObj.description) {
    descriptionCache[eventsObj.code] = eventsObj.description;
    return;
  }
  
  Object.values(eventsObj).forEach((value: any) => {
    if (typeof value === 'object' && value !== null) {
      populateCache(value);
    }
  });
}

// Заполнение кэша при импорте
populateCache(Events);

/**
 * Получение описания для кода события
 * @param eventId Код события
 * @returns Описание события или undefined, если описание не найдено
 */
export function getEventDescription(eventId: string): string | undefined {
  return descriptionCache[eventId];
}