import { createApp } from 'vue'
import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { useAuth } from '@/composables/useAuth'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'
import '@/assets/styles/styles.scss'

async function bootstrap() {
  const app = createApp(App)

  const { fetchSession } = useAuth()
  await fetchSession() 

  registerPlugins(app)
  app.mount('#app')
}

bootstrap()