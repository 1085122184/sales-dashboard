/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_OCR_URL?: string
  // 根据需要添加更多环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface DingTalkAuthResult {
  code: string
}

interface DingTalkRuntimeApi {
  permission?: {
    requestAuthCode(options: {
      corpId: string
      onSuccess: (result: DingTalkAuthResult) => void
      onFail: (error: unknown) => void
    }): void
  }
}

interface DingTalkApi {
  ready(callback: () => void): void
  error(callback: (error: unknown) => void): void
  runtime?: DingTalkRuntimeApi
  biz?: {
    navigation?: {
      close?: () => void
      quit?: () => void
    }
    util?: {
      openLink(options: {
        url: string
        onSuccess?: () => void
        onFail?: (error: unknown) => void
      }): void
    }
  }
  requestAuthCode?(options: {
    corpId: string
    success?: (result: DingTalkAuthResult) => void
    fail?: (error: unknown) => void
  }): void
}

interface Window {
  dd?: DingTalkApi
}
