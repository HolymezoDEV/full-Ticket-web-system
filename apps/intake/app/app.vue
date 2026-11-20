<script setup lang="ts">
import { de } from '@nuxt/ui/locale'

useHead({
  htmlAttrs: { lang: 'de' },
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  titleTemplate: title => title ? `${title} · Holymezo Support` : 'Holymezo Support'
})
useSeoMeta({ description: 'Supportanfrage an Holymezo senden und sicher nachverfolgen.' })
</script>

<template>
  <UApp :locale="de">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
