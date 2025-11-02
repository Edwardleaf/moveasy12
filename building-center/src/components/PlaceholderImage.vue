<template>
  <div 
    class="placeholder-image" 
    :style="computedStyle"
    :class="{ 'with-text': text }"
  >
    <span v-if="text" class="placeholder-text">{{ text }}</span>
    <slot></slot>
  </div>
</template>

<script>
import placeholderColors, { placeholderClasses } from '../assets/images/placeholders/placeholder.js'

export default {
  name: 'PlaceholderImage',
  props: {
    type: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'avatar', 'building', 'map', 'calendar', 'loginSidebar'].includes(value)
    },
    width: {
      type: String,
      default: null
    },
    height: {
      type: String,
      default: null
    },
    color: {
      type: String,
      default: null
    },
    text: {
      type: String,
      default: ''
    },
    rounded: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    computedStyle() {
      // 获取预设样式
      const presetStyle = this.type !== 'default' ? placeholderClasses[this.type] : {};
      
      // 合并自定义样式
      return {
        ...presetStyle,
        width: this.width || presetStyle.width || '100%',
        height: this.height || presetStyle.height || '100px',
        backgroundColor: this.color || presetStyle.backgroundColor || placeholderColors.gray,
        borderRadius: this.rounded ? '8px' : (presetStyle.borderRadius || '0')
      };
    }
  }
}
</script>

<style scoped>
.placeholder-image {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.with-text {
  position: relative;
}

.placeholder-text {
  color: #999;
  font-size: 1rem;
  text-align: center;
  padding: 0 1rem;
}
</style> 