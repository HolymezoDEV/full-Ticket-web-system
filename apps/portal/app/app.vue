<script setup lang="ts">
import { de } from '@nuxt/ui/locale'

const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'de' },
  titleTemplate: title => title ? `${title} · MezoHelpdesk` : 'Holymezo MezoHelpdesk'
})

useSeoMeta({ description: 'Supportanfragen verwalten und beantworten.' })
</script>

<template>
  <UApp :locale="de">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
