/**
 * 翻译API服务
 * 负责与后端翻译服务通信
 */

import axios from 'axios';

// API基础URL，使用Vite代理配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TRANSLATE_API_PATH = `${API_BASE_URL}/api/translate`;

/**
 * 翻译API服务
 */
const translateApi = {
  /**
   * 获取支持的语言列表
   * @returns {Promise<Array>} 语言列表
   */
  async getLanguages() {
    try {
      const response = await axios.get(`${TRANSLATE_API_PATH}/languages`);
      return response.data.languages || [];
    } catch (error) {
      console.error('获取语言列表失败:', error);
      return [];
    }
  },

  /**
   * 翻译单个文本
   * @param {string} text 要翻译的文本
   * @param {string} targetLanguage 目标语言代码
   * @param {string} [sourceLanguage=null] 源语言代码（可选）
   * @returns {Promise<string>} 翻译后的文本
   */
  async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      const payload = {
        text,
        target: targetLanguage,
        ...(sourceLanguage && { source: sourceLanguage })
      };

      const response = await axios.post(`${TRANSLATE_API_PATH}/text`, payload);
      return response.data.translation;
    } catch (error) {
      // 静默处理500错误，避免控制台噪音
      if (error.response?.status !== 500) {
        console.error('翻译文本失败:', error);
      }
      return text; // 翻译失败时返回原文
    }
  },

  /**
   * 批量翻译多个文本
   * @param {Array<string>} texts 要翻译的文本数组
   * @param {string} targetLanguage 目标语言代码
   * @param {string} [sourceLanguage=null] 源语言代码（可选）
   * @returns {Promise<Array<string>>} 翻译后的文本数组
   */
  async translateBatch(texts, targetLanguage, sourceLanguage = null) {
    try {
      const payload = {
        texts,
        target: targetLanguage,
        ...(sourceLanguage && { source: sourceLanguage })
      };
      
      const response = await axios.post(`${TRANSLATE_API_PATH}/batch`, payload);
      return response.data.translations;
    } catch (error) {
      console.error('批量翻译失败:', error);
      return texts; // 翻译失败时返回原文
    }
  },

  /**
   * 翻译JSON对象
   * @param {Object} jsonObj 要翻译的JSON对象
   * @param {string} targetLanguage 目标语言代码
   * @param {string} [sourceLanguage=null] 源语言代码（可选）
   * @returns {Promise<Object>} 翻译后的JSON对象
   */
  async translateJson(jsonObj, targetLanguage, sourceLanguage = null) {
    try {
      const payload = {
        data: jsonObj,
        target: targetLanguage,
        ...(sourceLanguage && { source: sourceLanguage })
      };
      
      const response = await axios.post(`${TRANSLATE_API_PATH}/json`, payload);
      return response.data.translatedData;
    } catch (error) {
      console.error('翻译JSON失败:', error);
      return jsonObj; // 翻译失败时返回原始对象
    }
  },

  /**
   * 检测文本语言
   * @param {string} text 要检测的文本
   * @returns {Promise<string>} 检测到的语言代码
   */
  async detectLanguage(text) {
    try {
      const response = await axios.post(`${TRANSLATE_API_PATH}/detect`, { text });
      return response.data.language;
    } catch (error) {
      console.error('语言检测失败:', error);
      // 使用本地语言检测作为备用
      return this.detectLanguageLocal(text);
    }
  },

  /**
   * 本地语言检测（备用方案）
   * @param {string} text 要检测的文本
   * @returns {string} 检测到的语言代码
   */
  detectLanguageLocal(text) {
    if (!text || text.trim() === '') {
      return 'en';
    }

    // 检测中文字符（包括中文汉字、标点等）
    const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff]/;
    if (chineseRegex.test(text)) {
      console.log(`🔍 本地检测: "${text}" 识别为中文`);
      return 'zh';
    }

    // 检测英文字符
    const englishRegex = /^[a-zA-Z\s\-'.]+$/;
    if (englishRegex.test(text)) {
      console.log(`🔍 本地检测: "${text}" 识别为英文`);
      return 'en';
    }

    // 默认返回英文
    console.log(`🔍 本地检测: "${text}" 无法识别，默认为英文`);
    return 'en';
  },

  /**
   * 本地翻译字典（备用方案）
   */
  getLocalTranslationDict() {
    return {
      // 常见地名翻译
      '哈里森': 'Harrison',
      '曼哈顿': 'Manhattan', 
      '布鲁克林': 'Brooklyn',
      '皇后区': 'Queens',
      '布朗克斯': 'Bronx',
      '史坦顿岛': 'Staten Island',
      '泽西城': 'Jersey City',
      '霍博肯': 'Hoboken',
      '长岛市': 'Long Island City',
      '威廉斯堡': 'Williamsburg',
      '阿斯托利亚': 'Astoria',
      '东村': 'East Village',
      '西村': 'West Village',
      '李堡': 'Fort Lee',
      
      // 建筑类型翻译
      '公寓': 'Apartment',
      '学生公寓': 'Student Accommodation',
      '单间公寓': 'Studio',
      '一室': '1 Bedroom',
      '两室': '2 Bedroom', 
      '三室': '3 Bedroom',
      '联排别墅': 'Townhouse',
      '共管公寓': 'Condo',
      '独栋房屋': 'House',
      '阁楼公寓': 'Loft',
      
      // 设施翻译
      '游泳池': 'Pool',
      '健身房': 'Gym', 
      '停车场': 'Parking',
      '洗衣房': 'Laundry',
      '电梯': 'Elevator',
      '阳台': 'Balcony',
      '空调': 'Air Conditioning',
      '洗碗机': 'Dishwasher',
      
      // 区域特征翻译
      '经济实惠': 'Affordable',
      '适合家庭': 'Family Friendly',
      '学生友好': 'Student Friendly',
      '年轻专业人士': 'Young Professional',
      '安静': 'Quiet',
      '时尚': 'Trendy',
      '多元化': 'Diverse',
      '步行友好': 'Walkable',
      '交通便利': 'Transit',
      '夜生活': 'Nightlife',
      '购物': 'Shopping',
      '餐饮': 'Dining',
      '艺术': 'Arts',
      '公园': 'Parks',
      '海滨': 'Waterfront',
      '豪华': 'Luxury',
      '安全': 'Safe',
      '历史': 'Historic',
      '宠物友好': 'Pet Friendly',
      '大学区': 'University Area'
    };
  },

  /**
   * 本地翻译（备用方案）
   * @param {string} text 要翻译的文本
   * @param {string} targetLang 目标语言
   * @returns {string} 翻译后的文本
   */
  translateLocal(text, targetLang = 'en') {
    const dict = this.getLocalTranslationDict();
    
    if (targetLang === 'en' && dict[text]) {
      console.log(`🌐 本地翻译: "${text}" -> "${dict[text]}"`);
      return dict[text];
    }
    
    // 如果没有找到翻译，返回原文
    return text;
  },

  /**
   * 为搜索优化的翻译：中文 -> 英文
   * @param {string} searchTerm 搜索词
   * @returns {Promise<string>} 翻译后的英文搜索词
   */
  async translateForSearch(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return searchTerm;
      }

      // 检测语言
      const detectedLang = await this.detectLanguage(searchTerm);
      console.log(`🔍 检测到搜索词"${searchTerm}"的语言:`, detectedLang);

      // 如果是中文，尝试翻译为英文
      if (detectedLang === 'zh' || detectedLang === 'zh-cn' || detectedLang === 'zh-tw') {
        // 首先尝试本地翻译字典
        const localTranslation = this.translateLocal(searchTerm, 'en');
        if (localTranslation !== searchTerm) {
          console.log(`🌐 本地字典翻译成功: "${searchTerm}" -> "${localTranslation}"`);
          return localTranslation;
        }
        
        // 如果本地字典没有，尝试API翻译
        try {
          const englishTerm = await this.translateText(searchTerm, 'en', detectedLang);
          if (englishTerm !== searchTerm) {
            console.log(`🌐 API翻译成功: "${searchTerm}" -> "${englishTerm}"`);
            return englishTerm;
          }
        } catch (apiError) {
          console.warn('API翻译失败，使用本地翻译结果:', apiError);
        }
        
        // 都失败了，返回原文
        console.log(`⚠️ 翻译失败，返回原文: "${searchTerm}"`);
        return searchTerm;
      }

      // 如果已经是英文或其他语言，直接返回
      return searchTerm;
    } catch (error) {
      console.error('搜索翻译失败:', error);
      return searchTerm; // 翻译失败时返回原文
    }
  }
};

export default translateApi; 