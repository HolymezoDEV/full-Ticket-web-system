import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-11-20',
  devtools: { enabled: true },
  modules: [
    'nuxt-security',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxthub/core',
    '@nuxt/scripts',
    'shadcn-nuxt',
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: 'Ui',
    componentDir: '~/components/ui',
  },
  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || '',
    supportEmail: process.env.SUPPORT_EMAIL || '',
    public: {
      intakeUrl: process.env.NUXT_PUBLIC_INTAKE_URL || 'http://127.0.0.1:3001',
    },
  },
})
