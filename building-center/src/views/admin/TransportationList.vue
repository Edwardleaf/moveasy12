<template>
  <div class="transportation-list">
    <n-card :bordered="false" class="header-card">
      <n-space justify="space-between" align="center">
        <n-h2>
          <TranslatedText>Transportation</TranslatedText>
        </n-h2>
        <div class="header-actions">
          <n-input
            v-model:value="searchQuery"
            :placeholder="t('search_transportation')"
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
            {{ t('Add Transportation') }}
          </n-button>
        </div>
      </n-space>
    </n-card>

    <n-data-table
      :columns="columns"
      :data="transportations"
      :loading="loading"
      :pagination="pagination"
      :bordered="false"
      remote
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      class="transportation-table"
    />

    <!-- Add/Edit Transportation Modal -->
    <n-modal 
      v-model:show="showTransportationModal" 
      preset="dialog" 
      :title="currentTransportation.id ? t('Edit Transportation') : t('Add Transportation')" 
      :mask-closable="false" 
      :closable="true"
      @close="cancelForm"
      @esc="cancelForm"
    >
      <n-form
        ref="formRef"
        :model="currentTransportation"
        :rules="rules"
        label-placement="left"
        label-width="auto"
        require-mark-local
      >
        <n-form-item :label="t('Area')" path="area_id">
          <n-select
            v-model:value="currentTransportation.area_id"
            :options="areaOptions"
            :placeholder="t('Select area')"
            :loading="areasLoading"
            clearable
          />
        </n-form-item>
        <n-form-item :label="t('Name')" path="name">
          <n-input v-model:value="currentTransportation.name" :placeholder="t('Enter transportation name')" />
        </n-form-item>
        <n-form-item :label="t('Image URL')" path="image_url">
          <n-input v-model:value="currentTransportation.image_url" :placeholder="t('Enter image URL')" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="cancelForm">{{ t('Cancel') }}</n-button>
        <n-button type="primary" @click="saveTransportation" :loading="saving">{{ t('Save') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { h, ref, reactive, onMounted, computed } from 'vue'
import { NCard, NSpace, NH2, NButton, NDataTable, NModal, NForm, NFormItem, NInput, NSelect, NIcon, useMessage, useDialog } from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline, TrainOutline, SearchOutline } from '@vicons/ionicons5'
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

const transportations = ref([])
const loading = ref(false)
const saving = ref(false)
const areasLoading = ref(false)
const searchQuery = ref('')
const searchTimeout = ref(null)
const areaOptions = ref([])
const showTransportationModal = computed(() => showAddModal.value || showEditModal.value)
const showAddModal = ref(false)
const showEditModal = ref(false)
const formRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix ({ itemCount }) {
    return t('Total') + ` ${itemCount} ` + t('items')
  },
  suffix ({ startIndex, endIndex }) {
    return `${startIndex}-${endIndex}`
  }
})

const currentTransportation = reactive({
  id: null,
  area_id: null,
  name: '',
  image_url: ''
})


const rules = {
  area_id: {
    required: true,
    message: t('Please select an area'),
    trigger: ['blur', 'change']
  },
  name: {
    required: true,
    message: t('Please enter transportation name'),
    trigger: ['input', 'blur']
  },
}

const columns = computed(() => [
  {
    title: t('Area'),
    key: 'area_name',
    ellipsis: true
  },
  {
    title: t('Name'),
    key: 'name',
    ellipsis: true
  },
  {
    title: t('Image'),
    key: 'image_url',
    width: 100,
    render: (row) => {
      if (row.image_url) {
        return h('img', {
          src: row.image_url,
          alt: row.name || 'Transportation image',
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
            onClick: () => editTransportation(row) 
          }, { default: () => t('Edit') }),
          h(NButton, { 
            size: 'small', 
            class: 'action-btn delete-btn',
            onClick: () => deleteTransportation(row.id) 
          }, { default: () => t('Delete') })
        ]
      })
    }
  }
])

