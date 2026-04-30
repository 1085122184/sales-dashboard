<template>
  <div class="role-page">
    <section class="hero-card">
      <div>
        <h1 class="hero-title">系统权限管理</h1>
        <p class="hero-subtitle">账号和角色分开维护，角色负责菜单权限，账号负责登录身份和角色绑定。</p>
      </div>
      <div class="hero-actions">
        <el-button v-if="activeTab === 'users'" type="primary" @click="handleAddUser()">新增账号</el-button>
        <el-button v-else type="primary" @click="handleAddRole">新增角色</el-button>
      </div>
    </section>

    <section class="panel-card">
      <el-tabs v-model="activeTab" class="management-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="账号管理" name="users">
          <el-form :model="userQueryForm" inline class="query-form">
            <el-form-item label="用户名">
              <el-input
                v-model.trim="userQueryForm.username"
                placeholder="请输入用户名"
                clearable
                @keyup.enter="handleUserSearch"
              />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input
                v-model.trim="userQueryForm.mobile"
                placeholder="请输入手机号"
                clearable
                @keyup.enter="handleUserSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="userQueryForm.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="正常" :value="1" />
                <el-option label="停用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUserSearch">查询</el-button>
              <el-button @click="handleUserReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-summary">共 {{ userTotal }} 个账号</div>
            <div class="toolbar-actions">
              <el-button :loading="userLoading" @click="fetchUserList">刷新</el-button>
              <el-button type="primary" @click="handleAddUser()">新增账号</el-button>
            </div>
          </div>

          <el-table :data="userList" v-loading="userLoading" border stripe class="role-table">
            <el-table-column prop="id" label="账号 ID" width="96" align="center" />
            <el-table-column prop="username" label="用户名" min-width="130" />
            <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="realName" label="真实姓名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="mobile" label="手机号" min-width="140" />
            <el-table-column label="角色" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag
                  v-for="roleName in row.roleNames"
                  :key="roleName"
                  size="small"
                  class="role-tag"
                >
                  {{ roleName }}
                </el-tag>
                <span v-if="!row.roleNames?.length" class="empty-text">未分配</span>
              </template>
            </el-table-column>
            <el-table-column label="钉钉绑定" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="row.dingUserId ? 'success' : 'info'" size="small">
                  {{ row.dingUserId ? '已绑定' : '未绑定' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="handleUserStatusSwitchChange(row, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditUser(row)">编辑</el-button>
                <el-button link type="danger" @click="handleDeleteUser(row)">删除</el-button>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="暂无账号数据" />
            </template>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="userQueryForm.pageNum"
              v-model:page-size="userQueryForm.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="userTotal"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handleUserSizeChange"
              @current-change="handleUserCurrentChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="角色管理" name="roles">
          <el-form :model="roleQueryForm" inline class="query-form">
            <el-form-item label="角色名称">
              <el-input
                v-model.trim="roleQueryForm.roleName"
                placeholder="请输入角色名称"
                clearable
                @keyup.enter="handleRoleSearch"
              />
            </el-form-item>
            <el-form-item label="权限字符">
              <el-input
                v-model.trim="roleQueryForm.roleKey"
                placeholder="请输入权限字符"
                clearable
                @keyup.enter="handleRoleSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="roleQueryForm.status" placeholder="全部" clearable style="width: 140px">
                <el-option label="正常" :value="1" />
                <el-option label="停用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRoleSearch">查询</el-button>
              <el-button @click="handleRoleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="table-toolbar">
            <div class="toolbar-summary">共 {{ roleTotal }} 个角色</div>
            <div class="toolbar-actions">
              <el-button :loading="roleLoading" @click="fetchRoleList">刷新</el-button>
              <el-button type="primary" @click="handleAddRole">新增角色</el-button>
            </div>
          </div>

          <el-table :data="roleList" v-loading="roleLoading" border stripe class="role-table">
            <el-table-column prop="id" label="角色 ID" width="96" align="center" />
            <el-table-column prop="roleName" label="角色名称" min-width="160" />
            <el-table-column prop="roleKey" label="权限字符" min-width="180" />
            <el-table-column prop="roleSort" label="排序" width="90" align="center" />
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="handleRoleStatusSwitchChange(row, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="310" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleEditRole(row)">编辑</el-button>
                <el-button link type="success" @click="handlePermission(row)">分配权限</el-button>
                <el-button link type="warning" @click="handleAddUser(row)">新增账号</el-button>
                <el-button link type="danger" @click="handleDeleteRole(row)">删除</el-button>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="暂无角色数据" />
            </template>
          </el-table>

          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="roleQueryForm.pageNum"
              v-model:page-size="roleQueryForm.pageSize"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="roleTotal"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handleRoleSizeChange"
              @current-change="handleRoleCurrentChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog
      v-model="roleDialog.visible"
      :title="roleDialog.mode === 'add' ? '新增角色' : '编辑角色'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="92px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model.trim="roleForm.roleName" maxlength="30" show-word-limit placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model.trim="roleForm.roleKey" maxlength="60" show-word-limit placeholder="如：system:role:list" />
        </el-form-item>
        <el-form-item label="显示排序" prop="roleSort">
          <el-input-number v-model="roleForm.roleSort" :min="0" :max="9999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model.trim="roleForm.remark"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="roleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="roleDialog.submitLoading" @click="submitRole">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="userDialog.visible"
      :title="userDialog.mode === 'add' ? '新增账号' : '编辑账号'"
      width="660px"
      destroy-on-close
    >
      <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="92px">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model.trim="userForm.username"
                maxlength="50"
                show-word-limit
                :disabled="userDialog.mode === 'edit'"
                placeholder="请输入用户名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="userDialog.mode === 'add' ? '初始密码' : '重置密码'" prop="password">
              <el-input
                v-model.trim="userForm.password"
                type="password"
                maxlength="64"
                show-password
                :placeholder="userDialog.mode === 'add' ? '至少 6 位' : '不填则不修改'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model.trim="userForm.nickname" maxlength="100" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model.trim="userForm.realName" maxlength="100" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model.trim="userForm.mobile" maxlength="30" placeholder="钉钉免登可用手机号自动绑定" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model.trim="userForm.email" maxlength="100" placeholder="可选" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="账号状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="分配角色" prop="roleIds">
          <el-select
            v-model="userForm.roleIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
              :disabled="!role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="userDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="userDialog.submitLoading" @click="submitUser">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialog.visible" title="分配权限" width="560px" destroy-on-close>
      <div class="permission-header">
        <div class="permission-role">
          当前角色：
          <span>{{ permissionDialog.currentRoleName || '-' }}</span>
        </div>
        <el-button text @click="clearTreeSelection">清空</el-button>
      </div>

      <div v-loading="permissionDialog.loading" class="permission-tree-wrap">
        <el-tree
          ref="menuTreeRef"
          :data="menuOptions"
          show-checkbox
          node-key="id"
          default-expand-all
          :props="{ label: 'menuName', children: 'children' }"
          empty-text="暂无菜单数据"
        />
      </div>

      <template #footer>
        <el-button @click="permissionDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="permissionDialog.submitLoading" @click="submitPermission">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  addRole,
  addUser,
  deleteRole,
  deleteUser,
  getMenuTree,
  getRoleMenuIds,
  getRolePage,
  getUserPage,
  saveRoleMenus,
  updateRole,
  updateUser
} from '@/api/system-api'
import type {
  MenuTreeNode,
  RoleItem,
  RolePayload,
  RoleQuery,
  UserCreatePayload,
  UserItem,
  UserQuery,
  UserUpdatePayload
} from '@/types'

type UserFormModel = UserCreatePayload & { id?: number }

const activeTab = ref<'users' | 'roles'>('users')
const roleLoading = ref(false)
const userLoading = ref(false)
const roleTotal = ref(0)
const userTotal = ref(0)
const roleList = ref<RoleItem[]>([])
const userList = ref<UserItem[]>([])
const roleOptions = ref<RoleItem[]>([])
const menuOptions = ref<MenuTreeNode[]>([])

const roleFormRef = ref<FormInstance>()
const userFormRef = ref<FormInstance>()
const menuTreeRef = ref<any>()

const defaultRoleQueryForm = (): RoleQuery => ({
  pageNum: 1,
  pageSize: 10,
  roleName: '',
  roleKey: '',
  status: undefined
})

const defaultUserQueryForm = (): UserQuery => ({
  pageNum: 1,
  pageSize: 10,
  username: '',
  mobile: '',
  status: undefined
})

const defaultRoleForm = (): RolePayload => ({
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: 1,
  remark: ''
})

const defaultUserForm = (): UserFormModel => ({
  username: '',
  password: '',
  nickname: '',
  realName: '',
  email: '',
  mobile: '',
  status: 1,
  roleIds: []
})

const roleQueryForm = reactive<RoleQuery>(defaultRoleQueryForm())
const userQueryForm = reactive<UserQuery>(defaultUserQueryForm())
const roleForm = reactive<RolePayload>(defaultRoleForm())
const userForm = reactive<UserFormModel>(defaultUserForm())

const roleDialog = reactive({
  visible: false,
  mode: 'add' as 'add' | 'edit',
  submitLoading: false
})

const userDialog = reactive({
  visible: false,
  mode: 'add' as 'add' | 'edit',
  submitLoading: false
})

const permissionDialog = reactive({
  visible: false,
  loading: false,
  submitLoading: false,
  currentRoleId: 0,
  currentRoleName: '',
  checkedKeys: [] as number[]
})

const roleRules: FormRules<RolePayload> = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 30, message: '角色名称长度为 2-30 个字符', trigger: 'blur' }
  ],
  roleKey: [
    { required: true, message: '请输入权限字符', trigger: 'blur' },
    { min: 2, max: 60, message: '权限字符长度为 2-60 个字符', trigger: 'blur' }
  ],
  roleSort: [
    { required: true, message: '请输入显示排序', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const userRules: FormRules<UserFormModel> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度为 2-50 个字符', trigger: 'blur' }
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (userDialog.mode === 'add' && !value) {
          callback(new Error('请输入初始密码'))
          return
        }
        if (value && (value.length < 6 || value.length > 64)) {
          callback(new Error('密码长度为 6-64 个字符'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择账号状态', trigger: 'change' }
  ],
  roleIds: [
    { type: 'array', required: true, min: 1, message: '请至少选择一个角色', trigger: 'change' }
  ]
}

onMounted(async () => {
  await Promise.all([fetchUserList(), fetchRoleList(), fetchRoleOptions(), fetchMenuTree()])
})

function handleTabChange() {
  if (activeTab.value === 'users') {
    fetchUserList()
  } else {
    fetchRoleList()
  }
}

async function fetchUserList() {
  userLoading.value = true
  try {
    const res = await getUserPage({ ...userQueryForm })
    const pageData = res.data || {}
    userList.value = pageData.list || pageData.rows || []
    userTotal.value = Number(pageData.total ?? userList.value.length ?? 0)
  } catch (error: any) {
    ElMessage.error(error?.message || '账号列表加载失败')
  } finally {
    userLoading.value = false
  }
}

async function fetchRoleList() {
  roleLoading.value = true
  try {
    const res = await getRolePage({ ...roleQueryForm })
    const pageData = res.data || {}
    roleList.value = pageData.list || pageData.rows || []
    roleTotal.value = Number(pageData.total ?? roleList.value.length ?? 0)
  } catch (error: any) {
    ElMessage.error(error?.message || '角色列表加载失败')
  } finally {
    roleLoading.value = false
  }
}

async function fetchRoleOptions() {
  try {
    const res = await getRolePage({
      pageNum: 1,
      pageSize: 100,
      roleName: '',
      roleKey: '',
      status: 1
    })
    const pageData = res.data || {}
    roleOptions.value = pageData.list || pageData.rows || []
  } catch (error: any) {
    ElMessage.error(error?.message || '角色选项加载失败')
  }
}

async function fetchMenuTree() {
  if (menuOptions.value.length > 0) return
  try {
    const res = await getMenuTree()
    menuOptions.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error?.message || '菜单树加载失败')
  }
}

function handleUserSearch() {
  userQueryForm.pageNum = 1
  fetchUserList()
}

function handleUserReset() {
  Object.assign(userQueryForm, defaultUserQueryForm())
  fetchUserList()
}

function handleUserSizeChange() {
  userQueryForm.pageNum = 1
  fetchUserList()
}

function handleUserCurrentChange() {
  fetchUserList()
}

function handleRoleSearch() {
  roleQueryForm.pageNum = 1
  fetchRoleList()
}

function handleRoleReset() {
  Object.assign(roleQueryForm, defaultRoleQueryForm())
  fetchRoleList()
}

function handleRoleSizeChange() {
  roleQueryForm.pageNum = 1
  fetchRoleList()
}

function handleRoleCurrentChange() {
  fetchRoleList()
}

function resetRoleForm() {
  Object.assign(roleForm, defaultRoleForm())
}

function fillRoleForm(row: RoleItem) {
  Object.assign(roleForm, {
    id: row.id,
    roleName: row.roleName,
    roleKey: row.roleKey,
    roleSort: row.roleSort ?? 0,
    status: row.status ?? 1,
    remark: row.remark ?? ''
  })
}

async function openRoleDialog(mode: 'add' | 'edit', row?: RoleItem) {
  roleDialog.mode = mode
  roleDialog.visible = true
  resetRoleForm()
  if (row) fillRoleForm(row)
  await nextTick()
  roleFormRef.value?.clearValidate()
}

function handleAddRole() {
  openRoleDialog('add')
}

function handleEditRole(row: RoleItem) {
  openRoleDialog('edit', row)
}

function resetUserForm() {
  Object.assign(userForm, defaultUserForm())
}

function fillUserForm(row: UserItem) {
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    password: '',
    nickname: row.nickname ?? '',
    realName: row.realName ?? '',
    email: row.email ?? '',
    mobile: row.mobile ?? '',
    status: row.status ?? 1,
    roleIds: row.roleIds || []
  })
}

