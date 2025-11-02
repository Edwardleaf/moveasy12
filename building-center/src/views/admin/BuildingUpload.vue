<template>
  <div class="building-upload-page">
    <div class="page-header">
      <h1 class="page-title">
        <TranslatedText>Add New Building</TranslatedText>
      </h1>
      <p class="page-subtitle">
        <TranslatedText>Upload a new building to the system</TranslatedText>
      </p>
    </div>

    <div class="upload-container">
      <n-card>
        <n-form
          ref="formRef"
          :model="buildingData"
          :rules="rules"
          label-placement="top"
          label-width="120"
          require-mark-placement="right-hanging"
          :show-require-mark="false"
          class="building-form"
        >
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">
              <TranslatedText>Basic Information</TranslatedText>
            </h3>
            
            <n-grid :cols="2" :x-gap="24">
              <n-grid-item>
                <n-form-item path="name">
                  <template #label>
                    <TranslatedText :use-static="true">Name</TranslatedText> <span style="color: #dc3545;">*</span>
                  </template>
                  <n-input 
                    v-model:value="buildingData.name"
                    :placeholder="getStaticText('Building name')"
                    clearable
                  />
                </n-form-item>
              </n-grid-item>
              
            </n-grid>

            <!-- Description hidden temporarily - no data from client yet -->
            <!-- <n-form-item path="description">
              <template #label>
                <TranslatedText :use-static="true">Description</TranslatedText>
              </template>
              <n-input
                v-model:value="buildingData.description"
                type="textarea"
                :placeholder="getStaticText('Enter building description')"
                :rows="3"
                clearable
              />
            </n-form-item> -->

            <n-grid :cols="2" :x-gap="24">
              <n-grid-item>
                <n-form-item path="year_built">
                  <template #label>
                    <TranslatedText :use-static="true">Year Built</TranslatedText>
                  </template>
                  <n-input-number
                    v-model:value="buildingData.year_built"
                    :min="1800"
                    :max="2030"
                    placeholder="2020"
                    class="w-full"
                  />
                </n-form-item>
              </n-grid-item>

              <n-grid-item>
                <n-form-item path="total_floors">
                  <template #label>
                    <TranslatedText :use-static="true">Total Floors</TranslatedText>
                  </template>
                  <n-input-number
                    v-model:value="buildingData.total_floors"
                    :min="1"
                    :max="200"
                    placeholder="10"
                    class="w-full"
                  />
                </n-form-item>
              </n-grid-item>
            </n-grid>

            <n-form-item path="image_url">
              <template #label>
                <TranslatedText :use-static="true">Image URL</TranslatedText>
              </template>
              <n-input
                v-model:value="buildingData.image_url"
                :placeholder="getStaticText('Enter building image URL (e.g., https://example.com/image.jpg)')"
                clearable
              />
            </n-form-item>
            
            <!-- 图片预览 -->
            <div v-if="buildingData.image_url" class="image-preview">
              <img :src="buildingData.image_url" :alt="buildingData.name || 'Building'" @error="handleImageError" />
            </div>

            <n-form-item path="area_id">
              <template #label>
                <TranslatedText :use-static="true">Area</TranslatedText> <span style="color: #dc3545;">*</span>
              </template>
              <n-select
                v-model:value="buildingData.area_id"
                :options="areaOptions"
                :loading="areasLoading"
                :placeholder="getStaticText('Select area')"
                clearable
                filterable
              />
            </n-form-item>
          </div>

          <!-- 租金和房型 -->
          <div class="form-section">
            <h3 class="section-title">
              <TranslatedText>Rent & Availability</TranslatedText>
            </h3>
            
            <n-grid :cols="2" :x-gap="24" style="margin-bottom: 1.5rem;">
              <n-grid-item>
                <n-form-item path="rent_range_min">
                  <template #label>
                    <TranslatedText :use-static="true">Min Rent ($)</TranslatedText> <span style="color: #dc3545;">*</span>
                  </template>
                  <n-input-number
                    v-model:value="buildingData.rent_range_min"
                    :min="0"
                    :max="50000"
                    placeholder="1500"
                    class="w-full"
                  />
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item path="rent_range_max">
                  <template #label>
                    <TranslatedText :use-static="true">Max Rent ($)</TranslatedText> <span style="color: #dc3545;">*</span>
                  </template>
                  <n-input-number
                    v-model:value="buildingData.rent_range_max"
                    :min="0"
                    :max="50000"
                    placeholder="5000"
                    class="w-full"
                  />
                </n-form-item>
              </n-grid-item>
            </n-grid>
            
            <n-grid :cols="4" :x-gap="24">
              <n-grid-item>
                <n-form-item>
                  <template #label>
                    <TranslatedText :use-static="true">Studio Available</TranslatedText>
                  </template>
                  <n-switch v-model:value="buildingData.studio_available" />
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item>
                  <template #label>
                    <TranslatedText :use-static="true">1BR Available</TranslatedText>
                  </template>
                  <n-switch v-model:value="buildingData.one_br_available" />
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item>
                  <template #label>
                    <TranslatedText :use-static="true">2BR Available</TranslatedText>
                  </template>
                  <n-switch v-model:value="buildingData.two_br_available" />
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item>
                  <template #label>
                    <TranslatedText :use-static="true">3BR Available</TranslatedText>
                  </template>
                  <n-switch v-model:value="buildingData.three_br_available" />
                </n-form-item>
              </n-grid-item>
            </n-grid>
          </div>

          <!-- 设施 -->
          <div class="form-section">
            <h3 class="section-title">
              <TranslatedText :useStatic="true">amenities</TranslatedText>
            </h3>
            
            <n-form-item path="amenities">
              <template #label>
                <TranslatedText :use-static="true">Amenities</TranslatedText>
              </template>
              <n-select
                v-model:value="buildingData.amenities"
                :options="amenityOptions"
                :loading="amenitiesLoading"
                multiple
                :placeholder="getStaticText('Select amenities')"
                clearable
                filterable
                tag
              />
            </n-form-item>
          </div>

          <!-- 联系信息和设置 -->
          <div class="form-section">
            <h3 class="section-title">
              <TranslatedText :use-static="true">Contact & Settings</TranslatedText>
            </h3>
            
            <n-grid :cols="2" :x-gap="24" style="margin-bottom: 1.5rem;">
              <n-grid-item>
                <n-form-item path="leasing_office_phone">
                  <template #label>
                    <TranslatedText :use-static="true">Leasing Phone</TranslatedText>
                  </template>
                  <n-input
                    v-model:value="buildingData.leasing_office_phone"
                    :placeholder="getStaticText('+1 (555) 123-4567')"
                    clearable
                  />
                </n-form-item>
              </n-grid-item>
              
              <n-grid-item>
                <n-form-item path="leasing_office_email">
                  <template #label>
                    <TranslatedText :use-static="true">Leasing Email</TranslatedText>
                  </template>
                  <n-input
                    v-model:value="buildingData.leasing_office_email"
                    :placeholder="getStaticText('leasing@example.com')"
                    clearable
                  />
                </n-form-item>
              </n-grid-item>
            </n-grid>

            <n-form-item path="calendly_url">
              <template #label>
                <TranslatedText :use-static="true">Calendly URL</TranslatedText>
              </template>
              <n-input
                v-model:value="buildingData.calendly_url"
                :placeholder="getStaticText('https://calendly.com/your-event')"
                clearable
              />
            </n-form-item>

            <n-grid :cols="3" :x-gap="24">
              <n-grid-item>
                <n-form-item path="pet_policy">
                  <template #label>
                    <TranslatedText :use-static="true">Pet Policy</TranslatedText> <span style="color: #dc3545;">*</span>
                  </template>
                  <n-select
                    v-model:value="buildingData.pet_policy"
                    :options="petPolicyOptions"
                    :placeholder="getStaticText('Select pet policy')"
                    clearable
                  />
                </n-form-item>
              </n-grid-item>

              <n-grid-item>
                <n-form-item>
                  <template #label>
                    <TranslatedText :use-static="true">Parking Available</TranslatedText>
                  </template>
                  <n-switch v-model:value="buildingData.parking_available" />
                </n-form-item>
              </n-grid-item>

              <n-grid-item>
                <n-form-item>
                  <template #label>
                    <TranslatedText :use-static="true">Featured Building</TranslatedText>
                  </template>
                  <n-switch v-model:value="buildingData.is_featured" />
                </n-form-item>
              </n-grid-item>
            </n-grid>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <n-space>
              <n-button @click="handleReset">
                <TranslatedText :useStatic="true">cancel</TranslatedText>
              </n-button>
              <n-button 
                type="primary" 
                :loading="submitting"
                @click="handleSubmit"
              >
                <TranslatedText>Create Building</TranslatedText>
              </n-button>
            </n-space>
          </div>
        </n-form>
      </n-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { CloudUploadOutline } from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'
