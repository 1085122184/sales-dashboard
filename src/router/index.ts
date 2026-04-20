/**
 * src/router/index.ts
 * 路由配置文件
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 1. 定义路由表
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'BusinessDashboard',
    // 采用路由懒加载（按需加载），提升首页首屏渲染速度
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { 
      title: '业务明细大屏' 
    }
  },
  {
    path: '/v1',
    name: 'ExecutiveDashboard',
    component: () => import('@/views/dashboard/ExecutiveDashboardView.vue'),
    meta: { 
      title: '集团高管指挥舱' 
    }
  },
  {
    path: '/v2',
    name: 'AnomalyMonitorView',
    component: () => import('@/views/anomaly-monitor/AnomalyMonitorView.vue'),
    meta: { 
      title: '异常监控指挥舱' 
    }
  },
  {
    path: '/details/sales',
    name: 'SalesDetail',
    component: () => import('@/views/sales-detail/SalesDetailView.vue'),
    meta: { title: '各公司销售明细' }
  },
  {
  path: '/details/order',
  name: 'OrderDetail',
  meta: { title: '各公司订单明细' },
  component: () => import('@/views/order-detail/OrderDetailView.vue')
},
  {
  path: '/screen/monitor',
  name: 'screenMonitor',
  meta: { title: '各公司订单明细' },
  component: () => import('@/views/screen-monitor/index.vue')
},
  {
  path: '/details/collection',
  name: 'CollectionDetail',
  meta: { title: '各公司回款明细' },
  component: () => import('@/views/collection-detail/CollectionDetailView.vue')
},
  {
    path: '/all-details',
    name: 'AllDetails',
    meta: { title: '明细数据查询' },
    component: () => import('@/views/all-details/AllDetailsView.vue')
  },
  {
    path: '/expense-monitor',
    name: 'ExpenseMonitor',
    meta: { title: '三项费用监控' },
    component: () => import('@/views/expense-monitor/ExpenseMonitorView.vue')
  },
  {
    path: '/expense-executive',
    name: 'ExpenseExecutive',
    meta: { title: '集团三费高管驾驶舱' },
    component: () => import('@/views/expense-monitor/ExpenseExecutiveView.vue')
  }
  // 未来您可以在这里继续添加二级页面，例如：
  // {
  //   path: '/details/price',
  //   name: 'PriceDetails',
  //   component: () => import('@/views/PriceDeviationView.vue'),
  //   meta: { title: '价格偏差明细台账' }
  // }
]

// 2. 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式（去掉 URL 中的 # 号）
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 切换路由时自动滚动到顶部
  scrollBehavior() {
    return { top: 0 }
  }
})

// 3. 全局前置路由守卫：用于动态修改网页标题
router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 销售系统`
  }
  next()
})

export default router