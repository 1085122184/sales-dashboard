export interface PageResult<T> {
  list?: T[]
  rows?: T[]
  total?: number
  pageNum?: number
  pageSize?: number
}

export interface RoleQuery {
  pageNum: number
  pageSize: number
  roleName?: string
  roleKey?: string
  status?: number | undefined
}

export interface RoleItem {
  id?: number
  roleName: string
  roleKey: string
  roleSort: number
  status: number
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface RolePayload {
  id?: number
  roleName: string
  roleKey: string
  roleSort: number
  status: number
  remark?: string
}

export interface UserCreatePayload {
  username: string
  password: string
  nickname?: string
  realName?: string
  email?: string
  mobile?: string
  status: number
  roleIds: number[]
}

export interface UserUpdatePayload {
  id: number
  password?: string
  nickname?: string
  realName?: string
  email?: string
  mobile?: string
  status: number
  roleIds: number[]
}

export interface UserQuery {
  pageNum: number
  pageSize: number
  username?: string
  mobile?: string
  status?: number | undefined
}

export interface UserItem {
  id: number
  username: string
  nickname?: string
  realName?: string
  email?: string
  mobile?: string
  dingUserId?: string
  status: number
  roleIds: number[]
  roleNames: string[]
  createTime?: string
  updateTime?: string
}

export interface MenuTreeNode {
  id: number
  menuName: string
  parentId?: number
  menuType?: string
  path?: string
  component?: string
  perms?: string
  icon?: string
  orderNum?: number
  remark?: string
  children?: MenuTreeNode[]
}

export interface PermissionAuditPermission {
  permission: string
  label?: string
}

export interface PermissionAuditRoute {
  path: string
  name?: string
  title?: string
  menuPathRequired?: boolean
  permissions: PermissionAuditPermission[]
}

export interface PermissionAuditRequest {
  routes: PermissionAuditRoute[]
}

export interface PermissionAuditIssue {
  type: 'missing-permission' | 'missing-route-path' | 'route-without-permission' | 'orphan-menu-path' | 'duplicate-menu-path'
  severity: 'error' | 'warning'
  routePath?: string
  routeTitle?: string
  menuName?: string
  permission?: string
  fixable?: boolean
  message: string
}

export interface PermissionAuditSummary {
  protectedRouteCount: number
  menuPathCount: number
  menuPermissionCount: number
  errorCount: number
  warningCount: number
  fixableCount: number
}

export interface PermissionAuditResponse {
  summary: PermissionAuditSummary
  routes: PermissionAuditRoute[]
  issues: PermissionAuditIssue[]
}

export interface PermissionAuditFixResponse {
  insertedCount: number
  skippedCount: number
  audit: PermissionAuditResponse
}
