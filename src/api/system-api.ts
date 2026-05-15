import http from './http'
import type {
  ApiResponse,
  MenuTreeNode,
  PageResult,
  RoleItem,
  RolePayload,
  RoleQuery,
  UserCreatePayload,
  UserItem,
  UserQuery,
  UserUpdatePayload,
  DingTalkDepartmentNode,
  DingTalkUserImportRequest,
  DingTalkUserImportResponse,
  DingTalkUserPageResult,
  PermissionAuditRequest,
  PermissionAuditResponse,
  PermissionAuditFixResponse
} from '@/types'

export const getRolePage = async (params: RoleQuery) => {
  const res = await http.get<any, ApiResponse<PageResult<RoleItem>>>('/v1/system/roles', { params })
  return res
}

export const addRole = async (data: RolePayload) => {
  const res = await http.post<any, ApiResponse<number | RoleItem>>('/v1/system/roles', data)
  return res
}

export const addUser = async (data: UserCreatePayload) => {
  const res = await http.post<any, ApiResponse<number>>('/v1/system/roles/users', data)
  return res
}

export const getUserPage = async (params: UserQuery) => {
  const res = await http.get<any, ApiResponse<PageResult<UserItem>>>('/v1/system/roles/users', { params })
  return res
}

export const updateUser = async (data: UserUpdatePayload) => {
  const res = await http.put<any, ApiResponse<boolean>>('/v1/system/roles/users', data)
  return res
}

export const deleteUser = async (id: number) => {
  const res = await http.delete<any, ApiResponse<boolean>>(`/v1/system/roles/users/${id}`)
  return res
}

export const getDingTalkDepartments = async (params?: { deptId?: number }) => {
  const res = await http.get<any, ApiResponse<DingTalkDepartmentNode[]>>('/v1/system/dingtalk/departments', { params })
  return res
}

export const getDingTalkUsers = async (params: {
  deptId?: number
  includeChildren?: boolean
  cursor?: number
  size?: number
}) => {
  const res = await http.get<any, ApiResponse<DingTalkUserPageResult>>('/v1/system/dingtalk/users', { params })
  return res
}

export const importDingTalkUsers = async (data: DingTalkUserImportRequest) => {
  const res = await http.post<any, ApiResponse<DingTalkUserImportResponse>>('/v1/system/dingtalk/users/import', data)
  return res
}

export const updateRole = async (data: RolePayload) => {
  const res = await http.put<any, ApiResponse<boolean | RoleItem>>('/v1/system/roles', data)
  return res
}

export const deleteRole = async (id: number) => {
  const res = await http.delete<any, ApiResponse<boolean>>(`/v1/system/roles/${id}`)
  return res
}

export const getMenuTree = async () => {
  const res = await http.get<any, ApiResponse<MenuTreeNode[]>>('/v1/system/roles/menu-tree')
  return res
}

export const getRoleMenuIds = async (roleId: number) => {
  const res = await http.get<any, ApiResponse<number[]>>(`/v1/system/roles/${roleId}/menus`)
  return res
}

export const saveRoleMenus = async (roleId: number, menuIds: number[]) => {
  const res = await http.put<any, ApiResponse<boolean>>(`/v1/system/roles/${roleId}/menus`, menuIds)
  return res
}

export const auditRoutePermissions = async (data: PermissionAuditRequest) => {
  const res = await http.post<any, ApiResponse<PermissionAuditResponse>>('/v1/system/roles/permission-audit', data)
  return res
}

export const fixMissingRoutePermissions = async (data: PermissionAuditRequest) => {
  const res = await http.post<any, ApiResponse<PermissionAuditFixResponse>>('/v1/system/roles/permission-audit/fix', data)
  return res
}
