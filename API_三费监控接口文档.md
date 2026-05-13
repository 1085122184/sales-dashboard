# 三费监控 API 接口文档

## 基础信息
- **基础路径**: `/api/expense`
- **认证方式**: Bearer Token
- **日期格式**: `YYYY-MM-DD`

---

## 1. 获取三费总览指标

### 接口信息
- **URL**: `/api/expense/overview`
- **方法**: `GET`
- **描述**: 获取三费总额、销售费用、管理费用、财务费用的汇总数据

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| date | string | 是 | 业务日期，格式 YYYY-MM-DD |

### 请求示例
```
GET /api/expense/overview?date=2024-01-15
```

### 响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalExpense": {
      "amount": 12.8,
      "unit": "亿",
      "yoyChange": -8.3,
      "yoyChangeText": "同比下降 ¥1.16亿"
    },
    "salesExpense": {
      "amount": 6.2,
      "unit": "亿",
      "percent": 48.4,
      "yoyChange": -5.2
    },
    "managementExpense": {
      "amount": 4.8,
      "unit": "亿",
      "percent": 37.5,
      "yoyChange": 12.6
    },
    "financeExpense": {
      "amount": 1.8,
      "unit": "亿",
      "percent": 14.1,
      "yoyChange": 15.8
    }
  }
}
```

### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| amount | number | 金额数值 |
| unit | string | 单位（亿/万） |
| percent | number | 占比百分比 |
| yoyChange | number | 同比变化（正数表示上涨，负数表示下降） |

---

## 2. 获取各公司三费对比数据

### 接口信息
- **URL**: `/api/expense/company-comparison`
- **方法**: `GET`
- **描述**: 获取各分公司的三费对比数据

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| date | string | 是 | 业务日期，格式 YYYY-MM-DD |

### 请求示例
```
GET /api/expense/company-comparison?date=2024-01-15
```

### 响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "name": "华东分公司",
      "sales": 1.8,
      "management": 1.2,
      "finance": 0.5,
      "total": 3.5,
      "yoy": -8.2
    },
    {
      "name": "华南分公司",
      "sales": 1.6,
      "management": 1.1,
      "finance": 0.4,
      "total": 3.1,
      "yoy": 12.5
    },
    {
      "name": "华北分公司",
      "sales": 1.5,
      "management": 1.3,
      "finance": 0.5,
      "total": 3.3,
      "yoy": -3.8
    },
    {
      "name": "西南分公司",
      "sales": 1.3,
      "management": 1.2,
      "finance": 0.4,
      "total": 2.9,
      "yoy": 5.6
    }
  ]
}
```

### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 公司名称 |
| sales | number | 销售费用（亿元） |
| management | number | 管理费用（亿元） |
| finance | number | 财务费用（亿元） |
| total | number | 三费合计（亿元） |
| yoy | number | 同比变化百分比 |

---

## 3. 获取费用结构数据

### 接口信息
- **URL**: `/api/expense/structure`
- **方法**: `GET`
- **描述**: 获取费用结构占比数据

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| date | string | 是 | 业务日期，格式 YYYY-MM-DD |
| year | number | 否 | 年份，默认当前年 |

### 请求示例
```
GET /api/expense/structure?date=2024-01-15&year=2024
```

### 响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "name": "销售费用",
      "value": 6.2,
      "percent": 48.4
    },
    {
      "name": "管理费用",
      "value": 4.8,
      "percent": 37.5
    },
    {
      "name": "财务费用",
      "value": 1.8,
      "percent": 14.1
    }
  ]
}
```

### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 费用类型名称 |
| value | number | 费用金额（亿元） |
| percent | number | 占比百分比 |

---

## 4. 获取三费趋势数据（近12个月）

### 接口信息
- **URL**: `/api/expense/trend`
- **方法**: `GET`
- **描述**: 获取近12个月的三费趋势数据

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| date | string | 是 | 业务日期，格式 YYYY-MM-DD |

### 请求示例
```
GET /api/expense/trend?date=2024-01-15
```

### 响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "months": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    "sales": [0.48, 0.51, 0.49, 0.52, 0.55, 0.53, 0.51, 0.54, 0.52, 0.56, 0.53, 0.51],
    "management": [0.38, 0.40, 0.39, 0.41, 0.42, 0.40, 0.39, 0.41, 0.40, 0.42, 0.40, 0.38],
    "finance": [0.15, 0.14, 0.15, 0.16, 0.15, 0.14, 0.15, 0.16, 0.15, 0.14, 0.15, 0.14]
  }
}
```

### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| months | string[] | 月份数组 |
| sales | number[] | 销售费用数组（亿元） |
| management | number[] | 管理费用数组（亿元） |
| finance | number[] | 财务费用数组（亿元） |

---

## 5. 获取各公司三费明细列表

### 接口信息
- **URL**: `/api/expense/company-detail`
- **方法**: `GET`
- **描述**: 获取各公司三费明细列表（用于表格展示）

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| date | string | 是 | 业务日期，格式 YYYY-MM-DD |
| keyword | string | 否 | 搜索关键词（公司名称） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |

### 请求示例
```
GET /api/expense/company-detail?date=2024-01-15&keyword=华东&page=1&pageSize=10
```

### 响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "name": "华东分公司",
        "sales": 1.8,
        "management": 1.2,
        "finance": 0.5,
        "total": 3.5,
        "yoy": -8.2
      },
      {
        "name": "华南分公司",
        "sales": 1.6,
        "management": 1.1,
        "finance": 0.4,
        "total": 3.1,
        "yoy": 12.5
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10
  }
}
```

### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| list | array | 数据列表 |
| total | number | 总记录数 |
| page | number | 当前页码 |
| pageSize | number | 每页条数 |

---

## 错误响应格式

```json
{
  "code": 400,
  "message": "参数错误：日期格式不正确",
  "data": null
}
```

### 常见错误码
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 数据不存在 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. 所有金额数据单位统一为**亿元**，前端需要根据实际情况转换为显示单位
2. 同比变化 `yoy` 字段：正数表示上涨，负数表示下降
3. 日期参数必须为 `YYYY-MM-DD` 格式
4. 所有接口都需要携带有效的认证 Token
5. 建议对趋势数据和对比数据做缓存，减少数据库查询压力
