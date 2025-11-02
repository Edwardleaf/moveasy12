// dataService.js - 数据服务层，处理所有数据库查询
import { getSupabase } from './supabaseConfig.js';
import translateApi from './translateApi.js';

class DataService {
  constructor() {
    this.supabase = null;
  }

  async initializeSupabase() {
    try {
      this.supabase = await getSupabase();
    } catch (error) {
      console.error('Failed to initialize Supabase in DataService:', error);
    }
  }

  // 确保 Supabase 客户端已初始化
  async ensureSupabase() {
    if (!this.supabase) {
      await this.initializeSupabase();
    }
    return this.supabase;
  }

  // 获取所有建筑类别 (category字段)
  async getBuildingCategories() {
    try {
      const supabase = await this.ensureSupabase();
      console.log('🏷️ DataService: Fetching building categories...');
      
      const { data, error } = await supabase
        .from('buildings')
        .select('category')
        .not('category', 'is', null)
        .not('category', 'eq', '')
        .order('category');

      if (error) {
        console.error('❌ Failed to fetch building categories:', error);
        return this.getDefaultCategories();
      }

      // 去重并格式化
      const uniqueCategories = [...new Set(data.map(item => item.category))]
        .filter(category => category && category.trim())
        .map(category => ({
          value: category.toLowerCase().replace(/\s+/g, '_'),
          label: this.formatCategoryLabel(category)
        }));

      console.log('🏷️ Found categories:', uniqueCategories);
      return uniqueCategories;
    } catch (error) {
      console.error('❌ Error fetching building categories:', error);
      return this.getDefaultCategories();
    }
  }

  // 格式化类别标签
  formatCategoryLabel(category) {
    // 将类别名称转换为首字母大写的显示格式
    return category
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // 默认类别（作为备用）
  getDefaultCategories() {
    return [
      { value: 'apartment', label: 'Apartment' },
      { value: 'condo', label: 'Condo' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'studio', label: 'Studio' },
      { value: 'loft', label: 'Loft' },
      { value: 'penthouse', label: 'Penthouse' }
    ];
  }

  // 搜索区域和建筑物 - RPC 函数方式
  async searchAreasAndBuildings(params) {
    try {
      const supabase = await this.ensureSupabase();
      console.log('🔍 DataService: Calling searchAreasAndBuildings with params:', params);
      
      const { data, error } = await supabase.rpc('search_areas_and_buildings', {
        search_location: params.location || '',
        search_rent_type: params.rentType || 'all',
        search_tags: params.tags || []
      });

      if (error) {
        console.warn('🚨 RPC function failed, falling back to direct query:', error);
        return await this.searchAreasAndBuildingsDirect(params);
      }

      console.log('📊 Search results:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ RPC search failed, using fallback:', error);
      return await this.searchAreasAndBuildingsDirect(params);
    }
  }

  // 直接查询方式（备用）
  async searchAreasAndBuildingsDirect(params) {
    try {
      const supabase = await this.ensureSupabase();
      console.log('🔄 DataService: Using direct query fallback');

      let query = supabase
        .from('areas')
        .select(`
          id,
          name,
          state,
          city,
          borough,
          description,
          area_tags,
          general_latitude,
          general_longitude,
          total_buildings,
          buildings!inner(
            id,
            name,
            description,
            amenities,
            is_featured,
            image_url
          )
        `);

      // 添加位置搜索条件 - 支持中文搜索
      if (params.location && params.location !== 'all') {
        // 先尝试翻译搜索词（如果是中文）
        const translatedTerm = await translateApi.translateForSearch(params.location);
        const searchTerm = translatedTerm;
        
        console.log(`🔍 Areas search: "${params.location}" -> "${translatedTerm}"`);
        
        // 使用正确的 Supabase ilike 语法
        query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,borough.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Direct query failed:', error);
        return [];
      }

      console.log('📊 Direct query results:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ searchAreasAndBuildingsDirect error:', error);
      return [];
    }
  }

  // 根据缩放级别获取数据
  async getDataByZoomLevel(zoomLevel, searchParams = {}) {
    console.log(`🔍 Getting data for zoom level: ${zoomLevel}`);
    
    if (zoomLevel >= 14.5) {
      // 高zoom级别 - 主要检索区域/社区
      return await this.loadNeighborhoodData(searchParams);
    } else {
      // 低zoom级别 - 主要检索建筑物
      return await this.loadBuildingData(searchParams);
    }
  }

  // 加载社区数据
  async loadNeighborhoodData(searchParams = {}) {
    try {
      const supabase = await this.ensureSupabase();
      console.log('🏘️ Loading neighborhood data with params:', searchParams);

      // 简化查询，移除可能有问题的关联查询
      let query = supabase
        .from('areas')
        .select(`
          id,
          name,
          state,
          city,
          borough,
          description,
          area_tags,
          general_latitude,
          general_longitude,
          total_buildings,
          image_url
        `)
        .not('total_buildings', 'is', null)
        .order('total_buildings', { ascending: false });

      let data, error;

      // 处理搜索条件 - 智能模糊匹配，支持中文搜索
      if (searchParams.location && searchParams.location !== 'all') {
        console.log(`🔍 Searching for location: "${searchParams.location}"`);

        // 先尝试翻译搜索词（如果是中文）
        const translatedLocation = await translateApi.translateForSearch(searchParams.location);
        console.log(`🔍 Neighborhood search: "${searchParams.location}" -> "${translatedLocation}"`);

        // 先做一个简单的测试查询，看看数据库中有什么
        const { data: testData, error: testError } = await supabase
          .from('areas')
          .select('name, city, borough')
          .limit(5);

        if (!testError && testData) {
          console.log('📊 Sample data from database:', testData);
        }

        const searchResults = await this.performFuzzySearchSimple('areas', searchParams.location);
        data = searchResults;
        error = null;
      } else {
        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error loading neighborhood data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }

      // 应用tags过滤
      if (data && searchParams.tags && searchParams.tags.length > 0) {
        console.log(`🏷️ Filtering neighborhoods by tags: ${searchParams.tags.join(', ')}`);
        const originalCount = data.length;
        data = this.filterByTags(data, searchParams.tags);
        console.log(`📊 After tag filtering: ${data.length}/${originalCount} neighborhoods`);
      }

      console.log('📊 Neighborhood data loaded:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📊 Sample loaded data:', data.slice(0, 3).map(item => ({
          name: item.name,
          city: item.city,
          borough: item.borough,
          tags: item.area_tags
        })));
      }
      return data || [];
    } catch (error) {
      console.error('❌ loadNeighborhoodData error:', error);
      return [];
    }
  }

