<template>
  <div class="building-list">
    <div class="page-header">
      <h1 class="page-title">
        <TranslatedText :useStatic="true">buildings</TranslatedText>
      </h1>
      <div class="header-actions">
        <n-input
          v-model:value="searchQuery"
          :placeholder="t('search_buildings', 'Search buildings...')"
          clearable
          @input="handleSearch"
          style="width: 300px; margin-right: 16px;"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <n-button type="primary" @click="$router.push('/admin/buildings/new')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          <TranslatedText>Add Building</TranslatedText>
        </n-button>
      </div>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="buildings"
        :loading="loading"
        :pagination="pagination"
        remote
        @update:page="handlePageChange"
      />
    </n-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline, SearchOutline } from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'
import useTranslation from '@/composables/useTranslation'
import { getSupabase } from '@/services/supabaseConfig'

export default {
  name: 'BuildingList',
  components: {
    TranslatedText,
    AddOutline,
    CreateOutline,
    TrashOutline,
    SearchOutline
  },
  setup() {
    const router = useRouter()
    const message = useMessage()
    const { getStaticText, currentLanguage } = useTranslation()

    // 创建翻译函数
    const t = (key, fallback = key) => {
      return getStaticText(key, currentLanguage.value) || fallback
    }
    
    // Initialize dialog hook safely
    let dialog
    try {
      dialog = useDialog()
    } catch (error) {
      console.warn('Dialog provider not available:', error)
      // Fallback to window.confirm for delete operations
      dialog = {
        warning: ({ title, content, positiveText, negativeText, onPositiveClick }) => {
          const result = window.confirm(`${title}\n\n${content}`)
          if (result && onPositiveClick) {
            onPositiveClick()
          }
        }
      }
    }
    
    const loading = ref(false)
    const buildings = ref([])
    const searchQuery = ref('')
    const searchTimeout = ref(null)
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

    const columns = computed(() => [
      {
        title: t('Name'),
        key: 'name',
        ellipsis: true
      },
      {
        title: t('Area'),
        key: 'area_name'
      },
      {
        title: t('Image'),
        key: 'image_url',
        width: 100,
        render: (row) => {
          if (row.image_url) {
            return h('img', {
              src: row.image_url,
              alt: row.name || 'Building image',
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
        render: (row) => {
          return h('div', { class: 'action-buttons' }, [
            h('n-button', {
              size: 'small',
              class: 'action-btn edit-btn',
              onClick: () => editBuilding(row.id)
            }, [
              h('template', { slot: 'icon' }, [
                h('n-icon', {}, [h(CreateOutline)])
              ]),
              t('Edit')
            ]),
            h('n-button', {
              size: 'small',
              class: 'action-btn delete-btn',
              style: { marginLeft: '8px' },
              onClick: () => deleteBuilding(row.id)
            }, [
              h('template', { slot: 'icon' }, [
                h('n-icon', {}, [h(TrashOutline)])
              ]),
              t('Delete')
            ])
          ])
        }
      }
    ])

    const loadBuildings = async () => {
      try {
        loading.value = true
        const supabaseClient = await getSupabase();
        let query = supabaseClient
          .from('buildings')
          .select(`
            id,
            name,
            image_url,
            created_at,
            areas(name)
          `, { count: 'exact' })

        // Add search filter if query exists
        if (searchQuery.value.trim()) {
          query = query.or(`name.ilike.%${searchQuery.value}%`)
        }

        const { data, error, count } = await query
          .range(
            (pagination.page - 1) * pagination.pageSize,
            pagination.page * pagination.pageSize - 1
          )
          .order('created_at', { ascending: false })

        if (error) throw error

        buildings.value = data.map(building => ({
          ...building,
          area_name: building.areas?.name || 'Unknown Area'
        }))
        
        pagination.itemCount = count

      } catch (error) {
        console.error('Error loading buildings:', error)
        message.error('Failed to load buildings: ' + (error.message || 'Unknown error'))
        // Set empty data on error
        buildings.value = []
        pagination.itemCount = 0
      } finally {
        loading.value = false
      }
    }

    const handlePageChange = (page) => {
      pagination.page = page
      loadBuildings()
    }

    const handleSearch = () => {
      // Clear existing timeout
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      
      // Debounce search to avoid too many API calls
      searchTimeout.value = setTimeout(() => {
        pagination.page = 1 // Reset to first page when searching
        loadBuildings()
      }, 500)
    }

    const editBuilding = (id) => {
      router.push(`/admin/buildings/${id}/edit`)
    }

    const deleteBuilding = async (id) => {
      dialog.warning({
        title: t('Confirm Deletion'),
        content: t('Are you sure you want to delete this building? This action cannot be undone.'),
        positiveText: t('Delete'),
        negativeText: t('Cancel'),
        onPositiveClick: async () => {
          try {
            const supabaseClient = await getSupabase();
            const { error } = await supabaseClient
              .from('buildings')
              .delete()
              .eq('id', id)
            
            if (error) throw error
            
            message.success('Building deleted successfully!')
            loadBuildings() // 重新加载列表
            
          } catch (error) {
            console.error('Error deleting building:', error)
            message.error('Failed to delete building: ' + error.message)
          }
        }
      })
    }

    onMounted(() => {
      loadBuildings()
    })

    return {
      loading,
      buildings,
      pagination,
      searchQuery,
      handleSearch,
      columns,
      handlePageChange,
      editBuilding,
      deleteBuilding,
      t
    }
  }
}
</script>

<style scoped>
.building-list {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  text-transform: capitalize;
}

.header-actions {
  display: flex;
  align-items: center;
}


:deep(.action-buttons) {
  display: flex;
  gap: 0.5rem;
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