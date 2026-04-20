import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/styles/global.css'

// 🌟 统一注册 ECharts 模块，避免各组件重复注册
import * as echarts from 'echarts/core'
import {
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  // 图表类型
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  // 组件
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
  MarkAreaComponent,
  DataZoomComponent,
  // 渲染器
  CanvasRenderer,
])

const app = createApp(App)

// 🌟 添加全局错误处理器
app.config.errorHandler = (err, instance, info) => {
  console.error('🔴 Vue 全局错误捕获:', err)
  console.error('错误信息:', info)
  console.error('组件实例:', instance)

  // 生产环境可接入错误监控服务（如 Sentry）
  // if (import.meta.env.PROD) {
  //   reportToSentry(err, instance, info)
  // }
}

app.use(createPinia())
app.use(router)
app.mount('#app')