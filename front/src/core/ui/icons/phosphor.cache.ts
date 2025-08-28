/*
  Version: v0.1.0
  Purpose: Frontend helper (phosphor.cache.ts). Provides a shared in-memory cache
  for @phosphor-icons/vue so that the library can be prefetched in admin modules
  and reused by icon components without re-importing.
  This is a frontend file: phosphor.cache.ts
*/

let cachedPhosphorModule: Record<string, any> | null = null

export const getPhosphorModule = (): Record<string, any> | null => cachedPhosphorModule

export const loadPhosphorModule = async (): Promise<Record<string, any>> => {
  if (!cachedPhosphorModule) {
    cachedPhosphorModule = await import('@phosphor-icons/vue')
  }
  return cachedPhosphorModule
}


