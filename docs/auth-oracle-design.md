# Oracle 登录认证数据库设计

本文档对应 [登录认证接口文档](/E:/workspace/dy-app/web/sales-dashboard/docs/auth-api.md:1)。

可执行脚本：
- 角色与权限基础表：[role-oracle-schema.sql](/E:/workspace/dy-app/web/sales-dashboard/docs/role-oracle-schema.sql:1)
- 登录认证增量表：[auth-oracle-schema.sql](/E:/workspace/dy-app/web/sales-dashboard/docs/auth-oracle-schema.sql:1)

## 设计范围

为了支撑当前前端登录页和 RBAC 权限体系，认证部分至少需要：

- `SYS_USER`：用户主表
- `SYS_USER_ROLE`：用户角色关联
- `SYS_ROLE`：角色表
- `SYS_ROLE_MENU`：角色菜单关联
- `SYS_MENU`：菜单/权限表

可选但建议：

- `SYS_LOGIN_LOG`：登录日志

## 表关系

```text
SYS_USER
   |
   | N : N
   |
SYS_USER_ROLE
   |
   | N : 1
   |
SYS_ROLE
   |
   | N : N
   |
SYS_ROLE_MENU
   |
   | N : 1
   |
SYS_MENU
```

## 1. `SYS_USER`

用户主表，负责登录身份。

关键字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `USER_ID` | `NUMBER(19)` | 主键 |
| `USERNAME` | `VARCHAR2(50)` | 登录用户名，唯一 |
| `PASSWORD_HASH` | `VARCHAR2(255)` | 密码哈希，建议 BCrypt |
| `NICKNAME` | `VARCHAR2(100)` | 显示昵称 |
| `STATUS` | `NUMBER(1)` | `1` 正常，`0` 停用 |
| `DEL_FLAG` | `CHAR(1)` | `0` 未删除，`1` 已删除 |
| `LAST_LOGIN_TIME` | `DATE` | 最后登录时间 |
| `LAST_LOGIN_IP` | `VARCHAR2(64)` | 最后登录 IP |

建议：

- 不要保存明文密码
- Java 后端建议直接用 `BCryptPasswordEncoder`
- 如果启用逻辑删除，登录时过滤 `DEL_FLAG = '0'`

## 2. `SYS_USER_ROLE`

用户和角色的多对多关系表。

当前主要用途：

- 登录后查询用户角色编码
- 删除角色前判断是否绑定用户

## 3. `SYS_ROLE`

角色主表。

登录时通常不直接查全部字段，但会读取：

- `ROLE_ID`
- `ROLE_KEY`
- `STATUS`

## 4. `SYS_ROLE_MENU`

角色与菜单授权关系表。

登录后查权限点时需要通过它关联菜单。

## 5. `SYS_MENU`

既承载菜单，也承载按钮权限。

登录成功返回 `permissions` 时，一般从该表的 `PERMS` 字段取得。

建议：

- `MENU_TYPE = 'B'` 的记录代表按钮权限
- `PERMS` 为空的目录节点不参与权限返回

## 6. `SYS_LOGIN_LOG`

建议保留。

用途：

- 审计登录成功/失败
- 排查密码错误、异常 IP
- 后续接入安全告警

## 登录查询建议

### 1. 查询用户

```sql
SELECT
  U.USER_ID,
  U.USERNAME,
  U.PASSWORD_HASH,
  U.NICKNAME,
  U.STATUS,
  U.DEL_FLAG
FROM SYS_USER U
WHERE U.USERNAME = :username
  AND U.DEL_FLAG = '0';
```

### 2. 查询用户角色

```sql
SELECT R.ROLE_KEY
FROM SYS_USER_ROLE UR
JOIN SYS_ROLE R ON R.ROLE_ID = UR.ROLE_ID
WHERE UR.USER_ID = :userId
  AND R.STATUS = 1
ORDER BY R.ROLE_SORT ASC, R.ROLE_ID ASC;
```

### 3. 查询用户权限

```sql
SELECT DISTINCT M.PERMS
FROM SYS_USER_ROLE UR
JOIN SYS_ROLE_MENU RM ON RM.ROLE_ID = UR.ROLE_ID
JOIN SYS_MENU M ON M.MENU_ID = RM.MENU_ID
JOIN SYS_ROLE R ON R.ROLE_ID = UR.ROLE_ID
WHERE UR.USER_ID = :userId
  AND R.STATUS = 1
  AND M.STATUS = 1
  AND M.PERMS IS NOT NULL
ORDER BY M.PERMS;
```

### 4. 更新最后登录信息

```sql
UPDATE SYS_USER
SET LAST_LOGIN_TIME = SYSDATE,
    LAST_LOGIN_IP = :loginIp
WHERE USER_ID = :userId;
```

### 5. 写登录日志

```sql
INSERT INTO SYS_LOGIN_LOG (
  USER_ID, USERNAME, LOGIN_STATUS, LOGIN_MESSAGE, LOGIN_IP, USER_AGENT, LOGIN_TIME
) VALUES (
  :userId, :username, :loginStatus, :loginMessage, :loginIp, :userAgent, SYSDATE
);
```

## 与前端返回结构的映射

前端登录成功后需要：

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "userInfo": {
    "userId": 1,
    "username": "admin",
    "nickname": "系统管理员",
    "status": 1
  },
  "roles": ["system:admin"],
  "permissions": ["system:role:list"]
}
```

其中：

- `userInfo`：来自 `SYS_USER`
- `roles`：来自 `SYS_ROLE`
- `permissions`：来自 `SYS_MENU.PERMS`

## 实现建议

- Token 推荐 JWT，过期时间例如 2 小时
- Refresh Token 是否启用取决于你们后端架构
- 管理员角色可以保留一个通配权限，如 `*:*:*`
- 如果后续会有部门、数据范围控制，建议在 `SYS_ROLE` 增加数据权限字段，而不是塞到 `SYS_USER`
