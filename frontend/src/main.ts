import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router'
import { applyInitialTheme } from '@/composables/useTheme'
import '@/assets/main.css'

applyInitialTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
