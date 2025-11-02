/**
 * 翻译组合式API
 * 提供翻译功能和语言切换，实现多级缓存策略
 */

import { ref, reactive, computed } from 'vue';
import translateApi from '@/services/translateApi';

// 默认语言
const DEFAULT_LANGUAGE = 'en';
// 缓存过期时间（毫秒）- 24小时
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// 默认支持的语言列表
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文 (简体)' }
];

// 全局共享的语言状态 - 所有组件共享同一个状态
const globalCurrentLanguage = ref(
  localStorage.getItem('preferredLanguage') || DEFAULT_LANGUAGE
);
const globalAvailableLanguages = ref(DEFAULT_LANGUAGES);
const globalIsLoading = ref(false);
const globalTranslationCache = reactive({});

// 静态翻译字典 - 常用UI文本，避免API调用
const STATIC_TRANSLATIONS = {
  // 通用按钮和操作
  'search': { en: 'Search', zh: '搜索' },
  'filter': { en: 'Filter', zh: '筛选' },
  'view': { en: 'View', zh: '查看' },
  'details': { en: 'Details', zh: '详情' },
  'back': { en: 'Back', zh: '返回' },
  'submit': { en: 'Submit', zh: '提交' },
  'cancel': { en: 'Cancel', zh: '取消' },
  'confirm': { en: 'Confirm', zh: '确认' },
  'save': { en: 'Save', zh: '保存' },
  'edit': { en: 'Edit', zh: '编辑' },
  'delete': { en: 'Delete', zh: '删除' },
  'add': { en: 'Add', zh: '添加' },
  'clear': { en: 'Clear', zh: '清空' },
  'in': { en: 'in', zh: '在' },
  'continue': { en: 'Continue', zh: '继续' },
  
  // AI推荐页面
  'like what you see?': { en: 'Like what you see?', zh: '喜欢你看到的吗？' },
  'swipe to build your style profile.': { en: 'Swipe to build your style profile.', zh: '滑动卡片，建立你的风格档案。' },
  'all set!': { en: 'All Set!', zh: '完成了！' },
  "we've learned your style preferences": { en: "We've learned your style preferences", zh: '我们已经了解了你的风格偏好' },
  'analyzing your preferences...': { en: 'Analyzing your preferences...', zh: '正在分析您的偏好...' },
  'building your personalized housing profile': { en: 'Building your personalized housing profile', zh: '正在构建您的个性化住房档案' },
  'find your perfect home': { en: 'Find your perfect home', zh: '找到您的完美住所' },
  'answer 5 quick questions to get personalized recommendations': { en: 'Answer 5 quick questions to get personalized recommendations', zh: '回答5个简单问题，获得个性化推荐' },
  'where are you looking?': { en: 'Where are you looking?', zh: '您在哪里找房？' },
  'enter one or more locations anywhere in the u.s. you can use city, neighborhood, zip code, school, or a landmark.': { en: 'Enter one or more locations anywhere in the U.S. You can use city, neighborhood, ZIP code, school, or a landmark.', zh: '输入美国境内的一个或多个位置。您可以使用城市、社区、邮政编码、学校或地标。' },
  'enter location(s)': { en: 'Enter Location(s)', zh: '输入位置' },
  'use my location': { en: 'Use my location', zh: '使用我的位置' },
  "i'm open to suggestions": { en: "I'm open to suggestions", zh: '我愿意接受建议' },
  'search radius': { en: 'Search Radius', zh: '搜索半径' },
  'your browser does not support geolocation': { en: 'Your browser does not support geolocation', zh: '您的浏览器不支持地理定位' },
  'unable to get your location': { en: 'Unable to get your location', zh: '无法获取您的位置' },
  'location permission denied. please enable location access in your browser settings.': { en: 'Location permission denied. Please enable location access in your browser settings.', zh: '定位权限被拒绝。请在浏览器设置中启用位置访问权限。' },
  'location information is unavailable. please try again.': { en: 'Location information is unavailable. Please try again.', zh: '位置信息不可用。请重试。' },
  'location request timed out. please try again.': { en: 'Location request timed out. Please try again.', zh: '定位请求超时。请重试。' },
  'location detected successfully': { en: 'Location detected successfully', zh: '定位成功' },
  'you are outside our service area. defaulting to san francisco.': { en: 'You are outside our service area. Defaulting to San Francisco.', zh: '您不在我们的服务区域内。已自动设置为旧金山。' },
  'budget range': { en: 'Budget Range', zh: '预算范围' },
  'drag the sliders to set your price range': { en: 'Drag the sliders to set your price range', zh: '拖动滑块设置您的价格范围' },
  'minimum': { en: 'Minimum', zh: '最低' },
  'maximum': { en: 'Maximum', zh: '最高' },
  'your monthly budget': { en: 'Your Monthly Budget', zh: '您的月租预算' },
  'per month': { en: 'per month', zh: '每月' },
  'back': { en: 'Back', zh: '返回' },
  'question': { en: 'Question', zh: '问题' },
  'of': { en: 'of', zh: '/' },
  'top priorities': { en: 'Top Priorities', zh: '首要诉求' },
  'select and rank what matters most to you': { en: 'Select and rank what matters most to you', zh: '选择并排序对您最重要的因素' },
  'safety': { en: 'Safety', zh: '安全' },
  'commute': { en: 'Commute', zh: '通勤' },
  'public transit': { en: 'Public Transit', zh: '公共交通' },
  'near grocery': { en: 'Near Grocery', zh: '邻近超市' },
  'car friendly': { en: 'Car Friendly', zh: '适合开车' },
  'lifestyle': { en: 'Lifestyle', zh: '生活方式' },
  'pet friendly': { en: 'Pet Friendly', zh: '宠物友好' },
  'amenities': { en: 'Amenities', zh: '设施配套' },
  'you can select up to 5 priorities.': { en: 'You can select up to 5 priorities.', zh: '您最多可以选择5个优先级。' },
  'living arrangement preferences': { en: 'Living Arrangement Preferences', zh: '居住安排偏好' },
  "tell us how you'd like to live and what type of home fits your lifestyle.": { en: "Tell us how you'd like to live and what type of home fits your lifestyle.", zh: '告诉我们您想如何生活以及什么样的房子适合您的生活方式。' },
  '1. preferred housing type': { en: '1. Preferred Housing Type', zh: '1. 首选房型' },
  'entire apartment': { en: 'Entire Apartment', zh: '整套公寓' },
  'private room': { en: 'Private Room', zh: '独立房间' },
  'studio': { en: 'Studio', zh: '单间公寓' },
  'shared room': { en: 'Shared Room', zh: '合租房间' },
  'flexible / open to all': { en: 'Flexible / Open to All', zh: '灵活/接受所有' },
  '2. roommate preference': { en: '2. Roommate Preference', zh: '2. 室友偏好' },
  '3. layout requirements': { en: '3. Layout Requirements', zh: '3. 布局要求' },
  'bedrooms': { en: 'Bedrooms', zh: '卧室' },
  'bathrooms': { en: 'Bathrooms', zh: '浴室' },
  'timeline & lease preferences': { en: 'Timeline & Lease Preferences', zh: '时间线和租赁偏好' },
  "tell us when you're planning to move and how long you'd like to stay.": { en: "Tell us when you're planning to move and how long you'd like to stay.", zh: '告诉我们您计划何时搬家以及打算住多久。' },
  'how soon do you need to move?': { en: 'How soon do you need to move?', zh: '您需要多快搬家？' },
  'select move-in date': { en: 'Select move-in date', zh: '选择入住日期' },
  'planned lease term': { en: 'Planned Lease Term', zh: '计划租期' },
  'select duration': { en: 'Select duration', zh: '选择租期' },
  'move-in timeline': { en: 'Move-in Timeline', zh: '入住时间' },
  'lease term': { en: 'Lease Term', zh: '租期' },
  'find my home': { en: 'Find My Home', zh: '找到我的家' },
  'finding your perfect home': { en: 'Finding your perfect home', zh: '正在为您寻找完美住所' },
  'our ai is analyzing your preferences...': { en: 'Our AI is analyzing your preferences...', zh: '我们的AI正在分析您的偏好...' },
  
  // 推荐结果页面
  'your perfect matches': { en: 'Your Perfect Matches', zh: '您的完美匹配' },
  'our ai found 3 apartments that match your preferences': { en: 'Our AI found 3 apartments that match your preferences', zh: '我们的AI找到了3个符合您偏好的公寓' },
  'location': { en: 'Location', zh: '位置' },
  'budget': { en: 'Budget', zh: '预算' },
  'beds': { en: 'Beds', zh: '卧室' },
  'lease': { en: 'Lease', zh: '租期' },
  'open to suggestions': { en: 'Open to Suggestions', zh: '开放建议' },
  'flexible': { en: 'Flexible', zh: '灵活' },
  '15 min to downtown': { en: '15 min to Downtown', zh: '距市中心15分钟' },
  'why this is a great match:': { en: 'Why this is a great match:', zh: '为什么这是一个很好的匹配：' },
  'matches your preferences': { en: 'Matches your preferences', zh: '符合您的偏好' },
  'contact building': { en: 'Contact Building', zh: '联系建筑' },
  'start over': { en: 'Start Over', zh: '重新开始' },
  'to your location': { en: 'to your location', zh: '到您的位置' },
  'calculating...': { en: 'Calculating...', zh: '计算中...' },
  'min': { en: 'min', zh: '分钟' },
  'hr': { en: 'hr', zh: '小时' },
  'contact for price': { en: 'Contact for Price', zh: '联系询价' },
  'geocoding your location...': { en: 'Geocoding your location...', zh: '正在定位您的地址...' },
  'location found': { en: 'Location found', zh: '位置已找到' },
  'could not find exact coordinates for this location. commute times will not be available.': { 
    en: 'Could not find exact coordinates for this location. Commute times will not be available.', 
    zh: '无法找到此位置的精确坐标。将无法显示通勤时间。' 
  },
  'not what you\'re looking for?': { en: 'Not what you\'re looking for?', zh: '不满意这些推荐？' },
  'refine your preferences': { en: 'Refine Your Preferences', zh: '细化您的偏好' },
  'additional amenities': { en: 'Additional Amenities', zh: '附加设施偏好' },
  'select the amenities you\'d like your apartment to have': { 
    en: 'Select the amenities you\'d like your apartment to have', 
    zh: '选择您希望公寓具备的设施' 
  },
  'in-unit laundry': { en: 'In-unit laundry', zh: '房内洗衣机' },
  'full-function gym': { en: 'Full-function gym', zh: '全功能健身房' },
  'covered garage': { en: 'Covered garage', zh: '室内车库' },
  'swimming pool': { en: 'Swimming pool', zh: '游泳池' },
  'dog park': { en: 'Dog park', zh: '宠物公园' },
  '24-hour front desk': { en: '24-hour front desk', zh: '24小时前台' },
  'rooftop lounge': { en: 'Rooftop lounge', zh: '屋顶休息区' },
  'co-working space': { en: 'Co-working space', zh: '共享办公空间' },
  'package locker': { en: 'Package locker', zh: '包裹寄存柜' },
  'other amenities (comma separated)': { en: 'Other amenities (comma separated)', zh: '其他设施（逗号分隔）' },
  'commute preference': { en: 'Commute Preference', zh: '通勤偏好' },
  'specify your main destination and maximum commute time': {
    en: 'Specify your main destination and maximum commute time',
    zh: '指定您的主要目的地和最大通勤时长'
  },
  'e.g., stanford university, google campus': { 
    en: 'e.g., Stanford University, Google Campus', 
    zh: '例如：斯坦福大学、谷歌园区' 
  },
  'maximum commute time': { en: 'Maximum Commute Time', zh: '最大通勤时长' },
  'anything else?': { en: 'Anything Else?', zh: '其他需求？' },
  'tell us anything else about your ideal apartment': {
    en: 'Tell us anything else about your ideal apartment',
    zh: '告诉我们您理想公寓的其他要求'
  },
  'e.g., studio, 2br, furnished, high floor, south-facing...': {
    en: 'e.g., studio, 2BR, furnished, high floor, south-facing...',
    zh: '例如：开间、2卧室、家具齐全、高楼层、朝南...'
  },
  'cancel': { en: 'Cancel', zh: '取消' },
  'find my new apartments': { en: 'Find My New Apartments', zh: '查找新公寓' },
  'please fill in at least one preference': { 
    en: 'Please fill in at least one preference', 
    zh: '请至少填写一项偏好' 
  },
  'analyzing your refined preferences...': { 
    en: 'Analyzing your refined preferences...', 
    zh: '正在分析您的细化偏好...' 
  },
  'found 3 new recommendations!': { en: 'Found 3 new recommendations!', zh: '找到了3个新推荐！' },
  "let's refine your search!": { en: "Let's refine your search!", zh: '让我们细化您的搜索！' },
  "no problem — let's get to know what you are looking for a little better!": { 
    en: "No problem — let's get to know what you are looking for a little better!", 
    zh: '没问题 — 让我们更了解您在寻找！' 
  },
  "let's go!": { en: "Let's Go!", zh: '开始！' },
  "what are some additional amenities you'd love to have in your next apartment?": {
    en: "What are some additional amenities you'd love to have in your next apartment?",
    zh: '您希望下一套公寓有哪些额外设施？'
  },
  'how close do you want your apartment to be from your main destination?': {
    en: 'How close do you want your apartment to be from your main destination?',
    zh: '您希望公寓离主要目的地多近？'
  },
  'destination': { en: 'Destination', zh: '目的地' },
  'max commute time': { en: 'Max Commute Time', zh: '最大通勤时长' },
  'back': { en: 'Back', zh: '返回' },
  'continue': { en: 'Continue', zh: '继续' },
  
  // 导航和菜单
  'home': { en: 'Home', zh: '首页' },
  'browse': { en: 'Browse', zh: '浏览房源' },
  'favorites': { en: 'Favorites', zh: '收藏' },
  'profile': { en: 'Profile', zh: '个人资料' },
  'settings': { en: 'Settings', zh: '设置' },
  'help': { en: 'Help', zh: '帮助' },
  'contact': { en: 'Contact', zh: '联系我们' },
  'about': { en: 'About', zh: '关于我们' },
  'login': { en: 'Login', zh: '登录' },
  'register': { en: 'Register', zh: '注册' },
  'logout': { en: 'Logout', zh: '退出登录' },
  'menu': { en: 'Menu', zh: '菜单' },
  'dashboard': { en: 'Dashboard', zh: '仪表板' },
  'sign in': { en: 'Sign In', zh: '登录' },
  'list a place': { en: 'List A Place', zh: '发布房源' },
  'about us': { en: 'About Us', zh: '关于我们' },
  'whats app': { en: 'Whats App', zh: 'WhatsApp' },

  // 房源相关
  'buildings': { en: 'Buildings', zh: '房源' },
  'neighborhoods': { en: 'Neighborhoods', zh: '社区' },
  'price': { en: 'Price', zh: '价格' },
  'location': { en: 'Location', zh: '位置' },
  'amenities': { en: 'Amenities', zh: '设施' },
  'nearby': { en: 'Nearby', zh: '附近' },
  'distance': { en: 'Distance', zh: '距离' },
  'from_university': { en: 'from University', zh: '距离大学' },
  'month': { en: '/month', zh: '/月' },
  'comments': { en: 'comments', zh: '评论' },
  'rating': { en: 'Rating', zh: '评分' },
  
  // 房型类别翻译
  'apartment': { en: 'Apartment', zh: '公寓' },
  'studio': { en: 'Studio', zh: '单间公寓' },
  'townhouse': { en: 'Townhouse', zh: '联排别墅' },
  'condo': { en: 'Condo', zh: '共管公寓' },
  'house': { en: 'House', zh: '独栋房屋' },
  'loft': { en: 'Loft', zh: '阁楼公寓' },
  
  // 筛选器
  'all': { en: 'All', zh: '全部' },
  'studio': { en: 'Studio', zh: '开间' },
  'one_bedroom': { en: '1 Bedroom', zh: '一室' },
  'two_bedroom': { en: '2 Bedroom', zh: '两室' },
  'three_bedroom': { en: '3 Bedroom', zh: '三室' },
  'rent_type': { en: 'Rent Type', zh: '租赁类型' },
  'price_range': { en: 'Price Range', zh: '价格范围' },
  'property_type': { en: 'Property Type', zh: '房源类型' },
  
  // 表单
  'email': { en: 'Email', zh: '邮箱' },
  'password': { en: 'Password', zh: '密码' },
  'confirm_password': { en: 'Confirm Password', zh: '确认密码' },
  'first_name': { en: 'First Name', zh: '名字' },
  'last_name': { en: 'Last Name', zh: '姓氏' },
  'phone': { en: 'Phone', zh: '电话' },
  'message': { en: 'Message', zh: '留言' },
  
  // 状态和提示
  'loading': { en: 'Loading', zh: '加载中' },
  'no_results': { en: 'No results found', zh: '未找到结果' },
  'try_broader_search': { en: 'Try broader search', zh: '尝试更广泛的搜索' },
  'load_more_results': { en: 'Load More Results', zh: '加载更多结果' },
  'found': { en: 'found', zh: '找到' },
  'error': { en: 'Error', zh: '错误' },
  'success': { en: 'Success', zh: '成功' },
  'required_field': { en: 'This field is required', zh: '此项为必填' },
  'invalid_email': { en: 'Invalid email format', zh: '邮箱格式不正确' },
  
  // 登录和注册页面翻译
  'Welcome back! Please enter your details.': { en: 'Welcome back! Please enter your details.', zh: '欢迎回来！请输入您的详细信息。' },
  'Sign in with Google': { en: 'Sign in with Google', zh: '使用Google登录' },
  'or Sign in with Email': { en: 'or Sign in with Email', zh: '或使用邮箱登录' },
  'Remember me': { en: 'Remember me', zh: '记住我' },
  'Forgot Password': { en: 'Forgot Password', zh: '忘记密码' },
  'Not registered yet?': { en: 'Not registered yet?', zh: '还没有注册？' },
  'Getting Started': { en: 'Getting Started', zh: '开始注册' },
  'Create an account to continue!': { en: 'Create an account to continue!', zh: '创建账户以继续！' },
  'or Sign Up with Email': { en: 'or Sign Up with Email', zh: '或使用邮箱注册' },
  'Strong': { en: 'Strong', zh: '强' },
  'I agree to the': { en: 'I agree to the', zh: '我同意' },
  'Terms & Conditions': { en: 'Terms & Conditions', zh: '条款与条件' },
  'Already have an account?': { en: 'Already have an account?', zh: '已有账户？' },
  'Company/Landlord Name': { en: 'Company/Landlord Name', zh: '公司/房东姓名' },
  'Enter your company or agency name': { en: 'Enter your company or agency name', zh: '输入您的公司或代理名称' },
  'Building Name': { en: 'Building Name', zh: '建筑名称' },
  'Enter the name of the building': { en: 'Enter the name of the building', zh: '输入建筑名称' },
  'Contact Email': { en: 'Contact Email', zh: '联系邮箱' },
  'Enter your email address': { en: 'Enter your email address', zh: '输入您的邮箱地址' },
  'Set Password': { en: 'Set Password', zh: '设置密码' },
  'Enter a password': { en: 'Enter a password', zh: '输入密码' },
  'Choose Plan': { en: 'Choose Plan', zh: '选择计划' },
  'Listing Fee': { en: 'Listing Fee', zh: '刊登费' },
  'Success Fee': { en: 'Success Fee', zh: '成功费' },
  'Calendly Link': { en: 'Calendly Link', zh: 'Calendly链接' },
  'Building Qualification Document': { en: 'Building Qualification Document', zh: '建筑资格文件' },
  'PDF, JPG, PNG (Max 5 files)': { en: 'PDF, JPG, PNG (Max 5 files)', zh: 'PDF, JPG, PNG (最多5个文件)' },
  'I have read and agree to the': { en: 'I have read and agree to the', zh: '我已阅读并同意' },
  'Privacy Policy': { en: 'Privacy Policy', zh: '隐私政策' },
  'and': { en: 'and', zh: '和' },
  'Terms of Service': { en: 'Terms of Service', zh: '服务条款' },
  'Sign In': { en: 'Sign In', zh: '登录' },
  'Submit Registration': { en: 'Submit Registration', zh: '提交注册' },
  'Application Submitted Successfully!': { en: 'Application Submitted Successfully!', zh: '申请提交成功！' },
  "We'll review your application within 1-2 business days and notify you via email.": { en: "We'll review your application within 1-2 business days and notify you via email.", zh: '我们将在1-2个工作日内审核您的申请并通过邮件通知您。' },
  'You must agree to the Terms & Conditions': { en: 'You must agree to the Terms & Conditions', zh: '您必须同意条款与条件' },
  'You must agree to the Terms of Service and Privacy Policy': { en: 'You must agree to the Terms of Service and Privacy Policy', zh: '您必须同意服务条款和隐私政策' },
  
  // Form validation messages
  'Name is required': { en: 'Name is required', zh: '姓名是必填项' },
  'Name must be at least 2 characters': { en: 'Name must be at least 2 characters', zh: '姓名至少需要2个字符' },
  'Email is required': { en: 'Email is required', zh: '邮箱是必填项' },
  'Please enter a valid email address': { en: 'Please enter a valid email address', zh: '请输入有效的邮箱地址' },
  'Password is required': { en: 'Password is required', zh: '密码是必填项' },
  'Password must be at least 6 characters': { en: 'Password must be at least 6 characters', zh: '密码至少需要6个字符' },
  'Company name is required': { en: 'Company name is required', zh: '公司名称是必填项' },
  'Building name is required': { en: 'Building name is required', zh: '建筑名称是必填项' },
  'Building qualification document is required': { en: 'Building qualification document is required', zh: '建筑资格文件是必填项' },
  'Calendly link is required': { en: 'Calendly link is required', zh: 'Calendly链接是必填项' },
  'Please enter a valid Calendly link': { en: 'Please enter a valid Calendly link', zh: '请输入有效的Calendly链接' },
  
  // Admin Dashboard menu items
  'Dashboard': { en: 'Dashboard', zh: '仪表板' },
  'Buildings': { en: 'Buildings', zh: '建筑' },
  'Areas': { en: 'Areas', zh: '区域' },
  'Users': { en: 'Users', zh: '用户' },
  'Amenities': { en: 'Amenities', zh: '设施' },
  'Transportation': { en: 'Transportation', zh: '交通' },
  'Admin Dashboard': { en: 'Admin Dashboard', zh: '管理员仪表板' },
  'Back to site': { en: 'Back to site', zh: '返回网站' },
  'Logout': { en: 'Logout', zh: '退出登录' },
  
  // Building form translations
  'Add New Building': { en: 'Add New Building', zh: '添加新建筑' },
  'Upload a new building to the system': { en: 'Upload a new building to the system', zh: '向系统上传新建筑' },
  'Basic Information': { en: 'Basic Information', zh: '基本信息' },
  'Name': { en: 'Name', zh: '名称' },
  'Building name': { en: 'Building name', zh: '建筑名称' },
  'Description': { en: 'Description', zh: '描述' },
  'Enter building description': { en: 'Enter building description', zh: '输入建筑描述' },
  'Year Built': { en: 'Year Built', zh: '建造年份' },
  'Total Floors': { en: 'Total Floors', zh: '总楼层' },
  'Image URL': { en: 'Image URL', zh: '图片链接' },
  'Enter building image URL (e.g., https://example.com/image.jpg)': { en: 'Enter building image URL (e.g., https://example.com/image.jpg)', zh: '输入建筑图片链接（例如：https://example.com/image.jpg）' },
  'Area': { en: 'Area', zh: '区域' },
  'Select area': { en: 'Select area', zh: '选择区域' },
  'Rent & Availability': { en: 'Rent & Availability', zh: '租金与房型' },
  'Min Rent ($)': { en: 'Min Rent ($)', zh: '最低租金 ($)' },
  'Max Rent ($)': { en: 'Max Rent ($)', zh: '最高租金 ($)' },
  'Studio Available': { en: 'Studio Available', zh: '单间可用' },
  '1BR Available': { en: '1BR Available', zh: '一室可用' },
  '2BR Available': { en: '2BR Available', zh: '两室可用' },
  '3BR Available': { en: '3BR Available', zh: '三室可用' },
  'Amenities': { en: 'Amenities', zh: '设施' },
  'Select amenities': { en: 'Select amenities', zh: '选择设施' },
  'Contact & Settings': { en: 'Contact & Settings', zh: '联系方式与设置' },
  'Leasing Phone': { en: 'Leasing Phone', zh: '租赁电话' },
  'Leasing Email': { en: 'Leasing Email', zh: '租赁邮箱' },
  'Calendly URL': { en: 'Calendly URL', zh: 'Calendly链接' },
  'Pet Policy': { en: 'Pet Policy', zh: '宠物政策' },
  'Select pet policy': { en: 'Select pet policy', zh: '选择宠物政策' },
  'Parking Available': { en: 'Parking Available', zh: '停车位可用' },
  'Featured Building': { en: 'Featured Building', zh: '精选建筑' },
  'Create Building': { en: 'Create Building', zh: '创建建筑' },
  
  // Area form translations
  'Edit Area': { en: 'Edit Area', zh: '编辑区域' },
  'Add New Area': { en: 'Add New Area', zh: '添加新区域' },
  'Update area information': { en: 'Update area information', zh: '更新区域信息' },
  'Create a new NYC area': { en: 'Create a new NYC area', zh: '创建新的纽约区域' },
  'Area Information': { en: 'Area Information', zh: '区域信息' },
  'Area Name': { en: 'Area Name', zh: '区域名称' },
  'Enter area name (e.g. SoHo, Upper East Side)': { en: 'Enter area name (e.g. SoHo, Upper East Side)', zh: '输入区域名称（例如：苏豪区、上东区）' },
  'Borough': { en: 'Borough', zh: '行政区' },
  'Select borough': { en: 'Select borough', zh: '选择行政区' },
  'City': { en: 'City', zh: '城市' },
  'State': { en: 'State', zh: '州/省' },
  'Enter area description...': { en: 'Enter area description...', zh: '输入区域描述...' },
  'Tags': { en: 'Tags', zh: '标签' },
  'Add tags (e.g. trendy, nightlife, walkable)': { en: 'Add tags (e.g. trendy, nightlife, walkable)', zh: '添加标签（例如：时尚、夜生活、适合步行）' },
  
  // 城市翻译
  'Boston, MA': { en: 'Boston, MA', zh: '波士顿，马萨诸塞州' },
  'New York, NY': { en: 'New York, NY', zh: '纽约，纽约州' },
  'Philadelphia, PA': { en: 'Philadelphia, PA', zh: '费城，宾夕法尼亚州' },
  'Chicago, IL': { en: 'Chicago, IL', zh: '芝加哥，伊利诺伊州' },
  'Los Angeles, CA': { en: 'Los Angeles, CA', zh: '洛杉矶，加利福尼亚州' },
  'San Francisco, CA': { en: 'San Francisco, CA', zh: '旧金山，加利福尼亚州' },
  'Seattle, WA': { en: 'Seattle, WA', zh: '西雅图，华盛顿州' },
  'Washington, DC': { en: 'Washington, DC', zh: '华盛顿特区' },
  'Miami, FL': { en: 'Miami, FL', zh: '迈阿密，佛罗里达州' },
  'Atlanta, GA': { en: 'Atlanta, GA', zh: '亚特兰大，佐治亚州' },
  
  // 城市描述翻译
  'Historic city with world-class universities and rich academic culture.': { 
    en: 'Historic city with world-class universities and rich academic culture.', 
    zh: '拥有世界一流大学和丰富学术文化的历史名城。' 
  },
  'The city that never sleeps, offering endless opportunities and iconic landmarks.': { 
    en: 'The city that never sleeps, offering endless opportunities and iconic landmarks.', 
    zh: '不夜城，提供无限机会和标志性地标。' 
  },
  'City of brotherly love with rich American history and vibrant neighborhoods.': { 
    en: 'City of brotherly love with rich American history and vibrant neighborhoods.', 
    zh: '兄弟之爱之城，拥有丰富的美国历史和充满活力的社区。' 
  },
  'Windy city known for architecture, deep-dish pizza, and diverse culture.': { 
    en: 'Windy city known for architecture, deep-dish pizza, and diverse culture.', 
    zh: '风城，以建筑、深盘披萨和多元文化闻名。' 
  },
  'City of angels with beautiful weather, beaches, and entertainment industry.': { 
    en: 'City of angels with beautiful weather, beaches, and entertainment industry.', 
    zh: '天使之城，拥有美丽的天气、海滩和娱乐产业。' 
  },
  'Tech hub with stunning views, diverse culture, and innovative spirit.': { 
    en: 'Tech hub with stunning views, diverse culture, and innovative spirit.', 
    zh: '科技中心，拥有壮丽景色、多元文化和创新精神。' 
  },
  'Emerald city surrounded by water, mountains, and thriving tech scene.': { 
    en: 'Emerald city surrounded by water, mountains, and thriving tech scene.', 
    zh: '翡翠之城，被水域、山脉和蓬勃发展的科技景象环绕。' 
  },
  'Nations capital with rich history, museums, and political significance.': { 
    en: 'Nations capital with rich history, museums, and political significance.', 
    zh: '国家首都，拥有丰富的历史、博物馆和政治意义。' 
  },
  'Tropical paradise with beautiful beaches, nightlife, and Latin culture.': { 
    en: 'Tropical paradise with beautiful beaches, nightlife, and Latin culture.', 
    zh: '热带天堂，拥有美丽的海滩、夜生活和拉丁文化。' 
  },
  'Southern charm with modern skyline, great food, and warm hospitality.': { 
    en: 'Southern charm with modern skyline, great food, and warm hospitality.', 
    zh: '南方魅力，现代天际线，美食和热情好客。' 
  },
  'Midwestern metropolis known for architecture, food, and lakefront living.': { 
    en: 'Midwestern metropolis known for architecture, food, and lakefront living.', 
    zh: '中西部大都市，以建筑、美食和湖滨生活而闻名。' 
  },
  'Coastal city with stunning ocean views, perfect weather, and vibrant culture.': { 
    en: 'Coastal city with stunning ocean views, perfect weather, and vibrant culture.', 
    zh: '拥有壮丽海景、完美天气和充满活力文化的海滨城市。' 
  },
  'Mountain city with outdoor recreation, craft breweries, and laid-back lifestyle.': { 
    en: 'Mountain city with outdoor recreation, craft breweries, and laid-back lifestyle.', 
    zh: '山城，拥有户外娱乐、精酿啤酒厂和悠闲的生活方式。' 
  },
  'Desert oasis with year-round sunshine, golf courses, and luxury resorts.': { 
    en: 'Desert oasis with year-round sunshine, golf courses, and luxury resorts.', 
    zh: '沙漠绿洲，全年阳光充足，拥有高尔夫球场和豪华度假村。' 
  },
  'River city with rich history, blues music, and southern hospitality.': { 
    en: 'River city with rich history, blues music, and southern hospitality.', 
    zh: '河畔城市，拥有丰富历史、蓝调音乐和南方式热情好客。' 
  },
  'Tech capital with innovation, startups, and world-class universities.': { 
    en: 'Tech capital with innovation, startups, and world-class universities.', 
    zh: '科技之都，拥有创新、初创企业和世界一流大学。' 
  },
  'Cultural hub with museums, theaters, and diverse dining scene.': { 
    en: 'Cultural hub with museums, theaters, and diverse dining scene.', 
    zh: '文化中心，拥有博物馆、剧院和多样化的餐饮场所。' 
  },
  'College town with vibrant student life and academic excellence.': { 
    en: 'College town with vibrant student life and academic excellence.', 
    zh: '大学城，拥有充满活力的学生生活和卓越的学术水平。' 
  },
  'Gateway city connecting East and West with rich transportation history.': { 
    en: 'Gateway city connecting East and West with rich transportation history.', 
    zh: '连接东西部的门户城市，拥有丰富的交通历史。' 
  },
  'Port city with maritime heritage, fresh seafood, and historic charm.': { 
    en: 'Port city with maritime heritage, fresh seafood, and historic charm.', 
    zh: '港口城市，拥有海洋传统、新鲜海鲜和历史魅力。' 
  },
  
  // 遗漏的城市描述翻译
  'The city that never sleeps, offering endless opportunities for students and young professionals.': { 
    en: 'The city that never sleeps, offering endless opportunities for students and young professionals.', 
    zh: '不夜城，为学生和年轻专业人士提供无限机会。' 
  },
  'Entertainment capital with year-round sunshine and diverse neighborhoods.': { 
    en: 'Entertainment capital with year-round sunshine and diverse neighborhoods.', 
    zh: '娱乐之都，全年阳光充足，社区多元化。' 
  },
  'City of brotherly love with rich history and affordable living.': { 
    en: 'City of brotherly love with rich history and affordable living.', 
    zh: '兄弟之爱之城，拥有丰富历史和经济实惠的生活。' 
  },
  'Tech hub with stunning bay views and vibrant neighborhoods.': { 
    en: 'Tech hub with stunning bay views and vibrant neighborhoods.', 
    zh: '科技中心，拥有壮丽的海湾景色和充满活力的社区。' 
  },
  'The nations capital with government opportunities and cultural attractions.': { 
    en: 'The nations capital with government opportunities and cultural attractions.', 
    zh: '国家首都，拥有政府机会和文化景点。' 
  },
  'Pacific Northwest gem with tech companies and outdoor recreation.': { 
    en: 'Pacific Northwest gem with tech companies and outdoor recreation.', 
    zh: '太平洋西北地区的明珠，拥有科技公司和户外娱乐。' 
  },

  // BuildingUpload表单翻译
  'Name': { en: 'Name', zh: '名称' },
  'Building name': { en: 'Building name', zh: '建筑名称' },
  'Enter building description': { en: 'Enter building description', zh: '输入建筑描述' },
  'Enter building image URL (e.g., https://example.com/image.jpg)': { 
    en: 'Enter building image URL (e.g., https://example.com/image.jpg)', 
    zh: '输入建筑图片链接（例如：https://example.com/image.jpg）' 
  },
  'Select area': { en: 'Select area', zh: '选择区域' },
  'Select amenities': { en: 'Select amenities', zh: '选择设施' },
  'Select pet policy': { en: 'Select pet policy', zh: '选择宠物政策' },
  '+1 (555) 123-4567': { en: '+1 (555) 123-4567', zh: '+1 (555) 123-4567' },
  'leasing@example.com': { en: 'leasing@example.com', zh: 'leasing@example.com' },
  'https://calendly.com/your-event': { en: 'https://calendly.com/your-event', zh: 'https://calendly.com/your-event' },
  'Min Rent ($)': { en: 'Min Rent ($)', zh: '最低租金 ($)' },
  'Max Rent ($)': { en: 'Max Rent ($)', zh: '最高租金 ($)' },
  'Parking Available': { en: 'Parking Available', zh: '停车位可用' },
  'Featured Building': { en: 'Featured Building', zh: '精选建筑' },

  // Common form actions
  'Update': { en: 'Update', zh: '更新' },
  'Create': { en: 'Create', zh: '创建' },
  'Update Area': { en: 'Update Area', zh: '更新区域' },
  'Create Area': { en: 'Create Area', zh: '创建区域' },
  
  // Admin Dashboard translations
  'Manage your building listings and system data': { en: 'Manage your building listings and system data', zh: '管理您的建筑列表和系统数据' },
  'Loading dashboard data...': { en: 'Loading dashboard data...', zh: '加载仪表板数据...' },
  'buildings': { en: 'Buildings', zh: '建筑' },
  'Total Areas': { en: 'Total Areas', zh: '总区域数' },
  'Active Buildings': { en: 'Active Buildings', zh: '活跃建筑' },
  'Quick Actions': { en: 'Quick Actions', zh: '快速操作' },
  'Add Building': { en: 'Add Building', zh: '添加建筑' },
  'Create a new building listing': { en: 'Create a new building listing', zh: '创建新的建筑列表' },
  'Manage Buildings': { en: 'Manage Buildings', zh: '管理建筑' },
  'View and edit existing buildings': { en: 'View and edit existing buildings', zh: '查看和编辑现有建筑' },
  'Manage Areas': { en: 'Manage Areas', zh: '管理区域' },
  'View and edit NYC neighborhood areas': { en: 'View and edit NYC neighborhood areas', zh: '查看和编辑纽约社区区域' },
  'Manage Users': { en: 'Manage Users', zh: '管理用户' },
  'View and manage user accounts': { en: 'View and manage user accounts', zh: '查看和管理用户账户' },
  'Recent Buildings': { en: 'Recent Buildings', zh: '最近建筑' },
  'View All Buildings': { en: 'View All Buildings', zh: '查看所有建筑' },
  'Terms & Conditions': { en: 'Terms & Conditions', zh: '条款和条件' },
  'Already have an account?': { en: 'Already have an account?', zh: '已有账户？' },
  
  // Flash通知文本
  'application_submitted_title': { en: 'Application Submitted Successfully!', zh: '申请提交成功！' },
  'application_submitted_subtitle': { en: "We'll review your application within 1-2 business days and notify you via email.", zh: '我们将在1-2个工作日内审核您的申请并通过邮件通知您。' },
  'email_verified_success': { en: 'Email verified successfully, please sign in', zh: '邮箱验证成功，请登录' },
  'email_verification_failed': { en: 'Email verification failed', zh: '邮箱验证失败' },
  'registration_success': { en: 'Registration successful, please check your email and click the verification link', zh: '注册成功，请查看邮箱并点击验证链接完成注册' },
  'check_email_message': { en: 'Please check your email and click the verification link to complete registration', zh: '请查看您的邮箱，点击验证链接完成注册' },
  
  // 建筑相关翻译
  'Modern Apartment': { en: 'Modern Apartment', zh: '现代公寓' },
  'luxury': { en: 'Luxury', zh: '豪华' },
  'affordable': { en: 'Affordable', zh: '经济实惠' },
  'studio': { en: 'Studio', zh: '单间公寓' },
  'one_bedroom': { en: '1 Bedroom', zh: '一室' },
  'two_bedroom': { en: '2 Bedroom', zh: '两室' },
  'three_bedroom': { en: '3 Bedroom', zh: '三室' },
  
  // 用户类型翻译
  'tenant': { en: 'Tenant', zh: '租客' },
  'landlord': { en: 'Landlord', zh: '房东' },
  'name': { en: 'Name', zh: '姓名' },
  
  // Admin相关翻译
  'admin': { en: 'Admin', zh: '管理员' },
  'dashboard': { en: 'Dashboard', zh: '仪表板' },
  'Admin Dashboard': { en: 'Admin Dashboard', zh: '管理员仪表板' },
  'Users': { en: 'Users', zh: '用户' },
  'manage': { en: 'Manage', zh: '管理' },
  'upload': { en: 'Upload', zh: '上传' },
  'create': { en: 'Create', zh: '创建' },
  'update': { en: 'Update', zh: '更新' },
  'status': { en: 'Status', zh: '状态' },
  'active': { en: 'Active', zh: '激活' },
  'inactive': { en: 'Inactive', zh: '未激活' },
  'featured': { en: 'Featured', zh: '推荐' },
  
  // 分页相关
  'Total': { en: 'Total', zh: '总计' },
  'items': { en: 'items', zh: '条' },

  // Amenity Management
  'amenities': { en: 'Amenities', zh: '设施' },
  'search_amenities': { en: 'Search amenities...', zh: '搜索设施...' },
  'Add Amenity': { en: 'Add Amenity', zh: '添加设施' },
  'Edit Amenity': { en: 'Edit Amenity', zh: '编辑设施' },
  'Amenity Name': { en: 'Amenity Name', zh: '设施名称' },
  'Area': { en: 'Area', zh: '区域' },
  'Name': { en: 'Name', zh: '名称' },
  'Image': { en: 'Image', zh: '图片' },
  'Actions': { en: 'Actions', zh: '操作' },
  'Select area': { en: 'Select area', zh: '选择区域' },
  'Enter amenity name': { en: 'Enter amenity name', zh: '输入设施名称' },
  'Enter image URL': { en: 'Enter image URL', zh: '输入图片链接' },
  'Please select an area': { en: 'Please select an area', zh: '请选择区域' },
  'Please enter amenity name': { en: 'Please enter amenity name', zh: '请输入设施名称' },
  'Confirm Deletion': { en: 'Confirm Deletion', zh: '确认删除' },
  'Are you sure you want to delete this amenity? This action cannot be undone.': { en: 'Are you sure you want to delete this amenity? This action cannot be undone.', zh: '您确定要删除此设施吗？此操作无法撤消。' },
  'Delete': { en: 'Delete', zh: '删除' },
  'Cancel': { en: 'Cancel', zh: '取消' },
  'Save': { en: 'Save', zh: '保存' },
  'Edit': { en: 'Edit', zh: '编辑' },
  'No Image': { en: 'No Image', zh: '无图片' },
  'Confirm Deletion': { en: 'Confirm Deletion', zh: '确认删除' },
  'Are you sure you want to delete this area? This action cannot be undone and will affect all associated buildings.': { en: 'Are you sure you want to delete this area? This action cannot be undone and will affect all associated buildings.', zh: '您确定要删除此区域吗？此操作无法撤消，并将影响所有相关建筑。' },
  'Are you sure you want to delete this building? This action cannot be undone.': { en: 'Are you sure you want to delete this building? This action cannot be undone.', zh: '您确定要删除此建筑吗？此操作无法撤消。' },

  // Transportation Management
  'Transportation': { en: 'Transportation', zh: '交通' },
  'search_transportation': { en: 'Search transportation...', zh: '搜索交通...' },
  'Add Transportation': { en: 'Add Transportation', zh: '添加交通' },
  'Edit Transportation': { en: 'Edit Transportation', zh: '编辑交通' },
  'Enter transportation name': { en: 'Enter transportation name', zh: '输入交通名称' },
  
  // Areas Management  
  'Areas': { en: 'Areas', zh: '区域' },
  'NYC Areas': { en: 'NYC Areas', zh: 'NYC 区域' },
  'search_areas': { en: 'Search areas...', zh: '搜索区域...' },
  'Import JSON': { en: 'Import JSON', zh: '导入 JSON' },
  'Add Area': { en: 'Add Area', zh: '添加区域' },
  'Borough': { en: 'Borough', zh: '行政区' },
  'City': { en: 'City', zh: '城市' },
  'Created': { en: 'Created', zh: '创建时间' },
  
  // User dropdown menu
  'Back to site': { en: 'Back to site', zh: '返回网站' },
  'profile': { en: 'Profile', zh: '个人资料' },
  
  // Buildings Management
  'buildings': { en: 'Buildings', zh: '建筑' },
  'Building Management': { en: 'Building Management', zh: '建筑管理' },
  'search_buildings': { en: 'Search buildings...', zh: '搜索建筑...' },
  'Add Building': { en: 'Add Building', zh: '添加建筑' },
  'Building Name': { en: 'Building Name', zh: '建筑名称' },
  'Category': { en: 'Category', zh: '类别' },
  'Rent Range': { en: 'Rent Range', zh: '租金范围' },
  'Status': { en: 'Status', zh: '状态' },
  'Featured': { en: 'Featured', zh: '推荐' },

  // Dashboard specific translations
  'Admin Dashboard': { en: 'Admin Dashboard', zh: '管理员仪表板' },
  'Manage your building listings and system data': { en: 'Manage your building listings and system data', zh: '管理您的房源列表和系统数据' },
  'Total Buildings': { en: 'Total Buildings', zh: '总房源数' },
  'Total Areas': { en: 'Total Areas', zh: '总区域数' },
  'Active Buildings': { en: 'Active Buildings', zh: '活跃房源' },
  'Total Users': { en: 'Total Users', zh: '总用户数' },
  'Active Users': { en: 'Active Users', zh: '活跃用户' },
  'Quick Actions': { en: 'Quick Actions', zh: '快速操作' },
  'Add Building': { en: 'Add Building', zh: '添加房源' },
  'Create a new building listing': { en: 'Create a new building listing', zh: '创建新的房源列表' },
  'Manage Buildings': { en: 'Manage Buildings', zh: '管理房源' },
  'View and edit existing buildings': { en: 'View and edit existing buildings', zh: '查看和编辑现有房源' },
  'Manage Areas': { en: 'Manage Areas', zh: '管理区域' },
  'View and edit NYC neighborhood areas': { en: 'View and edit NYC neighborhood areas', zh: '查看和编辑纽约社区区域' },
  'Recent Buildings': { en: 'Recent Buildings', zh: '最新房源' },
  'View All Buildings': { en: 'View All Buildings', zh: '查看所有房源' },
  'Created': { en: 'Created', zh: '创建时间' },

  // 常见设施翻译
  'pool': { en: 'Pool', zh: '游泳池' },
  'gym': { en: 'Gym', zh: '健身房' },
  'rooftop': { en: 'Rooftop', zh: '屋顶' },
  'concierge': { en: 'Concierge', zh: '门房服务' },
  'parking': { en: 'Parking', zh: '停车场' },
  'laundry': { en: 'Laundry', zh: '洗衣房' },
  'balcony': { en: 'Balcony', zh: '阳台' },
  'elevator': { en: 'Elevator', zh: '电梯' },
  'dishwasher': { en: 'Dishwasher', zh: '洗碗机' },
  'air_conditioning': { en: 'Air Conditioning', zh: '空调' },
  
  // 建筑标签翻译
  'Verified': { en: 'Verified', zh: '已验证' },
  'Student Accommodation': { en: 'Student Accommodation', zh: '学生宿舍' },
  'No Service Fee': { en: 'No Service Fee', zh: '无服务费' },
  'Pet Friendly': { en: 'Pet Friendly', zh: '允许宠物' },
  'Furnished': { en: 'Furnished', zh: '已装修' },
  'New Building': { en: 'New Building', zh: '新建筑' },
  
  // 区域相关翻译
  'Harrison': { en: 'Harrison', zh: '哈里森' },
  'Fort Lee': { en: 'Fort Lee', zh: '李堡' },
  'East Village': { en: 'East Village', zh: '东村' },
  'West Village': { en: 'West Village', zh: '西村' },
  'Hoboken': { en: 'Hoboken', zh: '霍博肯' },
  'Jersey City': { en: 'Jersey City', zh: '泽西城' },
  
  // NYC主要区域翻译
  'Greenpoint': { en: 'Greenpoint', zh: '绿点' },
  'Williamsburg': { en: 'Williamsburg', zh: '威廉斯堡' },
  'South Williamsburg': { en: 'South Williamsburg', zh: '南威廉斯堡' },
  'East Williamsburg': { en: 'East Williamsburg', zh: '东威廉斯堡' },
  'Brooklyn Heights': { en: 'Brooklyn Heights', zh: '布鲁克林高地' },
  'Downtown Brooklyn-DUMBO-Boerum Hill': { en: 'Downtown Brooklyn-DUMBO-Boerum Hill', zh: '布鲁克林市中心-DUMBO-博勒姆山' },
  'Fort Greene': { en: 'Fort Greene', zh: '格林堡' },
  'Clinton Hill': { en: 'Clinton Hill', zh: '克林顿山' },
  'Bedford-Stuyvesant (West)': { en: 'Bedford-Stuyvesant (West)', zh: '贝德福德-史岱文森（西）' },
  'Bedford-Stuyvesant (East)': { en: 'Bedford-Stuyvesant (East)', zh: '贝德福德-史岱文森（东）' },
  'Bushwick (West)': { en: 'Bushwick (West)', zh: '布什威克（西）' },
  'Bushwick (East)': { en: 'Bushwick (East)', zh: '布什威克（东）' },
  'Park Slope': { en: 'Park Slope', zh: '公园坡' },
  'Prospect Heights': { en: 'Prospect Heights', zh: '展望高地' },
  'Crown Heights (North)': { en: 'Crown Heights (North)', zh: '皇冠高地（北）' },
  'Crown Heights (South)': { en: 'Crown Heights (South)', zh: '皇冠高地（南）' },
  'Bay Ridge': { en: 'Bay Ridge', zh: '海湾岭' },
  'Bensonhurst': { en: 'Bensonhurst', zh: '本森赫斯特' },
  'Coney Island-Sea Gate': { en: 'Coney Island-Sea Gate', zh: '康尼岛-海门' },
  'Brighton Beach': { en: 'Brighton Beach', zh: '布莱顿海滩' },
  
  // Manhattan主要区域翻译
  'Tribeca-Civic Center': { en: 'Tribeca-Civic Center', zh: '翠贝卡-市政中心' },
  'SoHo-Little Italy-Hudson Square': { en: 'SoHo-Little Italy-Hudson Square', zh: 'SoHo-小意大利-哈德逊广场' },
  'Greenwich Village': { en: 'Greenwich Village', zh: '格林尼治村' },
  'Chinatown-Two Bridges': { en: 'Chinatown-Two Bridges', zh: '唐人街-双桥' },
  'Lower East Side': { en: 'Lower East Side', zh: '下东区' },
  'Chelsea-Hudson Yards': { en: 'Chelsea-Hudson Yards', zh: '切尔西-哈德逊广场' },
  "Hell's Kitchen": { en: "Hell's Kitchen", zh: '地狱厨房' },
  'Midtown South-Flatiron-Union Square': { en: 'Midtown South-Flatiron-Union Square', zh: '中城南-熨斗-联合广场' },
  'Midtown-Times Square': { en: 'Midtown-Times Square', zh: '中城-时代广场' },
  'Stuyvesant Town-Peter Cooper Village': { en: 'Stuyvesant Town-Peter Cooper Village', zh: '史岱文森镇-彼得库珀村' },
  'East Midtown-Turtle Bay': { en: 'East Midtown-Turtle Bay', zh: '东中城-海龟湾' },
  'Upper West Side-Lincoln Square': { en: 'Upper West Side-Lincoln Square', zh: '上西区-林肯广场' },
  'Upper West Side (Central)': { en: 'Upper West Side (Central)', zh: '上西区（中部）' },
  'Upper West Side-Manhattan Valley': { en: 'Upper West Side-Manhattan Valley', zh: '上西区-曼哈顿谷' },
  'Upper East Side-Lenox Hill-Roosevelt Island': { en: 'Upper East Side-Lenox Hill-Roosevelt Island', zh: '上东区-勒诺克斯山-罗斯福岛' },
  'Upper East Side-Carnegie Hill': { en: 'Upper East Side-Carnegie Hill', zh: '上东区-卡内基山' },
  'Upper East Side-Yorkville': { en: 'Upper East Side-Yorkville', zh: '上东区-约克维尔' },
  'Manhattanville-West Harlem': { en: 'Manhattanville-West Harlem', zh: '曼哈顿维尔-西哈莱姆' },
  'Harlem (South)': { en: 'Harlem (South)', zh: '哈莱姆（南）' },
  'Harlem (North)': { en: 'Harlem (North)', zh: '哈莱姆（北）' },
  'East Harlem (South)': { en: 'East Harlem (South)', zh: '东哈莱姆（南）' },
  'East Harlem (North)': { en: 'East Harlem (North)', zh: '东哈莱姆（北）' },
  
  // Queens主要区域翻译
  'Astoria (North)-Ditmars-Steinway': { en: 'Astoria (North)-Ditmars-Steinway', zh: '阿斯托利亚（北）-迪特马斯-斯坦威' },
  'Old Astoria-Hallets Point': { en: 'Old Astoria-Hallets Point', zh: '老阿斯托利亚-哈利茨角' },
  'Astoria (Central)': { en: 'Astoria (Central)', zh: '阿斯托利亚（中部）' },
  'Long Island City-Hunters Point': { en: 'Long Island City-Hunters Point', zh: '长岛市-猎人角' },
  'Jackson Heights': { en: 'Jackson Heights', zh: '杰克逊高地' },
  'Murray Hill-Broadway Flushing': { en: 'Murray Hill-Broadway Flushing', zh: '默里山-百老汇法拉盛' },
  'East Flushing': { en: 'East Flushing', zh: '东法拉盛' },

  // 完整的NYC 260个区域翻译 - 第一批 (A-C)
  'Allerton': { en: 'Allerton', zh: '阿勒顿' },
  'Alley Pond Park': { en: 'Alley Pond Park', zh: '胡同池塘公园' },
  'Annadale-Huguenot-Prince\'s Bay-Woodrow': { en: 'Annadale-Huguenot-Prince\'s Bay-Woodrow', zh: '安娜戴尔-雨格诺-王子湾-伍德罗' },
  'Arden Heights-Rossville': { en: 'Arden Heights-Rossville', zh: '阿登高地-罗斯维尔' },
  'Astoria (East)-Woodside (North)': { en: 'Astoria (East)-Woodside (North)', zh: '阿斯托利亚（东）-伍德赛德（北）' },
  'Astoria Park': { en: 'Astoria Park', zh: '阿斯托利亚公园' },
  'Auburndale': { en: 'Auburndale', zh: '奥本戴尔' },
  'Baisley Park': { en: 'Baisley Park', zh: '贝斯利公园' },
  'Barren Island-Floyd Bennett Field': { en: 'Barren Island-Floyd Bennett Field', zh: '荒岛-弗洛伊德贝内特机场' },
  'Bath Beach': { en: 'Bath Beach', zh: '巴斯海滩' },
  'Bayside': { en: 'Bayside', zh: '湾边' },
  'Bay Terrace-Clearview': { en: 'Bay Terrace-Clearview', zh: '湾台-清景' },
  'Bedford Park': { en: 'Bedford Park', zh: '贝德福德公园' },
  'Bellerose': { en: 'Bellerose', zh: '美玫瑰' },
  'Belmont': { en: 'Belmont', zh: '贝尔蒙特' },
  'Borough Park': { en: 'Borough Park', zh: '区公园' },
  'Breezy Point-Belle Harbor-Rockaway Park-Broad Channel': { en: 'Breezy Point-Belle Harbor-Rockaway Park-Broad Channel', zh: '微风角-美港-洛克威公园-宽海峡' },
  'Bronx Park': { en: 'Bronx Park', zh: '布朗克斯公园' },
  'Brooklyn Navy Yard': { en: 'Brooklyn Navy Yard', zh: '布鲁克林海军船厂' },
  'Brownsville': { en: 'Brownsville', zh: '布朗斯维尔' },
  'Calvary & Mount Zion Cemeteries': { en: 'Calvary & Mount Zion Cemeteries', zh: '加尔瓦里与锡安山公墓' },
  'Calvert Vaux Park': { en: 'Calvert Vaux Park', zh: '卡尔弗特沃克斯公园' },
  'Cambria Heights': { en: 'Cambria Heights', zh: '坎布里亚高地' },
  'Canarsie': { en: 'Canarsie', zh: '卡纳西' },
  'Canarsie Park & Pier': { en: 'Canarsie Park & Pier', zh: '卡纳西公园码头' },
  'Castle Hill-Unionport': { en: 'Castle Hill-Unionport', zh: '城堡山-联合港' },
  'Central Park': { en: 'Central Park', zh: '中央公园' },
  'Claremont Park': { en: 'Claremont Park', zh: '克莱蒙特公园' },
  'College Point': { en: 'College Point', zh: '学院角' },

  // 第二批 (C-F)
  'Co-op City': { en: 'Co-op City', zh: '合作城' },
  'Corona': { en: 'Corona', zh: '科罗娜' },
  'Crotona Park': { en: 'Crotona Park', zh: '克罗托纳公园' },
  'Crotona Park East': { en: 'Crotona Park East', zh: '东克罗托纳公园' },
  'Cunningham Park': { en: 'Cunningham Park', zh: '坎宁安公园' },
  'Douglaston-Little Neck': { en: 'Douglaston-Little Neck', zh: '道格拉斯顿-小颈' },
  'Dyker Beach Park': { en: 'Dyker Beach Park', zh: '戴克海滩公园' },
  'Dyker Heights': { en: 'Dyker Heights', zh: '戴克高地' },
  'Eastchester-Edenwald-Baychester': { en: 'Eastchester-Edenwald-Baychester', zh: '东切斯特-伊登沃德-贝切斯特' },
  'East Elmhurst': { en: 'East Elmhurst', zh: '东榆树赫斯特' },
  'East Flatbush-Erasmus': { en: 'East Flatbush-Erasmus', zh: '东扁布什-伊拉斯谟' },
  'East Flatbush-Farragut': { en: 'East Flatbush-Farragut', zh: '东扁布什-法拉格特' },
  'East Flatbush-Remsen Village': { en: 'East Flatbush-Remsen Village', zh: '东扁布什-伦森村' },
  'East Flatbush-Rugby': { en: 'East Flatbush-Rugby', zh: '东扁布什-橄榄球' },
  'East New York-City Line': { en: 'East New York-City Line', zh: '东纽约-市界' },
  'East New York-New Lots': { en: 'East New York-New Lots', zh: '东纽约-新地段' },
  'East New York (North)': { en: 'East New York (North)', zh: '东纽约（北）' },
  'Elmhurst': { en: 'Elmhurst', zh: '榆树赫斯特' },
  'Far Rockaway-Bayswater': { en: 'Far Rockaway-Bayswater', zh: '远洛克威-海湾水' },
  'Ferry Point Park-St. Raymond Cemetery': { en: 'Ferry Point Park-St. Raymond Cemetery', zh: '渡口公园-圣雷蒙德公墓' },
  'Financial District-Battery Park City': { en: 'Financial District-Battery Park City', zh: '金融区-炮台公园城' },
  'Flatbush': { en: 'Flatbush', zh: '扁布什' },
  'Flatbush (West)-Ditmas Park-Parkville': { en: 'Flatbush (West)-Ditmas Park-Parkville', zh: '扁布什（西）-迪特马斯公园-帕克维尔' },
  'Flatlands': { en: 'Flatlands', zh: '平地' },
  'Flushing Meadows-Corona Park': { en: 'Flushing Meadows-Corona Park', zh: '法拉盛草原-科罗娜公园' },
  'Flushing-Willets Point': { en: 'Flushing-Willets Point', zh: '法拉盛-威利茨角' },
  'Fordham Heights': { en: 'Fordham Heights', zh: '福德汉姆高地' },
  'Forest Hills': { en: 'Forest Hills', zh: '森林山' },
  'Forest Park': { en: 'Forest Park', zh: '森林公园' },
  'Fort Hamilton': { en: 'Fort Hamilton', zh: '汉密尔顿堡' },
  'Fort Totten': { en: 'Fort Totten', zh: '托滕堡' },
  'Fort Wadsworth': { en: 'Fort Wadsworth', zh: '沃兹沃思堡' },
  'Freshkills Park (North)': { en: 'Freshkills Park (North)', zh: '鲜杀公园（北）' },
  'Freshkills Park (South)': { en: 'Freshkills Park (South)', zh: '鲜杀公园（南）' },
  'Fresh Meadows-Utopia': { en: 'Fresh Meadows-Utopia', zh: '新鲜草原-乌托邦' },

  // 第三批 (G-M)
  'Glendale': { en: 'Glendale', zh: '格伦代尔' },
  'Glen Oaks-Floral Park-New Hyde Park': { en: 'Glen Oaks-Floral Park-New Hyde Park', zh: '格伦橡树-花卉公园-新海德公园' },
  'Gramercy': { en: 'Gramercy', zh: '格拉梅西' },
  'Grasmere-Arrochar-South Beach-Dongan Hills': { en: 'Grasmere-Arrochar-South Beach-Dongan Hills', zh: '格拉斯米尔-阿罗查-南海滩-董甘山' },
  'Great Kills-Eltingville': { en: 'Great Kills-Eltingville', zh: '大杀-艾尔廷维尔' },
  'Great Kills Park': { en: 'Great Kills Park', zh: '大杀公园' },
  'Hamilton Heights-Sugar Hill': { en: 'Hamilton Heights-Sugar Hill', zh: '汉密尔顿高地-糖山' },
  'Hart Island': { en: 'Hart Island', zh: '哈特岛' },
  'Highbridge': { en: 'Highbridge', zh: '高桥' },
  'Highbridge Park': { en: 'Highbridge Park', zh: '高桥公园' },
  'Highland Park-Cypress Hills Cemeteries (North)': { en: 'Highland Park-Cypress Hills Cemeteries (North)', zh: '高地公园-柏树山公墓（北）' },
  'Hoffman & Swinburne Islands': { en: 'Hoffman & Swinburne Islands', zh: '霍夫曼与斯温伯恩岛' },
  'Hollis': { en: 'Hollis', zh: '霍利斯' },
  'Holy Cross Cemetery': { en: 'Holy Cross Cemetery', zh: '圣十字公墓' },
  'Howard Beach-Lindenwood': { en: 'Howard Beach-Lindenwood', zh: '霍华德海滩-林登伍德' },
  'Hunts Point': { en: 'Hunts Point', zh: '亨茨角' },
  'Hutchinson Metro Center': { en: 'Hutchinson Metro Center', zh: '哈钦森地铁中心' },
  'Inwood': { en: 'Inwood', zh: '因伍德' },
  'Inwood Hill Park': { en: 'Inwood Hill Park', zh: '因伍德山公园' },
  'Jacob Riis Park-Fort Tilden-Breezy Point Tip': { en: 'Jacob Riis Park-Fort Tilden-Breezy Point Tip', zh: '雅各布里斯公园-蒂尔登堡-微风角尖' },
  'Jamaica': { en: 'Jamaica', zh: '牙买加' },
  'Jamaica Bay (East)': { en: 'Jamaica Bay (East)', zh: '牙买加湾（东）' },
  'Jamaica Bay (West)': { en: 'Jamaica Bay (West)', zh: '牙买加湾（西）' },
  'Jamaica Estates-Holliswood': { en: 'Jamaica Estates-Holliswood', zh: '牙买加庄园-霍利斯伍德' },
  'Jamaica Hills-Briarwood': { en: 'Jamaica Hills-Briarwood', zh: '牙买加山-布赖尔伍德' },
  'John F. Kennedy International Airport': { en: 'John F. Kennedy International Airport', zh: '约翰肯尼迪国际机场' },
  'Kew Gardens': { en: 'Kew Gardens', zh: '邱园' },
  'Kew Gardens Hills': { en: 'Kew Gardens Hills', zh: '邱园山' },
  'Kissena Park': { en: 'Kissena Park', zh: '基塞纳公园' },
  'LaGuardia Airport': { en: 'LaGuardia Airport', zh: '拉瓜迪亚机场' },
  'Laurelton': { en: 'Laurelton', zh: '劳雷尔顿' },
  'Longwood': { en: 'Longwood', zh: '长伍德' },
  'Madison': { en: 'Madison', zh: '麦迪逊' },
  'Marine Park-Mill Basin-Bergen Beach': { en: 'Marine Park-Mill Basin-Bergen Beach', zh: '海洋公园-磨坊盆地-卑尔根海滩' },
  'Marine Park-Plumb Island': { en: 'Marine Park-Plumb Island', zh: '海洋公园-铅岛' },
  'Mariner\'s Harbor-Arlington-Graniteville': { en: 'Mariner\'s Harbor-Arlington-Graniteville', zh: '水手港-阿灵顿-花岗岩维尔' },
  'Maspeth': { en: 'Maspeth', zh: '马斯佩思' },
  'McGuire Fields': { en: 'McGuire Fields', zh: '麦奎尔球场' },
  'Melrose': { en: 'Melrose', zh: '梅尔罗斯' },
  'Middle Village': { en: 'Middle Village', zh: '中村' },
  'Middle Village Cemetery': { en: 'Middle Village Cemetery', zh: '中村公墓' },
  'Midwood': { en: 'Midwood', zh: '中伍德' },
  'Miller Field': { en: 'Miller Field', zh: '米勒球场' },
  'Montefiore Cemetery': { en: 'Montefiore Cemetery', zh: '蒙特菲奥里公墓' },
  'Morningside Heights': { en: 'Morningside Heights', zh: '晨边高地' },
  'Morrisania': { en: 'Morrisania', zh: '莫里萨尼亚' },
  'Morris Park': { en: 'Morris Park', zh: '莫里斯公园' },
  'Mott Haven-Port Morris': { en: 'Mott Haven-Port Morris', zh: '莫特港-港口莫里斯' },
  'Mount Eden-Claremont (West)': { en: 'Mount Eden-Claremont (West)', zh: '伊甸山-克莱蒙特（西）' },
  'Mount Hebron & Cedar Grove Cemeteries': { en: 'Mount Hebron & Cedar Grove Cemeteries', zh: '希伯伦山与雪松林公墓' },
  'Mount Hope': { en: 'Mount Hope', zh: '希望山' },
  'Mount Olivet & All Faiths Cemeteries': { en: 'Mount Olivet & All Faiths Cemeteries', zh: '橄榄山与万信公墓' },

  // 第四批 (N-Z)
  'New Dorp-Midland Beach': { en: 'New Dorp-Midland Beach', zh: '新多普-中陆海滩' },
  'New Springville-Willowbrook-Bulls Head-Travis': { en: 'New Springville-Willowbrook-Bulls Head-Travis', zh: '新斯普林维尔-柳溪-牛头-特拉维斯' },
  'North Corona': { en: 'North Corona', zh: '北科罗娜' },
  'North & South Brother Islands': { en: 'North & South Brother Islands', zh: '南北兄弟岛' },
  'Norwood': { en: 'Norwood', zh: '诺伍德' },
  'Oakland Gardens-Hollis Hills': { en: 'Oakland Gardens-Hollis Hills', zh: '奥克兰花园-霍利斯山' },
  'Oakwood-Richmondtown': { en: 'Oakwood-Richmondtown', zh: '橡木-里士满镇' },
  'Ocean Hill': { en: 'Ocean Hill', zh: '海洋山' },
  'Old Astoria-Hallets Point': { en: 'Old Astoria-Hallets Point', zh: '老阿斯托利亚-哈利茨角' },
  'Ozone Park': { en: 'Ozone Park', zh: '臭氧公园' },
  'Ozone Park (North)': { en: 'Ozone Park (North)', zh: '臭氧公园（北）' },
  'Parkchester': { en: 'Parkchester', zh: '公园切斯特' },
  'Pelham Bay-Country Club-City Island': { en: 'Pelham Bay-Country Club-City Island', zh: '佩勒姆湾-乡村俱乐部-城市岛' },
  'Pelham Bay Park': { en: 'Pelham Bay Park', zh: '佩勒姆湾公园' },
  'Pelham Gardens': { en: 'Pelham Gardens', zh: '佩勒姆花园' },
  'Pelham Parkway-Van Nest': { en: 'Pelham Parkway-Van Nest', zh: '佩勒姆公园路-范内斯特' },
  'Pomonok-Electchester-Hillcrest': { en: 'Pomonok-Electchester-Hillcrest', zh: '波莫诺克-电切斯特-山脊' },
  'Port Richmond': { en: 'Port Richmond', zh: '里士满港' },
  'Prospect Park': { en: 'Prospect Park', zh: '展望公园' },
  'Queensboro Hill': { en: 'Queensboro Hill', zh: '皇后区山' },
  'Queens Village': { en: 'Queens Village', zh: '皇后村' },
  'Randall\'s Island': { en: 'Randall\'s Island', zh: '兰德尔岛' },
  'Rego Park': { en: 'Rego Park', zh: '雷戈公园' },
  'Richmond Hill': { en: 'Richmond Hill', zh: '里士满山' },
  'Ridgewood': { en: 'Ridgewood', zh: '岭木' },
  'Rikers Island': { en: 'Rikers Island', zh: '赖克斯岛' },
  'Riverdale-Spuyten Duyvil': { en: 'Riverdale-Spuyten Duyvil', zh: '河谷-斯普伊滕杜伊维尔' },
  'Rockaway Beach-Arverne-Edgemere': { en: 'Rockaway Beach-Arverne-Edgemere', zh: '洛克威海滩-阿文-埃奇米尔' },
  'Rockaway Community Park': { en: 'Rockaway Community Park', zh: '洛克威社区公园' },
  'Rosebank-Shore Acres-Park Hill': { en: 'Rosebank-Shore Acres-Park Hill', zh: '玫瑰银行-海岸英亩-公园山' },
  'Rosedale': { en: 'Rosedale', zh: '玫瑰谷' },
  'Sheepshead Bay-Manhattan Beach-Gerritsen Beach': { en: 'Sheepshead Bay-Manhattan Beach-Gerritsen Beach', zh: '羊头湾-曼哈顿海滩-格里森海滩' },
  'Shirley Chisholm State Park': { en: 'Shirley Chisholm State Park', zh: '雪莉奇泽姆州立公园' },
  'Snug Harbor': { en: 'Snug Harbor', zh: '舒适港' },
  'Soundview-Bruckner-Bronx River': { en: 'Soundview-Bruckner-Bronx River', zh: '声景-布鲁克纳-布朗克斯河' },
  'Soundview-Clason Point': { en: 'Soundview-Clason Point', zh: '声景-克拉森角' },
  'Soundview Park': { en: 'Soundview Park', zh: '声景公园' },
  'South Jamaica': { en: 'South Jamaica', zh: '南牙买加' },
  'South Ozone Park': { en: 'South Ozone Park', zh: '南臭氧公园' },
  'South Richmond Hill': { en: 'South Richmond Hill', zh: '南里士满山' },
  'Spring Creek Park': { en: 'Spring Creek Park', zh: '春溪公园' },
  'Springfield Gardens (North)-Rochdale Village': { en: 'Springfield Gardens (North)-Rochdale Village', zh: '斯普林菲尔德花园（北）-罗奇代尔村' },
  'Springfield Gardens (South)-Brookville': { en: 'Springfield Gardens (South)-Brookville', zh: '斯普林菲尔德花园（南）-布鲁克维尔' },
  'St. Albans': { en: 'St. Albans', zh: '圣奥尔本斯' },
  'St. George-New Brighton': { en: 'St. George-New Brighton', zh: '圣乔治-新布莱顿' },
  'St. John Cemetery': { en: 'St. John Cemetery', zh: '圣约翰公墓' },
  'St. Michael\'s Cemetery': { en: 'St. Michael\'s Cemetery', zh: '圣迈克尔公墓' },
  'Sunnyside': { en: 'Sunnyside', zh: '阳边' },
  'Sunnyside Yards (North)': { en: 'Sunnyside Yards (North)', zh: '阳边货场（北）' },
  'Sunnyside Yards (South)': { en: 'Sunnyside Yards (South)', zh: '阳边货场（南）' },
  'The Battery-Governors Island-Ellis Island-Liberty Island': { en: 'The Battery-Governors Island-Ellis Island-Liberty Island', zh: '炮台-总督岛-埃利斯岛-自由岛' },
  'The Evergreens Cemetery': { en: 'The Evergreens Cemetery', zh: '常青公墓' },
  'Throgs Neck-Schuylerville': { en: 'Throgs Neck-Schuylerville', zh: '斯罗格斯颈-舒勒维尔' },
  'Todt Hill-Emerson Hill-Lighthouse Hill-Manor Heights': { en: 'Todt Hill-Emerson Hill-Lighthouse Hill-Manor Heights', zh: '托德山-爱默生山-灯塔山-庄园高地' },
  'Tompkinsville-Stapleton-Clifton-Fox Hills': { en: 'Tompkinsville-Stapleton-Clifton-Fox Hills', zh: '汤普金斯维尔-斯台普顿-克利夫顿-狐狸山' },
  'Tottenville-Charleston': { en: 'Tottenville-Charleston', zh: '托滕维尔-查尔斯顿' },
  'Tremont': { en: 'Tremont', zh: '特里蒙特' },
  'United Nations': { en: 'United Nations', zh: '联合国' },
  'University Heights (North)-Fordham': { en: 'University Heights (North)-Fordham', zh: '大学高地（北）-福德汉姆' },
  'University Heights (South)-Morris Heights': { en: 'University Heights (South)-Morris Heights', zh: '大学高地（南）-莫里斯高地' },
  'Van Cortlandt Park': { en: 'Van Cortlandt Park', zh: '范科特兰公园' },
  'Wakefield-Woodlawn': { en: 'Wakefield-Woodlawn', zh: '韦克菲尔德-伍德朗' },
  'Washington Heights (North)': { en: 'Washington Heights (North)', zh: '华盛顿高地（北）' },
  'Washington Heights (South)': { en: 'Washington Heights (South)', zh: '华盛顿高地（南）' },
  'Westchester Square': { en: 'Westchester Square', zh: '韦斯切斯特广场' },
  'Westerleigh-Castleton Corners': { en: 'Westerleigh-Castleton Corners', zh: '韦斯特利-卡斯尔顿角' },
  'West Farms': { en: 'West Farms', zh: '西农场' },
  'West New Brighton-Silver Lake-Grymes Hill': { en: 'West New Brighton-Silver Lake-Grymes Hill', zh: '西新布莱顿-银湖-格赖姆斯山' },
  'Whitestone-Beechhurst': { en: 'Whitestone-Beechhurst', zh: '白石-海滩赫斯特' },
  'Williamsbridge-Olinville': { en: 'Williamsbridge-Olinville', zh: '威廉斯桥-奥林维尔' },
  'Windsor Terrace-South Slope': { en: 'Windsor Terrace-South Slope', zh: '温莎台-南坡' },
  'Woodhaven': { en: 'Woodhaven', zh: '伍德港' },
  'Woodlawn Cemetery': { en: 'Woodlawn Cemetery', zh: '伍德朗公墓' },
  'Woodside': { en: 'Woodside', zh: '伍德赛德' },
  'Yankee Stadium-Macombs Dam Park': { en: 'Yankee Stadium-Macombs Dam Park', zh: '洋基球场-马库姆大坝公园' },

  // HomePage 主页翻译
  'Moving Made Easy': { en: 'Moving Made Easy', zh: '搬家变得简单' },
  'Find your perfect home near the best universities & cities in the world': { 
    en: 'Find your perfect home near the best universities & cities in the world', 
    zh: '在世界顶尖大学和城市附近找到完美家园' 
  },
  'Find Your Ideal Neighborhood': { en: 'Find Your Ideal Neighborhood', zh: '找到您理想的社区' },
  'Explore diverse neighborhoods with unique character and amenities': { 
    en: 'Explore diverse neighborhoods with unique character and amenities', 
    zh: '探索具有独特特色和设施的多样化社区' 
  },
  'Explore on Map': { en: 'Explore on Map', zh: '在地图上探索' },
  'Search More': { en: 'Search More', zh: '搜索更多' },
  'Find Properties in These Cities': { en: 'Find Properties in These Cities', zh: '在这些城市寻找房源' },
  'Discover amazing properties in top cities worldwide': { 
    en: 'Discover amazing properties in top cities worldwide', 
    zh: '发现全球顶级城市的优质房源' 
  },

  // OpenStreetMap 地图组件翻译
  '平均租金': { en: 'Average Rent', zh: '平均租金' },
  '月': { en: 'month', zh: '月' },
  '范围': { en: 'Range', zh: '范围' },
  '步行指数': { en: 'Walk Score', zh: '步行指数' },
  '距离': { en: 'Distance', zh: '距离' },
  '热门搜索': { en: 'Popular Searches', zh: '热门搜索' },
  'School': { en: 'School', zh: '学校' },
  'City': { en: 'City', zh: '城市' },
  
  // 错误处理翻译
  'undefined': { en: 'Unknown', zh: '未知' },
  'null': { en: 'Unknown', zh: '未知' },
  'Unknown': { en: 'Unknown', zh: '未知' },
  
  // 地图标签翻译
  'affordable': { en: 'Affordable', zh: '经济实惠' },
  'family-friendly': { en: 'Family Friendly', zh: '适合家庭' },
  'trendy': { en: 'Trendy & Popular', zh: '时尚热门' },
  'diverse': { en: 'Diverse Community', zh: '多元社区' },
  'young-professional': { en: 'Young Professional', zh: '年轻专业人士' },
  'walkable': { en: 'Walkable', zh: '步行友好' },
  'quiet': { en: 'Quiet', zh: '安静' },
  'transit': { en: 'Transit', zh: '交通便利' },
  'residential': { en: 'Residential', zh: '住宅区' },
  'nightlife': { en: 'Nightlife', zh: '夜生活' },
  'shopping': { en: 'Shopping', zh: '购物' },
  'dining': { en: 'Dining', zh: '餐饮' },
  'arts': { en: 'Arts', zh: '艺术' },
  'parks': { en: 'Parks', zh: '公园' },
  'diverse': { en: 'Diverse', zh: '多元化' },
  'student-friendly': { en: 'Student Friendly', zh: '学生友好' },
  'university-area': { en: 'University Area', zh: '大学区' },
  'pet-friendly': { en: 'Pet Friendly', zh: '宠物友好' },
  'luxury': { en: 'Luxury', zh: '豪华' },
  'waterfront': { en: 'Waterfront', zh: '海滨' },
  'Waterfront': { en: 'Waterfront', zh: '海滨' },
  'Residential': { en: 'Residential', zh: '住宅区' },
  'Community': { en: 'Community', zh: '社区' },
  
  // Tab标签的具体翻译 - formatTagLabel方法生成的标签
  'Affordable': { en: 'Affordable', zh: '经济实惠' },
  'Diverse Community': { en: 'Diverse Community', zh: '多元社区' },  
  'Family Friendly': { en: 'Family Friendly', zh: '适合家庭' },
  'Trendy & Popular': { en: 'Trendy & Popular', zh: '时尚热门' },
  'Quiet & Peaceful': { en: 'Quiet & Peaceful', zh: '安静祥和' },
  'Best for Students': { en: 'Best for Students', zh: '学生首选' },
  'University Area': { en: 'University Area', zh: '大学区' },
  'Residential': { en: 'Residential', zh: '住宅区' },
  'Great Transit': { en: 'Great Transit', zh: '交通便利' },
  'Nightlife': { en: 'Nightlife', zh: '夜生活' },
  'Arts & Culture': { en: 'Arts & Culture', zh: '艺术文化' },
  'Great Dining': { en: 'Great Dining', zh: '美食天堂' },
  'Shopping': { en: 'Shopping', zh: '购物' },
  'Walkable': { en: 'Walkable', zh: '步行友好' },
  'Safe': { en: 'Safe', zh: '安全' },
  'Parks & Recreation': { en: 'Parks & Recreation', zh: '公园休闲' },
  'Historic': { en: 'Historic', zh: '历史' },
  'Young Professional': { en: 'Young Professional', zh: '年轻专业人士' },
  'Great neighborhood with quality residential buildings and local amenities.': { 
    en: 'Great neighborhood with quality residential buildings and local amenities.', 
    zh: '优质社区，拥有高品质住宅建筑和本地便民设施。' 
  },
  
  // 常见区域描述翻译
  'Peaceful residential area': { en: 'Peaceful residential area', zh: '安静的住宅区' },
  'Vibrant bars & restaurants': { en: 'Vibrant bars & restaurants', zh: '充满活力的酒吧和餐厅' },
  'Commercial hub district': { en: 'Commercial hub district', zh: '商业中心区' },
  'Diverse culinary scene': { en: 'Diverse culinary scene', zh: '多元化美食场所' },
  'Cultural & creative district': { en: 'Cultural & creative district', zh: '文化创意区' },
  'Green spaces & nature': { en: 'Green spaces & nature', zh: '绿地和自然环境' },
  'Well-rounded community': { en: 'Well-rounded community', zh: '全面发展的社区' },
  'Great neighborhood': { en: 'Great neighborhood', zh: '优秀社区' },
  '区域位于': { en: ' area in ', zh: '区域位于' },
  
  // 具体区域描述
  'Upper East Side-Yorkville area in Manhattan': { 
    en: 'Upper East Side-Yorkville area in Manhattan', 
    zh: 'Upper East Side-Yorkville区域位于Manhattan' 
  },
  'A growing waterfront community with modern apartments and convenient NYC access': {
    en: 'A growing waterfront community with modern apartments and convenient NYC access',
    zh: '一个发展中的滨水社区，拥有现代化公寓和便捷的纽约市交通'
  },
  'Historic neighborhood with tree-lined streets and local charm': {
    en: 'Historic neighborhood with tree-lined streets and local charm',
    zh: '历史悠久的街区，绿树成荫的街道充满当地魅力'
  },
  'Vibrant area with excellent dining and shopping options': {
    en: 'Vibrant area with excellent dining and shopping options',
    zh: '充满活力的区域，拥有优秀的餐饮和购物选择'
  },
  'Family-friendly community with parks and good schools': {
    en: 'Family-friendly community with parks and good schools',
    zh: '适合家庭的社区，拥有公园和优质学校'
  },
  'Trendy neighborhood popular with young professionals': {
    en: 'Trendy neighborhood popular with young professionals',
    zh: '深受年轻专业人士喜爱的时尚街区'
  },
  
  // 城市名翻译（主要纽约五区）
  'Manhattan': { en: 'Manhattan', zh: '曼哈顿' },
  'Brooklyn': { en: 'Brooklyn', zh: '布鲁克林' },
  'Queens': { en: 'Queens', zh: '皇后区' },
  'Bronx': { en: 'Bronx', zh: '布朗克斯' },
  'Staten Island': { en: 'Staten Island', zh: '史坦顿岛' },
  'Jersey City': { en: 'Jersey City', zh: '泽西城' },
  'Hoboken': { en: 'Hoboken', zh: '霍博肯' },
  'Long Island City': { en: 'Long Island City', zh: '长岛市' },
  'Williamsburg': { en: 'Williamsburg', zh: '威廉斯堡' },
  'Astoria': { en: 'Astoria', zh: '阿斯托利亚' },
  
  // 大学名翻译
  'Columbia University': { en: 'Columbia University', zh: '哥伦比亚大学' },
  'New York University': { en: 'New York University', zh: '纽约大学' },
  'Fordham University': { en: 'Fordham University', zh: '福特汉姆大学' },
  'Pace University': { en: 'Pace University', zh: '佩斯大学' },
  'Stevens Institute of Technology': { en: 'Stevens Institute of Technology', zh: '史蒂文斯理工学院' },
  'The New School': { en: 'The New School', zh: '新学院' },
  'CUNY Hunter College': { en: 'CUNY Hunter College', zh: '纽约市立大学亨特学院' },
  'CUNY Baruch College': { en: 'CUNY Baruch College', zh: '纽约市立大学巴鲁克学院' },
  'Pratt Institute': { en: 'Pratt Institute', zh: '普拉特学院' },
  'Brooklyn College': { en: 'Brooklyn College', zh: '布鲁克林学院' },
  "St. John's University": { en: "St. John's University", zh: '圣约翰大学' },
  'New Jersey Institute of Technology': { en: 'New Jersey Institute of Technology', zh: '新泽西理工学院' },

  // Popular search keywords from recommendationsData.js
  'near subway': { en: 'Near Subway', zh: '地铁附近' },
  'pet friendly': { en: 'Pet Friendly', zh: '允许宠物' },
  'short term': { en: 'Short Term', zh: '短租' },
  'one bedroom': { en: 'One Bedroom', zh: '一居室' },
  'two bedroom': { en: 'Two Bedroom', zh: '两居室' },
  'bills included': { en: 'Bills Included', zh: '包水电' },

  // Map popup related translations
  '未知社区': { en: 'Unknown Community', zh: '未知社区' },
  '这是一个': { en: 'This is a ', zh: '这是一个' },
  '，包含多种类型的建筑和设施。': { en: ' area with various types of buildings and facilities.', zh: '，包含多种类型的建筑和设施。' },
  '鼠标悬停在社区上查看信息': { en: 'Hover over communities to view information', zh: '鼠标悬停在社区上查看信息' },
  '点击查看详情': { en: 'Click to view details', zh: '点击查看详情' },
  '选择标签': { en: 'Select Tags', zh: '选择标签' },
  '确定': { en: 'Confirm', zh: '确定' },
  'Max 3': { en: 'Max 3', zh: '最多3个' },
  'found': { en: 'found', zh: '找到' },
  'Discover this vibrant neighborhood': { en: 'Discover this vibrant neighborhood', zh: '探索这个充满活力的社区' },
  'Urban': { en: 'Urban', zh: '都市' },
  'Properties': { en: 'Properties', zh: '房源' },
  'NYC': { en: 'NYC', zh: '纽约市' },
  'Queens': { en: 'Queens', zh: '皇后区' },

  // Footer相关翻译
  'Still have questions?': { en: 'Still have questions?', zh: '还有疑问吗？' },
  'Get in Touch with Our Team': { en: 'Get in Touch with Our Team', zh: '联系我们的团队' },
  "Have something to ask? Drop us an email — we're here to help you explore neighborhoods and buildings.": {
    en: "Have something to ask? Drop us an email — we're here to help you explore neighborhoods and buildings.",
    zh: '有问题要咨询吗？给我们发邮件——我们在这里帮助您探索社区和房源。'
  },
  'Call Us': { en: 'Call Us', zh: '联系电话' },
  'Email Us': { en: 'Email Us', zh: '邮箱联系' },
  'Copyright': { en: 'Copyright', zh: '版权信息' },
  '© 2025 Moveasy. All rights reserved.': { en: '© 2025 Moveasy. All rights reserved.', zh: '© 2025 Moveasy. 保留所有权利。' },
  'Platform': { en: 'Platform', zh: '平台' },
  'Building Details': { en: 'Building Details', zh: '房源详情' },
  'RESOURCES': { en: 'RESOURCES', zh: '资源' },
  'Neighborhood Guide': { en: 'Neighborhood Guide', zh: '社区指南' },
  'Support': { en: 'Support', zh: '支持' },
  'Publisher Terms': { en: 'Publisher Terms', zh: '发布者条款' },
  'Terms of Use': { en: 'Terms of Use', zh: '使用条款' },
  'Privacy Policy': { en: 'Privacy Policy', zh: '隐私政策' }
};