async function handleAddUser(row?: RoleItem) {
  userDialog.mode = 'add'
  resetUserForm()
  if (row?.id) {
    userForm.roleIds = [row.id]
  }
  await ensureRoleOptions()
  userDialog.visible = true
  await nextTick()
  userFormRef.value?.clearValidate()
}

async function handleEditUser(row: UserItem) {
  userDialog.mode = 'edit'
  resetUserForm()
  fillUserForm(row)
  await ensureRoleOptions()
  userDialog.visible = true
  await nextTick()
  userFormRef.value?.clearValidate()
}

async function ensureRoleOptions() {
  if (roleOptions.value.length === 0) {
    await fetchRoleOptions()
  }
}

async function submitUser() {
  if (!userFormRef.value) return
  await userFormRef.value.validate()
  userDialog.submitLoading = true
  try {
    if (userDialog.mode === 'add') {
      await addUser({ ...userForm })
      ElMessage.success('账号新增成功')
    } else {
      const payload: UserUpdatePayload = {
        id: userForm.id!,
        password: userForm.password || undefined,
        nickname: userForm.nickname,
        realName: userForm.realName,
        email: userForm.email,
        mobile: userForm.mobile,
        status: userForm.status,
        roleIds: userForm.roleIds
      }
      await updateUser(payload)
      ElMessage.success('账号更新成功')
    }
    userDialog.visible = false
    await fetchUserList()
  } catch (error: any) {
    ElMessage.error(error?.message || '账号保存失败')
  } finally {
    userDialog.submitLoading = false
  }
}