import useTranslation from '@/composables/useTranslation'
import { getSupabase } from '@/services/supabaseConfig'

export default {
  name: 'BuildingUpload',
  components: {
    TranslatedText,
    CloudUploadOutline
  },
  setup() {
    const router = useRouter()
    const message = useMessage()
    const { getStaticText } = useTranslation()
    
    const formRef = ref(null)
    const uploadRef = ref(null)
    const submitting = ref(false)
    const areasLoading = ref(false)
    const areaOptions = ref([])
    const amenitiesLoading = ref(false)
    const amenityOptions = ref([])
    
    // 表单数据
    const buildingData = reactive({
      name: '',
      area_id: null,
      description: '',
      year_built: null,
      total_floors: null,
      rent_range_min: null,
      rent_range_max: null,
      studio_available: false,
      one_br_available: false,
      two_br_available: false,
      three_br_available: false,
      amenities: [],
      pet_policy: '',
      parking_available: false,
      leasing_office_phone: '',
      leasing_office_email: '',
      calendly_url: '',
      is_featured: false,
      city: 'New York',
      state: 'NY',
      image_url: ''
    })

    // 选项数据

    const petPolicyOptions = [
      { label: 'Allowed', value: 'Allowed' },
      { label: 'Not Allowed', value: 'Not Allowed' }
    ]


    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: 'Building name is required', trigger: 'blur' }
      ],
      area_id: [
        { required: true, message: 'Area is required', trigger: 'change' }
      ],
      // description: [
      //   { required: false, message: 'Description is required', trigger: 'blur' }
      // ],
      rent_range_min: [
        { type: 'number', required: true, message: 'Minimum rent is required', trigger: 'blur' }
      ],
      rent_range_max: [
        { type: 'number', required: true, message: 'Maximum rent is required', trigger: 'blur' },
        {
          validator: (rule, value) => {
            if (value && buildingData.rent_range_min && value <= buildingData.rent_range_min) {
              return new Error('Maximum rent must be greater than minimum rent')
            }
            return true
          },
          trigger: 'blur'
        }
      ],
      pet_policy: [
        { required: true, message: 'Pet policy is required', trigger: 'change' }
      ]
    }

    // 加载区域数据
    const loadAreas = async () => {
      try {
        areasLoading.value = true
        const supabaseClient = await getSupabase();
        const { data, error } = await supabaseClient
          .from('areas')
          .select('id, name, borough, city, state')
          .order('city', { ascending: true })
          .order('name', { ascending: true })

        if (error) throw error

        // 按城市分组
        const grouped = {}
        data.forEach(area => {
          const cityKey = area.city || 'Other'
          if (!grouped[cityKey]) {
            grouped[cityKey] = []
          }
          grouped[cityKey].push({
            label: `${area.name}${area.borough ? ' (' + area.borough + ')' : ''}`,
            value: area.id
          })
        })

        // 转换为带分组的选项格式
        areaOptions.value = Object.keys(grouped).map(city => ({
          type: 'group',
          label: city,
          key: city,
          children: grouped[city]
        }))
      } catch (error) {
        console.error('Error loading areas:', error)
        message.error('Failed to load areas')
      } finally {
        areasLoading.value = false
      }
    }

    // 加载设施数据 - 从areas表获取常见amenities
    const loadAmenities = async () => {
      try {
        amenitiesLoading.value = true
        
        // 预定义的常见设施选项
        const commonAmenities = [
          'Gym',
          'Pool',
          'Doorman',
          'Laundry',
          'Parking',
          'Elevator',
          'Rooftop',
          'Pet Friendly',
          'Storage',
          'Bike Room',
          'Package Room',
          'Concierge',
          'Business Center',
          'Lounge',
          'Garden',
          'Playground'
        ]

        amenityOptions.value = commonAmenities.map(amenity => ({
          label: amenity,
          value: amenity
        }))
        
      } catch (error) {
        console.error('Error loading amenities:', error)
        message.error('Failed to load amenities')
      } finally {
        amenitiesLoading.value = false
      }
    }

    // 图片预览错误处理
    const handleImageError = (event) => {
      event.target.style.display = 'none'
      message.error('Failed to load image. Please check the URL.')
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return
      
      formRef.value.validate(async (errors) => {
        if (errors) {
          console.log('Form validation failed:', errors)
          message.error('Please fill in all required fields')
          return
        }
        
        try {
          submitting.value = true
          const supabaseClient = await getSupabase()

          // 插入建筑数据
          const { data: building, error: buildingError } = await supabaseClient
            .from('buildings')
            .insert({
              name: buildingData.name,
              area_id: buildingData.area_id,
              description: buildingData.description,
              image_url: buildingData.image_url || null,
              rent_range_min: buildingData.rent_range_min,
              rent_range_max: buildingData.rent_range_max,
              studio_available: buildingData.studio_available,
              one_br_available: buildingData.one_br_available,
              two_br_available: buildingData.two_br_available,
              three_br_available: buildingData.three_br_available,
              amenities: buildingData.amenities,
              leasing_office_phone: buildingData.leasing_office_phone || null,
              leasing_office_email: buildingData.leasing_office_email || null,
              calendly_url: buildingData.calendly_url || null,
              pet_policy: buildingData.pet_policy,
              parking_available: buildingData.parking_available,
              is_featured: buildingData.is_featured
            })
            .select()
            .single()

          if (buildingError) throw buildingError

          message.success('Building created successfully!')
          router.push('/admin/buildings')
            
        } catch (error) {
          console.error('Error creating building:', error)
          message.error('Failed to create building: ' + error.message)
        } finally {
          submitting.value = false
        }
      })
    }

    // 重置表单
    const handleReset = () => {
      router.back()
    }

    // 初始化
    onMounted(() => {
      loadAreas()
      loadAmenities()
    })

    return {
      formRef,
      uploadRef,
      buildingData,
      rules,
      submitting,
      areasLoading,
      amenitiesLoading,
      areaOptions,
      petPolicyOptions,
      amenityOptions,
      getStaticText,
      handleImageError,
      handleSubmit,
      handleReset
    }
  }
}
</script>

