<template>
  <div class="area-form-page">
    <div class="page-header">
      <h1 class="page-title">
        <TranslatedText :text="isEdit ? 'Edit Area' : 'Add New Area'" :use-static="true" />
      </h1>
      <p class="page-subtitle">
        <TranslatedText :text="isEdit ? 'Update area information' : 'Create a new NYC area'" :use-static="true" />
      </p>
    </div>

    <div class="form-container" v-if="!pageLoading">
      <n-card>
        <n-form
          ref="formRef"
          :model="areaData"
          :rules="rules"
          label-placement="top"
          label-width="120"
          require-mark-placement="right-hanging"
          class="area-form"
        >
          <!-- 区域信息 -->
          <div class="form-section">
            <h3 class="section-title">
              <TranslatedText text="Area Information" :use-static="true" />
            </h3>
            
            <n-grid :cols="2" :x-gap="24" style="margin-bottom: 1.5rem;">
              <n-grid-item>
                <n-form-item path="name">
                  <template #label>
                    <TranslatedText text="Area Name" :use-static="true" />
                  </template>
                  <n-input 
                    v-model:value="areaData.name"
:placeholder="getStaticText('Enter area name (e.g. SoHo, Upper East Side)')"
                    clearable
                  />
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item path="borough">
                  <template #label>
                    <TranslatedText text="Borough" :use-static="true" />
                  </template>
                  <n-select
                    v-model:value="areaData.borough"
                    :options="boroughOptions"
:placeholder="getStaticText('Select borough')"
                    clearable
                  />
                </n-form-item>
              </n-grid-item>
            </n-grid>
            
            <n-grid :cols="2" :x-gap="24">
              <n-grid-item>
                <n-form-item path="city">
                  <template #label>
                    <TranslatedText text="City" :use-static="true" />
                  </template>
                  <n-input
                    v-model:value="areaData.city"
                    value="New York"
                    disabled
                    placeholder="New York"
                  />
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item path="state">
                  <template #label>
                    <TranslatedText text="State" :use-static="true" />
                  </template>
                  <n-input
                    v-model:value="areaData.state"
                    value="NY"
                    disabled
                    placeholder="NY"
                  />
                </n-form-item>
              </n-grid-item>
            </n-grid>

            <!-- Description hidden temporarily - no data from client yet -->
            <!-- <n-form-item path="description">
              <template #label>
                <TranslatedText text="Description" :use-static="true" />
              </template>
              <n-input
                v-model:value="areaData.description"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
:placeholder="getStaticText('Enter area description...')"
                clearable
              />
            </n-form-item> -->

            <n-form-item path="image_url">
              <template #label>
                <TranslatedText text="Image URL" :use-static="true" />
              </template>
              <n-input
                v-model:value="areaData.image_url"
                placeholder="https://example.com/image.jpg"
                clearable
              />
            </n-form-item>
          </div>

          <!-- 标签和特征 -->
          <div class="form-section">
            <h3 class="section-title">
              <TranslatedText>Tags & Features</TranslatedText>
            </h3>

            <n-form-item path="area_tags">
              <template #label>
                <TranslatedText text="Area Tags" :use-static="true" />
              </template>
              <n-dynamic-tags
                v-model:value="areaData.area_tags"
                :max="10"
:placeholder="getStaticText('Add tags (e.g. trendy, nightlife, walkable)')"
              />
            </n-form-item>

            <n-form-item path="amenities">
              <template #label>
                <TranslatedText text="Amenities" :use-static="true" />
              </template>
              <n-dynamic-tags
                v-model:value="areaData.amenities"
                :max="15"
:placeholder="getStaticText('Add amenities (e.g. Whole Foods, CVS, Starbucks)')"
              />
            </n-form-item>

            <n-form-item path="transportation">
              <template #label>
                <TranslatedText text="Transportation" :use-static="true" />
              </template>
              <n-dynamic-tags
                v-model:value="areaData.transportation"
                :max="10"
