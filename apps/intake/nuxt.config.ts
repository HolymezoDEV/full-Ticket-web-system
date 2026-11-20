// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    ticketApiUrl: process.env.NUXT_TICKET_API_URL || 'http://127.0.0.1:3000/api/public/v1/tickets',
    // 'true' when running behind Cloudflare Tunnel, so limits apply per visitor.
    trustProxy: false
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: { commaDangle: 'never', braceStyle: '1tbs' }
    }
  }
})
