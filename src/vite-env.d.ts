/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_API_URL: string;
  readonly VITE_PROXY_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
