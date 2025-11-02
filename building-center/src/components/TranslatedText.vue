<script>
import { ref, watch, onMounted, h } from 'vue';
import { NSpin } from 'naive-ui';
import useTranslation from '@/composables/useTranslation';

export default {
  name: 'TranslatedText',
  props: {
    /**
     * 要翻译的文本
     */
    text: {
      type: String,
      default: ''
    },
    /**
     * 目标语言代码（如未指定，使用当前语言）
     */
    targetLanguage: {
      type: String,
      default: null
    },
    /**
     * 是否自动翻译
     */
    autoTranslate: {
      type: Boolean,
      default: true
    },
    /**
     * 是否使用静态翻译（用于常用UI文本）
     */
    useStatic: {
      type: Boolean,
      default: false
    },
    /**
     * 调试上下文标识
     */
    debugContext: {
      type: String,
      default: ''
    },
    /**
     * 强制使用API翻译，跳过静态字典和缓存
     */
    forceAPI: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { slots }) {
    const { translateText, getStaticText, currentLanguage, isLoading } = useTranslation();
    const translatedContent = ref('');
    const slotText = ref(''); // 存储从slot提取的文本
    
    // 翻译文本
    const translate = async (textToTranslate) => {
      if (!textToTranslate) {
        translatedContent.value = '';
        return;
      }
      
      // 如果启用了自动翻译，则翻译文本
      if (props.autoTranslate) {
        if (props.useStatic) {
          // 使用静态翻译，避免API调用
          translatedContent.value = getStaticText(textToTranslate, props.targetLanguage);
        } else {
          // 使用API翻译（会先检查静态字典）
          translatedContent.value = await translateText(
            textToTranslate,
            props.targetLanguage,
            props.debugContext,
            props.forceAPI
          );
        }
      } else {
        translatedContent.value = textToTranslate;
      }
    };
    
    // 监听文本变化
    watch(() => props.text, (newText) => {
      if (newText) {
        translate(newText);
      }
    }, { immediate: true });
    
    // 监听语言变化 - 确保立即响应
    watch(currentLanguage, () => {
      if (props.text) {
        translate(props.text);
      } else if (slotText.value) {
        // 对slot内容也要重新翻译
        translate(slotText.value);
      }
    });
    
    // 监听目标语言变化
    watch(() => props.targetLanguage, () => {
      if (props.text) {
        translate(props.text);
      } else if (slotText.value) {
        translate(slotText.value);
      }
    });
    
    // 监听自动翻译设置变化
    watch(() => props.autoTranslate, () => {
      if (props.text) {
        translate(props.text);
      } else if (slotText.value) {
        translate(slotText.value);
      }
    });
    
    return () => {
      // 如果有显式的text属性，使用翻译后的内容
      if (props.text && translatedContent.value) {
        return h('span', { class: 'translated-text' }, [
          translatedContent.value,
          isLoading.value && !props.useStatic && props.autoTranslate 
            ? h(NSpin, { size: 'small' }) 
            : null
        ]);
      }
      
      // 如果有text属性但还没翻译，显示原文
      if (props.text) {
        return h('span', { class: 'translated-text' }, [
          props.text,
          isLoading.value && !props.useStatic && props.autoTranslate 
            ? h(NSpin, { size: 'small' }) 
            : null
        ]);
      }
      
      // 没有text属性时，处理slot内容
      if (slots.default) {
        const slotContent = slots.default();
        if (slotContent && slotContent.length > 0) {
          // 尝试从slot内容中提取文本进行翻译
          let textFromSlot = '';
          if (slotContent[0] && typeof slotContent[0].children === 'string') {
            textFromSlot = slotContent[0].children;
          }
          
          // 如果slot文本发生变化，更新存储并重新翻译
          if (textFromSlot && textFromSlot !== slotText.value) {
            slotText.value = textFromSlot;
            translate(textFromSlot);
          }
          // 如果是初次加载且有slot文本但没有翻译内容
          else if (textFromSlot && !translatedContent.value) {
            slotText.value = textFromSlot;
            translate(textFromSlot);
          }
          
          // 如果有翻译内容，显示翻译结果，否则显示原始slot
          return h('span', { class: 'translated-text' }, [
            translatedContent.value || slotContent,
            isLoading.value && !props.useStatic && props.autoTranslate 
              ? h(NSpin, { size: 'small' }) 
              : null
          ]);
        }
      }
      
      // 默认返回空span
      return h('span', { class: 'translated-text' });
    };
  }
};
</script>

<style scoped>
.translated-text {
  position: relative;
  display: inline-flex;
  align-items: center;
}
</style> 