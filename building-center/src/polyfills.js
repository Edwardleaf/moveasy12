// 为浏览器环境提供Node.js的global对象
window.global = window;

// 其他可能需要的Node.js环境变量
window.process = window.process || {
  env: { DEBUG: undefined },
  version: '',
  browser: true
};