async function submitRole() {
  if (!roleFormRef.value) return
  await roleFormRef.value.validate()
  roleDialog.submitLoading = true
  try {
    if (roleDialog.mode === 'add') {
      await addRole({ ...roleForm })
      ElMessage.success('角色新增成功')
    } else {
      await updateRole({ ...roleForm })
      ElMessage.success('角色更新成功')
    }
    roleDialog.visible = false
    await Promise.all([fetchRoleList(), fetchRoleOptions(), fetchUserList()])
  } catch (error: any) {
    ElMessage.error(error?.message || '角色保存失败')
  } finally {
    roleDialog.submitLoading = false
  }
}

async function handleDeleteRole(row: RoleItem) {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`确认删除角色“${row.roleName}”吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    if (roleList.value.length === 1 && roleQueryForm.pageNum > 1) {
      roleQueryForm.pageNum -= 1
    }
    await Promise.all([fetchRoleList(), fetchRoleOptions(), fetchUserList()])
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除失败')
  }
}

async function handleDeleteUser(row: UserItem) {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`确认删除账号“${row.username}”吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    if (userList.value.length === 1 && userQueryForm.pageNum > 1) {
      userQueryForm.pageNum -= 1
    }
    await fetchUserList()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除失败')
  }
}

async function handleRoleStatusChange(row: RoleItem, value: number) {
  const previous = row.status
  try {
    await updateRole({
      id: row.id,
      roleName: row.roleName,
      roleKey: row.roleKey,
      roleSort: row.roleSort,
      status: value,
      remark: row.remark
    })
    row.status = value
    ElMessage.success(`角色已${value === 1 ? '启用' : '停用'}`)
    await fetchUserList()
  } catch (error) {
    row.status = previous
    ElMessage.error((error as Error)?.message || '状态更新失败')
  }
}