<style scoped>
.building-upload-page {
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

.upload-container {
  max-width: 1200px;
  margin: 0 auto;
}

.building-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
}

.form-section:last-of-type {
  border-bottom: none;
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

.w-full {
  width: 100%;
}

.image-preview {
  margin-top: 12px;
  max-width: 400px;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-dragger {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 3rem;
  background-color: #f9fafb;
  transition: all 0.2s ease;
  text-align: center;
}

.upload-dragger:hover {
  border-color: #198754;
  background-color: #f0fdf4;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  color: #6b7280;
}

.upload-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
}

.upload-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

.form-actions {
  display: flex;
  justify-content: center;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.form-item-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 5px;
  display: block;
}

:deep(.n-form-item-label) {
  font-weight: 600;
  color: #374151;
}

:deep(.n-input), :deep(.n-select), :deep(.n-input-number) {
  border-radius: 6px;
}

:deep(.n-button--primary-type) {
  background-color: #198754;
  border-color: #198754;
}

:deep(.n-button--primary-type:hover) {
  background-color: #157347;
  border-color: #157347;
}

/* 表单验证样式优化 */
:deep(.n-form-item--error .n-input__input-el) {
  border-color: #dc3545 !important;
}

:deep(.n-form-item--error .n-select .n-base-selection) {
  border-color: #dc3545 !important;
}

:deep(.n-form-item--error .n-input-number .n-input__input-el) {
  border-color: #dc3545 !important;
}

:deep(.n-form-item-feedback--error) {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .building-upload-page {
    padding: 1rem;
  }
  
  .building-form {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .upload-dragger {
    padding: 2rem 1rem;
  }
}
</style>