  // 加载建筑物数据
  async loadBuildingData(searchParams = {}) {
    try {
      const supabase = await this.ensureSupabase();
      console.log('🏢 Loading building data');

      let query = supabase
        .from('buildings')
        .select(`
          id,
          name,
          description,
          image_url,
          amenities,
          is_featured,
          area_id,
          areas!inner(
            id,
            name,
            state,
            city,
            borough,
            general_latitude,
            general_longitude
          )
        `)
        .order('is_featured', { ascending: false })
        .order('name');

      let data, error;

      // 处理搜索条件 - 智能模糊匹配，支持中文搜索
      if (searchParams.location && searchParams.location !== 'all') {
        // 先尝试翻译搜索词（如果是中文）
        const translatedLocation = await translateApi.translateForSearch(searchParams.location);
        console.log(`🔍 Building search: "${searchParams.location}" -> "${translatedLocation}"`);
        
        const searchResults = await this.performFuzzySearch('buildings', translatedLocation);
        data = searchResults;
        error = null;
      } else {
        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error loading building data:', error);
        return [];
      }

      console.log('📊 Building data loaded:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ loadBuildingData error:', error);
      return [];
    }
  }

  // 根据tags过滤数据
  filterByTags(data, selectedTags) {
    if (!selectedTags || selectedTags.length === 0) {
      return data;
    }

    return data.filter(item => {
      const itemTags = item.area_tags || [];
      // 检查是否至少包含一个选中的tag
      return selectedTags.some(selectedTag =>
        itemTags.includes(selectedTag)
      );
    });
  }

