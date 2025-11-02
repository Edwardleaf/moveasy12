<template>
  <div class="area-upload">
    <div class="page-header">
      <h1 class="page-title">
        <TranslatedText>Add New Area</TranslatedText>
      </h1>
    </div>

    <n-card>
      <div class="placeholder">
        <n-icon size="64" color="#6b7280">
          <AddOutline />
        </n-icon>
        <h3>Area Upload Form</h3>
        <p>This page will contain a form to add new areas/neighborhoods.</p>
        <n-button @click="$router.back()">
          <TranslatedText :useStatic="true">back</TranslatedText>
        </n-button>
      </div>
    </n-card>
  </div>
</template>

<script>
import { AddOutline } from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'

export default {
  name: 'AreaUpload',
  components: {
    TranslatedText
  }
}
</script>

<style scoped>
.area-upload {
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