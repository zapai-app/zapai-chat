/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TARGET_PUBKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