:placeholder="getStaticText('Add transportation (e.g. 1/2/3 trains, M15 bus)')"
              />
            </n-form-item>
          </div>

          <!-- 租金信息 -->
          <div class="form-section">
            <h3 class="section-title">
              <TranslatedText text="Average Rent Information" :use-static="true" />
            </h3>

            <n-grid :cols="3" :x-gap="24">
              <n-grid-item>
                <n-form-item path="avg_rent_studio">
                  <template #label>
                    <TranslatedText text="Avg Studio Rent" :use-static="true" />
                  </template>
                  <n-input-number
                    v-model:value="areaData.avg_rent_studio"
                    :min="0"
                    :step="100"
                    placeholder="2500"
                    class="w-full"
                  >
                    <template #prefix>$</template>
                  </n-input-number>
                </n-form-item>
              </n-grid-item>

              <n-grid-item>
                <n-form-item path="avg_rent_1br">
                  <template #label>
                    <TranslatedText text="Avg 1BR Rent" :use-static="true" />
                  </template>
                  <n-input-number
                    v-model:value="areaData.avg_rent_1br"
                    :min="0"
                    :step="100"
                    placeholder="3000"
                    class="w-full"
                  >
                    <template #prefix>$</template>
                  </n-input-number>
                </n-form-item>
              </n-grid-item>

              <n-grid-item>
                <n-form-item path="avg_rent_2br">
                  <template #label>
                    <TranslatedText text="Avg 2BR Rent" :use-static="true" />
                  </template>
                  <n-input-number
                    v-model:value="areaData.avg_rent_2br"
                    :min="0"
                    :step="100"
                    placeholder="4000"
                    class="w-full"
                  >
                    <template #prefix>$</template>
                  </n-input-number>
                </n-form-item>
              </n-grid-item>
            </n-grid>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <n-space>
              <n-button @click="handleCancel">
                <TranslatedText text="cancel" :use-static="true" />
              </n-button>
              <n-button 
                type="primary" 
                :loading="submitting"
                @click="handleSubmit"
              >
                <TranslatedText :text="isEdit ? 'Update Area' : 'Create Area'" :use-static="true" />
              </n-button>
            </n-space>
          </div>
        </n-form>
      </n-card>
    </div>
    
    <div v-else class="loading-container">
      <n-spin size="large" />
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import TranslatedText from '@/components/TranslatedText.vue'
import useTranslation from '@/composables/useTranslation'
import { getSupabase } from '@/services/supabaseConfig'

