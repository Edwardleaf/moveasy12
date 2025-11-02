<template>
  <div class="app-logo" :style="{ width: size + 'px', height: size + 'px' }">
    <div class="logo-content">
      <div class="logo-icon">
        <n-icon :size="iconSize" :color="iconColor">
          <HomeOutline />
        </n-icon>
      </div>
      <div v-if="showText" class="logo-text">BuildingCenter</div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { HomeOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'AppLogo',
  components: {
    HomeOutline
  },
  props: {
    size: {
      type: Number,
      default: 40
    },
    showText: {
      type: Boolean,
      default: false
    },
    iconColor: {
      type: String,
      default: '#198754' // 主题绿色
    }
  },
  computed: {
    iconSize() {
      return this.size * 0.6
    }
  }
})
</script>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #f0f9f4;
  overflow: hidden;
}

.logo-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 12px;
  font-weight: 600;
  color: #198754;
  margin-top: 4px;
}
</style> 