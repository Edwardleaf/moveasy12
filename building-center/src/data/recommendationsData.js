// 搜索推荐数据 - 来源于uhomes
// 包含热门大学和城市推荐

// NYC相关推荐数据
const nycRecommendationData = {
  // NYC区域和周边城市
  cities: [
    { id: 'manhattan', name: 'Manhattan', name_en: 'Manhattan', state: 'NY', type: 'city', popular: true },
    { id: 'brooklyn', name: 'Brooklyn', name_en: 'Brooklyn', state: 'NY', type: 'city', popular: true },
    { id: 'queens', name: 'Queens', name_en: 'Queens', state: 'NY', type: 'city', popular: true },
    { id: 'bronx', name: 'Bronx', name_en: 'Bronx', state: 'NY', type: 'city', popular: true },
    { id: 'staten-island', name: 'Staten Island', name_en: 'Staten Island', state: 'NY', type: 'city', popular: true },
    { id: 'jersey-city', name: 'Jersey City', name_en: 'Jersey City', state: 'NJ', type: 'city', popular: true },
    { id: 'hoboken', name: 'Hoboken', name_en: 'Hoboken', state: 'NJ', type: 'city', popular: true },
    { id: 'long-island-city', name: 'Long Island City', name_en: 'Long Island City', state: 'NY', type: 'city', popular: true },
    { id: 'williamsburg', name: 'Williamsburg', name_en: 'Williamsburg', state: 'NY', type: 'city', popular: true },
    { id: 'astoria', name: 'Astoria', name_en: 'Astoria', state: 'NY', type: 'city', popular: true }
  ],
  
  // NYC地区大学
  universities: [
    { id: 'columbia', name: 'Columbia University', city: 'Manhattan', type: 'university' },
    { id: 'nyu', name: 'New York University', city: 'Manhattan', type: 'university' },
    { id: 'fordham', name: 'Fordham University', city: 'Bronx', type: 'university' },
    { id: 'pace', name: 'Pace University', city: 'Manhattan', type: 'university' },
    { id: 'stevens', name: 'Stevens Institute of Technology', city: 'Hoboken', type: 'university' },
    { id: 'the-new-school', name: 'The New School', city: 'Manhattan', type: 'university' },
    { id: 'cuny-hunter', name: 'CUNY Hunter College', city: 'Manhattan', type: 'university' },
    { id: 'cuny-baruch', name: 'CUNY Baruch College', city: 'Manhattan', type: 'university' },
    { id: 'pratt', name: 'Pratt Institute', city: 'Brooklyn', type: 'university' },
    { id: 'brooklyn-college', name: 'Brooklyn College', city: 'Brooklyn', type: 'university' },
    { id: 'st-johns', name: "St. John's University", city: 'Queens', type: 'university' },
    { id: 'njit', name: 'New Jersey Institute of Technology', city: 'Newark', type: 'university' }
  ],
  
  // 热门搜索关键词
  popularKeywords: [
    'near subway',
    'pet friendly', 
    'luxury',
    'affordable',
    'gym',
    'parking',
    'furnished',
    'short term',
    'studio',
    'one bedroom',
    'two bedroom',
    'bills included'
  ]
};

// 获取推荐数据的函数
export function getSearchRecommendations() {
  return {
    universities: nycRecommendationData.universities,
    cities: nycRecommendationData.cities,
    popularKeywords: nycRecommendationData.popularKeywords
  };
}

// 搜索函数 - 重命名避免冲突
export function searchRecommendationData(query) {
  if (!query) return getSearchRecommendations();
  
  const lowerQuery = query.toLowerCase();
  
  const matchedUniversities = nycRecommendationData.universities.filter(uni => 
    uni.name.toLowerCase().includes(lowerQuery)
  );
  
  const matchedCities = nycRecommendationData.cities.filter(city => 
    city.name.toLowerCase().includes(lowerQuery) || 
    city.name_en.toLowerCase().includes(lowerQuery)
  );
  
  const matchedKeywords = nycRecommendationData.popularKeywords.filter(keyword => 
    keyword.toLowerCase().includes(lowerQuery)
  );
  
  return {
    universities: matchedUniversities,
    cities: matchedCities,
    keywords: matchedKeywords
  };
}