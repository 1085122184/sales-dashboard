# 三费监控 - 同环比分析接口文档

## 接口概述

**接口名称**：各公司同环比分析数据接口

**接口描述**：获取集团下属各分公司在三费（销售费用、管理费用、财务费用）方面的本期值、去年同期值、上月环比值，以及同比增长率和环比增长率。

**接口路径**：`GET /api/expense/company-growth`

---

## 接口详情

### 请求信息

| 项目 | 说明 |
|------|------|
| **接口路径** | `/api/expense/company-growth` |
| **请求方式** | `GET` |
| **Content-Type** | `application/json` |
| **接口说明** | 获取各公司同环比分析数据 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `date` | String | 是 | 业务日期，格式：`YYYY-MM-DD` |

**示例请求：**
```
GET /api/expense/company-growth?date=2026-04-01
```

### 响应参数

#### 响应数据结构

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "companyName": "华东分公司",
      "currentValue": 120.5,
      "yoyValue": 110.2,
      "momValue": 115.8,
      "yoy": 9.37,
      "mom": -3.87
    },
    {
      "companyName": "华南分公司",
      "currentValue": 85.3,
      "yoyValue": 95.6,
      "momValue": 80.2,
      "yoy": -10.80,
      "mom": 6.41
    },
    {
      "companyName": "华北分公司",
      "currentValue": 140.2,
      "yoyValue": 135.5,
      "momValue": 145.3,
      "yoy": 3.47,
      "mom": -3.52
    },
    {
      "companyName": "西南分公司",
      "currentValue": 75.8,
      "yoyValue": 70.3,
      "momValue": 74.2,
      "yoy": 7.82,
      "mom": -2.14
    },
    {
      "companyName": "西北分公司",
      "currentValue": 60.5,
      "yovValue": 65.8,
      "momValue": 62.4,
      "yoy": -8.05,
      "mom": -3.02
    }
  ]
}
```

#### 字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `companyName` | String | 公司名称 |
| `currentValue` | Number | 本期金额（万元） |
| `yoyValue` | Number | 去年同期金额（万元） |
| `momValue` | Number | 上期环比金额（万元） |
| `yoy` | Number | 同比增长率（百分比） |
| `mom` | Number | 环比增长率（百分比） |

---

## 响应示例

### 成功响应

**HTTP 状态码**：`200`

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "companyName": "华东分公司",
      "currentValue": 120.5,
      "yoyValue": 110.2,
      "momValue": 115.8,
      "yoy": 9.37,
      "mom": -3.87
    }
  ]
}
```

### 错误响应

#### 1. 参数错误

**HTTP 状态码**：`400`

```json
{
  "code": 400,
  "message": "date parameter is required",
  "data": null
}
```

#### 2. 数据不存在

**HTTP 状态码**：`404`

```json
{
  "code": 404,
  "message": "No data found for the specified date",
  "data": []
}
```

#### 3. 服务器错误

**HTTP 状态码**：`500`

```json
{
  "code": 500,
  "message": "Internal server error",
  "data": null
}
```

---

## 计算说明

### 同比增长率计算公式

```
yoy = ((本期金额 - 去年同期金额) / |去年同期金额|) * 100
```

**说明**：
- 当去年同期金额 > 0 时，增长率 = (本期 - 去年同期) / 去年同期 * 100
- 当去年同期金额 ≤ 0 时，增长率 = 本期金额 / 1 * 100（特殊情况）

### 环比增长率计算公式

```
mom = ((本期金额 - 上期环比金额) / |上期环比金额|) * 100
```

**说明**：
- 当上期环比金额 > 0 时，增长率 = (本期 - 上期) / 上期 * 100
- 当上期环比金额 ≤ 0 时，增长率 = 本期金额 / 1 * 100（特殊情况）

---

## 业务规则

### 1. 公司名称规范

- 华东分公司
- 华南分公司
- 华北分公司
- 西南分公司
- 西北分公司

### 2. 费用说明

- **销售费用**：为业务推广、销售渠道维护等发生的费用
- **管理费用**：为公司管理部门（行政、人事、财务等）发生的费用
- **财务费用**：为融资、资金管理等发生的费用

### 3. 数据精度

- 所有金额字段保留 1 位小数
- 所有百分比字段保留 2 位小数
- 数据单位统一为：万元

---

## 前端调用示例

### JavaScript / TypeScript

