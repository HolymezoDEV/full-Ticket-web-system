<template>
  <div class="flex min-h-dvh flex-col bg-muted/30">
    <UHeader :toggle="false" :ui="{ root: 'bg-default/75' }">
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <span class="grid size-8 place-items-center rounded-md bg-primary text-inverted">
            <UIcon name="i-lucide-life-buoy" class="size-4.5" />
          </span>
          <span class="text-sm"><span class="font-semibold text-highlighted">Holymezo</span> <span class="text-muted">MezoHelpdesk</span></span>
        </NuxtLink>
      </template>
      <template #right>
        <UColorModeButton />
        <UButton
          to="mailto:support@holymezo.com"
          label="E-Mail schreiben"
          icon="i-lucide-mail"
          color="neutral"
          variant="ghost"
          class="max-sm:hidden"
        />
      </template>
    </UHeader>

    <UMain class="flex-1">
      <slot />
    </UMain>

    <USeparator />
    <UFooter :ui="{ root: 'bg-default' }">
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Holymezo · MezoHelpdesk
        </p>
      </template>
      <template #right>
        <ULink to="mailto:support@holymezo.com" class="text-sm text-muted hover:text-default">support@holymezo.com</ULink>
      </template>
    </UFooter>
  </div>
</template>
