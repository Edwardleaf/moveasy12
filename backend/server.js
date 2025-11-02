const express = require('express');
const cors = require('cors');
const { Translate } = require('@google-cloud/translate').v2;
const { createClient } = require('@supabase/supabase-js');
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

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});