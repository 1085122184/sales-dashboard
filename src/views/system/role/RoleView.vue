<template>
  <div class="role-page">
    <section class="hero-card">
      <div>
        <h1 class="hero-title">系统权限管理</h1>
      </div>
      <div class="hero-actions">
        <el-button type="warning" plain @click="openPermissionAudit">权限体检</el-button>
        <template v-if="activeTab === 'users'">
          <el-button @click="openDingTalkImportDialog">从钉钉导入</el-button>
          <el-button type="primary" @click="handleAddUser()">新增账号</el-button>
        </template>
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
              <el-button @click="openDingTalkImportDialog">从钉钉导入</el-button>
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

    <el-dialog
      v-model="dingTalkImportDialog.visible"
      title="从钉钉导入账号"
      width="1080px"
      destroy-on-close
      class="dingtalk-import-dialog"
      @closed="resetDingTalkImportState"
    >
      <div class="dingtalk-import-layout">
        <aside class="dingtalk-dept-panel">
          <div class="import-panel-title">组织架构</div>
          <el-tree
            ref="dingTalkDeptTreeRef"
            lazy
            node-key="deptId"
            :load="loadDingTalkDeptNode"
            :props="dingTalkDeptTreeProps"
            highlight-current
            empty-text="暂无部门"
            @node-click="handleDingTalkDeptClick"
          />
        </aside>

        <main class="dingtalk-user-panel">
          <div class="dingtalk-import-controls">
            <div class="selected-dept-name">{{ dingTalkImportDialog.selectedDeptName || '请选择部门' }}</div>
            <el-switch
              v-model="dingTalkImportDialog.includeChildren"
              active-text="包含子部门"
              inactive-text="仅直属"
              @change="reloadDingTalkUsers"
            />
          </div>

          <el-table
            ref="dingTalkUserTableRef"
            :data="dingTalkUserList"
            v-loading="dingTalkImportDialog.userLoading"
            border
            stripe
            height="100%"
            class="role-table dingtalk-user-table"
            @selection-change="handleDingTalkSelectionChange"
          >
            <el-table-column type="selection" width="48" :selectable="isDingTalkUserSelectable" />
            <el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="mobile" label="手机号" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.mobile || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="position" label="职位" min-width="130" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.position || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="email" label="邮箱" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.email || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="导入状态" width="136" align="center">
              <template #default="{ row }">
                <el-tooltip
                  v-if="row.importStatus === 'CONFLICT'"
                  :content="row.conflictReason || '账号冲突'"
                  placement="top"
                >
                  <el-tag type="danger" size="small">冲突</el-tag>
                </el-tooltip>
                <el-tag v-else :type="row.importStatus === 'NEW' ? 'success' : 'warning'" size="small">
                  {{ getDingTalkImportStatusLabel(row.importStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="existingUsername" label="系统账号" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.existingUsername || '-' }}
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="暂无钉钉人员" />
            </template>
          </el-table>

          <div class="dingtalk-import-footer-form">
            <el-select
              v-model="dingTalkImportForm.roleIds"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择导入账号角色"
              class="dingtalk-role-select"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role.id"
                :label="role.roleName"
                :value="role.id"
                :disabled="!role.id"
              />
            </el-select>
            <el-radio-group v-model="dingTalkImportForm.status">
              <el-radio-button :label="1">正常</el-radio-button>
              <el-radio-button :label="0">停用</el-radio-button>
            </el-radio-group>
            <el-button
              :disabled="!dingTalkImportDialog.hasMore"
              :loading="dingTalkImportDialog.userLoading"
              @click="loadMoreDingTalkUsers"
            >
              加载更多
            </el-button>
          </div>
        </main>
      </div>

      <template #footer>
        <div class="dingtalk-import-footer">
          <span>已选择 {{ dingTalkSelectedUsers.length }} 人</span>
          <div>
            <el-button @click="dingTalkImportDialog.visible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="dingTalkImportDialog.submitLoading"
              @click="submitDingTalkImport"
            >
              导入账号
            </el-button>
          </div>
        </div>
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

      <el-input
        v-model.trim="permissionFilterText"
        class="permission-filter"
        placeholder="搜索菜单、权限标识或路径"
        clearable
      />

      <div v-loading="permissionDialog.loading" class="permission-tree-wrap">
        <el-tree
          ref="menuTreeRef"
          :data="menuOptions"
          show-checkbox
          node-key="id"
          default-expand-all
          :props="{ label: 'menuName', children: 'children' }"
          :filter-node-method="filterMenuNode"
          empty-text="暂无菜单数据"
        />
      </div>

      <template #footer>
        <el-button @click="permissionDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="permissionDialog.submitLoading" @click="submitPermission">保存权限</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionAuditDialog.visible" title="权限体检" width="920px" destroy-on-close>
      <div v-loading="permissionAuditDialog.loading" class="permission-audit">
        <template v-if="permissionAuditResult">
          <div class="audit-summary-grid">
            <div class="audit-summary-item">
              <span>受控路由</span>
              <strong>{{ permissionAuditResult.summary.protectedRouteCount }}</strong>
            </div>
            <div class="audit-summary-item">
              <span>数据库路径</span>
              <strong>{{ permissionAuditResult.summary.menuPathCount }}</strong>
            </div>
            <div class="audit-summary-item">
              <span>数据库权限</span>
              <strong>{{ permissionAuditResult.summary.menuPermissionCount }}</strong>
            </div>
            <div class="audit-summary-item danger">
              <span>错误</span>
              <strong>{{ permissionAuditResult.summary.errorCount }}</strong>
            </div>
            <div class="audit-summary-item warning">
              <span>警告</span>
              <strong>{{ permissionAuditResult.summary.warningCount }}</strong>
            </div>
            <div class="audit-summary-item fixable">
              <span>可补入</span>
              <strong>{{ permissionAuditResult.summary.fixableCount }}</strong>
            </div>
          </div>

          <el-alert
            v-if="permissionAuditResult.issues.length === 0"
            type="success"
            title="当前前端受控路由与数据库菜单权限一致"
            show-icon
            :closable="false"
          />

          <el-table
            v-else
            :data="permissionAuditResult.issues"
            border
            stripe
            max-height="430"
            class="audit-table"
          >
            <el-table-column label="级别" width="92" align="center">
              <template #default="{ row }">
                <el-tag :type="row.severity === 'error' ? 'danger' : 'warning'" size="small">
                  {{ row.severity === 'error' ? '错误' : '警告' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="138">
              <template #default="{ row }">
                {{ getAuditIssueTypeLabel(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="routePath" label="路由/路径" min-width="150" show-overflow-tooltip />
            <el-table-column prop="permission" label="权限标识" min-width="210" show-overflow-tooltip />
            <el-table-column label="可修复" width="92" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.fixable" type="success" size="small">可补入</el-tag>
                <span v-else class="empty-text">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="说明" min-width="300" show-overflow-tooltip />
          </el-table>
        </template>
      </div>
      <template #footer>
        <el-button @click="permissionAuditDialog.visible = false">关闭</el-button>
        <el-button
          v-if="permissionAuditResult?.summary.fixableCount"
          type="success"
          :loading="permissionAuditDialog.fixing"
          @click="fixPermissionAuditIssues"
        >
          补入数据库
        </el-button>
        <el-button type="primary" :loading="permissionAuditDialog.loading" @click="openPermissionAudit">重新检查</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  addRole,
  addUser,
  deleteRole,
  deleteUser,
  auditRoutePermissions,
  fixMissingRoutePermissions,
  getDingTalkDepartments,
  getDingTalkUsers,
  getMenuTree,
  getRoleMenuIds,
  getRolePage,
  getUserPage,
  importDingTalkUsers,
  saveRoleMenus,
  updateRole,
  updateUser
} from '@/api/system-api'
import { appRoutes } from '@/router/routes'
import { appendRoutePermissionConfigIssues, collectRoutePermissionPayload } from '@/utils/permissionAudit'
import type {
  MenuTreeNode,
  PermissionAuditResponse,
  PermissionAuditIssue,
  DingTalkDepartmentNode,
  DingTalkUserCandidate,
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
const dingTalkUserList = ref<DingTalkUserCandidate[]>([])
const dingTalkSelectedUsers = ref<DingTalkUserCandidate[]>([])
const permissionFilterText = ref('')
const permissionAuditResult = ref<PermissionAuditResponse | null>(null)

const roleFormRef = ref<FormInstance>()
const userFormRef = ref<FormInstance>()
const menuTreeRef = ref<any>()
const dingTalkDeptTreeRef = ref<any>()
const dingTalkUserTableRef = ref<any>()

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

const defaultDingTalkImportForm = () => ({
  roleIds: [] as number[],
  status: 1
})

const roleQueryForm = reactive<RoleQuery>(defaultRoleQueryForm())
const userQueryForm = reactive<UserQuery>(defaultUserQueryForm())
const roleForm = reactive<RolePayload>(defaultRoleForm())
const userForm = reactive<UserFormModel>(defaultUserForm())
const dingTalkImportForm = reactive(defaultDingTalkImportForm())

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

const dingTalkImportDialog = reactive({
  visible: false,
  deptLoading: false,
  userLoading: false,
  submitLoading: false,
  includeChildren: false,
  selectedDeptId: 1,
  selectedDeptName: '',
  nextCursor: 0 as number | null,
  hasMore: false
})

const permissionDialog = reactive({
  visible: false,
  loading: false,
  submitLoading: false,
  currentRoleId: 0,
  currentRoleName: '',
  checkedKeys: [] as number[]
})

const permissionAuditDialog = reactive({
  visible: false,
  loading: false,
  fixing: false
})

const auditIssueTypeLabels: Record<PermissionAuditIssue['type'], string> = {
  'missing-permission': '权限缺失',
  'missing-route-path': '路径未登记',
  'route-without-permission': '路由未配置权限',
  'orphan-menu-path': '历史菜单路径',
  'duplicate-menu-path': '路径重复'
}

const dingTalkDeptTreeProps = {
  label: 'name',
  children: 'children',
  isLeaf: 'leaf'
}

watch(permissionFilterText, (value) => {
  menuTreeRef.value?.filter?.(value)
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

async function fetchMenuTree(force = false) {
  if (!force && menuOptions.value.length > 0) return
  try {
    const res = await getMenuTree()
    menuOptions.value = res.data || []
  } catch (error: any) {
    ElMessage.error(error?.message || '菜单树加载失败')
  }
}

async function openDingTalkImportDialog() {
  await ensureRoleOptions()
  resetDingTalkImportState()
  dingTalkImportDialog.visible = true
}

function resetDingTalkImportState() {
  dingTalkUserList.value = []
  dingTalkSelectedUsers.value = []
  Object.assign(dingTalkImportForm, defaultDingTalkImportForm())
  Object.assign(dingTalkImportDialog, {
    deptLoading: false,
    userLoading: false,
    submitLoading: false,
    includeChildren: false,
    selectedDeptId: 1,
    selectedDeptName: '',
    nextCursor: 0,
    hasMore: false
  })
}

async function loadDingTalkDeptNode(node: any, resolve: (data: DingTalkDepartmentNode[]) => void) {
  const deptId = node.level === 0 ? 1 : Number(node.data?.deptId || 1)
  try {
    const res = await getDingTalkDepartments({ deptId })
    const departments = res.data || []
    if (node.level === 0) {
      resolve([{ deptId: 1, parentId: 0, name: '钉钉组织', leaf: departments.length === 0, children: departments }])
      return
    }
    resolve(departments)
  } catch (error: any) {
    ElMessage.error(error?.message || '钉钉部门加载失败')
    resolve([])
  }
}

function handleDingTalkDeptClick(data: DingTalkDepartmentNode) {
  dingTalkImportDialog.selectedDeptId = data.deptId
  dingTalkImportDialog.selectedDeptName = data.name
  reloadDingTalkUsers()
}

async function reloadDingTalkUsers() {
  dingTalkImportDialog.nextCursor = 0
  dingTalkImportDialog.hasMore = false
  dingTalkUserList.value = []
  dingTalkSelectedUsers.value = []
  dingTalkUserTableRef.value?.clearSelection?.()
  await fetchDingTalkUsers(false)
}

async function fetchDingTalkUsers(append: boolean) {
  if (!dingTalkImportDialog.selectedDeptId) {
    ElMessage.warning('请先选择钉钉部门')
    return
  }
  dingTalkImportDialog.userLoading = true
  try {
    const res = await getDingTalkUsers({
      deptId: dingTalkImportDialog.selectedDeptId,
      includeChildren: dingTalkImportDialog.includeChildren,
      cursor: dingTalkImportDialog.nextCursor ?? 0,
      size: 50
    })
    const pageData = res.data || { list: [] }
    dingTalkUserList.value = append
      ? mergeDingTalkUsers(dingTalkUserList.value, pageData.list || [])
      : (pageData.list || [])
    dingTalkImportDialog.hasMore = Boolean(pageData.hasMore)
    dingTalkImportDialog.nextCursor = pageData.nextCursor ?? null
  } catch (error: any) {
    ElMessage.error(error?.message || '钉钉人员加载失败')
  } finally {
    dingTalkImportDialog.userLoading = false
  }
}

function mergeDingTalkUsers(
  existing: DingTalkUserCandidate[],
  incoming: DingTalkUserCandidate[]
): DingTalkUserCandidate[] {
  const map = new Map<string, DingTalkUserCandidate>()
  for (const item of existing) {
    map.set(item.dingUserId, item)
  }
  for (const item of incoming) {
    map.set(item.dingUserId, item)
  }
  return Array.from(map.values())
}

function loadMoreDingTalkUsers() {
  fetchDingTalkUsers(true)
}

function isDingTalkUserSelectable(row: DingTalkUserCandidate) {
  return row.importStatus !== 'CONFLICT'
}

function handleDingTalkSelectionChange(selection: DingTalkUserCandidate[]) {
  dingTalkSelectedUsers.value = selection
}

function getDingTalkImportStatusLabel(status: string) {
  if (status === 'NEW') return '新增'
  if (status === 'EXISTS') return '覆盖更新'
  if (status === 'CONFLICT') return '冲突'
  return status || '-'
}

async function submitDingTalkImport() {
  if (dingTalkSelectedUsers.value.length === 0) {
    ElMessage.warning('请先勾选要导入的钉钉人员')
    return
  }
  if (dingTalkImportForm.roleIds.length === 0) {
    ElMessage.warning('请至少选择一个系统角色')
    return
  }

  try {
    const updateCount = dingTalkSelectedUsers.value.filter(item => item.importStatus === 'EXISTS').length
    if (updateCount > 0) {
      await ElMessageBox.confirm(
        `本次将覆盖更新 ${updateCount} 个已存在账号的资料、角色和状态。确认继续吗？`,
        '覆盖更新确认',
        {
          type: 'warning',
          confirmButtonText: '继续导入',
          cancelButtonText: '取消'
        }
      )
    }
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }

  dingTalkImportDialog.submitLoading = true
  try {
    const res = await importDingTalkUsers({
      dingUserIds: dingTalkSelectedUsers.value.map(item => item.dingUserId),
      roleIds: dingTalkImportForm.roleIds,
      status: dingTalkImportForm.status
    })
    const result = res.data || {
      createdCount: 0,
      updatedCount: 0,
      conflictCount: 0,
      failedCount: 0,
      rows: []
    }
    ElMessage.success(
      `导入完成：新增 ${result.createdCount}，更新 ${result.updatedCount}，冲突 ${result.conflictCount}，失败 ${result.failedCount}`
    )
    dingTalkImportDialog.visible = false
    await fetchUserList()
  } catch (error: any) {
    ElMessage.error(error?.message || '钉钉人员导入失败')
  } finally {
    dingTalkImportDialog.submitLoading = false
  }
}

function getParentMenuIds(treeData: MenuTreeNode[]): number[] {
  const parentIds: number[] = []
  function traverse(nodes: MenuTreeNode[]) {
    for (const node of nodes) {
      // 如果存在 children 且长度大于 0，说明它是父节点
      if (node.children && node.children.length > 0) {
        parentIds.push(node.id)
        traverse(node.children)
      }
    }
  }
  traverse(treeData)
  return parentIds
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
  permissionFilterText.value = ''

  try {
    await fetchMenuTree()
    
    const res = await getRoleMenuIds(row.id)
    const allAssignedIds = res.data || []

    const parentIds = getParentMenuIds(menuOptions.value)
    const leafIdsToEcho = allAssignedIds.filter(id => !parentIds.includes(id))

    permissionDialog.checkedKeys = leafIdsToEcho
    
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

function filterMenuNode(value: string, data: MenuTreeNode) {
  if (!value) return true
  const keyword = value.toLowerCase()
  return [data.menuName, data.perms, data.path, data.remark]
    .filter(Boolean)
    .some(item => String(item).toLowerCase().includes(keyword))
}

async function openPermissionAudit() {
  permissionAuditDialog.visible = true
  permissionAuditDialog.loading = true
  permissionAuditResult.value = null
  try {
    const payload = buildPermissionAuditPayload()
    const res = await auditRoutePermissions(payload)
    permissionAuditResult.value = appendRoutePermissionConfigIssues(res.data, appRoutes)
  } catch (error: any) {
    ElMessage.error(error?.message || '权限体检失败')
  } finally {
    permissionAuditDialog.loading = false
  }
}

async function fixPermissionAuditIssues() {
  if (!permissionAuditResult.value?.summary.fixableCount) return

  try {
    await ElMessageBox.confirm(
      `将向数据库补入 ${permissionAuditResult.value.summary.fixableCount} 个缺失权限，并默认授权给 system:admin。确认继续吗？`,
      '补入数据库确认',
      {
        type: 'warning',
        confirmButtonText: '补入数据库',
        cancelButtonText: '取消'
      }
    )
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }

  permissionAuditDialog.fixing = true
  try {
    const res = await fixMissingRoutePermissions(buildPermissionAuditPayload())
    permissionAuditResult.value = appendRoutePermissionConfigIssues(res.data.audit, appRoutes)
    menuOptions.value = []
    await fetchMenuTree(true)
    ElMessage.success(`已补入 ${res.data.insertedCount} 个权限`)
  } catch (error: any) {
    ElMessage.error(error?.message || '补入数据库失败')
  } finally {
    permissionAuditDialog.fixing = false
  }
}

function buildPermissionAuditPayload() {
  return {
    routes: collectRoutePermissionPayload(appRoutes)
  }
}

function getAuditIssueTypeLabel(type: PermissionAuditIssue['type']) {
  return auditIssueTypeLabels[type] || type
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

.permission-filter {
  margin: 0 0 12px;
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

.dingtalk-import-dialog :deep(.el-dialog) {
  max-height: 86vh;
  display: flex;
  flex-direction: column;
}

.dingtalk-import-dialog :deep(.el-dialog__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.dingtalk-import-dialog :deep(.el-dialog__footer) {
  flex: 0 0 auto;
}

.dingtalk-import-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  height: min(620px, calc(86vh - 142px));
  min-height: 420px;
  overflow: hidden;
}

.dingtalk-dept-panel,
.dingtalk-user-panel {
  min-width: 0;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.dingtalk-dept-panel {
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: auto;
}

.import-panel-title {
  flex: 0 0 auto;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.dingtalk-dept-panel :deep(.el-tree) {
  flex: 1;
  min-height: 0;
}

.dingtalk-user-panel {
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}

.dingtalk-import-controls,
.dingtalk-import-footer-form,
.dingtalk-import-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dingtalk-import-controls {
  flex: 0 0 auto;
  margin-bottom: 12px;
}

.selected-dept-name {
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.dingtalk-user-table {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 12px;
}

.dingtalk-import-footer-form {
  flex: 0 0 auto;
  flex-wrap: wrap;
}

.dingtalk-role-select {
  flex: 1 1 320px;
  min-width: 260px;
}

.permission-audit {
  min-height: 260px;
}

.audit-summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.audit-summary-item {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.audit-summary-item span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #64748b;
}

.audit-summary-item strong {
  font-size: 22px;
  color: #0f172a;
}

.audit-summary-item.danger strong {
  color: #dc2626;
}

.audit-summary-item.warning strong {
  color: #d97706;
}

.audit-summary-item.fixable strong {
  color: #16a34a;
}

.audit-table {
  width: 100%;
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

  .audit-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dingtalk-import-layout {
    grid-template-columns: 1fr;
    height: min(680px, calc(86vh - 142px));
    min-height: 0;
  }

  .dingtalk-dept-panel {
    max-height: 220px;
  }

  .dingtalk-import-controls,
  .dingtalk-import-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
