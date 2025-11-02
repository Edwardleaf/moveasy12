<template>
  <div class="amenity-list">
    <n-card :bordered="false" class="header-card">
      <n-space justify="space-between" align="center">
        <n-h2>
          <TranslatedText :useStatic="true">amenities</TranslatedText>
        </n-h2>
        <div class="header-actions">
          <n-input
            v-model:value="searchQuery"
            :placeholder="t('search_amenities', 'Search amenities...')"
            clearable
            @input="handleSearch"
            style="width: 300px; margin-right: 16px;"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
          <n-button type="primary" @click="showAddModal = true">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            <TranslatedText>Add Amenity</TranslatedText>
          </n-button>
        </div>
      </n-space>
    </n-card>

    <n-data-table
      :columns="columns"
      :data="amenities"
      :loading="loading"
      :pagination="pagination"
      :bordered="false"
      remote
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      class="amenity-table"
    />

    <!-- Add/Edit Amenity Modal -->
    <n-modal v-model:show="showAmenityModal" preset="dialog" :title="currentAmenity.id ? t('Edit Amenity') : t('Add Amenity')" :mask-closable="false">
      <n-form
        ref="formRef"
        :model="currentAmenity"
        :rules="rules"
        label-placement="left"
        label-width="auto"
        require-mark-local
      >
        <n-form-item :label="t('Area')" path="area_name">
          <n-select
            v-model:value="currentAmenity.area_name"
            :options="areaOptions"
            :placeholder="t('Select area')"
            :loading="areasLoading"
            filterable
            clearable
            remote
            :clear-filter-after-select="false"
            @search="handleAreaSearch"
          />
        </n-form-item>
        <n-form-item :label="t('Amenity Name')" path="name">
          <n-input v-model:value="currentAmenity.name" :placeholder="t('Enter amenity name')" />
        </n-form-item>
        <n-form-item :label="t('Image URL')" path="image_url">
          <n-input v-model:value="currentAmenity.image_url" :placeholder="t('Enter image URL')" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="cancelForm">{{ t('Cancel') }}</n-button>
        <n-button type="primary" @click="saveAmenity" :loading="saving">{{ t('Save') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { h, ref, reactive, onMounted, computed } from 'vue'
import { NCard, NSpace, NH2, NButton, NDataTable, NModal, NForm, NFormItem, NInput, NSelect, NIcon, useMessage, useDialog } from 'naive-ui'
import { SearchOutline, AddOutline } from '@vicons/ionicons5'
// import { Add, Edit, Trash } from '@vicons/ionicons5/AddOutline' // Temporarily removed due to build issues
import TranslatedText from '@/components/TranslatedText.vue'
import useTranslation from '@/composables/useTranslation'
import { getSupabase } from '@/services/supabaseConfig'

const message = useMessage()
const dialog = useDialog()
const { getStaticText, currentLanguage } = useTranslation()

// 创建响应式翻译函数
const t = (key, fallback = key) => {
  // 通过访问currentLanguage.value来确保响应式
  return getStaticText(key, currentLanguage.value) || fallback
}

const amenities = ref([])
const loading = ref(false)
const saving = ref(false)
const areasLoading = ref(false)
const areaOptions = ref([])
const searchQuery = ref('')
const searchTimeout = ref(null)
const showAddModal = ref(false)
const showEditModal = ref(false)

const showAmenityModal = computed({
  get() {
    return showAddModal.value || showEditModal.value;
  },
  set(val) {
    if (!val) { // If the modal is being closed
      showAddModal.value = false;
      showEditModal.value = false;
    }
  }
});

const currentAmenity = reactive({
  id: null,
  area_name: '',
  name: '',
  image_url: ''
})
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30],
  prefix ({ itemCount }) {
    return t('Total') + ` ${itemCount} ` + t('items')
  },
  suffix ({ startIndex, endIndex }) {
    return `${startIndex}-${endIndex}`
  }
})

const rules = computed(() => ({
  area_name: {
    required: true,
    message: t('Please select an area'),
    trigger: ['change', 'blur']
  },
  name: {
    required: true,
    message: t('Please enter amenity name'),
    trigger: ['input', 'blur']
  }
}))

