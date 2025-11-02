const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// 检查必要的环境变量
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('错误：缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY 环境变量。');
  // 在这种情况下，我们可以抛出错误以防止应用程序在没有正确配置的情况下运行
  throw new Error('Supabase service client a无法初始化。请检查您的 .env 文件。');
}

// 使用 service_role key 初始化 Supabase admin 客户端
// 这将绕过所有 RLS 策略
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * @route GET /api/users
 * @description 获取所有用户的配置文件（仅限管理员）
 * @access Private (需要适当的API密钥或认证中间件)
 */
router.get('/', async (req, res) => {
  try {
    // 从 'user_profiles' 表中获取所有用户
    const { data: profiles, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*');

    if (error) {
      // 如果 Supabase 客户端返回错误，则将其记录并发送500响应
      console.error('从 Supabase 获取用户配置文件时出错:', error.message);
      return res.status(500).json({ success: false, error: '获取用户数据时发生内部服务器错误。' });
    }

    // 成功时返回所有用户配置文件
    res.json({ success: true, data: profiles });

  } catch (err) {
    // 捕获任何意外错误
    console.error('获取用户路由中的意外错误:', err.message);
    res.status(500).json({ success: false, error: '处理您的请求时发生意外错误。' });
  }
});

module.exports = router;
