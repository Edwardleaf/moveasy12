const express = require('express');
const router = express.Router();

// 提供前端配置信息
router.get('/', (req, res) => {
  try {
    // 返回前端需要的配置信息
    const config = {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      googleClientId: process.env.GOOGLE_CLIENT_ID
    };

    // 验证必需的配置是否存在
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return res.status(500).json({
        error: 'Missing required Supabase configuration'
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Config endpoint error:', error);
    res.status(500).json({
      error: 'Failed to load configuration'
    });
  }
});

module.exports = router;