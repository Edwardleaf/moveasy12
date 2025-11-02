/**
 * 宠物政策工具函数
 * 这些是前端固定的选项，不依赖数据库现有数据
 */

export const PET_POLICY_OPTIONS = [
  { label: 'Pets Allowed', value: 'allowed' },
  { label: 'Pets Not Allowed', value: 'not_allowed' }
]

/**
 * 获取宠物政策的显示标签
 * @param {string} value - 宠物政策值 ('allowed' 或 'not_allowed')
 * @returns {string} 显示标签
 */
export const getPetPolicyLabel = (value) => {
  if (!value) return 'Not specified'
  
  const policy = PET_POLICY_OPTIONS.find(option => option.value === value)
  return policy ? policy.label : value // 如果没找到匹配项，返回原值
}

/**
 * 检查是否允许宠物
 * @param {string} value - 宠物政策值
 * @returns {boolean} 是否允许宠物
 */
export const isPetAllowed = (value) => {
  return value === 'allowed'
}

/**
 * 获取宠物政策的图标或样式类
 * @param {string} value - 宠物政策值
 * @returns {object} 包含图标和样式信息
 */
export const getPetPolicyDisplay = (value) => {
  switch (value) {
    case 'allowed':
      return {
        icon: '🐕',
        text: 'Pets Allowed',
        color: 'green'
      }
    case 'not_allowed':
      return {
        icon: '🚫',
        text: 'Pets Not Allowed', 
        color: 'red'
      }
    default:
      return {
        icon: '❓',
        text: 'Not specified',
        color: 'gray'
      }
  }
}