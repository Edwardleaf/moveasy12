// 地图配置文件
// 包含地图的默认设置、样式配置等

export const mapConfig = {
  // 默认中心点 (聚焦Manhattan主城区)
  defaultCenter: [40.7831, -73.9712],
  defaultZoom: 12,
  
  // 使用CARTO Voyager样式 - CARTO Builder默认底图，平衡的彩色地图
  tileLayer: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  
  // 地图选项
  mapOptions: {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    scaleControl: true,
  },
  
  // 瓦片层选项
  tileOptions: {
    maxZoom: 18,
    minZoom: 3,
  },
  
  // GeoJSON样式配置
  geoJsonStyle: {
    weight: 3,                    // 适中的边框宽度
    opacity: 0.8,                 // 边框透明度
    fillOpacity: 0.35,            // 填充透明度 (避免重叠过暗)
    dashArray: '10, 5',           // 虚线样式
    lineJoin: 'round',            // 圆润的线条连接
    lineCap: 'round',             // 圆润的线条端点
    smoothFactor: 2.0,            // Leaflet平滑因子 (1-3范围内)
    interactive: true,            // 允许交互
    bubblingMouseEvents: false    // 防止事件冒泡
  }
};