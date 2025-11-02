/**
 * 通勤时间计算工具
 * 使用 OpenRouteService API 计算两点之间的通勤时间
 */

// OpenRouteService API配置
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFlNTc2YjZjOTQ2ODQzZThiNjM1NzA2YzVjMjA4Y2Q5IiwiaCI6Im11cm11cjY0In0=' 
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2'

/**
 * 交通方式映射
 */
export const TRANSPORT_MODES = {
  DRIVING: 'driving-car',      // 驾车
  WALKING: 'foot-walking',     // 步行
  CYCLING: 'cycling-regular',  // 骑行
  PUBLIC_TRANSIT: 'driving-car' // 公共交通（ORS不直接支持，用driving-car近似）
}

/**
 * 计算两点之间的通勤时间
 * @param {Object} origin - 起点坐标 {lat, lon}
 * @param {Object} destination - 终点坐标 {lat, lon}
 * @param {String} mode - 交通方式，默认为驾车
 * @returns {Promise<Object>} - 返回 {duration: 秒数, distance: 米数, durationText: '15 min'}
 */
export async function calculateCommuteTime(origin, destination, mode = TRANSPORT_MODES.DRIVING) {
  try {
    // 构建请求URL
    const url = `${ORS_BASE_URL}/directions/${mode}`
    
    // 请求体（ORS使用经度在前，纬度在后）
    const requestBody = {
      coordinates: [
        [origin.lon, origin.lat],
        [destination.lon, destination.lat]
      ],
      units: 'mi', // 使用英里
      language: 'en'
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      throw new Error(`ORS API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 提取第一条路线的信息
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const summary = route.summary
      
      const durationSeconds = summary.duration // 秒
      const distanceMeters = summary.distance   // 米
      
      return {
        duration: durationSeconds,
        distance: distanceMeters,
        durationText: formatDuration(durationSeconds),
        distanceText: formatDistance(distanceMeters),
        mode: mode
      }
    } else {
      throw new Error('No route found')
    }
  } catch (error) {
    console.error('计算通勤时间失败:', error)
    return null
  }
}

/**
 * 批量计算通勤时间（使用Matrix API）
 * @param {Object} origin - 起点坐标 {lat, lon}
 * @param {Array} destinations - 终点坐标数组 [{lat, lon}, ...]
 * @param {String} mode - 交通方式
 * @returns {Promise<Array>} - 返回通勤时间数组
 */
export async function calculateBatchCommuteTime(origin, destinations, mode = TRANSPORT_MODES.DRIVING) {
  try {
    const url = `${ORS_BASE_URL}/matrix/${mode}`
    
    // 构建坐标数组：第一个是起点，其余是终点
    const coordinates = [
      [origin.lon, origin.lat],
      ...destinations.map(dest => [dest.lon, dest.lat])
    ]
    
    const requestBody = {
      locations: coordinates,
      sources: [0], // 只从第一个点（起点）出发
      destinations: Array.from({ length: destinations.length }, (_, i) => i + 1), // 到所有其他点
      metrics: ['duration', 'distance'],
      units: 'mi'
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      throw new Error(`ORS Matrix API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 提取结果
    if (data.durations && data.durations.length > 0) {
      const durations = data.durations[0] // 第一行是从起点到各个终点的时间
      const distances = data.distances[0]
      
      return destinations.map((dest, index) => ({
        destination: dest,
        duration: durations[index + 1], // +1 因为第一个是起点到起点
        distance: distances[index + 1],
        durationText: formatDuration(durations[index + 1]),
        distanceText: formatDistance(distances[index + 1]),
        mode: mode
      }))
    } else {
      throw new Error('No matrix data returned')
    }
  } catch (error) {
    console.error('批量计算通勤时间失败:', error)
    return null
  }
}

/**
 * 格式化时长（秒 -> 可读文本）
 * @param {Number} seconds - 秒数
 * @returns {String} - 例如 "15 min", "1 hr 30 min"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return 'N/A'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} hr ${minutes} min`
    }
    return `${hours} hr`
  }
  
  if (minutes > 0) {
    return `${minutes} min`
  }
  
  return '< 1 min'
}

/**
 * 格式化距离（米 -> 可读文本）
 * @param {Number} meters - 米数
 * @returns {String} - 例如 "2.5 mi", "0.3 mi"
 */
export function formatDistance(meters) {
  if (!meters || meters < 0) return 'N/A'
  
  const miles = meters * 0.000621371 // 米转英里
  
  if (miles < 0.1) {
    return `${Math.round(meters * 3.28084)} ft` // 小于0.1英里显示英尺
  }
  
  return `${miles.toFixed(1)} mi`
}

/**
 * 使用Google Maps Directions API作为备选方案
 * （如果OpenRouteService不可用）
 */
export async function calculateCommuteTimeGoogle(origin, destination, mode = 'driving') {
  // Google Maps API需要API Key
  const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'
  
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${origin.lat},${origin.lon}&` +
      `destination=${destination.lat},${destination.lon}&` +
      `mode=${mode}&` +
      `key=${GOOGLE_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0]
      const leg = route.legs[0]
      
      return {
        duration: leg.duration.value, // 秒
        distance: leg.distance.value, // 米
        durationText: leg.duration.text,
        distanceText: leg.distance.text,
        mode: mode
      }
    } else {
      throw new Error(`Google Directions API error: ${data.status}`)
    }
  } catch (error) {
    console.error('Google通勤时间计算失败:', error)
    return null
  }
}

/**
 * 简单的直线距离计算（Haversine公式）
 * 作为最后的fallback
 */
export function calculateStraightLineDistance(origin, destination) {
  const R = 3959 // 地球半径（英里）
  const dLat = toRad(destination.lat - origin.lat)
  const dLon = toRad(destination.lon - origin.lon)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // 英里
  
  // 估算时间（假设平均速度30mph）
  const estimatedMinutes = Math.round((distance / 30) * 60)
  
  return {
    distance: distance * 1609.34, // 转换为米
    duration: estimatedMinutes * 60, // 转换为秒
    durationText: formatDuration(estimatedMinutes * 60),
    distanceText: `${distance.toFixed(1)} mi`,
    mode: 'straight-line',
    isEstimate: true
  }
}

function toRad(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * 智能通勤时间计算（自动选择最佳方法）
 * 优先级：OpenRouteService > 直线距离估算
 */
export async function getCommuteTime(origin, destination, mode = TRANSPORT_MODES.DRIVING) {
  // 先尝试OpenRouteService
  const orsResult = await calculateCommuteTime(origin, destination, mode)
  if (orsResult) {
    return orsResult
  }
  
  // 如果失败，使用直线距离估算
  console.warn('使用直线距离估算通勤时间')
  return calculateStraightLineDistance(origin, destination)
}

export default {
  calculateCommuteTime,
  calculateBatchCommuteTime,
  getCommuteTime,
  formatDuration,
  formatDistance,
  TRANSPORT_MODES
}