```typescript
import { getCompanyGrowthData } from '@/api/expense-api'

// 获取同环比数据
async function fetchGrowthData() {
  try {
    const data = await getCompanyGrowthData({
      date: '2026-04-01'
    })

    console.log('公司同环比数据：', data)
    // 输出示例：
    // [
    //   { companyName: '华东分公司', currentValue: 120.5, yoyValue: 110.2, momValue: 115.8, yoy: 9.37, mom: -3.87 },
    //   { companyName: '华南分公司', currentValue: 85.3, yoyValue: 95.6, momValue: 80.2, yoy: -10.80, mom: 6.41 },
    //   ...
    // ]

    return data
  } catch (error) {
    console.error('获取同环比数据失败：', error)
    return []
  }
}
```

### Vue Composition API

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStore } from '@/store/useGlobalStore'
import { getCompanyGrowthData } from '@/api/expense-api'

const store = useGlobalStore()

const growthLoading = ref(true)
const companyGrowthData = ref<any[]>([])

// 加载同环比数据
async function loadGrowthData() {
  growthLoading.value = true
  try {
    companyGrowthData.value = await getCompanyGrowthData({
      date: store.backendDateStr
    })
  } catch (error) {
    console.error('获取同环比数据失败：', error)
  } finally {
    growthLoading.value = false
  }
}

// 切换同比/环比视图
const growthViewType = ref<'yoy' | 'mom'>('yoy')

const growthChartOption = computed(() => {
  if (!companyGrowthData.value.length) return {}

  const isYoy = growthViewType.value === 'yoy'
  const compareName = isYoy ? '去年同期' : '上月同期'

  const categories = companyGrowthData.value.map(d => d.companyName)
  const currentData = companyGrowthData.value.map(d => d.currentValue)
  const compareData = companyGrowthData.value.map(d => isYoy ? d.yoyValue : d.momValue)
  const rates = companyGrowthData.value.map(d => isYoy ? d.yoy : d.mom)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const current = params.find((p: any) => p.seriesName === '本期金额')
        const compare = params.find((p: any) => p.seriesName === compareName)
        const dataIndex = params[0].dataIndex
        const rate = rates[dataIndex]
        const sign = rate > 0 ? '+' : ''

        return `
          <div style="color: #fff; font-size: 13px;">
            <div style="font-weight:700; margin-bottom:6px;">${params[0].name}</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>${current.marker} 本期金额:</span> <b>${current.value} 万</b>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>${compare.marker} ${compareName}:</span> <b>${compare.value} 万</b>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px dashed #475569; padding-top:6px; margin-top:4px;">
              <span style="color:#cbd5e1;">${isYoy ? '同比' : '环比'}变化:</span>
              <b style="color: ${rate >= 0 ? '#10b981' : '#ef4444'}">${sign}${rate.toFixed(2)}%</b>
            </div>
          </div>
        `
      }
    },
    legend: {
      data: ['本期金额', compareName],
      top: 0,
      textStyle: { color: '#fff' }
    },
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: '#cbd5e1',
        fontSize: 11,
        interval: 0,
        rotate: 25
      }
    },
    yAxis: {
      type: 'value',
      name: '金额(万)',
      nameTextStyle: { color: '#cbd5e1', fontSize: 11 },
      axisLabel: { color: '#cbd5e1' },
      splitLine: { lineStyle: { color: 'rgba(203, 213, 225, 0.2)', type: 'dashed' } }
    },
    series: [
      {
        name: '本期金额',
        type: 'bar',
        barWidth: '26%',
        data: currentData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#2563eb' }
            ]
          },
          borderRadius: [6, 6, 0, 0]
        }
      },
      {
        name: compareName,
        type: 'bar',
        barWidth: '26%',
        data: compareData,
        itemStyle: {
          color: '#94a3b8',
          borderRadius: [6, 6, 0, 0]
        }
      }
    ]
  }
})
</script>
```

---

## 注意事项

1. **日期格式**：请求参数中的 `date` 必须使用 `YYYY-MM-DD` 格式
2. **增长率符号**：
   - 正数表示增长，显示 `+` 号
   - 负数表示下降，不显示 `+` 号
   - `0` 表示无变化
3. **空数据处理**：如果数据不存在，返回空数组 `[]`
4. **精度处理**：前端显示时建议保留 2 位小数
5. **缓存建议**：建议对同一日期的数据进行缓存，避免频繁请求

---

## 更新日志

| 版本 | 日期 | 修改说明 |
|------|------|---------|
| v1.0.0 | 2026-04-23 | 初始版本，完成接口定义 |

---

## 联系方式

如有问题，请联系：
- **前端负责人**：[请联系前端团队]
- **后端负责人**：[请联系后端团队]
- **技术支持**：[技术支持邮箱]
