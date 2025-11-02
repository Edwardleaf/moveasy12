<template>
  <div class="admin-settings">
    <div class="page-header">
      <h1 class="page-title">
        <TranslatedText :useStatic="true">settings</TranslatedText>
      </h1>
    </div>

    <n-card>
      <div class="placeholder">
        <n-icon size="64" color="#6b7280">
          <SettingsOutline />
        </n-icon>
        <h3>Admin Settings</h3>
        <p>This page will contain system settings and configuration options.</p>
      </div>
    </n-card>
  </div>
</template>

<script>
import { SettingsOutline } from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'

export default {
  name: 'AdminSettings',
  components: {
    TranslatedText,
    SettingsOutline
  }
}
</script>

<style scoped>
.admin-settings {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  text-transform: capitalize;
}

.placeholder {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.placeholder h3 {
  margin: 1rem 0;
  color: #374151;
}
</style>