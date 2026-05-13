# 登录认证后端接口文档

本文档对应前端登录页 [LoginView.vue](/E:/workspace/dy-app/web/sales-dashboard/src/views/auth/LoginView.vue:1)、认证请求 [auth-api.ts](/E:/workspace/dy-app/web/sales-dashboard/src/api/auth-api.ts:1) 以及全局认证状态 [useGlobalStore.ts](/E:/workspace/dy-app/web/sales-dashboard/src/store/useGlobalStore.ts:1)。

## 通用约定

- 接口前缀：`/api/v1/auth`
- `Content-Type`：`application/json`
- 统一响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- 前端按 `code === 0` 或 `code === 200` 视为成功
- 登录成功后，前端会缓存：
  - `access_token`
  - `refresh_token`
  - `user_info`
  - `roles`
  - `permissions`

## 1. 登录

- 方法：`POST /api/v1/auth/login`

### 请求体

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 用户名 |
| `password` | string | 是 | 密码 |

### 成功响应示例

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.xxx.yyy",
    "refreshToken": "refresh-token-demo",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "userInfo": {
      "userId": 1,
      "username": "admin",
      "nickname": "系统管理员",
      "status": 1
    },
    "roles": ["system:admin"],
    "permissions": [
      "system:role:list",
      "system:role:add",
      "system:role:edit",
      "system:role:remove",
      "system:role:grant"
    ]
  }
}
```

### 失败响应示例

```json
{
  "code": 401,
  "message": "用户名或密码错误",
  "data": null
}
```

### 后端处理建议

1. 根据 `username` 查询启用中的用户
2. 校验密码哈希
3. 查询用户角色
4. 查询角色对应权限集
5. 签发 JWT 或服务端 token
6. 写入登录日志和最后登录时间

## 2. 退出登录

- 方法：`POST /api/v1/auth/logout`

### 请求头

```http
Authorization: Bearer <access_token>
```

### 成功响应示例

```json
{
  "code": 200,
  "message": "退出成功",
  "data": true
}
```

### 说明

- 如果你们用 JWT 无状态认证，这个接口可以只做前端清理确认，或把 token 加入黑名单。
- 当前前端即使该接口失败，也会清理本地登录态。

## 3. 获取当前登录用户信息（建议）

- 方法：`GET /api/v1/auth/profile`

### 请求头

```http
Authorization: Bearer <access_token>
```

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userInfo": {
      "userId": 1,
      "username": "admin",
      "nickname": "系统管理员",
      "status": 1
    },
    "roles": ["system:admin"],
    "permissions": [
      "system:role:list",
      "system:role:add",
      "system:role:edit",
      "system:role:remove",
      "system:role:grant"
    ]
  }
}
```

### 说明

- 当前前端没有强依赖这个接口，因为登录信息会持久化到本地。
- 但生产环境建议保留，便于刷新时重新同步用户权限。

## 返回字段定义

### `userInfo`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `userId` | number | 用户ID |
| `username` | string | 用户名 |
| `nickname` | string | 显示名 |
| `status` | number | `1` 正常，`0` 停用 |

### `roles`

- 类型：`string[]`
- 示例：`["system:admin"]`

### `permissions`

- 类型：`string[]`
- 示例：`["system:role:list", "system:role:add"]`

## 与数据库的关系

认证接口建议基于以下表：

- `SYS_USER`
- `SYS_USER_ROLE`
- `SYS_ROLE`
- `SYS_ROLE_MENU`
- `SYS_MENU`

对应的 Oracle 设计见 [auth-oracle-design.md](/E:/workspace/dy-app/web/sales-dashboard/docs/auth-oracle-design.md:1) 和 [auth-oracle-schema.sql](/E:/workspace/dy-app/web/sales-dashboard/docs/auth-oracle-schema.sql:1)。
