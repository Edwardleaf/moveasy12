<template>
  <div class="user-list">
    <div class="page-header">
      <h1 class="page-title">
        <TranslatedText>Users</TranslatedText>
      </h1>
    </div>

    <n-card>
      <div class="placeholder">
        <n-icon size="64" color="#6b7280">
          <PeopleOutline />
        </n-icon>
        <h3>User Management</h3>
        <p>This page will display and manage all user accounts.</p>
      </div>
    </n-card>
  </div>
</template>

<script>
import { PeopleOutline } from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'

export default {
  name: 'UserList',
  components: {
    TranslatedText
  }
}
</script>

<style scoped>
.user-list {
  max-width: 1400px;
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