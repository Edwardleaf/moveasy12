import { 
  CognitoUserPool, 
  CognitoUserAttribute, 
  CognitoUser, 
  AuthenticationDetails 
} from 'amazon-cognito-identity-js';
import { 
  CognitoIdentityProviderClient, 
  SignUpCommand,
  InitiateAuthCommand
} from '@aws-sdk/client-cognito-identity-provider';
import authConfig from './authConfig';
import { clearUserState } from './userStore';
import crypto from 'crypto-js';

// 初始化用户池
const userPool = new CognitoUserPool({
  UserPoolId: authConfig.userPoolId,
  ClientId: authConfig.clientId
});

// 初始化 Cognito 客户端
const cognitoClient = new CognitoIdentityProviderClient({
  region: authConfig.region
});

// 计算SECRET_HASH
const calculateSecretHash = (username) => {
  if (!authConfig.requiresSecretHash || !authConfig.clientSecret) {
    return undefined;
  }
  
  try {
    // 使用HMAC SHA256计算密钥
    const message = username + authConfig.clientId;
    const hash = crypto.HmacSHA256(message, authConfig.clientSecret);
    const secretHash = crypto.enc.Base64.stringify(hash);
    console.log('计算的SECRET_HASH:', secretHash);
    return secretHash;
  } catch (error) {
    console.error('计算SECRET_HASH失败:', error);
    return undefined;
  }
};

/**
 * 注册新用户
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {object} attributes - 其他用户属性
 * @returns {Promise} - 返回注册结果
 */
export const signUp = (email, password, attributes = {}) => {
  return new Promise((resolve, reject) => {
    // 创建用户属性列表
    const attributeList = [];
    
    // 添加邮箱属性
    attributeList.push(
      new CognitoUserAttribute({
        Name: 'email',
        Value: email
      })
    );
    
    // 添加其他属性
    Object.keys(attributes).forEach(key => {
      attributeList.push(
        new CognitoUserAttribute({
          Name: key,
          Value: attributes[key]
        })
      );
    });
    
    // 计算SECRET_HASH
    const secretHash = calculateSecretHash(email);
    
    // 创建验证数据数组
    const validationData = [];
    if (secretHash) {
      validationData.push(
        new CognitoUserAttribute({
          Name: 'SECRET_HASH',
          Value: secretHash
        })
      );
    }
    
    // 调用用户池的注册方法
    userPool.signUp(
      email, 
      password, 
      attributeList, 
      validationData.length > 0 ? validationData : null, 
      (err, result) => {
        if (err) {
          console.error('注册失败:', err);
          reject(err);
          return;
        }
        
        resolve({
          user: result.user,
          userConfirmed: result.userConfirmed,
          userSub: result.userSub
        });
      }
    );
  });
};

/**
 * 确认用户注册
 * @param {string} email - 用户邮箱
 * @param {string} code - 验证码
 * @returns {Promise} - 返回确认结果
 */
export const confirmSignUp = (email, code) => {
  return new Promise((resolve, reject) => {
    // 计算SECRET_HASH
    const secretHash = calculateSecretHash(email);
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
      Storage: localStorage
    });
    
    // 如果有SECRET_HASH，设置到用户对象
    if (secretHash) {
      cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
      cognitoUser.setClientSecret(secretHash);
    }
    
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.error('确认注册失败:', err);
        reject(err);
        return;
      }
      
      resolve(result);
    });
  });
};

/**
 * 用户登录
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {Promise} - 返回登录结果
 */
export const signIn = (email, password) => {
  return new Promise((resolve, reject) => {
    // 计算SECRET_HASH
    const secretHash = calculateSecretHash(email);
    
    // 创建验证数据数组
    const validationData = [];
    if (secretHash) {
      validationData.push({
        Name: 'SECRET_HASH',
        Value: secretHash
      });
    }
    
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
      ValidationData: validationData.length > 0 ? validationData : null
    });
    
    const userData = {
      Username: email,
      Pool: userPool
    };
    
    const cognitoUser = new CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        const result = {
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          isAuthenticated: true
        };
        resolve(result);
      },
      onFailure: (err) => {
        console.error('登录失败:', err);
        reject(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // 处理首次登录需要重置密码的情况
        resolve({
          user: cognitoUser,
          newPasswordRequired: true,
          userAttributes,
          requiredAttributes
        });
      }
    });
  });
};

/**
 * 忘记密码 - 发送重置密码验证码
 * @param {string} email - 用户邮箱
 * @returns {Promise} - 返回发送结果
 */
