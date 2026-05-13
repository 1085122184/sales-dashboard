/**
 * ============================================================
 * 组件统一导出文件
 * ============================================================
 * 用于简化组件导入路径，提高代码可读性
 *
 * @example
 * import { BaseEChart, ProgressBar } from '@/components'
 */

// Base 基础组件
export { default as LoadingSkeleton } from './base/LoadingSkeleton.vue'
export { default as ProgressBar } from './base/ProgressBar.vue'
export { default as SectionTitle } from './base/SectionTitle.vue'
export { default as VirtualTable } from './base/VirtualTable.vue'

// 高级骨架屏组件
export { default as MetricCardSkeleton } from './base/MetricCardSkeleton.vue'
export { default as ChartSkeleton } from './base/ChartSkeleton.vue'
export { default as TableSkeleton } from './base/TableSkeleton.vue'
export { default as DelayedSkeleton } from './base/DelayedSkeleton.vue'

// Charts 图表基础组件
export { default as BaseEChart } from './charts/BaseEChart.vue'

// Business 跨模块业务组件
export { default as AIInsightPanel } from './business/AIInsightPanel.vue'
export { default as DetailTopBar } from './business/DetailTopBar.vue'
export { default as CompanySidebar } from './business/CompanySidebar.vue'
