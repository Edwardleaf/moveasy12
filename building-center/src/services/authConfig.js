// AWS Cognito 配置
export default {
    region: 'ap-southeast-2', 
    userPoolId: 'ap-southeast-2_jbrZ7DfuN', 
    clientId: '69fv7ca17v86r1k18hck2afjcb',
    identityPoolId: 'ap-southeast-2:2d45e212-e53a-43d0-a59b-6d94461d960c', 
    googleClientId: '48504898141-kh8o9lgpq9c23g6g14749p5u5nfae1sd.apps.googleusercontent.com',
    googleClientSecret: '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', // 更新的Google客户端密钥
    clientSecret: '1jj34o6kgk0eq5ugcgl888bkf5lhv97b15jjvt308qmkq9v0hnpm',
    requiresSecretHash: false, // 尝试禁用SECRET_HASH
    debug: true, // 启用调试模式
    apiBaseUrl: 'http://localhost:5003', // 后端API基础URL
    callbackUrl: 'http://localhost:5173/auth/callback',
    cognitoDomain: 'ap-southeast-2ziikiw6t5.auth.ap-southeast-2.amazoncognito.com' // 添加Cognito域名
  }; 