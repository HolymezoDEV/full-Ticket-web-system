<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const menuOpen = shallowRef(false)
const pageTitle = computed(() => route.path.startsWith('/tickets/') ? 'Ticket' : route.path === '/new-ticket' ? 'Neues Ticket' : 'Posteingang')
</script>

<template>
  <div class="workspace-shell">
    <button class="mobile-menu-button" type="button" aria-label="Menü öffnen" @click="menuOpen = !menuOpen">
      <Icon :name="menuOpen ? 'lucide:x' : 'lucide:menu'" />
    </button>
    <aside class="sidebar" :class="{ 'sidebar-open': menuOpen }">
      <NuxtLink class="brand" to="/" @click="menuOpen = false">
        <span class="brand-mark"><Icon name="lucide:life-buoy" /></span>
        <span class="brand-name">Holymezo<br>MezoHelpdesk</span>
      </NuxtLink>

      <button class="workspace-switcher" type="button">
        <span class="workspace-avatar">H</span>
        <span class="workspace-copy"><strong>Holymezo</strong><small>MezoHelpdesk</small></span>
        <Icon name="lucide:chevrons-up-down" class="switcher-icon" />
      </button>

      <div class="nav-label">Arbeitsbereich</div>
      <nav class="main-nav" aria-label="Hauptnavigation">
        <NuxtLink to="/" class="nav-link" :class="{ 'nav-active': route.path === '/' }" @click="menuOpen = false">
          <Icon name="lucide:inbox" /><span>Posteingang</span>
        </NuxtLink>
        <NuxtLink to="/?filter=waiting" class="nav-link" @click="menuOpen = false"><Icon name="lucide:clock-3" /><span>Wartet auf Kunde</span></NuxtLink>
        <NuxtLink to="/?filter=all" class="nav-link" @click="menuOpen = false"><Icon name="lucide:layers-2" /><span>Alle Tickets</span></NuxtLink>
        <NuxtLink to="/?filter=resolved" class="nav-link" @click="menuOpen = false"><Icon name="lucide:circle-check" /><span>Gelöst</span></NuxtLink>
      </nav>

      <div class="nav-label team-label">Deine Teams <button type="button" aria-label="Team hinzufügen"><Icon name="lucide:plus" /></button></div>
      <button class="team-link" type="button"><span class="team-dot team-dot-blue" />Support <span>12</span></button>

      <div class="sidebar-spacer" />
      <a class="public-link" :href="String(config.public.intakeUrl)" target="_blank" rel="noreferrer"><Icon name="lucide:external-link" /><span>Öffentliches Formular</span></a>
      <button class="profile-button" type="button">
        <span class="avatar avatar-lara">H</span>
        <span class="profile-copy"><strong>Holymezo</strong><small>Support</small></span>
        <Icon name="lucide:ellipsis" />
      </button>
    </aside>

    <div v-if="menuOpen" class="sidebar-backdrop" @click="menuOpen = false" />

    <main class="workspace-main">
      <header class="topbar">
        <div class="breadcrumbs"><span>Support</span><Icon name="lucide:chevron-right" /><strong>{{ pageTitle }}</strong></div>
        <div class="topbar-actions">
          <button class="icon-button topbar-search" type="button" aria-label="Suche öffnen"><Icon name="lucide:search" /><kbd>⌘ K</kbd></button>
          <button class="icon-button" type="button" aria-label="Benachrichtigungen"><Icon name="lucide:bell" /><i class="notification-dot" /></button>
          <span class="avatar avatar-lara topbar-avatar">LW</span>
        </div>
      </header>
      <div class="page-content"><slot /></div>
    </main>
  </div>
</template>
