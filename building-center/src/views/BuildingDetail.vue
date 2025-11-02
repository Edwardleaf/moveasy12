<template>
  <div class="building-detail">
    <div class="container">
      <h1>Building Detail</h1>
      <p>Building ID: {{ $route.params.id }}</p>
      
      <!-- TODO: Implement building detail content -->
      <div class="placeholder-content">
        <p>This page will show detailed information about the selected building.</p>
        <button @click="goBack" class="back-btn">
          ← Back to Browse
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/browse')
}
</script>

<style scoped>
.building-detail {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  color: #0a3622;
  margin-bottom: 1rem;
}

.placeholder-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.back-btn {
  background-color: #198754;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s ease;
}

.back-btn:hover {
  background-color: #146c43;
}
</style>