async function handleUserStatusChange(row: UserItem, value: number) {
  const previous = row.status
  try {
    await updateUser({
      id: row.id,
      nickname: row.nickname,
      realName: row.realName,
      email: row.email,
      mobile: row.mobile,
      status: value,
      roleIds: row.roleIds || []
    })
    row.status = value
    ElMessage.success(`账号已${value === 1 ? '启用' : '停用'}`)
  } catch (error) {
    row.status = previous
    ElMessage.error((error as Error)?.message || '状态更新失败')
  }
}

function handleRoleStatusSwitchChange(row: RoleItem, value: string | number | boolean) {
  handleRoleStatusChange(row, Number(value))
}

function handleUserStatusSwitchChange(row: UserItem, value: string | number | boolean) {
  handleUserStatusChange(row, Number(value))
}

async function handlePermission(row: RoleItem) {
  if (!row.id) return
  permissionDialog.currentRoleId = row.id
  permissionDialog.currentRoleName = row.roleName
  permissionDialog.visible = true
  permissionDialog.loading = true
  permissionDialog.checkedKeys = []

  try {
    await fetchMenuTree()
    const res = await getRoleMenuIds(row.id)
    permissionDialog.checkedKeys = res.data || []
    await nextTick()
    menuTreeRef.value?.setCheckedKeys(permissionDialog.checkedKeys, false)
  } catch (error: any) {
    ElMessage.error(error?.message || '角色权限加载失败')
  } finally {
    permissionDialog.loading = false
  }
}