export const forgotPassword = (email) => {
  return new Promise((resolve, reject) => {
    // 计算SECRET_HASH
    const secretHash = calculateSecretHash(email);
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
      Storage: localStorage
    });
    
    // 如果有SECRET_HASH，设置到用户对象
    if (secretHash) {
      cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
      cognitoUser.setClientSecret(secretHash);
    }
    
    cognitoUser.forgotPassword({
      onSuccess: (data) => {
        resolve(data);
      },
      onFailure: (err) => {
        console.error('发送重置密码验证码失败:', err);
        reject(err);
      }
    });
  });
};

/**
 * 重置密码
 * @param {string} email - 用户邮箱
 * @param {string} code - 验证码
 * @param {string} newPassword - 新密码
 * @returns {Promise} - 返回重置结果
 */
export const confirmForgotPassword = (email, code, newPassword) => {
  return new Promise((resolve, reject) => {
    // 计算SECRET_HASH
    const secretHash = calculateSecretHash(email);
    
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
      Storage: localStorage
    });
    
    // 如果有SECRET_HASH，设置到用户对象
    if (secretHash) {
      cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
      cognitoUser.setClientSecret(secretHash);
    }
    
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        resolve({ success: true });
      },
      onFailure: (err) => {
        console.error('重置密码失败:', err);
        reject(err);
      }
    });
  });
};

/**
 * 验证用户是否存在于Cognito用户池中
 * @param {string} token - 访问令牌
 * @returns {Promise<boolean>} - 返回用户是否存在于Cognito用户池中
 */
export const verifyUserInCognitoPool = async (token) => {
  try {
    // 创建请求头
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // 调用Cognito UserInfo端点验证令牌
    const userInfoEndpoint = `https://${authConfig.cognitoDomain}/oauth2/userInfo`;
    
    const response = await fetch(userInfoEndpoint, {
      method: 'GET',
      headers
    });
    
    // 如果请求成功，则用户存在于Cognito用户池中
    return response.ok;
  } catch (error) {
    console.error('验证用户在Cognito用户池中是否存在失败:', error);
    return false;
  }
};

/**
 * 获取当前用户
 * @returns {Promise<Object|null>} - 返回当前用户或null
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    try {
      // 检查本地存储中的令牌
      const idToken = localStorage.getItem('idToken');
      const accessToken = localStorage.getItem('accessToken');
      
      if (!idToken || !accessToken) {
        console.log('找不到令牌，用户未登录');
        resolve(null);
        return;
      }
      
      // 验证令牌是否存在于Cognito用户池中
      verifyUserInCognitoPool(accessToken).then(isValid => {
        if (!isValid) {
          console.log('令牌无效，用户不存在于Cognito用户池中');
          // 清除令牌
          localStorage.removeItem('idToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          resolve(null);
          return;
        }
        
        // 解析ID令牌获取用户信息
        try {
          // 解析JWT令牌
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          
          // 提取用户属性
          const user = {
            sub: payload.sub,
            email: payload.email,
            email_verified: payload.email_verified,
            username: payload['cognito:username'],
            name: payload.name
          };
          
          // 检查令牌是否过期
          const currentTime = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < currentTime) {
            console.log('令牌已过期，尝试刷新');
            
            // 尝试刷新令牌
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              refreshSession()
                .then(result => {
                  console.log('会话刷新成功');
                  resolve({
                    user,
                    attributes: payload,
                    isAuthenticated: true
                  });
                })
                .catch(error => {
                  console.error('刷新会话失败:', error);
                  localStorage.removeItem('idToken');
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  resolve(null);
                });
            } else {
              console.log('没有刷新令牌，无法刷新会话');
              localStorage.removeItem('idToken');
              localStorage.removeItem('accessToken');
              resolve(null);
            }
          } else {
            // 令牌有效
            resolve({
              user,
              attributes: payload,
              isAuthenticated: true
            });
          }
        } catch (error) {
          console.error('解析ID令牌失败:', error);
          resolve(null);
        }
      }).catch(error => {
        console.error('验证令牌失败:', error);
        resolve(null);
      });
    } catch (error) {
      console.error('获取当前用户失败:', error);
      reject(error);
    }
  });
};

/**
 * 用户登出
 */
export const signOut = () => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
    // 清除本地存储的令牌
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // 清除用户状态
    clearUserState();
  }
};

/**
 * 使用刷新令牌获取新的访问令牌
 * @returns {Promise} - 返回刷新结果
 */
