import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiresPermission?: string | string[]
    requiresAnyPermissions?: string[]
    requiresAllPermissions?: string[]
    menuPathRequired?: boolean
  }
}
