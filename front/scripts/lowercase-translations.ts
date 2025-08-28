/*
  Version: v0.1.0
  Purpose: Frontend script (not part of production build). Recursively lowercases
  all string values in translation JSON files for EN and RU bundles, except for
  keys under actions (buttons) and validation messages pulled from backend.
  Frontend helper script - lowercase-translations.ts
*/

import { promises as fs } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

const shouldSkipKey = (keyPath: string[]): boolean => {
  const joined = keyPath.join('.')
  if (joined.includes('.actions.')) return true
  if (joined.startsWith('core.validation.')) return true
  if (joined.includes('.messages.')) return false
  return false
}

const toLowercaseDeep = (value: any, path: string[] = []): any => {
  if (Array.isArray(value)) return value.map((v, i) => toLowercaseDeep(v, [...path, String(i)]))
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = toLowercaseDeep(v, [...path, k])
    }
    return out
  }
  if (typeof value === 'string') {
    if (shouldSkipKey(path)) return value
    return value.toLowerCase()
  }
  return value
}

const globCandidates = [
  'modules/AppTranslationEN.json',
  'modules/AppTranslationRU.json',
  'modules/**/*.en.json',
  'modules/**/*.ru.json',
  'core/**/*.en.json',
  'core/**/*.ru.json'
]

const listFiles = async (dir: string): Promise<string[]> => {
  const out: string[] = []
  const walk = async (d: string) => {
    const entries = await fs.readdir(d, { withFileTypes: true })
    for (const e of entries) {
      const p = join(d, e.name)
      if (e.isDirectory()) await walk(p)
      else if (p.endsWith('.json')) out.push(p)
    }
  }
  await walk(dir)
  return out
}

const isTarget = (p: string): boolean => {
  const rel = p.replace(SRC + '/', '')
  const patterns = [/\.en\.json$/i, /\.ru\.json$/i, /^modules\/AppTranslationEN\.json$/, /^modules\/AppTranslationRU\.json$/]
  return patterns.some(rx => rx.test(rel))
}

async function main(): Promise<void> {
  const files = (await listFiles(SRC)).filter(isTarget)
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8')
    let data: any
    try { data = JSON.parse(raw) } catch { continue }
    const lowered = toLowercaseDeep(data, [])
    await fs.writeFile(file, JSON.stringify(lowered, null, 2) + '\n', 'utf8')
    console.log('[lowercase-translations] updated', file.replace(ROOT + '/', ''))
  }
}

main().catch(err => {
  console.error('[lowercase-translations] failed', err)
  process.exit(1)
})


