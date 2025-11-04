/**
 * 数据库诊断脚本 - 检查Los Altos/San Jose地区的building数据
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('🔍 开始数据库诊断...\n');
  
  // Los Altos坐标
  const targetLat = 37.3790629;
  const targetLon = -122.116578;
  
  // 1. 检查总building数量
  console.log('=== 1. 检查总building数量 ===');
  const { data: allBuildings, error: countError } = await supabase
    .from('buildings')
    .select('id', { count: 'exact' });
  
  if (countError) {
    console.error('❌ 查询失败:', countError);
  } else {
    console.log(`✅ 数据库中共有 ${allBuildings?.length || 0} 个buildings\n`);
  }
  
  // 2. 检查California的buildings
  console.log('=== 2. 检查California的buildings ===');
  const { data: caBuildings, error: caError } = await supabase
    .from('buildings')
    .select('id, name, city, state')
    .ilike('state', '%CA%');
  
  if (caError) {
    console.error('❌ 查询失败:', caError);
  } else {
    console.log(`✅ California州有 ${caBuildings?.length || 0} 个buildings`);
    if (caBuildings && caBuildings.length > 0) {
      console.log('前5个buildings:', caBuildings.slice(0, 5).map(b => `${b.name} (${b.city})`).join(', '));
    }
  }
  console.log('');
  
  // 3. 检查San Jose地区
  console.log('=== 3. 检查San Jose地区 ===');
  const { data: sjBuildings, error: sjError } = await supabase
    .from('buildings')
    .select('id, name, city, latitude, longitude')
    .ilike('city', '%San Jose%');
  
  if (sjError) {
    console.error('❌ 查询失败:', sjError);
  } else {
    console.log(`✅ San Jose有 ${sjBuildings?.length || 0} 个buildings`);
    if (sjBuildings && sjBuildings.length > 0) {
      console.log('示例:', sjBuildings.slice(0, 3).map(b => 
        `${b.name} (${b.latitude}, ${b.longitude})`
      ).join('\n        '));
    }
  }
  console.log('');
  
  // 4. 检查Los Altos地区
  console.log('=== 4. 检查Los Altos地区 ===');
  const { data: laBuildings, error: laError } = await supabase
    .from('buildings')
    .select('id, name, city')
    .ilike('city', '%Los Altos%');
  
  if (laError) {
    console.error('❌ 查询失败:', laError);
  } else {
    console.log(`✅ Los Altos有 ${laBuildings?.length || 0} 个buildings\n`);
  }
  
  // 5. 检查附近的buildings（50km范围内）
  console.log('=== 5. 检查Los Altos坐标附近50km的buildings ===');
  const { data: nearbyBuildings, error: nearbyError } = await supabase
    .from('buildings')
    .select('id, name, city, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(1000);
  
  if (nearbyError) {
    console.error('❌ 查询失败:', nearbyError);
  } else if (nearbyBuildings) {
    // 计算距离
    const withDistance = nearbyBuildings
      .map(b => {
        const lat1 = targetLat * Math.PI / 180;
        const lat2 = b.latitude * Math.PI / 180;
        const dLat = (b.latitude - targetLat) * Math.PI / 180;
        const dLon = (b.longitude - targetLon) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = 6371 * c; // 地球半径6371km
        
        return { ...b, distance };
      })
      .filter(b => b.distance <= 50)
      .sort((a, b) => a.distance - b.distance);
    
    console.log(`✅ 50km范围内有 ${withDistance.length} 个buildings`);
    if (withDistance.length > 0) {
      console.log('最近的10个buildings:');
      withDistance.slice(0, 10).forEach((b, i) => {
        console.log(`  ${i+1}. ${b.name} (${b.city}) - ${b.distance.toFixed(1)}km`);
      });
    }
  }
  console.log('');
  
  // 6. 检查所有城市列表
  console.log('=== 6. 数据库中的所有城市 ===');
  const { data: cities, error: cityError } = await supabase
    .from('buildings')
    .select('city, state')
    .not('city', 'is', null);
  
  if (cityError) {
    console.error('❌ 查询失败:', cityError);
  } else if (cities) {
    const uniqueCities = [...new Set(cities.map(c => `${c.city}, ${c.state}`))].sort();
    console.log(`✅ 共有 ${uniqueCities.length} 个不同的城市`);
    console.log('前20个城市:', uniqueCities.slice(0, 20).join(', '));
  }
}

checkDatabase().then(() => {
  console.log('\n✅ 诊断完成');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ 诊断失败:', err);
  process.exit(1);
});