  // 有关键词时：优先匹配关键词为社区，然后搜索该社区下的建筑，如果没找到就直接搜索建筑
  async loadBuildingsInCommunity(communityName, searchParams = {}) {
    try {
      const supabase = await this.ensureSupabase();
      console.log(`🏠 Loading buildings in community: "${communityName}"`);
      console.log('🔍 Search params:', searchParams);

      // 使用新的优化搜索方法
      const searchResult = await this.performOptimizedSearch(communityName);
      
      let buildings = [];
      
      if (searchResult && searchResult.found) {
        if (searchResult.type === 'area' && searchResult.details) {
          // 从区域详情中获取建筑
          buildings = searchResult.details.buildings || [];
        } else if (searchResult.type === 'building') {
          // 直接建筑搜索结果
          buildings = searchResult.buildings || [];
        }
      }

      // 应用tags过滤（如果有的话）
      if (buildings && searchParams.tags && searchParams.tags.length > 0) {
        console.log(`🏷️ Filtering search results by tags: ${searchParams.tags.join(', ')}`);
        const originalCount = buildings.length;
        buildings = buildings.filter(building => {
          const areaTags = building.areas?.area_tags || [];
          return searchParams.tags.some(selectedTag => areaTags.includes(selectedTag));
        });
        console.log(`📊 After tag filtering: ${buildings.length}/${originalCount} buildings`);
      }

      console.log(`📊 Final result: ${buildings?.length || 0} buildings`);
      return buildings || [];

    } catch (error) {
      console.error('❌ loadBuildingsInCommunity error:', error);
      return [];
    }
  }

  // 根据关键词查找地理位置坐标（层级匹配：city → community → building）- 支持中文搜索
  async locateAndFocusArea(keyword) {
    try {
      console.log(`🎯 Locating area for keyword: "${keyword}"`);

      // 使用优化的搜索方法
      const searchResult = await this.performOptimizedSearch(keyword);
      
      if (searchResult && searchResult.found && searchResult.type === 'area') {
        // 从区域匹配结果中获取区域信息
        const area = searchResult.details?.area;
        console.log('🔍 [DEBUG] Area details:', area);
        console.log('🔍 [DEBUG] Coordinates:', area?.general_latitude, area?.general_longitude);
        
        if (area && area.general_latitude && area.general_longitude) {
          console.log('🏘️ Found area match:', area);
          return {
            location: area,
            type: 'area',
            coordinates: [parseFloat(area.general_latitude), parseFloat(area.general_longitude)]
          };
        } else {
          console.log('❌ Area found but coordinates missing or null');
        }
      }

      // 如果优化搜索没找到，使用备用的直接搜索
      const areas = await this.searchAreas(keyword, 1);
      if (areas && areas.length > 0) {
        const area = areas[0];
        if (area.general_latitude && area.general_longitude) {
          console.log('🏘️ Found area match (fallback):', area);
          return {
            location: area,
            type: 'area', 
            coordinates: [parseFloat(area.general_latitude), parseFloat(area.general_longitude)]
          };
        }
      }

      console.log('❌ No location found for keyword:', keyword);
      return null;
    } catch (error) {
      console.error('❌ locateAndFocusArea error:', error);
      return null;
    }
  }

