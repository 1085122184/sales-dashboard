import type { RouteRecordRaw } from 'vue-router'
import { PERMISSION_LABELS } from '@/config/permissions'
import type {
  PermissionAuditResponse,
  PermissionAuditRoute
} from '@/types'

export type PermissionAuditSeverity = 'error' | 'warning'
export type PermissionAuditIssueType =
  | 'missing-permission'
  | 'missing-route-path'
  | 'route-without-permission'
  | 'orphan-menu-path'
  | 'duplicate-menu-path'

const IGNORED_ROUTE_NAMES = new Set(['Login', 'Forbidden'])
const IGNORED_PATH_PREFIXES = ['/:pathMatch']

export function auditRoutePermissions(
  routes: RouteRecordRaw[]
): PermissionAuditResponse {
  const routeAuditItems = collectRoutePermissionPayload(routes)
  const routeWithoutPermissionCount = flattenRoutes(routes)
    .filter(route => route.requiresAuth && route.permissions.length === 0)
    .length

  const issues = flattenRoutes(routes)
    .filter(route => route.requiresAuth && route.permissions.length === 0)
    .map(route => ({
      type: 'route-without-permission' as PermissionAuditIssueType,
      severity: 'warning' as PermissionAuditSeverity,
      routePath: route.path,
      routeTitle: route.title,
      fixable: false,
      message: `${route.title} (${route.path}) 已要求登录，但没有配置权限标识`
    }))

  return {
    summary: {
      protectedRouteCount: routeAuditItems.length + routeWithoutPermissionCount,
      menuPathCount: 0,
      menuPermissionCount: 0,
      errorCount: 0,
      warningCount: issues.length,
      fixableCount: 0
    },
    routes: routeAuditItems,
    issues
  }
}

export function collectRoutePermissionPayload(routes: RouteRecordRaw[]): PermissionAuditRoute[] {
  return flattenRoutes(routes)
    .filter(route => route.requiresAuth && route.permissions.length > 0)
    .map(route => ({
      path: route.path,
      name: route.name,
      title: route.title,
      menuPathRequired: route.menuPathRequired,
      permissions: route.permissions.map(permission => ({
        permission,
        label: PERMISSION_LABELS[permission] || route.title || permission
      }))
    }))
}

export function appendRoutePermissionConfigIssues(
  result: PermissionAuditResponse,
  routes: RouteRecordRaw[]
): PermissionAuditResponse {
  const localIssues = auditRoutePermissions(routes).issues
  if (localIssues.length === 0) {
    return result
  }

  const issues = [...result.issues, ...localIssues]
  const errorCount = issues.filter(issue => issue.severity === 'error').length
  const warningCount = issues.length - errorCount
  const fixableCount = issues.filter(issue => issue.fixable).length

  return {
    ...result,
    summary: {
      ...result.summary,
      errorCount,
      warningCount,
      fixableCount
    },
    issues
  }
}

function flattenRoutes(routes: RouteRecordRaw[], parentPath = '') {
  const items: Array<{
    path: string
    name: string
    title: string
    requiresAuth: boolean
    menuPathRequired: boolean
    permissions: string[]
  }> = []

  for (const route of routes) {
    const fullPath = joinRoutePath(parentPath, route.path)
    const name = String(route.name || '')

    if (!IGNORED_ROUTE_NAMES.has(name) && !IGNORED_PATH_PREFIXES.some(prefix => fullPath.startsWith(prefix))) {
      items.push({
        path: fullPath,
        name,
        title: String(route.meta?.title || name || fullPath),
        requiresAuth: route.meta?.requiresAuth === true,
        menuPathRequired: route.meta?.menuPathRequired === true,
        permissions: collectRoutePermissions(route.meta)
      })
    }

    if (route.children?.length) {
      items.push(...flattenRoutes(route.children, fullPath))
    }
  }

  return items
}

function collectRoutePermissions(meta: RouteRecordRaw['meta']): string[] {
  const permissions = new Set<string>()
  const requiredPermission = meta?.requiresPermission

  if (typeof requiredPermission === 'string') {
    permissions.add(requiredPermission)
  } else if (Array.isArray(requiredPermission)) {
    requiredPermission.forEach(permission => permissions.add(permission))
  }

  meta?.requiresAnyPermissions?.forEach(permission => permissions.add(permission))
  meta?.requiresAllPermissions?.forEach(permission => permissions.add(permission))

  return Array.from(permissions)
}

function joinRoutePath(parentPath: string, routePath: string) {
  if (!parentPath || routePath.startsWith('/')) {
    return normalizePath(routePath) || '/'
  }

  return normalizePath(`${parentPath}/${routePath}`) || '/'
}

function normalizePath(path?: string) {
  if (!path) return ''
  const normalized = path.replace(/\/+/g, '/')
  if (normalized === '/') return normalized
  return normalized.replace(/\/$/, '')
}
