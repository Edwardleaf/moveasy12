/**
 * 建筑图片配置 - 从3个县的真实建筑中随机选择
 */

// 各县的建筑图片数量
export const countyImageCounts = {
  "san_francisco": 180,
  "san_mateo": 113,
  "santa_clara": 60
}

/**
 * 从3个县随机选择8张建筑图片用于问卷卡片
 */
function getRandomBuildingsFromCounties() {
  const allBuildings = []
  
  // San Francisco: 180张
  for (let i = 1; i <= countyImageCounts.san_francisco; i++) {
    allBuildings.push({
      id: `sf_${i}`,
      url: `/images/buildings/san_francisco/building_${String(i).padStart(3, '0')}.jpg`,
      name: `San Francisco Building ${i}`,
      county: 'san_francisco'
    })
  }
  
  // San Mateo: 113张
  for (let i = 1; i <= countyImageCounts.san_mateo; i++) {
    allBuildings.push({
      id: `sm_${i}`,
      url: `/images/buildings/san_mateo/building_${String(i).padStart(3, '0')}.jpg`,
      name: `San Mateo Building ${i}`,
      county: 'san_mateo'
    })
  }
  
  // Santa Clara: 60张
  for (let i = 1; i <= countyImageCounts.santa_clara; i++) {
    allBuildings.push({
      id: `sc_${i}`,
      url: `/images/buildings/santa_clara/building_${String(i).padStart(3, '0')}.jpg`,
      name: `Santa Clara Building ${i}`,
      county: 'santa_clara'
    })
  }
  
  // 随机打乱并选择8张
  const shuffled = allBuildings.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 8)
}

// 导出问卷使用的8张建筑图片（每次加载随机选择）
export const buildingImages = getRandomBuildingsFromCounties()