/**
 * 创建翻译组合式API
 * @returns {Object} 翻译相关的状态和方法
 */
export default function useTranslation() {
  // 使用全局共享状态，确保所有组件同步
  const currentLanguage = globalCurrentLanguage;
  const availableLanguages = globalAvailableLanguages;
  const isLoading = globalIsLoading;
  const translationCache = globalTranslationCache;
  
  // 加载语言列表
  const loadLanguages = async () => {
    try {
      isLoading.value = true;
      const languages = await translateApi.getLanguages();
      if (languages && languages.length > 0) {
        availableLanguages.value = languages;
      }
    } catch (error) {
      console.error('加载语言列表失败:', error);
    } finally {
      isLoading.value = false;
    }
    return availableLanguages.value;
  };
  
  // 清除翻译缓存
  const clearTranslationCache = () => {
    // 清除内存缓存
    Object.keys(translationCache).forEach(key => {
      delete translationCache[key];
    });
    
    // 清除本地存储缓存
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('translation_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ Translation cache cleared');
    } catch (error) {
      console.error('清除翻译缓存失败:', error);
    }
  };

  // 切换语言
  const setLanguage = (langCode) => {
    console.log('🔄 useTranslation: setLanguage 被调用', { 
      from: currentLanguage.value, 
      to: langCode 
    });
    if (langCode && langCode !== currentLanguage.value) {
      console.log('🔄 useTranslation: 正在切换语言...');
      const oldLang = currentLanguage.value;
      currentLanguage.value = langCode;
      localStorage.setItem('preferredLanguage', langCode);
      
      // 语言切换时清除缓存，强制重新翻译
      clearTranslationCache();
      console.log(`🌐 Language changed from ${oldLang} to ${langCode}, cache cleared`);
      console.log('🔄 useTranslation: 语言已切换到', currentLanguage.value);
      
      // Vue的响应式系统会自动重新翻译所有内容
      // 无需手动刷新页面
    } else {
      console.log('🔄 useTranslation: 语言未改变或参数无效');
    }
  };
  
  // 获取缓存的翻译
  const getCachedTranslation = (text, targetLang) => {
    // 检查内存缓存
    const cacheKey = `${text}:${targetLang}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }
    
    // 检查本地存储缓存
    try {
      const cachedItem = localStorage.getItem(`translation_${cacheKey}`);
      if (cachedItem) {
        const { value, timestamp } = JSON.parse(cachedItem);
        // 检查缓存是否过期
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          // 更新内存缓存
          translationCache[cacheKey] = value;
          return value;
        } else {
          // 清除过期缓存
          localStorage.removeItem(`translation_${cacheKey}`);
        }
      }
    } catch (error) {
      console.error('读取翻译缓存失败:', error);
    }
    
    return null;
  };
  
  // 保存翻译到缓存
  const cacheTranslation = (text, targetLang, translatedText) => {
    const cacheKey = `${text}:${targetLang}`;
    
    // 更新内存缓存
    translationCache[cacheKey] = translatedText;
    
    // 更新本地存储缓存
    try {
      localStorage.setItem(
        `translation_${cacheKey}`,
        JSON.stringify({
          value: translatedText,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('保存翻译缓存失败:', error);
    }
  };
  
  // 获取静态翻译 - 支持大小写不敏感匹配
  const getStaticText = (key, targetLang = null, debugContext = '') => {
    const langCode = targetLang || currentLanguage.value;
    
    // 首先尝试精确匹配
    let translations = STATIC_TRANSLATIONS[key];
    
    // 如果精确匹配失败，尝试大小写不敏感匹配
    if (!translations) {
      const lowerKey = key.toLowerCase();
      translations = STATIC_TRANSLATIONS[lowerKey];
    }
    
    // 如果还是没找到，尝试在所有key中查找
    if (!translations) {
      for (const [dictKey, dictTranslations] of Object.entries(STATIC_TRANSLATIONS)) {
        if (dictKey.toLowerCase() === key.toLowerCase()) {
          translations = dictTranslations;
          break;
        }
      }
    }
    
    if (!translations) {
      return key; // 如果没有找到翻译，返回key本身
    }
    
    const result = translations[langCode] || translations[DEFAULT_LANGUAGE] || key;
    
    return result;
  };

  // 翻译文本 - 支持强制动态翻译模式
  const translateText = async (text, targetLang = null, debugContext = '', forceAPI = false) => {
    if (!text) return '';

    // 使用当前语言或指定的目标语言
    const langCode = targetLang || currentLanguage.value;

    // 如果是默认语言，直接返回原文
    if (langCode === DEFAULT_LANGUAGE) {
      return text;
    }

    // 仅支持英文和中文
    if (langCode !== 'en' && langCode !== 'zh') {
      return text;
    }

    // 如果强制API翻译，跳过静态字典和缓存
    if (!forceAPI) {
      // 首先检查静态翻译字典 - 使用改进的getStaticText函数
      const staticTranslation = getStaticText(text, langCode, debugContext);
      if (staticTranslation !== text) {
        return staticTranslation;
      }

      // 尝试从缓存获取翻译
      const cachedTranslation = getCachedTranslation(text, langCode);
      if (cachedTranslation) {
        return cachedTranslation;
      }
    }

    // 调用API翻译 - 如果API不可用，直接返回原文
    try {
      isLoading.value = true;
      
      const translatedText = await translateApi.translateText(text, langCode);

      // 缓存翻译结果
      if (translatedText && translatedText !== text) {
        cacheTranslation(text, langCode, translatedText);
      }

      return translatedText;
    } catch (error) {
      // 静默处理翻译API错误，避免控制台噪音
      if (error.response?.status === 500 || error.code === 'ERR_BAD_RESPONSE') {
        // API服务不可用，直接返回原文
        return text;
      }
      
      // 只在有debug context时才输出错误
      if (debugContext) {
        console.warn(`🔤 [${debugContext}] 翻译失败: ${error.message}`);
      }
      return text; // 翻译失败时返回原文
    } finally {
      isLoading.value = false;
    }
  };
  
  // 批量翻译
  const translateBatch = async (texts, targetLang = null) => {
    if (!texts || texts.length === 0) return [];
    
    // 使用当前语言或指定的目标语言
    const langCode = targetLang || currentLanguage.value;
    
    // 如果是默认语言，直接返回原文
    if (langCode === DEFAULT_LANGUAGE) {
      return texts;
    }
    
    // 仅支持英文和中文
    if (langCode !== 'en' && langCode !== 'zh') {
      return texts;
    }
    
    // 分离已缓存和未缓存的文本
    const uncachedTexts = [];
    const translationMap = {};
    const results = new Array(texts.length);
    
    // 先检查缓存
    texts.forEach((text, index) => {
      const cachedTranslation = getCachedTranslation(text, langCode);
      if (cachedTranslation) {
        results[index] = cachedTranslation;
      } else {
        uncachedTexts.push(text);
        translationMap[text] = index;
      }
    });
    
    // 如果所有文本都已缓存，直接返回
    if (uncachedTexts.length === 0) {
      return results;
    }
    
    // 翻译未缓存的文本
    try {
      isLoading.value = true;
      const translatedTexts = await translateApi.translateBatch(uncachedTexts, langCode);
      
      // 处理翻译结果
      uncachedTexts.forEach((text, i) => {
        const translatedText = translatedTexts[i];
        const originalIndex = translationMap[text];
        
        // 更新结果
        results[originalIndex] = translatedText;
        
        // 缓存翻译结果
        if (translatedText && translatedText !== text) {
          cacheTranslation(text, langCode, translatedText);
        }
      });
      
      return results;
    } catch (error) {
      console.error('批量翻译失败:', error);
      
      // 填充未翻译的文本
      texts.forEach((text, index) => {
        if (!results[index]) {
          results[index] = text;
        }
      });
      
      return results;
    } finally {
      isLoading.value = false;
    }
  };
  
  // 当前语言的名称
  const currentLanguageName = computed(() => {
    const lang = availableLanguages.value.find(
      (lang) => lang.code === currentLanguage.value
    );
    return lang ? lang.name : '';
  });
  
  return {
    currentLanguage,
    availableLanguages,
    isLoading,
    loadLanguages,
    setLanguage,
    translateText,
    translateBatch,
    getStaticText,
    currentLanguageName,
  };
}

// 同时提供命名导出以兼容不同的导入方式
export { useTranslation } 