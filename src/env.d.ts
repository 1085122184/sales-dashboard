/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

// 🌟 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_OCR_URL?: string
  readonly VITE_DINGTALK_CORP_ID?: string
  readonly VITE_DINGTALK_JSAPI_URL?: string
  // 根据需要添加更多环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
