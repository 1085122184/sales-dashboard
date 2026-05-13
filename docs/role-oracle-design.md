# Oracle 角色管理库表设计

本文档基于 [角色接口文档](/E:/workspace/dy-app/web/sales-dashboard/docs/role-api.md:1) 反推数据库结构，适配前端页面 [RoleView.vue](/E:/workspace/dy-app/web/sales-dashboard/src/views/system/role/RoleView.vue:1)。

对应的可执行 Oracle 脚本在 [role-oracle-schema.sql](/E:/workspace/dy-app/web/sales-dashboard/docs/role-oracle-schema.sql:1)。

## 设计目标

- 支撑角色分页查询
- 支撑角色新增、编辑、删除、状态切换
- 支撑菜单树查询
- 支撑角色菜单授权
- 兼容后续按钮级权限控制

## 表结构总览

### `SYS_ROLE`

角色主表。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ROLE_ID` | `NUMBER(19)` | 主键 |
| `ROLE_NAME` | `VARCHAR2(60)` | 角色名称 |
| `ROLE_KEY` | `VARCHAR2(100)` | 权限字符，唯一 |
| `ROLE_SORT` | `NUMBER(10)` | 排序 |
| `STATUS` | `NUMBER(1)` | `1` 正常，`0` 停用 |
| `REMARK` | `VARCHAR2(500)` | 备注 |
| `CREATE_TIME` | `DATE` | 创建时间 |
| `UPDATE_TIME` | `DATE` | 更新时间 |

### `SYS_MENU`

菜单与按钮统一存储。

核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `MENU_ID` | `NUMBER(19)` | 主键 |
| `PARENT_ID` | `NUMBER(19)` | 父级ID，顶级为 `0` |
| `MENU_NAME` | `VARCHAR2(100)` | 菜单名称 |
| `MENU_TYPE` | `CHAR(1)` | `M` 目录，`C` 菜单，`B` 按钮 |
| `PATH` | `VARCHAR2(200)` | 前端路由 |
| `COMPONENT` | `VARCHAR2(200)` | 前端组件路径 |
| `PERMS` | `VARCHAR2(200)` | 权限标识 |
| `ORDER_NUM` | `NUMBER(10)` | 排序 |
| `STATUS` | `NUMBER(1)` | `1` 正常，`0` 停用 |

### `SYS_ROLE_MENU`

角色与菜单多对多关联表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ROLE_ID` | `NUMBER(19)` | 角色ID |
| `MENU_ID` | `NUMBER(19)` | 菜单ID |
| `CREATE_TIME` | `DATE` | 授权时间 |

联合主键：`(ROLE_ID, MENU_ID)`

### `SYS_USER_ROLE`

这是可选扩展表，但我建议直接建上。

原因：
- 删除角色前通常要校验是否已绑定用户
- 后续登录态、按钮权限、数据权限都要用到

## 接口与表映射

### 1. 分页查询角色

接口：
- `GET /api/v1/system/roles`

来源表：
- `SYS_ROLE`

典型 SQL：

```sql
SELECT *
FROM (
  SELECT
    R.ROLE_ID       AS id,
    R.ROLE_NAME     AS roleName,
    R.ROLE_KEY      AS roleKey,
    R.ROLE_SORT     AS roleSort,
    R.STATUS        AS status,
    R.REMARK        AS remark,
    TO_CHAR(R.CREATE_TIME, 'YYYY-MM-DD HH24:MI:SS') AS createTime,
    ROW_NUMBER() OVER (ORDER BY R.ROLE_SORT ASC, R.ROLE_ID DESC) AS RN
  FROM SYS_ROLE R
  WHERE (:roleName IS NULL OR R.ROLE_NAME LIKE '%' || :roleName || '%')
    AND (:roleKey  IS NULL OR R.ROLE_KEY  LIKE '%' || :roleKey  || '%')
    AND (:status   IS NULL OR R.STATUS = :status)
)
WHERE RN BETWEEN (:startRow) AND (:endRow);
```

总数 SQL：

```sql
SELECT COUNT(1)
FROM SYS_ROLE R
WHERE (:roleName IS NULL OR R.ROLE_NAME LIKE '%' || :roleName || '%')
  AND (:roleKey  IS NULL OR R.ROLE_KEY  LIKE '%' || :roleKey  || '%')
  AND (:status   IS NULL OR R.STATUS = :status);
```

