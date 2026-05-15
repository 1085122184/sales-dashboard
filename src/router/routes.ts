import type { RouteRecordRaw } from 'vue-router'
import {
  DASHBOARD_REQUIRED_PERMISSIONS,
  DECISION_PERMISSIONS,
  SYSTEM_ROLE_PERMISSIONS
} from '@/config/permissions'

export const appRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/dingtalk-bridge',
    name: 'DingTalkBridge',
    component: () => import('@/views/auth/DingTalkBridgeView.vue'),
    meta: { title: '钉钉中转' }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/ForbiddenView.vue'),
    meta: { title: '无权限' }
  },
  {
    path: '/',
    name: 'BusinessDashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: {
      title: '销售指标大盘',
      requiresAuth: true,
      menuPathRequired: true,
      requiresAllPermissions: [...DASHBOARD_REQUIRED_PERMISSIONS]
    }
  },
  {
    path: '/v1',
    name: 'ExecutiveDashboard',
    component: () => import('@/views/dashboard/ExecutiveDashboardView.vue'),
    meta: {
      title: '集团高管指挥舱',
      requiresAuth: true,
      requiresPermission: DECISION_PERMISSIONS.SALES_ANALYSIS_VIEW
    }
  },
  {
    path: '/v2',
    name: 'AnomalyMonitorView',
    component: () => import('@/views/anomaly-monitor/AnomalyMonitorView.vue'),
    meta: {
      title: '异常监控指挥舱',
      requiresAuth: true,
      requiresPermission: DECISION_PERMISSIONS.PRICE_ANALYSIS_VIEW
    }
  },
  {
    path: '/details/sales',
    name: 'SalesDetail',
    component: () => import('@/views/sales-detail/SalesDetailView.vue'),
    meta: {
      title: '销售明细',
      requiresAuth: true,
      menuPathRequired: true,
      requiresPermission: DECISION_PERMISSIONS.SALES_ANALYSIS_VIEW
    }
  },
  {
    path: '/details/order',
    name: 'OrderDetail',
    component: () => import('@/views/order-detail/OrderDetailView.vue'),
    meta: {
      title: '订单明细',
      requiresAuth: true,
      requiresPermission: DECISION_PERMISSIONS.SALES_ANALYSIS_VIEW
    }
  },
  {
    path: '/screen/monitor',
    name: 'ScreenMonitor',
    component: () => import('@/views/screen-monitor/index.vue'),
    meta: {
      title: '大屏监控',
      requiresAuth: true,
      requiresPermission: DECISION_PERMISSIONS.METRICS_VIEW
    }
  },
  {
    path: '/details/collection',
    name: 'CollectionDetail',
    component: () => import('@/views/collection-detail/CollectionDetailView.vue'),
    meta: {
      title: '回款明细',
      requiresAuth: true,
      menuPathRequired: true,
      requiresPermission: DECISION_PERMISSIONS.COLLECTION_ANALYSIS_VIEW
    }
  },
  {
    path: '/all-details',
    name: 'AllDetails',
    component: () => import('@/views/all-details/AllDetailsView.vue'),
    meta: {
      title: '明细数据查询',
      requiresAuth: true,
      menuPathRequired: true,
      requiresPermission: DECISION_PERMISSIONS.ALL_DETAILS_VIEW
    }
  },
  {
    path: '/expense-monitor',
    name: 'ExpenseMonitor',
    component: () => import('@/views/expense-monitor/ExpenseMonitorView.vue'),
    meta: {
      title: '三费监控',
      requiresAuth: true,
      requiresPermission: DECISION_PERMISSIONS.EXPENSE_VIEW
    }
  },
  {
    path: '/expense-executive',
    name: 'ExpenseExecutive',
    component: () => import('@/views/expense-monitor/ExpenseExecutiveView.vue'),
    meta: {
      title: '集团三费高管驾驶舱',
      requiresAuth: true,
      menuPathRequired: true,
      requiresPermission: DECISION_PERMISSIONS.EXPENSE_VIEW
    }
  },
  {
    path: '/production-dashboard',
    name: 'ProductionDashboard',
    component: () => import('@/views/production/ProductionDashboardView.vue'),
    meta: {
      title: '生产运营指标大盘',
      requiresAuth: true,
      menuPathRequired: true,
      requiresPermission: DECISION_PERMISSIONS.PRODUCTION_VIEW
    }
  },
  {
    path: '/production-detail',
    name: 'ProductionDetail',
    component: () => import('@/views/production/ProductionDetailView.vue'),
    meta: {
      title: '生产明细数据',
      requiresAuth: true,
      menuPathRequired: true,
      requiresPermission: DECISION_PERMISSIONS.PRODUCTION_DETAIL_VIEW
    }
  },
  {
    path: '/system/role',
    name: 'RoleManage',
    component: () => import('@/views/system/role/RoleView.vue'),
    meta: {
      title: '角色管理',
      requiresAuth: true,
      menuPathRequired: true,
      requiresPermission: SYSTEM_ROLE_PERMISSIONS.LIST
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]
