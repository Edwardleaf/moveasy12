const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// 初始化Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 解析NTA.json格式的GeoJSON数据
 */
function parseNTAJson(jsonData) {
  if (!jsonData.type === 'FeatureCollection' || !jsonData.features) {
    throw new Error('Invalid NTA JSON format');
  }

  return jsonData.features.map(feature => {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    // 计算中心点坐标
    let centerLat = 0, centerLng = 0;
    if (coords && coords[0] && coords[0].length > 0) {
      const flatCoords = coords[0];
      const lats = flatCoords.map(c => c[1]);
      const lngs = flatCoords.map(c => c[0]);
      centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    }

    return {
      name: props.NTAName,
      state: 'New York',
      city: 'New York', 
      borough: props.BoroName,
      description: `${props.NTAName} area in ${props.BoroName}`,
      general_latitude: centerLat,
      general_longitude: centerLng,
      area_tags: ['residential', 'community'] // 默认标签
    };
  }).filter(area => area.name); // 过滤掉没有名称的区域
}

/**
 * 解析NJ-Filter.geojson格式的数据
 */
function parseNJGeoJson(jsonData) {
  if (!jsonData.type === 'FeatureCollection' || !jsonData.features) {
    throw new Error('Invalid NJ GeoJSON format');
  }

  return jsonData.features.map(feature => {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    // 计算中心点坐标
    let centerLat = 0, centerLng = 0;
    if (coords && coords[0] && coords[0].length > 0) {
      const flatCoords = coords[0];
      const lats = flatCoords.map(c => c[1]);
      const lngs = flatCoords.map(c => c[0]);
      centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    }

    return {
      name: props.MUN_LABEL || props.NAME,
      state: 'New Jersey',
      city: props.MUN || 'Unknown',
      borough: props.COUNTY || 'Unknown County',
      description: `${props.MUN_LABEL || props.NAME} in ${props.COUNTY} County, NJ`,
      general_latitude: centerLat,
      general_longitude: centerLng,
      area_tags: ['residential', 'nj-area']
    };
  }).filter(area => area.name);
}

/**
 * POST /api/areas/sync-from-json
 * 从JSON文件同步区域数据
 */
router.post('/sync-from-json', async (req, res) => {
  try {
    const { jsonData, fileType, truncateFirst = true } = req.body;

    if (!jsonData) {
      return res.status(400).json({
        success: false,
        error: 'Missing jsonData in request body'
      });
    }

    console.log(`🔄 Starting areas sync from ${fileType || 'unknown'} format...`);

    // 解析JSON数据
    let areas = [];
    try {
      if (fileType === 'nta' || jsonData.type === 'FeatureCollection') {
        areas = parseNTAJson(jsonData);
      } else if (fileType === 'nj') {
        areas = parseNJGeoJson(jsonData);
      } else {
        // 尝试自动检测格式
        if (jsonData.features && jsonData.features[0]?.properties?.NTAName) {
          areas = parseNTAJson(jsonData);
        } else if (jsonData.features && jsonData.features[0]?.properties?.MUN_LABEL) {
          areas = parseNJGeoJson(jsonData);
        } else {
          throw new Error('Unable to detect JSON format');
        }
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: `JSON parsing failed: ${parseError.message}`
      });
    }

    if (areas.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid areas found in JSON data'
      });
    }

    console.log(`📊 Parsed ${areas.length} areas from JSON`);

    // 执行数据库操作
    if (truncateFirst) {
      console.log('🗑️ Truncating areas table...');
      const { error: truncateError } = await supabase.rpc('truncate_areas_table');
      
      if (truncateError) {
        console.warn('TRUNCATE RPC failed, falling back to DELETE:', truncateError);
        // 回退到DELETE
        const { error: deleteError } = await supabase
          .from('areas')
          .delete()
          .neq('id', 0);
        
        if (deleteError) throw deleteError;
      }
      console.log('✅ Areas table cleared');
    }

    // 批量插入新数据
    console.log('📥 Inserting new areas...');
    const { error: insertError } = await supabase
      .from('areas')
      .insert(areas);

    if (insertError) throw insertError;

    console.log('✅ Areas sync completed successfully');

    res.json({
      success: true,
      message: `Successfully synced ${areas.length} areas`,
      data: {
        areasCount: areas.length,
        truncated: truncateFirst,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Areas sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/areas/sync-from-files
 * 从服务器上的JSON文件同步数据
 */
router.post('/sync-from-files', async (req, res) => {
  try {
    const { truncateFirst = true } = req.body;
    
    console.log('🔄 Starting sync from server JSON files...');

    // 读取服务器上的JSON文件
    const ntaPath = path.join(__dirname, '../../building-center/src/data/NTA.json');
    const njPath = path.join(__dirname, '../../building-center/src/data/NJ-Fliter.geojson');

    let allAreas = [];

    // 读取NTA.json
    try {
      const ntaData = await fs.readFile(ntaPath, 'utf8');
      const ntaJson = JSON.parse(ntaData);
      const ntaAreas = parseNTAJson(ntaJson);
      allAreas = allAreas.concat(ntaAreas);
      console.log(`📊 Loaded ${ntaAreas.length} areas from NTA.json`);
    } catch (error) {
      console.warn('⚠️ Failed to load NTA.json:', error.message);
    }

    // 读取NJ-Filter.geojson
    try {
      const njData = await fs.readFile(njPath, 'utf8');
      const njJson = JSON.parse(njData);
      const njAreas = parseNJGeoJson(njJson);
      allAreas = allAreas.concat(njAreas);
      console.log(`📊 Loaded ${njAreas.length} areas from NJ-Filter.geojson`);
    } catch (error) {
      console.warn('⚠️ Failed to load NJ-Filter.geojson:', error.message);
    }

    if (allAreas.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No areas loaded from JSON files'
      });
    }

    // 执行数据库同步
    if (truncateFirst) {
      console.log('🗑️ Truncating areas table...');
      const { error: truncateError } = await supabase.rpc('truncate_areas_table');
      
      if (truncateError) {
        console.warn('TRUNCATE RPC failed, falling back to DELETE:', truncateError);
        const { error: deleteError } = await supabase
          .from('areas')
          .delete()
          .neq('id', 0);
        
        if (deleteError) throw deleteError;
      }
      console.log('✅ Areas table cleared');
    }

    // 批量插入
    console.log('📥 Inserting areas...');
    const { error: insertError } = await supabase
      .from('areas')
      .insert(allAreas);

    if (insertError) throw insertError;

    console.log('✅ File sync completed successfully');

    res.json({
      success: true,
      message: `Successfully synced ${allAreas.length} areas from server files`,
      data: {
        areasCount: allAreas.length,
        truncated: truncateFirst,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ File sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/areas/status
 * 获取areas表状态信息
 */
router.get('/status', async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from('areas')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        totalAreas: count,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
