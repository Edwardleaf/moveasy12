/**
 * 地址解析和地理编码优化工具
 */

// 美国州名缩写映射
const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
}

/**
 * 解析地址字符串，提取结构化组件
 */
export function parseAddress(addressStr) {
  if (!addressStr || typeof addressStr !== 'string') {
    return null
  }

  const cleaned = addressStr.trim()
  const parts = cleaned.split(',').map(p => p.trim())
  
  const parsed = {
    original: cleaned,
    city: null,
    state: null,
    zipCode: null,
    parts: []
  }

  // 从后往前解析（地址通常是：街道, 城市, 州 邮编）
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    
    // 检测州
    if (!parsed.state) {
      const stateMatch = part.match(/\b([A-Z]{2})\b/)
      if (stateMatch && US_STATES[stateMatch[1]]) {
        parsed.state = stateMatch[1]
        continue
      }
      
      // 检测完整州名
      const stateNames = Object.values(US_STATES).map(s => s.toLowerCase())
      if (stateNames.includes(part.toLowerCase())) {
        parsed.state = Object.keys(US_STATES).find(
          key => US_STATES[key].toLowerCase() === part.toLowerCase()
        )
        continue
      }
    }
    
    // 检测邮编
    const zipMatch = part.match(/\b(\d{5}(-\d{4})?)\b/)
    if (zipMatch && !parsed.zipCode) {
      parsed.zipCode = zipMatch[1]
      continue
    }
    
    // 剩余的作为城市/地点
    parsed.parts.unshift(part)
  }
  
  // 选择最后一个非州、非邮编的部分作为主要城市
  if (parsed.parts.length > 0) {
    parsed.city = parsed.parts[parsed.parts.length - 1]
  }

  return parsed
}

/**
 * 生成多个geocoding查询候选
 */
export function generateGeocodingQueries(addressStr) {
  const parsed = parseAddress(addressStr)
  if (!parsed) {
    return [addressStr]
  }

  const queries = []
  
  // 策略1: 完整原始地址
  queries.push(parsed.original)
  
  // 策略2: 仅城市+州
  if (parsed.city && parsed.state) {
    queries.push(`${parsed.city}, ${parsed.state}`)
  }
  
  // 策略3: 仅城市+州全名
  if (parsed.city && parsed.state && US_STATES[parsed.state]) {
    queries.push(`${parsed.city}, ${US_STATES[parsed.state]}`)
  }
  
  // 策略4: 如果有多个城市，尝试每个城市
  if (parsed.parts.length > 1 && parsed.state) {
    for (const part of parsed.parts) {
      queries.push(`${part}, ${parsed.state}`)
    }
  }
  
  // 去重
  return [...new Set(queries)]
}

/**
 * 智能地理编码 - 使用多策略重试
 */
export async function smartGeocode(addressStr) {
  const queries = generateGeocodingQueries(addressStr)
  
  console.log('📍 尝试地理编码:', addressStr)
  console.log('📝 生成查询策略:', queries)
  
  // 依次尝试每个查询
  for (const query of queries) {
    try {
      const result = await geocodeWithNominatim(query)
      if (result) {
        console.log('✅ 编码成功:', query, result)
        return result
      }
    } catch (error) {
      console.warn('❌ 编码失败:', query, error.message)
      continue
    }
  }
  
  return null
}

/**
 * 调用Nominatim API
 */
async function geocodeWithNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&` +
    `format=json&` +
    `limit=1&` +
    `countrycodes=us`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'BuildingCenter/1.0'
    }
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (data && data.length > 0) {
    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
      type: result.type,
      importance: result.importance
    }
  }
  
  return null
}

export default {
  parseAddress,
  generateGeocodingQueries,
  smartGeocode
}