### 2. 新增角色

接口：
- `POST /api/v1/system/roles`

写入表：
- `SYS_ROLE`

建议校验：
- `ROLE_KEY` 唯一
- `ROLE_NAME` 非空
- `STATUS` 只能是 `0/1`

### 3. 修改角色 / 切换状态

接口：
- `PUT /api/v1/system/roles`

写入表：
- `SYS_ROLE`

说明：
- 当前前端编辑角色和切换状态都走这一个接口
- 所以后端不要只接收部分字段，建议按完整对象更新

### 4. 删除角色

接口：
- `DELETE /api/v1/system/roles/{id}`

涉及表：
- `SYS_ROLE`
- `SYS_ROLE_MENU`
- 可选校验 `SYS_USER_ROLE`

建议处理顺序：

1. 校验 `SYS_USER_ROLE` 中是否存在绑定用户
2. 删除 `SYS_ROLE_MENU`
3. 删除 `SYS_ROLE`

### 5. 获取菜单树

接口：
- `GET /api/v1/system/roles/menu-tree`

来源表：
- `SYS_MENU`

Oracle 递归树 SQL：

```sql
SELECT
  MENU_ID,
  PARENT_ID,
  MENU_NAME,
  MENU_TYPE,
  PATH,
  COMPONENT,
  PERMS,
  ORDER_NUM,
  STATUS,
  LEVEL AS TREE_LEVEL
FROM SYS_MENU
WHERE STATUS = 1
START WITH PARENT_ID = 0
CONNECT BY PRIOR MENU_ID = PARENT_ID
ORDER SIBLINGS BY ORDER_NUM ASC, MENU_ID ASC;
```

说明：
- SQL 返回扁平树后，后端再组装成 `children` 嵌套结构返回给前端
- 前端树组件只依赖 `id / menuName / children`

### 6. 查询角色已分配菜单

接口：
- `GET /api/v1/system/roles/{roleId}/menus`

来源表：
- `SYS_ROLE_MENU`

SQL：

```sql
SELECT MENU_ID
FROM SYS_ROLE_MENU
WHERE ROLE_ID = :roleId
ORDER BY MENU_ID;
```

### 7. 保存角色菜单权限

接口：
- `PUT /api/v1/system/roles/{roleId}/menus`

涉及表：
- `SYS_ROLE_MENU`

建议事务：

1. 删除该角色已有授权
2. 批量插入新的 `menuIds`
3. 提交事务

SQL 示例：

```sql
DELETE FROM SYS_ROLE_MENU WHERE ROLE_ID = :roleId;
```

批量插入示例：

```sql
INSERT INTO SYS_ROLE_MENU (ROLE_ID, MENU_ID, CREATE_TIME)
VALUES (:roleId, :menuId, SYSDATE);
```

## 索引建议

已在脚本中包含：

- `SYS_ROLE`
  - `UK_SYS_ROLE_KEY`
  - `IDX_SYS_ROLE_NAME`
  - `IDX_SYS_ROLE_STATUS`
  - `IDX_SYS_ROLE_SORT`
- `SYS_MENU`
  - `IDX_SYS_MENU_PARENT`
  - `IDX_SYS_MENU_STATUS`
  - `IDX_SYS_MENU_ORDER`
  - `IDX_SYS_MENU_PERMS`
- `SYS_ROLE_MENU`
  - 主键 `(ROLE_ID, MENU_ID)`
  - `IDX_SYS_ROLE_MENU_MENU`

## Oracle 实现建议

- 如果你们是 Oracle 12c/19c，也可以把 `SEQUENCE + TRIGGER` 改成 `IDENTITY`
- 如果后续想做逻辑删除，可在 `SYS_ROLE` 增加 `DEL_FLAG CHAR(1)`，删除接口改成更新标记
- `ROLE_KEY` 建议作为权限体系中的稳定编码，不要频繁变更
- 菜单树和角色授权接口建议统一只返回启用状态的数据

## 最小可用数据关系

如果只为了把当前页面跑通，最少需要：

- `SYS_ROLE`
- `SYS_MENU`
- `SYS_ROLE_MENU`

如果要让删除角色逻辑更符合实际生产要求，再加：

- `SYS_USER_ROLE`
