<template>
  <div class="area-list">
    <div class="page-header">
      <h1 class="page-title">
        <TranslatedText :useStatic="true">Areas</TranslatedText>
      </h1>
      <div class="header-actions">
        <n-input
          v-model:value="searchQuery"
          :placeholder="t('search_areas', 'Search areas...')"
          clearable
          @input="handleSearch"
          style="width: 300px; margin-right: 16px;"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <!-- Download/Sync buttons hidden to prevent accidental data loss -->
        <!-- <n-button type="default" @click="downloadCurrentJsonFiles">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          <TranslatedText :useStatic="true">Download Current JSON</TranslatedText>
        </n-button>
        <n-button type="primary" @click="showImportModal = true">
          <template #icon>
            <n-icon><CloudUploadOutline /></n-icon>
          </template>
          <TranslatedText :useStatic="true">Sync from JSON</TranslatedText>
        </n-button> -->
        <!-- <n-button type="primary" @click="$router.push('/admin/areas/new')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          <TranslatedText>Add Area</TranslatedText>
        </n-button> -->
      </div>
    </div>

    <n-card>
      <n-data-table
        :columns="columns"
        :data="areas"
        :loading="loading"
        :pagination="pagination"
        remote
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <!-- JSON Sync Modal -->
    <n-modal v-model:show="showImportModal" preset="dialog" title="同步区域数据" style="width: 600px">
      <div class="import-modal-content">
        <n-alert type="warning" style="margin-bottom: 20px">
          <template #header>⚠️ 重要提醒</template>
          <div style="line-height: 1.6;">
            <p><strong>新上传的JSON文件将完全覆盖现有数据，此操作不可撤销！</strong></p>
            <p>建议先备份当前数据：</p>
            <div style="margin-top: 12px;">
              <n-button size="small" type="primary" @click="downloadCurrentData">
                <template #icon>
                  <n-icon><DownloadOutline /></n-icon>
                </template>
                快速备份当前数据
              </n-button>
            </div>
          </div>
        </n-alert>

        <n-upload
          ref="uploadRef"
          :file-list="fileList"
          :max="1"
          accept=".json"
          @change="handleFileChange"
          @remove="handleFileRemove"
          style="margin-bottom: 20px"
        >
          <n-upload-dragger>
            <div style="margin-bottom: 12px">
              <n-icon size="48" :depth="3">
                <CloudUploadOutline />
              </n-icon>
            </div>
            <n-text style="font-size: 16px">
              拖拽或点击上传JSON文件
            </n-text>
            <n-p depth="3" style="margin: 8px 0 0 0">
              支持 NTA.json 和 NJ-Fliter.geojson 格式
            </n-p>
          </n-upload-dragger>
        </n-upload>

        <div v-if="importPreview.length > 0" class="import-preview" style="margin-bottom: 20px">
          <n-alert type="info" style="margin-bottom: 12px">
            <strong>已解析 {{ importPreview.length }} 个区域</strong>
            <div style="margin-top: 8px; font-size: 12px; color: #666;">
              预览前5个：{{ importPreview.slice(0, 5).map(a => a.name).join(', ') }}
              <span v-if="importPreview.length > 5">...</span>
            </div>
          </n-alert>
        </div>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showImportModal = false">取消</n-button>
          <n-button
            type="primary"
            :loading="importing"
            :disabled="importPreview.length === 0"
            @click="handleTruncateAndImport"
          >
            导入 {{ importPreview.length }} 个区域
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline, CloudUploadOutline, DownloadOutline, SearchOutline } from '@vicons/ionicons5'
import TranslatedText from '@/components/TranslatedText.vue'
import useTranslation from '@/composables/useTranslation'
import { getSupabase } from '@/services/supabaseConfig'
import JSZip from 'jszip'