export default {
  name: 'AreaForm',
  components: {
    TranslatedText
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const message = useMessage()
    const { getStaticText } = useTranslation()
    
    const formRef = ref(null)
    const submitting = ref(false)
    const pageLoading = ref(false)
    const areaId = route.params.id
    const isEdit = computed(() => !!areaId)
    
    // 表单数据
    const areaData = reactive({
      name: '',
      borough: '',
      city: 'New York',
      state: 'NY',
      description: '',
      area_tags: [],
      image_url: '',
      amenities: [],
      transportation: [],
      avg_rent_studio: null,
      avg_rent_1br: null,
      avg_rent_2br: null
    })

    // NYC行政区选项
    const boroughOptions = [
      { label: 'Manhattan', value: 'Manhattan' },
      { label: 'Brooklyn', value: 'Brooklyn' },
      { label: 'Queens', value: 'Queens' },
      { label: 'Bronx', value: 'Bronx' },
      { label: 'Staten Island', value: 'Staten Island' }
    ]

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: 'Area name is required', trigger: 'blur' },
        { min: 2, max: 100, message: 'Area name should be 2-100 characters', trigger: 'blur' }
      ],
      borough: [
        { required: true, message: 'Borough is required', trigger: 'change' }
      ]
    }

    // 加载area数据 (编辑模式)
    const loadArea = async () => {
      if (!isEdit.value) return
      
      try {
        pageLoading.value = true
        const supabaseClient = await getSupabase();
        const { data, error } = await supabaseClient
          .from('areas')
          .select('*')
          .eq('id', areaId)
          .single()

        if (error) throw error
        
        if (!data) {
          message.error('Area not found')
          router.push('/admin/areas')
          return
        }

        // 填充表单数据
        Object.keys(areaData).forEach(key => {
          if (data[key] !== undefined) {
            if (key === 'area_tags' || key === 'amenities' || key === 'transportation') {
              // 确保数组字段是数组
              areaData[key] = Array.isArray(data[key]) ? data[key] : []
            } else {
              areaData[key] = data[key]
            }
          }
        })

      } catch (error) {
        console.error('Error loading area:', error)
        message.error('Failed to load area data')
        router.push('/admin/areas')
      } finally {
        pageLoading.value = false
      }
    }

    // 提交表单
    const handleSubmit = async () => {
      formRef.value?.validate(async (errors) => {
        if (!errors) {
          try {
            submitting.value = true
            const supabaseClient = await getSupabase();

            if (isEdit.value) {
              // 更新area
              const { error } = await supabaseClient
                .from('areas')
                .update({
                  name: areaData.name,
                  borough: areaData.borough,
                  city: areaData.city,
                  state: areaData.state,
                  description: areaData.description,
                  area_tags: areaData.area_tags,
                  image_url: areaData.image_url,
                  amenities: areaData.amenities,
                  transportation: areaData.transportation,
                  avg_rent_studio: areaData.avg_rent_studio,
                  avg_rent_1br: areaData.avg_rent_1br,
                  avg_rent_2br: areaData.avg_rent_2br,
                  updated_at: new Date().toISOString()
                })
                .eq('id', areaId)

              if (error) throw error
              message.success('Area updated successfully!')

            } else {
              // 创建area
              const { error } = await supabaseClient
                .from('areas')
                .insert({
                  name: areaData.name,
                  borough: areaData.borough,
                  city: areaData.city,
                  state: areaData.state,
                  description: areaData.description,
                  area_tags: areaData.area_tags,
                  image_url: areaData.image_url,
                  amenities: areaData.amenities,
                  transportation: areaData.transportation,
                  avg_rent_studio: areaData.avg_rent_studio,
                  avg_rent_1br: areaData.avg_rent_1br,
                  avg_rent_2br: areaData.avg_rent_2br
                })

              if (error) throw error
              message.success('Area created successfully!')
            }

            router.push('/admin/areas')
            
          } catch (error) {
            console.error('Error saving area:', error)
            message.error('Failed to save area: ' + error.message)
          } finally {
            submitting.value = false
          }
        }
      })
    }

    // 取消操作
    const handleCancel = () => {
      router.push('/admin/areas')
    }

    // 初始化
    onMounted(async () => {
      if (isEdit.value) {
        await loadArea()
      }
    })

    return {
      formRef,
      areaData,
      rules,
      submitting,
      pageLoading,
      isEdit,
      boroughOptions,
      handleSubmit,
      handleCancel,
      getStaticText
    }
  }
}
</script>

<style scoped>
.area-form-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.area-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #198754;
}

.form-actions {
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
  margin-top: 1rem;
}

:deep(.n-form-item-label) {
  font-weight: 600;
  color: #374151;
}

:deep(.n-input), :deep(.n-select), :deep(.n-input-number) {
  border-radius: 6px;
}

:deep(.n-input-number) {
  width: 100%;
}

.w-full {
  width: 100%;
}

:deep(.n-button--primary-type) {
  background-color: #198754;
  border-color: #198754;
}

:deep(.n-button--primary-type:hover) {
  background-color: #157347;
  border-color: #157347;
}

@media (max-width: 768px) {
  .area-form-page {
    padding: 1rem;
  }
  
  .area-form {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
}
</style>