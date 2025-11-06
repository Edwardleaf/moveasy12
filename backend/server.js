const express = require('express');
const cors = require('cors');
const { Translate } = require('@google-cloud/translate').v2;
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { LRUCache } = require('lru-cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;

// Initialize Google Translate client
const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

// Initialize Supabase clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedPatterns = [
      /^https?:\/\/localhost:\d+$/,
      /^https?:\/\/127\.0\.0\.1:\d+$/,
      /^https?:\/\/129\.226\.195\.19(:\d+)?$/,
      /^https:\/\/.*\.ngrok\.io$/,
      /^https:\/\/.*\.ngrok-free\.app$/,
      // 生产域名
      /^https:\/\/www\.themoveasy\.com$/,
      /^https:\/\/themoveasy\.com$/,
      /^https:\/\/app\.themoveasy\.com$/,
      // 测试域名
      /^https:\/\/www\.mytestkimxyz\.xyz$/,
      /^https:\/\/mytestkimxyz\.xyz$/,
      // 也保留HTTP版本以防需要
      /^http:\/\/www\.mytestkimxyz\.xyz$/,
      /^http:\/\/mytestkimxyz\.xyz$/
    ];
    
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Import and use areas routes
const areasRoutes = require('./routes/areas');
app.use('/api/areas', areasRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Building Center Backend API',
    version: '1.0.0',
    status: '运行中'
  });
});

// API root endpoint for nginx proxy
app.get('/api/', (req, res) => {
  res.json({ 
    message: 'Building Center Backend API',
    version: '1.0.0',
    status: '运行中'
  });
});

