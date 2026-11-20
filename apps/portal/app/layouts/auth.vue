<template>
  <div class="auth-shell">
    <div class="auth-panel">
      <NuxtLink class="auth-brand" to="/login">
        <span class="brand-mark"><Icon name="lucide:life-buoy" /></span>
        <span><strong>Holymezo</strong> MezoHelpdesk</span>
      </NuxtLink>
      <slot />
    </div>
  </div>
</template>