const loadTransportations = async () => {
  loading.value = true
  try {
    const supabaseClient = await getSupabase();
    let query = supabaseClient
      .from('area_transportation')
      .select(`
        *,
        areas(name)
      `, { count: 'exact' })

    // Add search filter if query exists
    if (searchQuery.value.trim()) {
      query = query.ilike('name', `%${searchQuery.value}%`)
    }

    const { data, error, count } = await query
      .range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    transportations.value = (data || []).map(item => ({
      ...item,
      area_name: item.areas?.name || 'Unknown Area'
    }))
    pagination.itemCount = count || 0
  } catch (error) {
    console.error('Error loading transportations:', error)
    message.error(t('Failed to load transportations') + ': ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadAreas = async () => {
  areasLoading.value = true
  try {
    const supabaseClient = await getSupabase();
    const { data, error } = await supabaseClient
      .from('areas')
      .select('id, name, borough')
      .eq('city', 'New York')
      .order('name')

    if (error) throw error

    areaOptions.value = (data || []).map(area => ({
      label: `${area.name}, ${area.borough}`,
      value: area.id
    }))
  } catch (error) {
    console.error('Error loading areas:', error)
    message.error(t('Failed to load areas'))
  } finally {
    areasLoading.value = false
  }
}

const saveTransportation = async () => {
  try {
    await formRef.value?.validate()
    saving.value = true
    const supabaseClient = await getSupabase();
    
    if (currentTransportation.id) {
      // Update
      const { error } = await supabaseClient
        .from('area_transportation')
        .update({
          area_id: currentTransportation.area_id,
          name: currentTransportation.name,
          image_url: currentTransportation.image_url
        })
        .eq('id', currentTransportation.id)
      if (error) throw error
      message.success(t('Transportation updated successfully!'))
    } else {
      // Create
      const { error } = await supabaseClient
        .from('area_transportation')
        .insert({
          area_id: currentTransportation.area_id,
          name: currentTransportation.name,
          image_url: currentTransportation.image_url
        })
      if (error) throw error
      message.success(t('Transportation created successfully!'))
      // Clear form after successful creation
      Object.assign(currentTransportation, {
        id: null,
        area_id: null,
        name: '',
        image_url: ''
      })
      formRef.value?.restoreValidation()
    }
    
    // Close modal only after update, keep open for add
    if (currentTransportation.id) {
      showAddModal.value = false
      showEditModal.value = false
    } else {
      showAddModal.value = false
      showEditModal.value = false
    }
    loadTransportations()
  } catch (error) {
    console.error('Error saving transportation:', error)
    message.error(t('Failed to save transportation') + ': ' + error.message)
  } finally {
    saving.value = false
  }
}

const editTransportation = (transportation) => {
  Object.assign(currentTransportation, transportation)
  showEditModal.value = true
}

const deleteTransportation = (id) => {
  dialog.warning({
    title: t('Confirm Deletion'),
    content: t('Are you sure you want to delete this transportation? This action cannot be undone.'),
    positiveText: t('Delete'),
    negativeText: t('Cancel'),
    onPositiveClick: async () => {
      const supabaseClient = await getSupabase();
      const { error } = await supabaseClient
        .from('area_transportation')
        .delete()
        .eq('id', id)
      if (error) {
        message.error(t('Failed to delete transportation') + ': ' + error.message)
      } else {
        message.success(t('Transportation deleted successfully!'))
        loadTransportations()
      }
    }
  })
}

const cancelForm = () => {
  showAddModal.value = false
  showEditModal.value = false
  Object.assign(currentTransportation, {
    id: null,
    area_id: null,
    name: '',
    image_url: ''
  })
  formRef.value?.restoreValidation()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadTransportations()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1 // Reset to first page when changing page size
  loadTransportations()
}

const handleSearch = () => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // Debounce search to avoid too many API calls
  searchTimeout.value = setTimeout(() => {
    pagination.page = 1 // Reset to first page when searching
    loadTransportations()
  }, 500)
}

onMounted(() => {
  loadTransportations()
  loadAreas()
})
</script>

<style scoped>
.transportation-list {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.transportation-table {
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
