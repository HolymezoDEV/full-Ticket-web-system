// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-security'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || '',
    // 'false' allows login over plain http (only for local testing without HTTPS).
    cookieSecure: '',
    // 'true' when the app sits behind a proxy/tunnel that sets X-Forwarded-For.
    trustProxy: false,
    resendApiKey: process.env.RESEND_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || '',
    supportEmail: process.env.SUPPORT_EMAIL || '',
    public: {
      intakeUrl: process.env.NUXT_PUBLIC_INTAKE_URL || 'http://127.0.0.1:3001',
      portalUrl: process.env.NUXT_PUBLIC_PORTAL_URL || 'http://127.0.0.1:3000'
    }
  },

  routeRules: {
    // Called server-to-server by the contact form app, so every request shares
    // one IP. That app enforces its own per-visitor limits.
    '/api/public/**': { security: { rateLimiter: false } }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  security: {
    // Nuxt UI injects inline styles for theming and color mode.
    headers: {
      contentSecurityPolicy: {
        'img-src': ['\'self\'', 'data:', 'https:']
      }
    }
  }
})