export const refreshSession = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    
    if (!cognitoUser) {
      reject(new Error('没有当前用户'));
      return;
    }
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      reject(new Error('没有刷新令牌'));
      return;
    }
    
    cognitoUser.getSession((err, session) => {
      if (err) {
        console.error('获取会话失败:', err);
        reject(err);
        return;
      }
      
      // 使用刷新令牌刷新会话
      cognitoUser.refreshSession(session.getRefreshToken(), (err, session) => {
        if (err) {
          console.error('刷新会话失败:', err);
          reject(err);
          return;
        }
        
        // 更新本地存储的令牌
        localStorage.setItem('idToken', session.getIdToken().getJwtToken());
        localStorage.setItem('accessToken', session.getAccessToken().getJwtToken());
        
        resolve({
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken()
        });
      });
    });
  });
};

/**
 * 检查用户是否已登录
 * @returns {boolean} - 返回是否已登录
 */
export const isAuthenticated = async () => {
  try {
    const userData = await getCurrentUser();
    return !!userData;
  } catch (error) {
    console.error('检查认证状态失败:', error);
    return false;
  }
};

/**
 * 使用Google登录
 * @param {string} googleToken - Google身份令牌
 * @returns {Promise} - 返回登录结果
 */
export const signInWithGoogle = async (googleToken) => {
  try {
    console.log('开始使用Google令牌登录');
    
    // 准备请求参数
    const params = {
      AuthFlow: 'CUSTOM_AUTH',
      ClientId: authConfig.clientId,
      AuthParameters: {
        'CUSTOM_AUTH_FLOW': 'googleAuth',
        'ID_TOKEN': googleToken
      }
    };
    
    // 如果需要SECRET_HASH，添加到参数中
    const secretHash = calculateSecretHash('Google_' + googleToken.substring(0, 10));
    if (secretHash) {
      params.AuthParameters['SECRET_HASH'] = secretHash;
    }
    
    // 使用SDK发起身份验证请求
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);
    
    console.log('Google登录成功，获取到认证结果');
    
    // 解析并返回令牌
    const { AuthenticationResult } = response;
    
    if (!AuthenticationResult) {
      throw new Error('未获取到认证结果');
    }
    
    return {
      idToken: AuthenticationResult.IdToken,
      accessToken: AuthenticationResult.AccessToken,
      refreshToken: AuthenticationResult.RefreshToken,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Google登录失败:', error);
    throw error;
  }
};

/**
 * 使用API进行注册
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {object} attributes - 用户属性
 * @returns {Promise} - 返回注册结果
 */
export const signUpWithAPI = async (email, password, attributes = {}) => {
  try {
    // 准备请求参数
    const params = {
      ClientId: authConfig.clientId,
      Username: email,
      Password: password,
      UserAttributes: []
    };
    
    // 添加邮箱属性
    params.UserAttributes.push({
      Name: 'email',
      Value: email
    });
    
    // 添加其他属性
    Object.keys(attributes).forEach(key => {
      params.UserAttributes.push({
        Name: key,
        Value: attributes[key]
      });
    });
    
    // 计算SECRET_HASH
    const secretHash = calculateSecretHash(email);
    if (secretHash) {
      params.SecretHash = secretHash;
    }
    
    // 发送注册请求
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    
    return {
      user: response.UserSub,
      userConfirmed: response.UserConfirmed,
      userSub: response.UserSub
    };
  } catch (error) {
    console.error('API注册失败:', error);
    throw error;
  }
};

/**
 * 使用API登录
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {Promise} - 返回登录结果
 */
export const signInWithAPI = async (email, password) => {
  try {
    // 准备请求参数
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: authConfig.clientId,
      AuthParameters: {
        'USERNAME': email,
        'PASSWORD': password
      }
    };
    
    // 计算SECRET_HASH
    const secretHash = calculateSecretHash(email);
    if (secretHash) {
      params.AuthParameters['SECRET_HASH'] = secretHash;
    }
    
    // 发送登录请求
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);
    
    // 解析并返回令牌
    const { AuthenticationResult } = response;
    
    if (!AuthenticationResult) {
      throw new Error('未获取到认证结果');
    }
    
    return {
      idToken: AuthenticationResult.IdToken,
      accessToken: AuthenticationResult.AccessToken,
      refreshToken: AuthenticationResult.RefreshToken,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('API登录失败:', error);
    throw error;
  }
};

/**
 * 重定向到Cognito托管UI
 */
export const redirectToCognitoHostedUI = () => {
  // 构建重定向URL
  const redirectUri = encodeURIComponent(authConfig.callbackUrl);
  const clientId = authConfig.clientId;
  const cognitoDomain = authConfig.cognitoDomain;
  
  // 跳转到Cognito托管UI
  const authorizationUrl = `https://${cognitoDomain}/login?client_id=${clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
  
  window.location.href = authorizationUrl;
}; 