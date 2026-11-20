export default defineNuxtConfig({
  compatibilityDate: '2025-11-20',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    ticketApiUrl: process.env.NUXT_TICKET_API_URL || 'http://127.0.0.1:3000/api/public/v1/tickets',
  },
})
