/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_OCR_URL?: string
  readonly VITE_DINGTALK_CORP_ID?: string
  readonly VITE_DINGTALK_JSAPI_URL?: string
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
