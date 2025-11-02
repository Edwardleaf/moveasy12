<template>
  <n-button
    :type="type"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :block="block"
    :ghost="ghost"
    :text="text"
    :color="color"
    :circle="circle"
    :round="round"
    :quaternary="quaternary"
    :strong="strong"
    class="app-button"
    :class="[
      `app-button--${type}`,
      `app-button--${size}`,
      { 'app-button--block': block }
    ]"
    @click="$emit('click', $event)"
  >
    <template v-if="$slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
    <template v-else-if="icon" #icon>
      <n-icon>
        <component :is="icon" />
      </n-icon>
    </template>
    
    <slot></slot>
  </n-button>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AppButton',
  props: {
    type: {
      type: String,
      default: 'default',
      validator: (value) => {
        return ['default', 'primary', 'info', 'success', 'warning', 'error'].includes(value)
      }
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => {
        return ['tiny', 'small', 'medium', 'large'].includes(value)
      }
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    block: {
      type: Boolean,
      default: false
    },
    ghost: {
      type: Boolean,
      default: false
    },
    text: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: null
    },
    icon: {
      type: Object,
      default: null
    },
    circle: {
      type: Boolean,
      default: false
    },
    round: {
      type: Boolean,
      default: false
    },
    quaternary: {
      type: Boolean,
      default: false
    },
    strong: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click']
})
</script>

<style scoped>
.app-button {
  font-weight: 500;
}

.app-button--primary {
  background-color: var(--primary-color);
}

.app-button--medium {
  height: 48px;
  font-size: 1rem;
  padding: 0 1.5rem;
}

.app-button--large {
  height: 56px;
  font-size: 1.125rem;
  padding: 0 2rem;
}

.app-button--block {
  width: 100%;
}

/* 覆盖naive-ui的一些默认样式 */
:deep(.n-button__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

:deep(.n-button--primary-type) {
  background-color: var(--primary-color);
}

:deep(.n-button--primary-type:hover) {
  background-color: var(--primary-hover);
}

:deep(.n-button--primary-type:active) {
  background-color: var(--primary-pressed);
}
</style> 