const columns = computed(() => [
  {
    title: t('Area'),
    key: 'area_name',
    width: 150
  },
  {
    title: t('Name'),
    key: 'name',
    width: 200
  },
  {
    title: t('Image'),
    key: 'image_url',
    width: 100,
    render: (row) => {
      if (row.image_url) {
        return h('img', {
          src: row.image_url,
          alt: row.name || 'Amenity image',
          style: 'width: 60px; height: 40px; object-fit: cover; border-radius: 4px; cursor: pointer;',
          onClick: () => window.open(row.image_url, '_blank')
        })
      }
      return h('span', { style: 'color: #ccc; font-style: italic;' }, t('No Image'))
    }
  },
  {
    title: t('Actions'),
    key: 'actions',
    width: 180,
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(NButton, {
            size: 'small',
            class: 'action-btn edit-btn',
            onClick: () => editAmenity(row)
          }, { default: () => t('Edit') }),
          h(NButton, {
            size: 'small',
            class: 'action-btn delete-btn',
            onClick: () => deleteAmenity(row.id)
          }, { default: () => t('Delete') })
        ]
      })
    }
  }
])


const loadAreas = async (searchText = '') => {
  areasLoading.value = true
  try {
    const supabaseClient = await getSupabase()
    let query = supabaseClient
      .from('areas')
      .select('id, name, borough')
      .eq('city', 'New York')
      .order('name')

    // Add search filter if provided
    if (searchText.trim()) {
      query = query.ilike('name', `%${searchText}%`)
    }

    const { data, error } = await query.limit(50) // Limit to 50 results for performance

    if (error) throw error

    areaOptions.value = (data || []).map(area => ({
      label: `${area.name}, ${area.borough}`,
      value: area.name, // Use area name as value since amenities table stores area_name
      area_name: area.name
    }))
  } catch (error) {
    console.error('Error loading areas:', error)
    message.error('Failed to load areas')
  } finally {
    areasLoading.value = false
  }
}

const handleAreaSearch = (query) => {
  if (query.length > 0) {
    loadAreas(query)
  } else {
    loadAreas() // Load initial areas
  }
}

const loadAmenities = async () => {
  loading.value = true
  try {
    const supabaseClient = await getSupabase();
    let query = supabaseClient
      .from('amenities')
      .select('*', { count: 'exact' })

    // Add search filter if query exists
    if (searchQuery.value.trim()) {
      query = query.or(`name.ilike.%${searchQuery.value}%,area_name.ilike.%${searchQuery.value}%`)
    }

    const { data, error, count } = await query
      .range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      )
      .order('name', { ascending: true })

    if (error) throw error

    amenities.value = data || []
    pagination.itemCount = count || 0
  } catch (error) {
    message.error('Failed to load amenities: ' + error.message)
    console.error('Error loading amenities:', error)
    amenities.value = []
    pagination.itemCount = 0
  } finally {
    loading.value = false
  }
}

const saveAmenity = async () => {
  try {
    const supabaseClient = await getSupabase();
    await formRef.value?.validate()
    saving.value = true

    if (currentAmenity.id) {
      // Update
      const { error } = await supabaseClient
        .from('amenities')
        .update({
          area_name: currentAmenity.area_name,
          name: currentAmenity.name,
          image_url: currentAmenity.image_url
        })
        .eq('id', currentAmenity.id)
      if (error) throw error
      message.success('Amenity updated successfully!')
    } else {
      // Create
      const { error } = await supabaseClient
        .from('amenities')
        .insert({
          area_name: currentAmenity.area_name,
          name: currentAmenity.name,
          image_url: currentAmenity.image_url
        })
      if (error) throw error
      message.success('Amenity created successfully!')
      // Clear form after successful creation
      Object.assign(currentAmenity, {
        id: null,
        area_name: '',
        name: '',
        image_url: ''
      })
      formRef.value?.restoreValidation()
    }
    
    // Close modal only after update, keep open for add
    if (currentAmenity.id) {
      cancelForm()
    } else {
      showAddModal.value = false
      showEditModal.value = false
    }
    loadAmenities()
  } catch (error) {
    message.error('Failed to save amenity: ' + (error.message || error))
    console.error('Error saving amenity:', error)
  } finally {
    saving.value = false
  }
}

