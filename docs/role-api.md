# 角色管理后端接口文档

本文档对应前端页面 [RoleView.vue](/E:/workspace/dy-app/web/sales-dashboard/src/views/system/role/RoleView.vue:1) 和接口封装 [system-api.ts](/E:/workspace/dy-app/web/sales-dashboard/src/api/system-api.ts:1)。

## 通用约定

- 接口前缀：`/api/v1/system/roles`
- 鉴权：请求头 `Authorization: Bearer <access_token>`
- `Content-Type`：`application/json`
- 通用响应结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- 前端按 `code === 0` 或 `code === 200` 视为成功。

## 1. 分页查询角色

- 方法：`GET /api/v1/system/roles`

### Query 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNum` | number | 是 | 页码，从 1 开始 |
| `pageSize` | number | 是 | 每页条数 |
| `roleName` | string | 否 | 角色名称，模糊查询 |
| `roleKey` | string | 否 | 权限字符，模糊查询 |
| `status` | number | 否 | 状态：`1` 正常，`0` 停用 |

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "roleName": "系统管理员",
        "roleKey": "system:admin",
        "roleSort": 1,
        "status": 1,
        "remark": "拥有全部权限",
        "createTime": "2026-04-28 10:00:00",
        "updateTime": "2026-04-28 10:00:00"
      }
    ],
    "total": 1,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

### 备注

- 前端也兼容 `data.rows` 替代 `data.list`。

## 2. 新增角色

- 方法：`POST /api/v1/system/roles`

### 请求体

```json
{
  "roleName": "销售主管",
  "roleKey": "system:role:sales-manager",
  "roleSort": 10,
  "status": 1,
  "remark": "销售角色"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `roleName` | string | 是 | 角色名称，建议 2-30 字符 |
| `roleKey` | string | 是 | 权限字符，建议唯一 |
| `roleSort` | number | 是 | 显示排序 |
| `status` | number | 是 | `1` 正常，`0` 停用 |
| `remark` | string | 否 | 备注，建议不超过 200 字符 |

### 成功响应示例

```json
{
  "code": 200,
  "message": "新增成功",
  "data": 101
}
```

## 3. 修改角色

- 方法：`PUT /api/v1/system/roles`

### 请求体

```json
{
  "id": 101,
  "roleName": "销售主管",
  "roleKey": "system:role:sales-manager",
  "roleSort": 10,
  "status": 0,
  "remark": "临时停用"
}
```

### 说明

- `id` 必填。
- 前端编辑角色、切换状态都调用这个接口。

## 4. 删除角色

- 方法：`DELETE /api/v1/system/roles/{id}`

### Path 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 角色 ID |

### 成功响应示例

```json
{
  "code": 200,
  "message": "删除成功",
  "data": true
}
```

## 5. 获取菜单树

- 方法：`GET /api/v1/system/roles/menu-tree`

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "menuName": "系统管理",
      "parentId": 0,
      "children": [
        {
          "id": 11,
          "menuName": "角色管理",
          "parentId": 1,
          "children": []
        }
      ]
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 菜单 ID |
| `menuName` | string | 是 | 菜单名称 |
| `parentId` | number | 否 | 父级菜单 ID |
| `children` | array | 否 | 子菜单列表 |

## 6. 查询角色已分配菜单

- 方法：`GET /api/v1/system/roles/{roleId}/menus`

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [1, 11, 12, 13]
}
```

### 说明

- 返回当前角色已选中的菜单 ID 列表。
- 前端会据此回显树形勾选状态。

## 7. 保存角色菜单权限

- 方法：`PUT /api/v1/system/roles/{roleId}/menus`

### 请求体

```json
[1, 11, 12, 13]
```

### 说明

- 请求体是 `number[]`，即最终勾选菜单 ID 列表。
- 前端会把“全选”和“半选”的节点 ID 一并提交。

### 成功响应示例

```json
{
  "code": 200,
  "message": "保存成功",
  "data": true
}
```

## 后端实现建议

- `roleKey` 建议做唯一索引校验。
- 删除角色前建议校验是否已绑定用户，避免误删。
- 菜单树建议直接返回前端可用结构，避免前端二次组装。
- 如果你们分页返回结构固定为 `rows + total`，当前前端也能兼容。
