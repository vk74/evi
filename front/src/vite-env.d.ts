/**
 * version: 1.0.0
 * purpose: Vite environment variable type declarations.
 * file: FRONTEND file: vite-env.d.ts
 * logic: Extends ImportMetaEnv with custom VITE_* environment variables used in the app.
 *
 * Changes in v1.0.0:
 * - Initial: VITE_API_URL declaration for backend API endpoint
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
