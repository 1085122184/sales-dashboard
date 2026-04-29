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

export interface MenuTreeNode {
  id: number
  menuName: string
  parentId?: number
  children?: MenuTreeNode[]
}
