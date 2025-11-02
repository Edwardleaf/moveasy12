<template>
  <div class="app-input">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <div class="input-wrapper" :class="{ 'has-error': !!error }">
      <n-input
        :id="id"
        v-model:value="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :show-password-on="showPassword ? 'click' : undefined"
        :status="error ? 'error' : undefined"
        :autosize="autosize"
        clearable
        @blur="handleBlur"
        @focus="handleFocus"
        @keyup.enter="$emit('enter')"
      >
        <template v-if="prefixIcon" #prefix>
          <n-icon>
            <component :is="prefixIcon" />
          </n-icon>
        </template>
        
        <template v-if="type === 'password'" #suffix>
          <n-button quaternary circle size="small" @click="togglePassword">
            <template #icon>
              <n-icon>
                <component :is="showPassword ? EyeOffOutline : EyeOutline" />
              </n-icon>
            </template>
          </n-button>
        </template>
        
        <template v-else-if="suffixIcon" #suffix>
          <n-icon>
            <component :is="suffixIcon" />
          </n-icon>
        </template>
      </n-input>
    </div>
    
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="hint" class="hint-message">{{ hint }}</div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { EyeOutline, EyeOffOutline } from '@vicons/ionicons5'

export default defineComponent({
  name: 'AppInput',
  components: {
    EyeOutline,
    EyeOffOutline
  },
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    id: {
      type: String,
      default: () => `input-${Math.random().toString(36).substring(2, 9)}`
    },
    label: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    },
    prefixIcon: {
      type: Object,
      default: null
    },
    suffixIcon: {
      type: Object,
      default: null
    },
    maxlength: {
      type: Number,
      default: undefined
    },
    autosize: {
      type: [Boolean, Object],
      default: false
    }
  },
  emits: ['update:modelValue', 'blur', 'focus', 'enter'],
  setup(props, { emit }) {
    const showPassword = ref(false)
    const inputValue = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const togglePassword = () => {
      showPassword.value = !showPassword.value
    }

    const handleBlur = (e) => {
      emit('blur', e)
    }

    const handleFocus = (e) => {
      emit('focus', e)
    }

    return {
      inputValue,
      showPassword,
      togglePassword,
      handleBlur,
      handleFocus,
      EyeOutline,
      EyeOffOutline
    }
  }
})
</script>

<style scoped>
.app-input {
  margin-bottom: 1.25rem;
  width: 100%;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.required {
  color: var(--error-color);
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper :deep(.n-input) {
  --n-height: 48px;
  --n-font-size: 1rem;
}

.input-wrapper :deep(.n-input__input-el) {
  height: 48px;
}

.input-wrapper :deep(.n-input-wrapper) {
  padding: 0 12px;
}

.error-message {
  color: var(--error-color);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.hint-message {
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style> 