app.get('/api/config', (req, res) => {
  try {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      googleClientId: process.env.GOOGLE_CLIENT_ID
    };
    
    console.log('Config requested from:', req.headers.origin);
    res.json({ success: true, config });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin权限检查API
app.get('/api/admin/check', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 使用service_role验证token并获取用户信息
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // 获取用户档案信息（使用service_role跳过RLS）
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('获取用户档案失败:', profileError);
      return res.status(500).json({ success: false, error: 'Failed to get user profile' });
    }

    const isAdmin = profile.user_type === 'admin';
    
    res.json({
      success: true,
      isAdmin,
      user: {
        id: user.id,
        email: user.email,
        profile: profile
      }
    });
    
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Translation API endpoints
app.get('/api/translate/languages', (req, res) => {
  try {
    // Return supported languages (simplified Chinese and English)
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'zh', name: '简体中文' }
    ];
    
    res.json({ success: true, languages });
  } catch (error) {
    console.error('Languages error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/translate/text', async (req, res) => {
  try {
    const { text, target, source = 'auto' } = req.body;
    
    if (!text || !target) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: text and target' 
      });
    }

    console.log(`Translating: "${text}" to ${target}`);
    
    const [translation] = await translate.translate(text, target);
    
    res.json({
      success: true,
      translation,
      source: source,
      target: target
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/translate/batch', async (req, res) => {
  try {
    const { texts, target, source = 'auto' } = req.body;
    
    if (!texts || !Array.isArray(texts) || !target) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: texts (array) and target' 
      });
    }

    console.log(`Batch translating ${texts.length} texts to ${target}`);
    
    const [translations] = await translate.translate(texts, target);
    
    res.json({
      success: true,
      translations: Array.isArray(translations) ? translations : [translations],
      source: source,
      target: target
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/translate/json', async (req, res) => {
  try {
    const { data, target, source = 'auto' } = req.body;
    
    if (!data || !target) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: data and target' 
      });
    }

    console.log(`JSON translating to ${target}`);
    
    // Extract all string values from the object
    const extractStrings = (obj) => {
      const strings = [];
      const extractFromValue = (value, path = '') => {
        if (typeof value === 'string' && value.trim()) {
          strings.push({ path, value });
        } else if (typeof value === 'object' && value !== null) {
          Object.keys(value).forEach(key => {
            extractFromValue(value[key], path ? `${path}.${key}` : key);
          });
        }
      };
      extractFromValue(obj);
      return strings;
    };

    const strings = extractStrings(data);
    const texts = strings.map(s => s.value);
    
    if (texts.length === 0) {
      return res.json({
        success: true,
        translatedData: data,
        source: source,
        target: target
      });
    }
    
    const [translations] = await translate.translate(texts, target);
    const translationArray = Array.isArray(translations) ? translations : [translations];
    
    // Rebuild the object with translations
    const translatedData = JSON.parse(JSON.stringify(data));
    strings.forEach((stringInfo, index) => {
      const pathParts = stringInfo.path.split('.');
      let current = translatedData;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = translationArray[index];
    });
    
    res.json({
      success: true,
      translatedData,
      source: source,
      target: target
    });
  } catch (error) {
    console.error('JSON translation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 地理编码服务 (Photon + LibreTranslate)
// ============================================================================

const PHOTON_BASE = process.env.PHOTON_BASE || 'https://photon.komoot.io';
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

// 简单缓存，避免重复请求
const geoCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 分钟
});

// 湾区常见城市中英文映射表
const BAY_AREA_CITY_MAP = {
  '旧金山': 'San Francisco',
  '圣弗朗西斯科': 'San Francisco',
  '三藩市': 'San Francisco',
  '圣何塞': 'San Jose',
  '圣荷西': 'San Jose',
  '洛思阿图斯': 'Los Altos',
  '洛斯阿尔托斯': 'Los Altos',
  '帕洛阿尔托': 'Palo Alto',
  '帕罗奥图': 'Palo Alto',
  '山景城': 'Mountain View',
  '桑尼维尔': 'Sunnyvale',
  '桑尼韦尔': 'Sunnyvale',
  '库比蒂诺': 'Cupertino',
  '库珀蒂诺': 'Cupertino',
  '圣克拉拉': 'Santa Clara',
  '圣马特奥': 'San Mateo',
  '雷德伍德城': 'Redwood City',
  '弗里蒙特': 'Fremont',
  '海沃德': 'Hayward',
  '奥克兰': 'Oakland',
  '伯克利': 'Berkeley',
  '柏克莱': 'Berkeley',
  '加州': 'California',
  '加利福尼亚': 'California',
  '美国': 'USA',
};

// 检测是否为中文
function isChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

// 翻译中文到英文（优先使用城市映射表）
async function translateToEnglish(text) {
  try {
    // 优先检查城市映射表
    const cityMap = BAY_AREA_CITY_MAP[text.trim()];
    if (cityMap) {
      console.log(`   ✅ 使用城市映射表: "${text}" → "${cityMap}"`);
      return cityMap;
    }
    
    // 检查是否包含映射表中的城市名
    for (const [chinese, english] of Object.entries(BAY_AREA_CITY_MAP)) {
      if (text.includes(chinese)) {
        const translated = text.replace(chinese, english);
        console.log(`   ✅ 替换城市名: "${text}" → "${translated}"`);
        return translated;
      }
    }
    
    // 使用LibreTranslate翻译
    const response = await axios.post(`${LIBRETRANSLATE_URL}/translate`, {
      q: text,
      source: 'zh',
      target: 'en',
      format: 'text'
    }, { timeout: 10000 });
    
    return response.data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error.message);
    return text; // 失败时返回原文
  }
}

// 统一抽取并规整行政区字段（Photon feature格式）
function normalizeFeature(feature) {
  const p = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  
  const city = p.city || p.town || p.village || p.suburb || p.neighbourhood || null;
  const county = p.county || p.district || p.borough || null;
  const state = p.state || null;
  const country = p.country || null;

  const streetLine = p.housenumber && p.street
    ? `${p.housenumber} ${p.street}`
    : (p.street || null);

  const address = [
    streetLine,
    city,
    state,
    p.postcode || null,
    country
  ].filter(Boolean).join(', ');

  return {
    name: p.name || null,
    address,
    street: p.street || null,
    housenumber: p.housenumber || null,
    city,
    county,
    state,
    country,
    postcode: p.postcode || null,
    lat: coords[1] || null,  // Photon用[lon, lat]格式
    lon: coords[0] || null
  };
}

// GET /api/geo/search?q=...&limit=5&lang=en
app.get('/api/geo/search', async (req, res) => {
  try {
    let q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'missing q' });

    const limit = Math.min(parseInt(req.query.limit || '5', 10), 10);
    const lang = (req.query.lang || 'en').trim();

    console.log(`🌍 Geocoding: "${q}"`);

    // 如果是中文，先翻译成英文
    if (isChinese(q)) {
      console.log('   检测到中文，翻译中...');
      const translated = await translateToEnglish(q);
      console.log(`   翻译结果: "${translated}"`);
      q = translated;
    }

    const url = `${PHOTON_BASE}/api?q=${encodeURIComponent(q)}&limit=${limit}&lang=${encodeURIComponent(lang)}`;

    // 简单本地缓存
    if (geoCache.has(url)) {
      console.log('   ✅ 使用缓存结果');
      return res.json(geoCache.get(url));
    }

    const { data } = await axios.get(url, { timeout: 10000 });
    const features = Array.isArray(data?.features) ? data.features : [];

    if (features.length === 0) {
      console.log('   ⚠️ 未找到结果');
    } else {
      console.log(`   ✅ 找到 ${features.length} 个结果`);
    }

    // 过滤：只保留美国的结果
    const usFeatures = features.filter(f => {
      const country = f.properties?.country;
      return country === 'United States' || country === 'United States of America' || country === 'USA';
    });

    if (usFeatures.length === 0 && features.length > 0) {
      console.log('   ⚠️ 过滤后没有美国结果，尝试添加 California 后缀重试...');
      // 如果没有美国结果，尝试添加California重试
      const retryQuery = `${q}, California, USA`;
      const retryUrl = `${PHOTON_BASE}/api?q=${encodeURIComponent(retryQuery)}&limit=${limit}&lang=${encodeURIComponent(lang)}`;
      const { data: retryData } = await axios.get(retryUrl, { timeout: 10000 });
      const retryFeatures = Array.isArray(retryData?.features) ? retryData.features : [];
      const retryUsFeatures = retryFeatures.filter(f => {
        const country = f.properties?.country;
        return country === 'United States' || country === 'United States of America' || country === 'USA';
      });
      
      if (retryUsFeatures.length > 0) {
        console.log(`   ✅ 重试成功，找到 ${retryUsFeatures.length} 个美国结果`);
        const candidates = retryUsFeatures.map(f => normalizeFeature(f));
        const payload = { top: candidates[0] || null, candidates };
        geoCache.set(url, payload);
        return res.json(payload);
      }
    }

    const candidates = usFeatures.map(f => normalizeFeature(f));
    const payload = { top: candidates[0] || null, candidates };

    geoCache.set(url, payload);
    res.json(payload);
  } catch (err) {
    console.error('Geocoding error:', err?.message || err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// GET /api/geo/reverse?lat=...&lon=...&lang=en
app.get('/api/geo/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'missing lat/lon' });

    const lang = (req.query.lang || 'en').trim();
    const url = `${PHOTON_BASE}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&lang=${encodeURIComponent(lang)}`;

    if (geoCache.has(url)) return res.json(geoCache.get(url));

    const { data } = await axios.get(url, { timeout: 10000 });
    const features = Array.isArray(data?.features) ? data.features : [];

    const candidates = features.map(f => normalizeFeature(f));
    const payload = { top: candidates[0] || null, candidates };

    geoCache.set(url, payload);
    res.json(payload);
  } catch (err) {
    console.error('Reverse geocoding error:', err?.message || err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Geocoding: Photon (${PHOTON_BASE}) + LibreTranslate (${LIBRETRANSLATE_URL})`);
});