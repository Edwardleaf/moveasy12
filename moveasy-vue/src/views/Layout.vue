<template>
  <div class="min-h-screen bg-gradient layout">
    <aside class="aside">
      <div class="aside-head">
        <RouterLink to="/owner" class="brand">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0a5ca0b1c78ff407591eb/5e0e76910_image.png" alt="Moveasy" class="brand-logo"/>
        </RouterLink>
      </div>
      <nav class="nav">
        <RouterLink v-for="item in nav" :key="item.title" :to="item.to" class="nav-item" :class="{ active: route.path===item.to }">
          <span class="nav-ico">🏢</span><span class="nav-txt">{{ item.title }}</span>
        </RouterLink>
      </nav>
    </aside>
    <main class="main">
      <header class="header">
        <div class="header-left">
          <RouterLink to="/owner" class="brand-sm">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0a5ca0b1c78ff407591eb/5e0e76910_image.png" alt="Moveasy" class="brand-logo-sm"/>
          </RouterLink>
        </div>
        <button class="btn ghost icon-only" title="Logout" @click="onLogout">⎋</button>
      </header>
      <section class="content"><router-view /></section>
    </main>
  </div>
</template>
<script setup>
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { logout } from '@/api/auth'
const route = useRoute(); const router = useRouter()
const nav = [{ title:'Buildings', to:'/owner' }]
async function onLogout(){ await logout(); router.replace('/role') }
</script>
<style scoped>
.layout{display:flex}.bg-gradient{background:linear-gradient(135deg,#eff6ff,#faf5ff,#fff1f2)}
.aside{width:250px;min-height:100vh;background:#ffffffcc;border-right:1px solid #e5e7eb;backdrop-filter:blur(6px)}
.aside-head{padding:16px;border-bottom:1px solid #e5e7eb}.brand{display:inline-flex;align-items:center;gap:8px}.brand-logo{height:32px}
.nav{padding:8px}.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;color:#111827;text-decoration:none;margin-bottom:6px}
.nav-item:hover{background:#eff6ff;color:#1d4ed8}.nav-item.active{background:#eff6ff;color:#1d4ed8}.nav-ico{font-size:14px}
.main{flex:1;display:flex;flex-direction:column}.header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#ffffffcc;border-bottom:1px solid #e5e7eb;backdrop-filter:blur(6px)}
.brand-logo-sm{height:24px}.content{flex:1;overflow:auto;padding:16px}.btn{border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px;background:#fff;cursor:pointer}
.btn.ghost{background:transparent}.btn.icon-only{padding:6px 8px}
</style>
