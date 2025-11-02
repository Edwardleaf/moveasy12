<template>
  <footer class="footer-container">
    <div class="footer-content">
      <!-- CTA Section at top -->
      <div class="contact-form">
        <div class="form-header">
          <h2><translated-text text="Still have questions?" :use-static="true" /></h2>
          <h1><translated-text text="Get in Touch with Our Team" :use-static="true" /></h1>
          <p><translated-text :text="`Have something to ask? Drop us an email — we're here to help you explore neighborhoods and buildings.`" :use-static="true" /></p>
        </div>
        
        <div class="form-input">
          <div class="email-display">
            <span class="email-text">support@moveasy.com</span>
          </div>
          <n-button class="copy-btn" @click="copyToClipboard">
            <template #icon>
              <n-icon>
                <CopyOutline />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
      
      <!-- Footer Links Section -->
      <div class="footer-bottom-section">
        <div class="footer-left">
          <div class="logo-section">
            <img src="../assets/images/sh_logo.png" alt="Moveasy Logo" class="logo-image" />
          </div>
          
          <div class="contact-info">
            <div class="contact-section">
              <h3><translated-text text="Call Us" :use-static="true" /></h3>
              <p class="contact-detail">1-234-647-8098</p>
            </div>

            <div class="contact-section">
              <h3><translated-text text="Email Us" :use-static="true" /></h3>
              <p class="contact-detail">support@moveasy.com</p>
            </div>

            <div class="contact-section">
              <h3><translated-text text="Copyright" :use-static="true" /></h3>
              <p class="contact-detail"><translated-text text="© 2025 Moveasy. All rights reserved." :use-static="true" /></p>
            </div>
          </div>
        </div>
        
        <div class="footer-links">
          <div class="links-column">
            <h3 class="column-title"><translated-text text="Platform" :use-static="true" /></h3>
            <ul class="links-list">
              <li><a href="#"><translated-text text="Home" :use-static="true" /></a></li>
              <li><a href="#"><translated-text text="About Us" :use-static="true" /></a></li>
              <li><a href="#"><translated-text text="Building Details" :use-static="true" /></a></li>
            </ul>
          </div>

          <div class="links-column">
            <h3 class="column-title"><translated-text text="RESOURCES" :use-static="true" /></h3>
            <ul class="links-list">
              <li><a href="#"><translated-text text="Neighborhood Guide" :use-static="true" /></a></li>
              <li><a href="#"><translated-text text="Support" :use-static="true" /></a></li>
              <li><a href="#"><translated-text text="Contact" :use-static="true" /></a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <div class="legal-links">
          <a href="#"><translated-text text="Publisher Terms" :use-static="true" /></a>
          <a href="#"><translated-text text="Terms of Use" :use-static="true" /></a>
          <a href="#"><translated-text text="Privacy Policy" :use-static="true" /></a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { CopyOutline } from '@vicons/ionicons5'
import TranslatedText from './TranslatedText.vue'

export default {
  name: 'AppFooter',
  components: {
    CopyOutline,
    TranslatedText
  },
  data() {
    return {
      email: 'support@moveasy.com'
    }
  },
  methods: {
    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.email);
        this.$message?.success('邮箱地址已复制到剪贴板');
      } catch (err) {
        // 降级方案
        this.fallbackCopy();
      }
    },

    fallbackCopy() {
      const textArea = document.createElement("textarea");
      textArea.value = this.email;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.$message?.success('邮箱地址已复制到剪贴板');
        } else {
          this.$message?.error('复制失败，请手动复制');
        }
      } catch (err) {
        this.$message?.error('复制失败，请手动复制');
      }

      document.body.removeChild(textArea);
    }
  }
}
</script>

<style scoped>
.footer-container {
  background-color: #ffffff;
  color: #333;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4rem 0 0;
  box-sizing: border-box;
}

.footer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.footer-bottom-section {
  display: flex;
  flex-wrap: wrap;
  padding: 40px 60px 20px 60px;
  gap: 40px;
}

.footer-left {
  flex: 0 0 45%;
  min-width: 300px;
}

.logo-section {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.logo-section .logo-image {
  height: 35px;
  width: auto;
}

.logo-section .n-icon {
  color: #198754; /* Green-500 */
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #0f5132; /* Green-700 */
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-section h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #0a3622; /* Green-800 */
}

.contact-detail {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #0f5132; /* Green-700 */
}

.footer-links {
  display: flex;
  justify-content: flex-start;
  gap: 80px;
  flex-wrap: wrap;
  flex: 0 0 50%;
}

.links-column {
  min-width: 150px;
  margin-bottom: 30px;
}

.column-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #0a3622; /* Green-800 */
}

.links-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.links-list li {
  margin-bottom: 12px;
}

.links-list a {
  text-decoration: none;
  color: #146c43; /* Green-600 */
  transition: color 0.2s;
}

.links-list a:hover {
  color: #198754; /* Green-500 */
}

.contact-form {
  padding: 7%  23%;
  background-color: #198754; /* Green-500 */
  color: white;
  margin-bottom: 0;
  text-align: center;
}

.form-header h2 {
  font-size: 18px;
  font-weight: 400;
  margin: 0 0 12px;
}

.form-header h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px;
}

.form-header p {
  font-size: 16px;
  margin-bottom: 24px;
}

.form-input {
  width: 50%;
  margin: 0 auto;
  display: flex;
  align-items: end;
  gap: 12px;
}

.email-display {
  border-radius: 20px;
  height: 44px;
  flex: 1;
  background-color: #188f50;
  border: 1px solid white;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.email-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
  user-select: all; /* 允许用户选择文本 */
}

.copy-btn {
  height: 44px;
  width: 44px;
  padding: 0 !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

:deep(.copy-btn) {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.copy-btn .n-button__border) {
  border: none !important;
}

:deep(.copy-btn .n-button__state-border) {
  border: none !important;
}

:deep(.copy-btn:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: none !important;
  border: none !important;
}

:deep(.copy-btn:hover .n-button__border) {
  border: none !important;
}

:deep(.copy-btn:hover .n-button__state-border) {
  border: none !important;
}

:deep(.copy-btn:focus) {
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

:deep(.copy-btn:focus .n-button__border) {
  border: none !important;
}

:deep(.copy-btn:focus .n-button__state-border) {
  border: none !important;
}

:deep(.copy-btn .n-icon) {
  color: white !important;
  font-size: 20px;
}

:deep(.copy-btn:hover .n-icon) {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* 强制移除所有可能的边框 */
:deep(.copy-btn),
:deep(.copy-btn *),
:deep(.copy-btn::before),
:deep(.copy-btn::after) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.footer-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
  border-top: 1px solid #d1e7dd; /* Green-100 */
}

.copyright {
  color: #146c43; /* Green-600 */
  margin: 0;
}

.legal-links {
  display: flex;
  gap: 32px;
  justify-content: center;
  align-items: center;
}

.legal-links a {
  text-decoration: none;
  color: #146c43; /* Green-600 */
  transition: color 0.2s;
}

.legal-links a:hover {
  color: #198754; /* Green-500 */
}

@media (max-width: 768px) {
  .footer-bottom-section {
    flex-direction: column;
    gap: 30px;
  }
  
  .footer-links {
    justify-content: flex-start;
    gap: 40px;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .legal-links {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .contact-form {
    padding: 24px;
  }
  
  .form-header h1 {
    font-size: 24px;
  }
}
</style> 