export default {
  name: 'AreaList',
  components: {
    TranslatedText,
    AddOutline,
    CreateOutline,
    TrashOutline,
    CloudUploadOutline,
    DownloadOutline,
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
    const areas = ref([])
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

    // Import related state
    const showImportModal = ref(false)
    const importing = ref(false)
    const fileList = ref([])
    const importPreview = ref([])

    const columns = computed(() => [
      {
        title: t('Name'),
        key: 'name',
        ellipsis: true
      },
      {
        title: t('Borough'),
        key: 'borough'
      },
      {
        title: t('City'),
        key: 'city'
      },
      {
        title: t('Image'),
        key: 'image_url',
        width: 100,
        render: (row) => {
          if (row.image_url) {
            return h('img', {
              src: row.image_url,
              alt: row.name || 'Area image',
              style: 'width: 60px; height: 40px; object-fit: cover; border-radius: 4px; cursor: pointer;',
              onClick: () => window.open(row.image_url, '_blank')
            })
          }
          return h('span', { style: 'color: #ccc; font-style: italic;' }, t('No Image'))
        }
      },
      {
        title: t('Area Tags'),
        key: 'area_tags',
        render: (row) => {
          if (row.area_tags && Array.isArray(row.area_tags) && row.area_tags.length > 0) {
            return h('div', { style: 'display: flex; gap: 4px; flex-wrap: wrap;' }, 
              row.area_tags.slice(0, 3).map(tag => 
                h('span', { 
                  style: 'background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 12px;' 
                }, tag)
              )
            )
          }
          return h('span', { style: 'color: #ccc; font-style: italic;' }, '-')
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
              onClick: () => editArea(row.id)
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
              onClick: () => deleteArea(row.id)
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

    const loadAreas = async () => {
      try {
        loading.value = true
        const supabaseClient = await getSupabase();
        let query = supabaseClient
          .from('areas')
          .select('*', { count: 'exact' })

        // Add search filter if query exists
        if (searchQuery.value.trim()) {
          query = query.or(`name.ilike.%${searchQuery.value}%,borough.ilike.%${searchQuery.value}%,state.ilike.%${searchQuery.value}%`)
        }

        const { data, error, count } = await query
          .range(
            (pagination.page - 1) * pagination.pageSize,
            pagination.page * pagination.pageSize - 1
          )
          .order('created_at', { ascending: false })

        if (error) throw error

        areas.value = data || []
        pagination.itemCount = count

      } catch (error) {
        console.error('Error loading areas:', error)
        message.error('Failed to load areas: ' + (error.message || 'Unknown error'))
        // Set empty data on error
        areas.value = []
        pagination.itemCount = 0
      } finally {
        loading.value = false
      }
    }

    const handlePageChange = (page) => {
      pagination.page = page
      loadAreas()
    }

    const handlePageSizeChange = (pageSize) => {
      pagination.pageSize = pageSize
      pagination.page = 1 // Reset to first page when changing page size
      loadAreas()
    }

    const handleSearch = () => {
      // Clear existing timeout
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      
      // Debounce search to avoid too many API calls
      searchTimeout.value = setTimeout(() => {
        pagination.page = 1 // Reset to first page when searching
        loadAreas()
      }, 500)
    }

    const editArea = (id) => {
      router.push(`/admin/areas/${id}/edit`)
    }

    const deleteArea = async (id) => {
      dialog.warning({
        title: t('Confirm Deletion'),
        content: t('Are you sure you want to delete this area? This action cannot be undone and will affect all associated buildings.'),
        positiveText: t('Delete'),
        negativeText: t('Cancel'),
        onPositiveClick: async () => {
          try {
            const supabaseClient = await getSupabase();
            const { error } = await supabaseClient
              .from('areas')
              .delete()
              .eq('id', id)
            
            if (error) throw error
            
            message.success('Area deleted successfully!')
            loadAreas() // 重新加载列表
            
          } catch (error) {
            console.error('Error deleting area:', error)
            message.error('Failed to delete area: ' + error.message)
          }
        }
      })
    }

    // 下载当前数据库数据 (JSON格式)
    const downloadCurrentData = async () => {
      try {
        const supabaseClient = await getSupabase();
        const { data, error } = await supabaseClient
          .from('areas')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        const jsonData = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `areas_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        message.success('JSON数据下载成功！')
      } catch (error) {
        console.error('Error downloading data:', error)
        message.error('下载失败: ' + error.message)
      }
    }



    // 下载当前系统使用的JSON文件
    const downloadCurrentJsonFiles = async () => {
      try {
        // 获取当前系统使用的JSON文件列表
        const activeFiles = await getActiveJsonFiles()

        if (activeFiles.length === 0) {
          message.warning('未找到当前使用的JSON文件')
          return
        }

        // 创建ZIP实例
        const zip = new JSZip()

        let successCount = 0

        // 下载每个活跃的JSON文件
        for (const fileInfo of activeFiles) {
          try {
            const response = await fetch(fileInfo.path)
            if (response.ok) {
              const content = await response.text()
              zip.file(fileInfo.name, content)
              successCount++
            } else {
              console.warn(`无法获取文件: ${fileInfo.name}`)
            }
          } catch (error) {
            console.warn(`下载文件失败: ${fileInfo.name}`, error)
          }
        }

        if (successCount === 0) {
          message.error('无法下载任何JSON文件')
          return
        }

        // 生成压缩包并下载
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `current_json_files_${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        message.success(`成功下载 ${successCount} 个当前使用的JSON文件`)
      } catch (error) {
        console.error('Error downloading JSON files:', error)
        message.error('下载失败: ' + error.message)
      }
    }

    // 获取当前系统使用的JSON文件列表
    const getActiveJsonFiles = async () => {
      // 返回系统中当前使用的JSON文件
      // 这里可以根据实际需求动态判断哪些文件正在使用
      return [
        {
          name: "NTA.json",
          path: "/src/data/NTA.json",
          description: "纽约市邻里制表区域数据"
        },
        {
          name: "NJ-Fliter.geojson",
          path: "/src/data/NJ-Fliter.geojson",
          description: "新泽西州过滤后的地理数据"
        }
      ]
    }

    // 处理文件变化
    const handleFileChange = ({ fileList: newFileList }) => {
      fileList.value = newFileList
      if (newFileList.length > 0) {
        const file = newFileList[0].file
        if (file) {
          parseJsonFile(file)
        }
      } else {
        importPreview.value = []
      }
    }

    // 处理文件移除
    const handleFileRemove = () => {
      fileList.value = []
      importPreview.value = []
    }

    // 解析JSON文件
    const parseJsonFile = (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result)

          // 检查是否是NTA.json格式
          if (jsonData.type === 'FeatureCollection' && jsonData.features) {
            // 解析NTA格式
            const areas = jsonData.features.map(feature => {
              const props = feature.properties
              const coords = feature.geometry.coordinates

              // 计算中心点坐标 (支持Polygon和MultiPolygon)
              let centerLat = 0, centerLng = 0
              
              if (coords && coords.length > 0) {
                let allPoints = []
                
                if (feature.geometry.type === 'Polygon') {
                  // Polygon: coords[ring_index][point_index][coordinate]
                  for (const ring of coords) {
                    allPoints.push(...ring)
                  }
                } else if (feature.geometry.type === 'MultiPolygon') {
                  // MultiPolygon: coords[polygon_index][ring_index][point_index][coordinate]
                  for (const polygon of coords) {
                    for (const ring of polygon) {
                      allPoints.push(...ring)
                    }
                  }
                }
                
                if (allPoints.length > 0) {
                  const lats = allPoints.map(c => c[1])
                  const lngs = allPoints.map(c => c[0])
                  centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
                  centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
                }
              }

              return {
                name: props.NTAName,
                state: 'New York',
                city: 'New York',
                borough: props.BoroName,
                description: `${props.NTAName} area in ${props.BoroName}`,
                general_latitude: centerLat,
                general_longitude: centerLng,
              }
            }).filter(area => area.name) // 过滤掉没有名称的区域

            importPreview.value = areas
            message.success(`解析成功！找到 ${areas.length} 个区域`)
          } else {
            // 尝试解析普通的areas数组格式
            const areas = Array.isArray(jsonData) ? jsonData : [jsonData]
            importPreview.value = areas.filter(area => area.name)
            message.success(`解析成功！找到 ${importPreview.value.length} 个区域`)
          }
        } catch (error) {
          console.error('Error parsing JSON:', error)
          message.error('JSON文件解析失败: ' + error.message)
          importPreview.value = []
        }
      }
      reader.readAsText(file)
    }

    // 执行TRUNCATE和重建
    const handleTruncateAndImport = async () => {
      if (importPreview.value.length === 0) {
        message.warning('没有可导入的数据')
        return
      }

      // 多重确认机制
      const firstConfirm = window.confirm(
        `⚠️ 危险操作确认 ⚠️\n\n即将执行：清空重建areas表\n` +
        `• 将删除所有现有区域数据\n` +
        `• 导入 ${importPreview.value.length} 个新区域\n` +
        `• 此操作不可撤销！\n\n确认继续吗？`
      )

      if (!firstConfirm) return

      const secondConfirm = window.confirm(
        `🔴 最终确认 🔴\n\n您确定要清空areas表并重新导入数据吗？\n\n` +
        `建议：如未备份请点击"取消"，先下载备份数据！\n\n点击"确定"将立即执行清空重建操作！`
      )

      if (!secondConfirm) return

      try {
        importing.value = true
        const supabaseClient = await getSupabase();

        // 使用RPC调用TRUNCATE（更高效且重置自增ID）
        const { error: truncateError } = await supabaseClient.rpc('truncate_areas_table')

        if (truncateError) {
          console.warn('TRUNCATE RPC失败，回退到DELETE:', truncateError)
          // 回退到DELETE方式
          const { error: deleteError } = await supabaseClient
            .from('areas')
            .delete()
            .neq('id', 0) // 删除所有记录

          if (deleteError) throw deleteError
        }

        // 批量插入新数据
        const { error: insertError } = await supabaseClient
          .from('areas')
          .insert(importPreview.value)

        if (insertError) throw insertError

        message.success(`🎉 同步成功！清空重建了 ${importPreview.value.length} 个区域`)
        showImportModal.value = false
        fileList.value = []
        importPreview.value = []
        loadAreas() // 重新加载列表

      } catch (error) {
        console.error('❌ 同步失败:', error)
        message.error(`同步失败: ${error.message}`)
      } finally {
        importing.value = false
      }
    }

    // 保留原有导入方法（增量导入）
    const handleImport = async () => {
      if (importPreview.value.length === 0) {
        message.warning('没有可导入的数据')
        return
      }

      const confirmed = window.confirm(
        `确认导入 ${importPreview.value.length} 个区域吗？\n\n这将覆盖现有数据且不可撤销！`
      )

      if (!confirmed) return

      try {
        importing.value = true
        const supabaseClient = await getSupabase();

        // 先删除现有的区域数据
        const { error: deleteError } = await supabaseClient
          .from('areas')
          .delete()
          .neq('id', 0)

        if (deleteError) throw deleteError

        // 批量插入新数据
        const { error: insertError } = await supabaseClient
          .from('areas')
          .insert(importPreview.value)

        if (insertError) throw insertError

        message.success(`成功导入 ${importPreview.value.length} 个区域！`)
        showImportModal.value = false
        fileList.value = []
        importPreview.value = []
        loadAreas() // 重新加载列表

      } catch (error) {
        console.error('Error importing areas:', error)
        message.error('导入失败: ' + error.message)
      } finally {
        importing.value = false
      }
    }

    onMounted(() => {
      loadAreas()
    })

    return {
      loading,
      areas,
      pagination,
      searchQuery,
      handleSearch,
      columns,
      handlePageChange,
      handlePageSizeChange,
      editArea,
      deleteArea,
      // Import related
      showImportModal,
      importing,
      fileList,
      importPreview,
      downloadCurrentData,
      downloadCurrentJsonFiles,
      handleFileChange,
      handleFileRemove,
      handleImport,
      handleTruncateAndImport,
      // Icons
      AddOutline,
      CreateOutline,
      TrashOutline,
      CloudUploadOutline,
      DownloadOutline,
      SearchOutline,
      // Translation
      t
    }
  }
}
</script>

<style scoped>
.area-list {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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

.import-preview {
  margin-top: 16px;
}

.preview-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-more {
  padding: 8px 0;
  color: #666;
  font-style: italic;
  text-align: center;
}

.download-section {
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}
</style>