const editAmenity = (amenity) => {
  Object.assign(currentAmenity, amenity)
  showEditModal.value = true
}

const deleteAmenity = (id) => {
  dialog.warning({
    title: t('Confirm Deletion'),
    content: t('Are you sure you want to delete this amenity? This action cannot be undone.'),
    positiveText: t('Delete'),
    negativeText: t('Cancel'),
    onPositiveClick: async () => {
      const supabaseClient = await getSupabase();
      const { error } = await supabaseClient
        .from('amenities')
        .delete()
        .eq('id', id)
      if (error) {
        message.error('Failed to delete amenity: ' + error.message)
        console.error('Error deleting amenity:', error)
      } else {
        message.success('Amenity deleted successfully!')
        loadAmenities()
      }
    }
  })
}

const cancelForm = () => {
  showAddModal.value = false
  showEditModal.value = false
  Object.assign(currentAmenity, {
    id: null,
    area_id: null,
    area_name: '',
    name: '',
    image_url: ''
  })
  formRef.value?.restoreValidation()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadAmenities()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1 // Reset to first page when changing page size
  loadAmenities()
}

const handleSearch = () => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // Debounce search to avoid too many API calls
  searchTimeout.value = setTimeout(() => {
    pagination.page = 1 // Reset to first page when searching
    loadAmenities()
  }, 500)
}

onMounted(() => {
  loadAmenities()
  loadAreas() // Load initial areas for the select
})
</script>

<style scoped>
.amenity-list {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.amenity-table {
  margin-top: 20px;
}

/* Edit按钮样式 - 绿色 */
:deep(.edit-btn) {
  --n-color: #198754 !important;
  --n-color-hover: #47976f !important;
  --n-color-pressed: #0f5132 !important;
  --n-color-focus: #198754 !important;
  --n-color-disabled: #198754 !important;
  --n-ripple-color: #198754 !important;
  --n-text-color: #fff !important;
  --n-text-color-hover: #fff !important;
  --n-text-color-pressed: #fff !important;
  --n-text-color-focus: #fff !important;
  --n-text-color-disabled: #fff !important;
  --n-border: 1px solid #198754 !important;
  --n-border-hover: 1px solid #47976f !important;
  --n-border-pressed: 1px solid #0f5132 !important;
  --n-border-focus: 1px solid #47976f !important;
  --n-border-disabled: 1px solid #198754 !important;
  --n-font-weight: 400 !important;
  --n-height: 34px !important;
  --n-font-size: 14px !important;
  --n-padding: 0 14px !important;
  --n-icon-size: 18px !important;
  --n-icon-margin: 6px !important;
  --n-border-radius: 8px !important;
}

/* Delete按钮样式 - 红色 */
:deep(.delete-btn) {
  --n-color: #dc3545 !important;
  --n-color-hover: #e15759 !important;
  --n-color-pressed: #b02a37 !important;
  --n-color-focus: #dc3545 !important;
  --n-color-disabled: #dc3545 !important;
  --n-ripple-color: #dc3545 !important;
  --n-text-color: #fff !important;
  --n-text-color-hover: #fff !important;
  --n-text-color-pressed: #fff !important;
  --n-text-color-focus: #fff !important;
  --n-text-color-disabled: #fff !important;
  --n-border: 1px solid #dc3545 !important;
  --n-border-hover: 1px solid #e15759 !important;
  --n-border-pressed: 1px solid #b02a37 !important;
  --n-border-focus: 1px solid #e15759 !important;
  --n-border-disabled: 1px solid #dc3545 !important;
  --n-font-weight: 400 !important;
  --n-height: 34px !important;
  --n-font-size: 14px !important;
  --n-padding: 0 14px !important;
  --n-icon-size: 18px !important;
  --n-icon-margin: 6px !important;
  --n-border-radius: 8px !important;
}


</style>