  // 使用 Nominatim API 作为地理编码备选方案
  async geocodeWithNominatim(location) {
    try {
      console.log('🌍 Using Nominatim geocoding for:', location);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=us`
      );
      
      if (!response.ok) {
        throw new Error('Nominatim API request failed');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        console.log('🎯 Nominatim found location:', result.display_name);
        
        return {
          location: {
            name: result.display_name,
            general_latitude: parseFloat(result.lat),
            general_longitude: parseFloat(result.lon)
          },
          type: 'geocoded',
          coordinates: [parseFloat(result.lat), parseFloat(result.lon)]
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Nominatim geocoding failed:', error);
      return null;
    }
  }

  // 简化的模糊搜索方法
  async performFuzzySearchSimple(table, searchTerm, limit = 20) {
    try {
      const supabase = await this.ensureSupabase();
      console.log(`🔍 [DEBUG] Performing simple fuzzy search on ${table} for: "${searchTerm}"`);
      console.log(`🔍 [DEBUG] searchTerm type: ${typeof searchTerm}, length: ${searchTerm.length}`);
      console.log(`🔍 [DEBUG] searchTerm charCodes:`, Array.from(searchTerm).map(c => c.charCodeAt(0)));

      // 分解搜索词
      const terms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      const primaryTerm = terms[0];
      console.log(`🔍 [DEBUG] Primary search term: "${primaryTerm}"`);
      console.log(`🔍 [DEBUG] primaryTerm type: ${typeof primaryTerm}, length: ${primaryTerm.length}`);

      if (table === 'areas') {
        // 扩展搜索到多个字段：name, borough, city
        console.log(`🔍 Searching in 'name', 'borough', 'city' fields for: "${primaryTerm}"`);
        
        // 首先在name字段搜索
        let { data: nameData, error: nameError } = await supabase
          .from('areas')
          .select(`
            id, name, state, city, borough, description, area_tags,
            general_latitude, general_longitude, total_buildings, image_url
          `)
          .ilike('name', `%${primaryTerm}%`)
          .order('total_buildings', { ascending: false })
          .limit(10);

        // 然后在borough字段搜索
        let { data: boroughData, error: boroughError } = await supabase
          .from('areas')
          .select(`
            id, name, state, city, borough, description, area_tags,
            general_latitude, general_longitude, total_buildings, image_url
          `)
          .ilike('borough', `%${primaryTerm}%`)
          .order('total_buildings', { ascending: false })
          .limit(10);

        // 合并结果，去重，borough搜索结果优先级更高
        let data = [];
        let error = nameError || boroughError;

        // 先添加borough搜索结果（优先级更高）
        if (boroughData) data = [...data, ...boroughData];
        if (nameData) {
          // 去重：只添加不在boroughData中的结果
          const existingIds = new Set(boroughData?.map(item => item.id) || []);
          const uniqueNameData = nameData.filter(item => !existingIds.has(item.id));
          data = [...data, ...uniqueNameData];
        }

        if (error) {
          console.error('❌ Search error in name field:', error);
        } else {
          console.log(`📊 Name field search results: ${data?.length || 0} items`);
        }

        if (!data || data.length === 0) {
          // 尝试在城市字段中搜索
          console.log(`🔍 Searching in 'city' field for: "${primaryTerm}"`);
          ({ data, error } = await supabase
            .from('areas')
            .select(`
              id, name, state, city, borough, description, area_tags,
              general_latitude, general_longitude, total_buildings
            `)
            .ilike('city', `%${primaryTerm}%`)
            .order('total_buildings', { ascending: false })
            .limit(20));

          if (error) {
            console.error('❌ Search error in city field:', error);
          } else {
            console.log(`📊 City field search results: ${data?.length || 0} items`);
          }
        }

        if (!data || data.length === 0) {
          // 尝试在区域字段中搜索
          console.log(`🔍 Searching in 'borough' field for: "${primaryTerm}"`);
          ({ data, error } = await supabase
            .from('areas')
            .select(`
              id, name, state, city, borough, description, area_tags,
              general_latitude, general_longitude, total_buildings
            `)
            .ilike('borough', `%${primaryTerm}%`)
            .order('total_buildings', { ascending: false })
            .limit(20));

          if (error) {
            console.error('❌ Search error in borough field:', error);
          } else {
            console.log(`📊 Borough field search results: ${data?.length || 0} items`);
          }
        }

        // 如果还是没有结果，尝试更宽泛的搜索
        if (!data || data.length === 0) {
          console.log(`🔍 Trying broader search with OR condition for: "${primaryTerm}"`);
          ({ data, error } = await supabase
            .from('areas')
            .select(`
              id, name, state, city, borough, description, area_tags,
              general_latitude, general_longitude, total_buildings
            `)
            .or(`name.ilike.%${primaryTerm}%,city.ilike.%${primaryTerm}%,borough.ilike.%${primaryTerm}%`)
            .order('total_buildings', { ascending: false })
            .limit(20));

          if (error) {
            console.error('❌ Search error in OR condition:', error);
          } else {
            console.log(`📊 OR condition search results: ${data?.length || 0} items`);
            if (data && data.length > 0) {
              console.log('📊 Sample results:', data.slice(0, 3).map(item => ({
                name: item.name,
                city: item.city,
                borough: item.borough
              })));
            }
          }
        }

        console.log(`📊 Final search results: ${data?.length || 0} items`);
        return data || [];
      }

      return [];
    } catch (error) {
      console.error('❌ Simple fuzzy search error:', error);
      return [];
    }
  }

  // 智能模糊搜索 - 支持大小写不敏感和拼写错误容忍 (性能优化版)
  async performFuzzySearch(table, searchTerm) {
    try {
      const supabase = await this.ensureSupabase();
      
      console.log(`🔍 [DEBUG-FUZZY] Performing fuzzy search on ${table} for: "${searchTerm}"`);
      console.log(`🔍 [DEBUG-FUZZY] searchTerm type: ${typeof searchTerm}, length: ${searchTerm.length}`);
      console.log(`🔍 [DEBUG-FUZZY] searchTerm charCodes:`, Array.from(searchTerm).map(c => c.charCodeAt(0)));
      
      // 预处理搜索词
      const cleanTerm = this.normalizeSearchTerm(searchTerm);
      const searchVariations = this.generateSearchVariations(cleanTerm);
      
      console.log(`🔍 [DEBUG-FUZZY] Fuzzy search for "${searchTerm}" -> cleanTerm: "${cleanTerm}" -> variations:`, searchVariations);
      
      let allResults = [];
      
      if (table === 'areas') {
        // 先尝试按区域名称搜索
        const primaryTerm = searchVariations[0]; // 主要搜索词
        
        // 搜索name字段
        let { data: nameResults, error: nameError } = await supabase
          .from('areas')
          .select(`
            id,
            name,
            state,
            city,
            borough,
            description,
            area_tags,
            general_latitude,
            general_longitude,
            total_buildings
          `)
          .ilike('name', `%${primaryTerm}%`)
          .order('total_buildings', { ascending: false })
          .limit(10);

        // 搜索borough字段
        let { data: boroughResults, error: boroughError } = await supabase
          .from('areas')
          .select(`
            id,
            name,
            state,
            city,
            borough,
            description,
            area_tags,
            general_latitude,
            general_longitude,
            total_buildings
          `)
          .ilike('borough', `%${primaryTerm}%`)
          .order('total_buildings', { ascending: false })
          .limit(10);

        // 合并结果，去重，borough搜索结果优先级更高
        let data = [];
        let error = nameError || boroughError;
        
        if (boroughResults) data = [...data, ...boroughResults];
        if (nameResults) {
          const existingIds = new Set(boroughResults?.map(item => item.id) || []);
          const uniqueNameResults = nameResults.filter(item => !existingIds.has(item.id));
          data = [...data, ...uniqueNameResults];
        }

        if (error) {
          console.error('❌ Search error in name/borough field:', error);
        }
        
        // 如果没有找到足够结果，尝试按城市名称搜索
        if (!data || data.length === 0) {
          const { data: cityData, error: cityError } = await supabase
            .from('areas')
            .select(`
              id,
              name,
              state,
              city,
              borough,
              description,
              area_tags,
              general_latitude,
              general_longitude,
              total_buildings
            `)
            .ilike('city', `%${primaryTerm}%`)
            .order('total_buildings', { ascending: false })
            .limit(20);

          if (cityError) {
            console.error('❌ Search error in city field:', cityError);
          }

          data = cityData;
        }
        
        if (data && data.length > 0) {
          allResults = data;
        }
      } else if (table === 'buildings') {
        // 先尝试建筑物名称搜索
        const primaryTerm = searchVariations[0]; // 主要搜索词
        let { data: buildingResults } = await supabase
          .from('buildings')
          .select(`
            id,
            name,
            description,
            image_url,
            amenities,
            is_featured,
            area_id,
            areas!inner(
              id,
              name,
              city,
              borough,
              general_latitude,
              general_longitude
            )
          `)
          .ilike('name', `%${primaryTerm}%`)
          .order('is_featured', { ascending: false })
          .order('name')
          .limit(10);
        
        // 搜索区域名称中的建筑物
        let { data: areaNameResults } = await supabase
          .from('buildings')
          .select(`
            id,
            name,
            description,
            image_url,
            amenities,
            is_featured,
            area_id,
            areas!inner(
              id,
              name,
              city,
              borough,
              general_latitude,
              general_longitude
            )
          `)
          .ilike('areas.name', `%${primaryTerm}%`)
          .order('is_featured', { ascending: false })
          .order('name')
          .limit(10);

        // 搜索区域borough中的建筑物（重要：处理"Queens"等地理搜索）
        let { data: boroughResults } = await supabase
          .from('buildings')
          .select(`
            id,
            name,
            description,
            image_url,
            amenities,
            is_featured,
            area_id,
            areas!inner(
              id,
              name,
              city,
              borough,
              general_latitude,
              general_longitude
            )
          `)
          .ilike('areas.borough', `%${primaryTerm}%`)
          .order('is_featured', { ascending: false })
          .order('name')
          .limit(20);
        
        // 合并结果，去重，borough搜索优先级最高
        let data = [];
        if (boroughResults) data = [...data, ...boroughResults];
        if (areaNameResults) {
          const existingIds = new Set(data.map(item => item.id));
          const uniqueAreaResults = areaNameResults.filter(item => !existingIds.has(item.id));
          data = [...data, ...uniqueAreaResults];
        }
        if (buildingResults) {
          const existingIds = new Set(data.map(item => item.id));
          const uniqueBuildingResults = buildingResults.filter(item => !existingIds.has(item.id));
          data = [...data, ...uniqueBuildingResults];
        }
        
        if (data && data.length > 0) {
          allResults = data;
        }
      }
      
      // 去重
      const uniqueResults = this.removeDuplicates(allResults);
      console.log(`📊 Fuzzy search found ${uniqueResults.length} unique results`);
      
      return uniqueResults;
    } catch (error) {
      console.error('❌ Fuzzy search error:', error);
      return [];
    }
  }

  // 标准化搜索词
  normalizeSearchTerm(term) {
    return term.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  // 生成搜索变体 - 处理常见拼写错误和变体
  generateSearchVariations(term) {
    const variations = [term];
    
    // 常见地名拼写映射
    const commonVariations = {
      'west village': ['westvillage', 'west vilage', 'west vil', 'wvillage'],
      'east village': ['eastvillage', 'east vilage', 'east vil', 'evillage'],
      'soho': ['so ho', 'south houston'],
      'noho': ['no ho', 'north houston'],
      'tribeca': ['tri beca', 'triangle below canal'],
      'chinatown': ['china town'],
      'little italy': ['littleitaly'],
      'financial district': ['fidi', 'financial', 'wall street'],
      'upper east side': ['ues', 'upper east'],
      'upper west side': ['uws', 'upper west'],
      'midtown': ['mid town', 'times square'],
      'chelsea': ['chelsey'],
      'greenwich village': ['greenwich', 'village'],
      'manhattan': ['manhatan', 'manhatten'],
      'brooklyn': ['brookyn', 'bklyn'],
      'queens': ['queen'],
      'bronx': ['the bronx'],
      'hoboken': ['hobokn', 'hobokken'],
      'jersey city': ['jc', 'jerseycity'],
      'fort lee': ['fortlee']
    };
    
    // 添加预定义的变体
    const lowerTerm = term.toLowerCase();
    if (commonVariations[lowerTerm]) {
      variations.push(...commonVariations[lowerTerm]);
    }
    
    // 添加无空格版本
    if (term.includes(' ')) {
      variations.push(term.replace(/\s+/g, ''));
    }
    
    // 添加首字母大写版本
    variations.push(this.capitalizeWords(term));
    
    // 去除重复
    return [...new Set(variations)];
  }

  // 首字母大写
  capitalizeWords(str) {
    return str.replace(/\b\w/g, letter => letter.toUpperCase());
  }


  // 搜索社区（仅社区，不包含建筑）- 支持中文搜索
  async searchCommunities(searchTerm) {
    try {
      const supabase = await this.ensureSupabase();
      console.log(`🏘️ Searching communities for: "${searchTerm}"`);
      
      // 先尝试翻译搜索词（如果是中文）
      const translatedTerm = await translateApi.translateForSearch(searchTerm);
      const cleanTerm = this.normalizeSearchTerm(translatedTerm);
      
      console.log(`🔍 Original term: "${searchTerm}" -> Translated term: "${translatedTerm}" -> Clean term: "${cleanTerm}"`);
      
      const { data, error } = await supabase
        .from('areas')
        .select(`
          id,
          name,
          state,
          city,
          borough,
          description,
          area_tags,
          general_latitude,
          general_longitude,
          total_buildings
        `)
        .or(`name.ilike.%${cleanTerm}%,city.ilike.%${cleanTerm}%,borough.ilike.%${cleanTerm}%`)
        .order('total_buildings', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error searching communities:', error);
        return [];
      }

      console.log(`📊 Found ${data?.length || 0} matching communities`);
      return data || [];
    } catch (error) {
      console.error('❌ searchCommunities error:', error);
      return [];
    }
  }

  // 通过名称获取区域完整信息（使用优化的RPC搜索）
  async getAreaByName(areaName) {
    try {
      console.log(`🔍 [getAreaByName] 使用优化搜索查询: "${areaName}"`);
      
      // 使用新的优化搜索函数
      const searchResult = await this.performOptimizedSearch(areaName);
      
      if (searchResult.found && searchResult.type === 'area' && searchResult.details) {
        const { area, amenities, transport, buildings } = searchResult.details;
        
        // 组装tooltip数据格式（保持向后兼容）
        const tooltipData = {
          // 基本信息
          id: area.id,
          name: area.name,
          description: area.description || '',
          tags: area.area_tags || [],
          
          // 租金信息
          rents: {
            studio: area.avg_rent_studio,
            br1: area.avg_rent_1br,
            br2: area.avg_rent_2br,
          },
          
          // 地理信息
          coords: [area.general_latitude, area.general_longitude],
          totalBuildings: area.total_buildings,
          
          // 图片
          image: area.image_url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=225&fit=crop',
          
          // 行政区域
          location: { 
            city: area.city, 
            borough: area.borough 
          },
          
          // 关联数据
          amenities: amenities.map(a => ({ 
            name: a.name, 
            image: a.image_url || '' 
          })),
          
          transport: transport.map(t => ({ 
            name: t.transport_name, 
            image: t.image_url || '' 
          })),
          
          buildings: buildings.map(b => ({ 
            id: b.id, 
            name: b.name, 
            description: b.description || '',
            image: b.image_url || '' 
          })),

          // 向后兼容的字段
          area_tags: area.area_tags || [],
          general_latitude: area.general_latitude,
          general_longitude: area.general_longitude,
          avg_rent_studio: area.avg_rent_studio,
          avg_rent_1br: area.avg_rent_1br,
          avg_rent_2br: area.avg_rent_2br,
          image_url: area.image_url
        };

        console.log(`✅ [getAreaByName] 使用RPC成功找到: ${area.name}`);
        return tooltipData;
      }
      
      console.log(`⚠️ [getAreaByName] 未找到区域: "${areaName}"`);
      return null;

    } catch (error) {
      console.error('❌ getAreaByName error:', error);
      return null;
    }
  }

  // 去重函数
  removeDuplicates(array) {
    const seen = new Set();
    return array.filter(item => {
      const key = item.id || item.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 新的RPC搜索函数 - 使用后端优化的搜索逻辑
  
  // 1) 先搜社区（短语/模糊 + 排序都在后端）
  async searchAreas(q, limit = 5) {
    try {
      const supabase = await this.ensureSupabase();
      console.log(`🔍 [searchAreas] 使用RPC搜索社区: "${q}"`);
      
      const { data, error } = await supabase.rpc('search_areas', { q, n: limit });
      if (error) {
        console.error('❌ searchAreas RPC error:', error);
        throw error;
      }
      
      console.log(`✅ [searchAreas] 找到 ${data?.length || 0} 个社区`, data?.slice(0, 2));
      return data || [];
    } catch (error) {
      console.error('❌ searchAreas error:', error);
      return [];
    }
  }

  // 2) 兜底搜楼盘（仅当社区=0 时）
  async searchBuildingsFallback(q, limit = 20) {
    try {
      const supabase = await this.ensureSupabase();
      console.log(`🏢 [searchBuildingsFallback] 搜索楼盘: "${q}"`);
      
      const { data, error } = await supabase.rpc('search_buildings', { q, n: limit });
      if (error) {
        console.error('❌ searchBuildingsFallback RPC error:', error);
        throw error;
      }
      
      console.log(`✅ [searchBuildingsFallback] 找到 ${data?.length || 0} 个楼盘`);
      return data || [];
    } catch (error) {
      console.error('❌ searchBuildingsFallback error:', error);
      return [];
    }
  }

  // 3) 命中社区后，取tooltip需要的补充数据
  async getAreaDetails(areaId) {
    try {
      const supabase = await this.ensureSupabase();
      console.log(`📊 [getAreaDetails] 获取区域详情: ${areaId}`);

      const [areaRes, amRes, trRes, bRes] = await Promise.allSettled([
        supabase.from('areas')
          .select('id,name,description,area_tags,avg_rent_studio,avg_rent_1br,avg_rent_2br,general_latitude,general_longitude,total_buildings,image_url,state,city,borough')
          .eq('id', areaId).single(),
        
        supabase.from('amenities_by_area')
          .select('name,image_url,created_at').eq('area_id', areaId)
          .order('created_at', { ascending: false }).limit(12),
        
        supabase.from('transport_by_area')
          .select('transport_name,image_url,created_at').eq('area_id', areaId)
          .order('created_at', { ascending: false }),
        
        supabase.from('buildings')
          .select('id,name,description,image_url,created_at').eq('area_id', areaId)
          .order('created_at', { ascending: false }).limit(8)
      ]);

      // 处理结果
      const area = areaRes.status === 'fulfilled' && !areaRes.value.error ? areaRes.value.data : null;
      const amenities = amRes.status === 'fulfilled' && !amRes.value.error ? amRes.value.data : [];
      const transport = trRes.status === 'fulfilled' && !trRes.value.error ? trRes.value.data : [];
      const buildings = bRes.status === 'fulfilled' && !bRes.value.error ? bRes.value.data : [];

      if (!area) {
        console.error('❌ Area not found:', areaId);
        return null;
      }

      console.log(`✅ [getAreaDetails] 详情获取完成: ${area.name}, 设施${amenities.length}个, 交通${transport.length}个, 建筑${buildings.length}个`);
      
      return {
        area,
        amenities: amenities || [],
        transport: transport || [],
        buildings: buildings || [],
      };
    } catch (error) {
      console.error('❌ getAreaDetails error:', error);
      return null;
    }
  }

  // 4) 优化的搜索入口函数 - 步骤A+B的整合
  async performOptimizedSearch(rawQuery, filters = {}) {
    try {
      console.log(`🎯 [performOptimizedSearch] 开始优化搜索: "${rawQuery}"`);
      
      // 步骤A: 先搜社区（不带tags筛选）
      const areas = await this.searchAreas(rawQuery, 5);
      
      if (areas && areas.length > 0) {
        // 取第一个最匹配的社区
        const picked = areas[0];
        console.log(`✅ [performOptimizedSearch] 命中社区: ${picked.name}`);
        
        // 步骤B: 获取完整详情
        const details = await this.getAreaDetails(picked.id);
        
        if (details) {
          // 应用筛选器（如果需要）
          const filteredDetails = this.applyFilters(details, filters);
          
          return {
            type: 'area',
            found: true,
            areas: [picked],
            details: filteredDetails,
            searchType: 'area_match'
          };
        }
      }
      
      // 步骤C: 社区为0，降级搜楼盘
      console.log(`🏢 [performOptimizedSearch] 社区未命中，降级搜索楼盘`);
      const buildings = await this.searchBuildingsFallback(rawQuery, 20);
      
      return {
        type: 'building',
        found: buildings && buildings.length > 0,
        areas: [],
        buildings: buildings || [],
        searchType: 'building_fallback'
      };
      
    } catch (error) {
      console.error('❌ performOptimizedSearch error:', error);
      return {
        type: 'error',
        found: false,
        areas: [],
        buildings: [],
        error: error.message
      };
    }
  }

  // 5) 应用筛选器的辅助函数
  applyFilters(details, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return details;
    }

    // 标签筛选
    const passTagFilter = (tags) => {
      if (!filters.tags || filters.tags.length === 0) return true;
      return (tags || []).some(t => filters.tags.includes(String(t)));
    };

    return {
      ...details,
      area: details.area, // 保持area不变，可以在UI层标记匹配状态
      amenities: details.amenities, // 可以按需进一步筛选
      transport: details.transport,
      buildings: details.buildings // 可以按价格/关键词筛选
    };
  }
}

// 导出单例实例
const dataService = new DataService();
export default dataService;
export { dataService };
