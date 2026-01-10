/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COSMOS_ENDPOINT?: string
  readonly VITE_COSMOS_KEY?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AAD_CLIENT_ID?: string
  readonly VITE_AAD_TENANT_ID?: string
  readonly VITE_AAD_AUTHORITY?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_BASE_PATH: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string