function clearTreeSelection() {
  menuTreeRef.value?.setCheckedKeys([], false)
}

async function submitPermission() {
  if (!permissionDialog.currentRoleId) return
  permissionDialog.submitLoading = true
  try {
    const checkedKeys = menuTreeRef.value?.getCheckedKeys?.(false) || []
    const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys?.() || []
    const finalMenuIds = Array.from(new Set([...checkedKeys, ...halfCheckedKeys])) as number[]
    await saveRoleMenus(permissionDialog.currentRoleId, finalMenuIds)
    ElMessage.success('权限分配成功')
    permissionDialog.visible = false
  } catch (error: any) {
    ElMessage.error(error?.message || '权限分配失败')
  } finally {
    permissionDialog.submitLoading = false
  }
}
</script>

<style scoped>
.role-page {
  min-height: 100%;
  padding: 20px;
  background: #f8fafc;
}

.hero-card,
.panel-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #f8fafc 100%);
}

.hero-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.hero-subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.hero-actions,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-card {
  padding: 18px 20px 20px;
}

.management-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 14px;
}

.toolbar-summary {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.role-table {
  width: 100%;
}

.role-tag {
  margin: 2px 4px 2px 0;
}

.empty-text {
  color: #94a3b8;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.permission-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.permission-role {
  font-size: 14px;
  color: #475569;
}

.permission-role span {
  color: #0f172a;
  font-weight: 700;
}

.permission-tree-wrap {
  min-height: 260px;
  max-height: 420px;
  overflow: auto;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

@media (max-width: 768px) {
  .role-page {
    padding: 12px;
  }

  .hero-card {
    flex-direction: column;
    align-items: stretch;
    padding: 18px 16px;
  }

  .hero-actions,
  .toolbar-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .panel-card {
    padding: 14px 12px 16px;
  }

  .query-form {
    display: block;
  }

  .query-form :deep(.el-form-item) {
    margin-right: 0;
  }

  .table-toolbar,
  .pagination-wrap {
    align-items: flex-start;
    justify-content: space-between;
  }
}
</style>
