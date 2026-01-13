/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DEV_MODE?: string
  readonly VITE_ENABLE_GOOGLE_LOGIN?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_ALLOWED_DOMAIN?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_BASE_PATH: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
