/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full origin of the API in production; empty locally, where the Vite proxy handles /api. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
