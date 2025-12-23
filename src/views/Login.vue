<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">vnpy web trader</h2>
      
      <div class="form-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username"
          v-model="username"
          placeholder="请输入用户名"
          :class="{ 'error': error }"
          @keyup.enter="handleLogin"
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input 
          type="password" 
          id="password"
          v-model="password"
          placeholder="请输入密码"
          :class="{ 'error': error }"
          @keyup.enter="handleLogin"
        />
      </div>

      <div v-if="error" class="error-message">
        <i class="error-icon">⚠</i> {{ error }}
      </div>

      <button 
        class="login-btn" 
        @click="handleLogin" 
        :disabled="loading"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '登录中...' : '登录系统' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const username = ref('vnpy')
const password = ref('vnpy')
const loading = ref(false)
const error = ref('')

const router = useRouter()

// login.
const handleLogin = async() => {
    if (!username.value) {
        error.value = 'please enter username'
        return
    }
    if (!password.value) {
        error.value = 'please enter password'
        return
    }
    loading.value = true
    error.value = ''

    try {
        const response = await axios.post(
            'api/token',
            new URLSearchParams({
                username: username.value,
                password: password.value
            }),
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )
        // save token data into localStorage.
        const token = response.data.access_token
        localStorage.setItem('vnpy_token', token)
        localStorage.setItem('vnpy_username', username.value)
        router.push('/system')
    } catch(err: any) {
        console.error('login failed: ', err)
        if (err.response?.status === 401) {
            err.value = 'username or password incorrect'
        } else if (err.response?.status === 422) {
            err.value = 'request params incorrect'
        } else if (err.reqeuest) {
            err.value = 'network link failed, please check backend service'
        } else {
            err.value = 'login failed: ${err.message}'
        }
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input.error {
  border-color: #ff4757;
}

.error-message {
  background: #ffeaea;
  color: #ff4757;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.error-icon {
  margin-right: 8px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>