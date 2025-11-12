<template>
  <div class="min-h-screen bg-gradient p-6 flex items-center justify-center">
    <div class="text-center">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0a5ca0b1c78ff407591eb/5e0e76910_image.png" alt="Moveasy" class="logo"/>
      <p class="muted">Loading Building Management...</p>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from 'vue'; import { useRouter } from 'vue-router'
const router = useRouter(); onMounted(()=>{ router.replace('/owner') })
</script>
<style scoped>
.bg-gradient{background:linear-gradient(135deg,#eff6ff,#faf5ff,#fff1f2)} .logo{height:64px;margin:0 auto 16px;display:block}
.muted{color:#64748b}.flex{display:flex}.items-center{align-items:center}.justify-center{justify-content:center}.min-h-screen{min-height:100vh}.p-6{padding:24px}.text-center{text-align:center}
</style>
