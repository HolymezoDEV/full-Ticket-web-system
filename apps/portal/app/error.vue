<script setup lang="ts">
import type { NuxtError } from '#app'
import { de } from '@nuxt/ui/locale'

defineProps<{ error: NuxtError }>()

useSeoMeta({ title: 'Seite nicht gefunden' })
useHead({ htmlAttrs: { lang: 'de' } })
</script>

<template>
  <UApp :locale="de">
    <UError :error="error" :clear="{ label: 'Zur Übersicht' }" redirect="/" />
  </UApp>
</template>
