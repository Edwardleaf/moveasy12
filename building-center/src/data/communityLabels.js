// 社区标签映射 - 为每个社区预设label，控制显示颜色
// 7种标签类型对应7种颜色：quiet, nightlife, shopping, dining, arts, parks, default

export const communityLabels = {
  // Manhattan 曼哈顿区 - 艺术和商业中心
  'Financial District': 'shopping',
  'Tribeca': 'arts', 
  'SoHo': 'arts',
  'Chinatown': 'dining',
  'Lower East Side': 'nightlife',
  'East Village': 'nightlife',
  'Greenwich Village': 'arts',
  'West Village': 'quiet',
  'Midtown': 'shopping',
  'Times Square': 'nightlife',
  'Theater District': 'arts',
  'Upper East Side': 'quiet',
  'Upper West Side': 'quiet',
  'Central Park': 'parks',
  'Harlem': 'arts',
  'Washington Heights': 'quiet',
  
  // Brooklyn 布鲁克林区 - 多元化社区
  'Williamsburg': 'nightlife',
  'DUMBO': 'arts',
  'Brooklyn Heights': 'quiet',
  'Park Slope': 'quiet', 
  'Prospect Heights': 'arts',
  'Greenpoint': 'arts',
  'Red Hook': 'nightlife',
  'Sunset Park': 'dining',
  'Bay Ridge': 'quiet',
  'Coney Island': 'nightlife',
  
  // Queens 皇后区 - 住宅和商业混合
  'Long Island City': 'shopping',
  'Astoria': 'dining',
  'Flushing': 'dining',
  'Forest Hills': 'quiet',
  'Jackson Heights': 'dining',
  
  // Bronx 布朗克斯区 - 住宅为主
  'South Bronx': 'quiet',
  'Bronx Park': 'parks',
  'Fordham': 'quiet',
  
  // Staten Island 史泰登岛 - 自然和住宅
  'St. George': 'quiet',
  'Stapleton': 'quiet'
};

// 根据社区名称关键词智能分配标签的规则
export const labelRules = {
  parks: ['Park', 'Green', 'Garden', 'Forest', 'Beach', 'Zoo'],
  arts: ['Village', 'SoHo', 'Art', 'Museum', 'Theater', 'Cultural', 'DUMBO', 'Heights'],
  shopping: ['Financial', 'Midtown', 'Commercial', 'Shopping', 'Business', 'Downtown'],
  dining: ['Chinatown', 'Little', 'Food', 'Market', 'Flushing', 'Astoria'],
  quiet: ['Upper', 'Residential', 'Heights', 'Slope', 'Hills', 'Bay', 'Ridge'],
  nightlife: ['East Village', 'Lower', 'Williamsburg', 'Times', 'Club', 'Bar']
};

// 默认标签分配函数
export function getDefaultLabel(communityName, nta2020) {
  // 首先检查预设映射
  if (communityLabels[communityName]) {
    return communityLabels[communityName];
  }
  
  // 然后根据关键词规则匹配
  for (const [label, keywords] of Object.entries(labelRules)) {
    if (keywords.some(keyword => communityName.includes(keyword))) {
      return label;
    }
  }
  
  // 最后使用hash算法分配
  const labelTypes = ['quiet', 'nightlife', 'shopping', 'dining', 'arts', 'parks'];
  const hash = hashCode(nta2020 || communityName);
  return labelTypes[Math.abs(hash) % labelTypes.length];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}