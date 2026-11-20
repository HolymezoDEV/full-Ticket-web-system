<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
    <NuxtLink to="/login" class="flex items-center gap-2.5">
      <span class="grid size-8 place-items-center rounded-md bg-primary text-inverted">
        <UIcon name="i-lucide-life-buoy" class="size-4.5" />
      </span>
      <span class="text-sm"><span class="font-semibold text-highlighted">Holymezo</span> <span class="text-muted">MezoHelpdesk</span></span>
    </NuxtLink>
    <UPageCard class="w-full max-w-sm">
      <slot />
    </UPageCard>
  </div>
</template>
