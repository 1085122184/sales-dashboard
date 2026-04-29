<template>
  <div class="role-page">
    <section class="hero-card">
      <div>
        <h1 class="hero-title">角色管理</h1>
        <p class="hero-subtitle">维护角色基础信息、启停状态和菜单权限分配。</p>
      </div>
      <el-button type="primary" @click="handleAdd">新增角色</el-button>
    </section>

    <section class="panel-card">
      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="角色名称">
          <el-input
            v-model.trim="queryForm.roleName"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input
            v-model.trim="queryForm.roleKey"
            placeholder="请输入权限字符"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <div class="toolbar-summary">共 {{ total }} 个角色</div>
        <el-button :loading="loading" @click="fetchRoleList">刷新</el-button>
      </div>

      <el-table :data="roleList" v-loading="loading" border stripe class="role-table">
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
              @change="value => handleStatusChange(row, Number(value))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" @click="handlePermission(row)">分配权限</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无角色数据" />
        </template>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryForm.pageNum"
          v-model:page-size="queryForm.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.mode === 'add' ? '新增角色' : '编辑角色'"
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
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="formDialog.submitLoading" @click="submitRole">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialog.visible" title="分配权限" width="560px" destroy-on-close>
      <div class="permission-header">
        <div class="permission-role">
          当前角色：
          <span>{{ permissionDialog.currentRoleName || '-' }}</span>
        </div>
        <el-button text @click="toggleTreeSelection(false)">清空</el-button>
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
  deleteRole,
  getMenuTree,
  getRoleMenuIds,
  getRolePage,
  saveRoleMenus,
  updateRole
} from '@/api/system-api'
import type { MenuTreeNode, RoleItem, RolePayload, RoleQuery } from '@/types'

const loading = ref(false)
const total = ref(0)
const roleList = ref<RoleItem[]>([])
const menuOptions = ref<MenuTreeNode[]>([])

const roleFormRef = ref<FormInstance>()
const menuTreeRef = ref<any>()

const defaultQueryForm = (): RoleQuery => ({
  pageNum: 1,
  pageSize: 10,
  roleName: '',
  roleKey: '',
  status: undefined
})

const defaultRoleForm = (): RolePayload => ({
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: 1,
  remark: ''
})

const queryForm = reactive<RoleQuery>(defaultQueryForm())
const roleForm = reactive<RolePayload>(defaultRoleForm())

const formDialog = reactive({
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

onMounted(async () => {
  await Promise.all([fetchRoleList(), fetchMenuTree()])
})

async function fetchRoleList() {
  loading.value = true
  try {
    const res = await getRolePage({ ...queryForm })
    const pageData = res.data || {}
    roleList.value = pageData.list || pageData.rows || []
    total.value = Number(pageData.total ?? roleList.value.length ?? 0)
  } catch (error: any) {
    ElMessage.error(error?.message || '角色列表加载失败')
  } finally {
    loading.value = false
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

function handleSearch() {
  queryForm.pageNum = 1
  fetchRoleList()
}

function handleReset() {
  Object.assign(queryForm, defaultQueryForm())
  fetchRoleList()
}

function handleSizeChange() {
  queryForm.pageNum = 1
  fetchRoleList()
}

function handleCurrentChange() {
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

async function openFormDialog(mode: 'add' | 'edit', row?: RoleItem) {
  formDialog.mode = mode
  formDialog.visible = true
  resetRoleForm()
  if (row) fillRoleForm(row)
  await nextTick()
  roleFormRef.value?.clearValidate()
}

function handleAdd() {
  openFormDialog('add')
}

function handleEdit(row: RoleItem) {
  openFormDialog('edit', row)
}

async function submitRole() {
  if (!roleFormRef.value) return
  await roleFormRef.value.validate()
  formDialog.submitLoading = true
  try {
    if (formDialog.mode === 'add') {
      await addRole({ ...roleForm })
      ElMessage.success('角色新增成功')
    } else {
      await updateRole({ ...roleForm })
      ElMessage.success('角色更新成功')
    }
    formDialog.visible = false
    await fetchRoleList()
  } catch (error: any) {
    ElMessage.error(error?.message || '角色保存失败')
  } finally {
    formDialog.submitLoading = false
  }
}

async function handleDelete(row: RoleItem) {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`确认删除角色“${row.roleName}”吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    if (roleList.value.length === 1 && queryForm.pageNum > 1) {
      queryForm.pageNum -= 1
    }
    await fetchRoleList()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error?.message || '删除失败')
  }
}

async function handleStatusChange(row: RoleItem, value: number) {
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
  } catch (error) {
    row.status = previous
    ElMessage.error((error as Error)?.message || '状态更新失败')
  }
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

function toggleTreeSelection(expanded: boolean) {
  menuTreeRef.value?.setCheckedKeys(expanded ? permissionDialog.checkedKeys : [], false)
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

.panel-card {
  padding: 18px 20px 20px;
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
    justify-content: space-between;
  }
}
</style>
