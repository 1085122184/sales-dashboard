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

export interface DingTalkDepartmentNode {
  deptId: number
  parentId?: number
  name: string
  leaf?: boolean
  children?: DingTalkDepartmentNode[]
}

export type DingTalkUserImportStatus = 'NEW' | 'EXISTS' | 'CONFLICT'

export interface DingTalkUserCandidate {
  dingUserId: string
  dingUnionId?: string
  name: string
  mobile?: string
  email?: string
  avatar?: string
  position?: string
  deptIdList?: number[]
  importStatus: DingTalkUserImportStatus
  existingUserId?: number
  existingUsername?: string
  conflictReason?: string
}

export interface DingTalkUserPageResult {
  list: DingTalkUserCandidate[]
  hasMore?: boolean
  nextCursor?: number | null
}

export interface DingTalkUserImportRequest {
  dingUserIds: string[]
  roleIds: number[]
  status: number
}

export interface DingTalkUserImportResultRow {
  dingUserId: string
  name?: string
  action: 'CREATED' | 'UPDATED' | 'CONFLICT' | 'FAILED'
  userId?: number
  message?: string
}

export interface DingTalkUserImportResponse {
  createdCount: number
  updatedCount: number
  conflictCount: number
  failedCount: number
  rows: DingTalkUserImportResultRow[]
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
