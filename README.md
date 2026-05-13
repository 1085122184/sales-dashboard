# 销售指标仪表盘

基于 **Vue 3 + TypeScript + Vite + ECharts** 的销售数据可视化仪表盘。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4 | 核心框架（Composition API） |
| TypeScript | ^5.3 | 类型安全 |
| Vite | ^5.0 | 构建工具 |
| ECharts | ^5.4 | 图表渲染 |
| @vueuse/core | ^10.7 | 实用组合式函数 |

## 项目结构

```
src/
├── assets/
│   └── styles/
│       └── global.css         # CSS 变量 & 全局样式
├── components/
│   ├── CollectionCard.vue     # 回款金额卡片
│   ├── LoadingSkeleton.vue    # 骨架屏组件
│   ├── MetricCard.vue         # 销售指标卡片（总销量/总销售额）
│   ├── OrderCard.vue          # 未关订单数卡片
│   ├── PriceDeviationChart.vue # 价格偏差柱状图（ECharts）
│   ├── PriceDeviationTable.vue # 价格偏差数据表格
│   ├── ProgressBar.vue        # 通用进度条
│   └── SectionTitle.vue       # 区块标题
├── composables/
│   └── useDashboard.ts        # 仪表盘数据获取 Composable
├── mock/
│   └── dashboard.ts           # 模拟数据 & fetchDashboardData 函数
├── types/
│   └── index.ts               # TypeScript 类型定义
├── views/
│   └── DashboardView.vue      # 仪表盘页面
├── App.vue
├── env.d.ts
└── main.ts
```

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产包
npm run build
```

## 对接后台接口

所有数据通过 `src/mock/dashboard.ts` 中的 `fetchDashboardData` 函数提供。  
替换为真实接口只需修改这一个函数：

```ts
// src/mock/dashboard.ts

import axios from 'axios'
import type { ApiResponse, DashboardData } from '@/types'

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await axios.get<ApiResponse<DashboardData>>('/api/dashboard')
  return res.data.data
}
```

## 组件说明

### `MetricCard.vue`
通用销售指标卡片，接收 `SalesMetric` 类型数据，展示数值、预算比进度条、目标差距等。

### `CollectionCard.vue`
回款金额专用卡片，使用绿色主题，展示回款率进度条。

### `OrderCard.vue`
未关订单数卡片，支持自定义进度条颜色。

### `ProgressBar.vue`
可复用进度条，支持自定义颜色、高度和进度值（0~1）。

### `PriceDeviationChart.vue`
ECharts 水平柱状图，展示七日均价与当日均价对比，自动响应窗口缩放。

### `PriceDeviationTable.vue`
价格偏差数据表格，告警行（`isAlert: true`）高亮显示为橙色。

### `useDashboard.ts`
数据层 Composable，封装加载状态、错误处理和刷新逻辑，视图层无需关心数据来源。
