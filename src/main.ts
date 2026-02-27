import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 引入路由实例
import '@/assets/styles/global.css'

const app = createApp(App)

// 注册路由插件
app.use(router) 

app.mount('#app')