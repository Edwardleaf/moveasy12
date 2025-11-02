/**
 * 占位图片生成工具
 * 这个文件用于生成占位图片的CSS类，实际项目中会被真实图片替换
 */

// 占位图片颜色
const placeholderColors = {
  primary: '#198754',
  secondary: '#47976f',
  light: '#d1e7dd',
  gray: '#e2e2e2',
  dark: '#333333'
};

// 导出占位图片CSS类
export const placeholderClasses = {
  // 登录和注册页面左侧占位图
  loginSidebar: {
    backgroundColor: placeholderColors.gray,
    width: '100%',
    height: '100%'
  },
  
  // 头像占位图
  avatar: {
    backgroundColor: placeholderColors.gray,
    width: '80px',
    height: '80px',
    borderRadius: '50%'
  },
  
  // 建筑图片占位图
  building: {
    backgroundColor: placeholderColors.light,
    width: '100%',
    height: '200px',
    borderRadius: '8px'
  },
  
  // 地图占位图
  map: {
    backgroundColor: placeholderColors.gray,
    width: '100%',
    height: '400px',
    borderRadius: '8px'
  },
  
  // 日历占位图
  calendar: {
    backgroundColor: placeholderColors.gray,
    width: '100%',
    height: '200px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '1.5rem'
  }
};

export default placeholderColors; 