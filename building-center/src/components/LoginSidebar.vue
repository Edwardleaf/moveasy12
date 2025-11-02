<template>
  <div class="login-sidebar">
    <div class="decoration-circles">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
    
    <div class="image-stack">
      <div class="image image-1">
        <img src="../assets/images/caspar-camille-rubin-uDpPaR14ENg-unsplash.jpg" alt="Building exterior" class="sidebar-image" />
      </div>
      <div class="image image-2">
        <img src="../assets/images/anthony-esau-N2zk9yXjmLA-unsplash.jpg" alt="Urban architecture" class="sidebar-image" />
      </div>
      <div class="image image-3">
        <img src="../assets/images/kimon-maritz-mQiZnKwGXW0-unsplash.jpg" alt="Modern apartment" class="sidebar-image" />
      </div>
    </div>
    
    <div class="floating-elements">
      <div class="floating-element element-1">
        <n-icon size="24" color="#198754">
          <HomeOutline />
        </n-icon>
      </div>
      <div class="floating-element element-2">
        <n-icon size="24" color="#198754">
          <BusinessOutline />
        </n-icon>
      </div>
      <div class="floating-element element-3">
        <n-icon size="24" color="#198754">
          <LinkOutline />
        </n-icon>
      </div>
    </div>
  </div>
</template>

<script>
import { NIcon } from 'naive-ui'
import { HomeOutline, BusinessOutline, LinkOutline } from '@vicons/ionicons5'
import PlaceholderImage from './PlaceholderImage.vue'

export default {
  name: 'LoginSidebar',
  components: {
    NIcon,
    HomeOutline,
    BusinessOutline,
    LinkOutline,
    PlaceholderImage
  }
}
</script>

<style scoped>
.login-sidebar {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
}

/* 装饰圆圈 */
.decoration-circles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  background: linear-gradient(135deg, #198754, #20c997);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation: float 15s infinite ease-in-out;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
  animation: float 12s infinite ease-in-out reverse;
}

/* 图片堆叠 */
.image-stack {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 70%;
  z-index: 2;
}

.image {
  position: absolute;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: all 0.5s ease;
}

.sidebar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-1 {
  width: 70%;
  height: 60%;
  top: 0;
  left: 0;
  z-index: 4;
  animation: hover 6s infinite ease-in-out;
}

.image-2 {
  width: 60%;
  height: 50%;
  top: 20%;
  right: 0;
  z-index: 3;
  animation: hover 7s infinite ease-in-out 1s;
}

.image-3 {
  width: 65%;
  height: 55%;
  bottom: 0;
  left: 15%;
  z-index: 2;
  animation: hover 8s infinite ease-in-out 2s;
}

/* 浮动元素 */
.floating-elements {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  width: 48px;
  height: 48px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.element-1 {
  top: 15%;
  right: 20%;
  animation: float 10s infinite ease-in-out;
}

.element-2 {
  top: 60%;
  left: 15%;
  animation: float 12s infinite ease-in-out 2s;
}

.element-3 {
  bottom: 15%;
  right: 30%;
  animation: float 9s infinite ease-in-out 1s;
}

/* 动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes hover {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.02);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-sidebar {
    display: none;
  }
}
</style> 