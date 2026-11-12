import { createApp } from 'vue'
import App from './App.vue'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/montserrat/800.css'
import './style.css'

createApp(App).mount('#app')

console.log(
  '%cHei 👋%c\nSer du etter koden? Den ligger på https://github.com/Asejs/Asejs.github.io',
  'font: 700 1.25rem Montserrat, sans-serif; color: #86d2dc',
  'font: 0.9rem Inter, sans-serif',
)
