// src/types/router.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题，会显示在浏览器标签和导航栏 */
    title?: string
    /** 是否需要认证 */
    requiresAuth?: boolean
    /** 是否需要特定权限 */
    requiresPermission?: string
  }
}
