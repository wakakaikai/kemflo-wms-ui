<template>
  <div class="login">
    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <h3 class="title">溢泰制造管理系统</h3>
      <el-form-item v-if="tenantEnabled" prop="tenantId">
        <el-select v-model="loginForm.tenantId" filterable placeholder="请选择/输入公司名称" style="width: 100%">
          <el-option v-for="item in tenantList" :key="item.tenantId" :label="item.companyName" :value="item.tenantId"></el-option>
          <template #prefix><svg-icon icon-class="company" class="el-input__icon input-icon" /></template>
        </el-select>
      </el-form-item>
      <el-form-item prop="username">
        <el-input v-model="loginForm.username" text size="large" auto-complete="off" placeholder="账号">
          <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="loginForm.password" type="password" size="large" auto-complete="off" placeholder="密码" @keyup.enter="handleLogin" show-password>
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <!--      <el-form-item v-if="captchaEnabled" prop="code">-->
      <!--        <el-input v-model="loginForm.code" size="large" auto-complete="off" placeholder="验证码" style="width: 63%" @keyup.enter="handleLogin">-->
      <!--          <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>-->
      <!--        </el-input>-->
      <!--        <div class="login-code">-->
      <!--          <img :src="codeUrl" class="login-code-img" @click="getCode" />-->
      <!--        </div>-->
      <!--      </el-form-item>-->
      <el-checkbox v-model="loginForm.rememberMe" style="margin: 0 0 25px 0">记住密码</el-checkbox>
      <!--      <el-form-item style="float: right">
        <el-button circle title="微信登录" @click="doSocialLogin('wechat')">
          <svg-icon icon-class="wechat" />
        </el-button>
        <el-button circle title="MaxKey登录" @click="doSocialLogin('maxkey')">
          <svg-icon icon-class="maxkey" />
        </el-button>
        <el-button circle title="TopIam登录" @click="doSocialLogin('topiam')">
          <svg-icon icon-class="topiam" />
        </el-button>
        <el-button circle title="Gitee登录" @click="doSocialLogin('gitee')">
          <svg-icon icon-class="gitee" />
        </el-button>
        <el-button circle title="Github登录" @click="doSocialLogin('github')">
          <svg-icon icon-class="github" />
        </el-button>
      </el-form-item>-->
      <el-form-item style="width: 100%">
        <el-button :loading="loading" size="large" type="primary" style="width: 100%" @click.prevent="handleLogin">
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <div v-if="register" style="float: right">
          <router-link class="link-type" :to="'/register'">立即注册</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <span>{{ copyrightText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCodeImg, getTenantList } from '@/api/login';
import { authRouterUrl } from '@/api/system/social/auth';
import { useUserStore } from '@/store/modules/user';
import { LoginData, TenantVO } from '@/api/types';
import { to } from 'await-to-js';
import { HttpStatus } from '@/enums/RespEnum';
import { setToken } from '@/utils/auth';
import { buildCopyrightText, resolveTenantCompanyName } from '@/utils/copyright';
const userStore = useUserStore();
const router = useRouter();

const loginForm = ref<LoginData>({
  tenantId: '000000',
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  tenantId: [{ required: true, trigger: 'blur', message: '请输入您的租户编号' }],
  username: [{ required: true, trigger: 'blur', message: '请输入您的账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入您的密码' }],
  code: [{ required: true, trigger: 'change', message: '请输入验证码' }]
};

const codeUrl = ref('');
const loading = ref(false);
// 验证码开关
const captchaEnabled = ref(true);
// 租户开关
const tenantEnabled = ref(true);

// 注册开关
const register = ref(false);
const redirect = ref('/');
const loginRef = ref<ElFormInstance>();
// 租户列表
const tenantList = ref<TenantVO[]>([]);

const copyrightText = computed(() => buildCopyrightText(resolveTenantCompanyName(loginForm.value.tenantId, tenantList.value)));

watch(
  () => router.currentRoute.value,
  (newRoute: any) => {
    redirect.value = newRoute.query && decodeURIComponent(newRoute.query.redirect);
  },
  { immediate: true }
);

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
    if (valid) {
      loading.value = true;
      // 勾选了需要记住密码设置在 localStorage 中设置记住用户名和密码
      localStorage.setItem('tenantId', String(loginForm.value.tenantId));
      if (loginForm.value.rememberMe) {
        localStorage.setItem('username', String(loginForm.value.username));
        localStorage.setItem('password', String(loginForm.value.password));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        // 否则移除
        // localStorage.removeItem('tenantId');
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
      // 调用action的登录方法
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        const redirectUrl = redirect.value || '/';
        await router.push(redirectUrl);
        loading.value = false;
      } else {
        loading.value = false;
        // 重新获取验证码
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    } else {
      console.log('error submit!', fields);
    }
  });
};

/**
 * 获取验证码
 */
const getCode = async () => {
  const res = await getCodeImg();
  const { data } = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    // 刷新验证码时清空输入框
    loginForm.value.code = '';
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    loginForm.value.uuid = data.uuid;
  }
};

const getLoginData = () => {
  const tenantId = localStorage.getItem('tenantId');
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  const rememberMe = localStorage.getItem('rememberMe');
  loginForm.value = {
    tenantId: tenantId === null ? String(loginForm.value.tenantId) : tenantId,
    username: username === null ? String(loginForm.value.username) : username,
    password: password === null ? String(loginForm.value.password) : String(password),
    rememberMe: rememberMe === null ? false : Boolean(rememberMe)
  } as LoginData;
};

/**
 * 获取租户列表
 */
const initTenantList = async () => {
  const { data } = await getTenantList();
  tenantEnabled.value = data.tenantEnabled === undefined ? true : data.tenantEnabled;
  if (tenantEnabled.value) {
    tenantList.value = data.voList;
    if (tenantList.value != null && tenantList.value.length !== 0 && !loginForm.value.tenantId) {
      loginForm.value.tenantId = tenantList.value[0].tenantId;
    }
  }
};

/**
 * 第三方登录
 * @param type
 */
const doSocialLogin = (type: string) => {
  authRouterUrl(type, loginForm.value.tenantId).then((res: any) => {
    if (res.code === HttpStatus.SUCCESS) {
      // 获取授权地址跳转
      window.location.href = res.data;
    } else {
      ElMessage.error(res.msg);
    }
  });
};

onMounted(() => {
  getCode();
  initTenantList();
  getLoginData();
  loginForm.value.tenantId = localStorage.getItem('tenantId');
  // 定义允许的源列表
  const allowedOrigins = ['http://127.0.0.1:3000', 'https://mesqas.yakimagroup.com:8998', 'https://mes.yakimagroup.com:8999'];

  // 监听事件
  window.addEventListener('message', function (event) {
    // 检查事件源是否在允许列表中
    if (!allowedOrigins.includes(event.origin)) return;

    if (event.data && event.data.type === 'AUTO_LOGIN') {
      console.log('event.data', event.data);
      loginForm.value.rememberMe = true;
      loginForm.value.tenantId = event.data.tenantId;
      loginForm.value.username = event.data.username;
      loginForm.value.password = event.data.password;
      localStorage.setItem('tenantId', String(loginForm.value.tenantId));
      localStorage.setItem('username', String(loginForm.value.username));
      localStorage.setItem('password', String(loginForm.value.password));
      localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      localStorage.setItem('sidebarStatus', String(0));
      handleLogin();
    }
  });
});
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 100vh;
  height: 100%;
  padding: 0 clamp(48px, 8vw, 160px);
  box-sizing: border-box;
  background-color: #063a6e;
  background-image: url('../assets/images/login-background.png');
  background-repeat: no-repeat;
  background-position: center center;
  /* 横向铺满，高度按比例缩放，避免变形 */
  background-size: 100% auto;
}

.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #f3f9ff;
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 2px 12px rgba(45, 156, 255, 0.35);
}

.login-form {
  border: 1px solid rgba(118, 198, 255, 0.42);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(8, 37, 82, 0.9) 0%, rgba(10, 66, 124, 0.78) 100%);
  box-shadow:
    0 24px 60px rgba(0, 21, 58, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px) saturate(125%);
  -webkit-backdrop-filter: blur(16px) saturate(125%);
  width: 400px;
  padding: 25px 25px 5px 25px;

  .el-input {
    height: 40px;

    input {
      height: 40px;
    }
  }

  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
    color: #6f8eac;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    background-color: rgba(245, 250, 255, 0.95);
    box-shadow: 0 0 0 1px rgba(145, 198, 239, 0.4) inset;
    transition:
      box-shadow 0.2s ease,
      background-color 0.2s ease;
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-select__wrapper:hover) {
    background-color: #ffffff;
    box-shadow: 0 0 0 1px rgba(80, 166, 239, 0.72) inset;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-select__wrapper.is-focused) {
    background-color: #ffffff;
    box-shadow:
      0 0 0 1px #4aa8f5 inset,
      0 0 0 3px rgba(74, 168, 245, 0.16);
  }

  :deep(.el-checkbox__label) {
    color: #dbeeff;
  }

  :deep(.el-button--primary) {
    border-color: transparent;
    background: linear-gradient(90deg, #2d8bf0 0%, #4ca9ff 100%);
    box-shadow: 0 8px 20px rgba(14, 104, 198, 0.34);
    letter-spacing: 4px;
  }

  :deep(.el-button--primary:hover) {
    background: linear-gradient(90deg, #3b98f6 0%, #65b7ff 100%);
  }
}

.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}

.login-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.login-form :deep(.el-button--primary) {
  border-radius: var(--app-radius-md);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
}

.login-form :deep(.el-button.is-circle) {
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: var(--el-text-color-regular);
}

.login-form :deep(.el-button.is-circle:hover) {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

.login-code {
  width: calc(37% - 10px);
  height: 40px;
  float: right;
  margin-left: 10px;
  box-sizing: border-box;
  border-radius: var(--app-radius-sm);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--el-border-color-light);

  img {
    cursor: pointer;
    vertical-align: middle;
    display: block;
    width: 100%;
    height: 40px;
    object-fit: cover;
  }
}

.el-login-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  min-height: 40px;
  padding: 8px 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.75);
  font-family: Arial, serif;
  font-size: 12px;
  letter-spacing: 1px;

  span {
    width: 100%;
    line-height: 1.5;
    text-align: center;
  }
}

.login-code-img {
  height: 40px;
  padding-left: 0;
}

:global(html.dark) {
  .login-form {
    background: rgba(17, 24, 39, 0.9);
    border-color: rgba(148, 163, 184, 0.2);
  }

  .login-form :deep(.el-input__wrapper) {
    background-color: rgba(17, 24, 39, 0.7);
  }

  .login-form :deep(.el-button.is-circle) {
    background: rgba(148, 163, 184, 0.12);
    border-color: rgba(148, 163, 184, 0.25);
    color: #e5e7eb;
  }

  .el-login-footer {
    color: rgba(226, 232, 240, 0.65);
  }
}

@media (max-width: 900px) {
  .login {
    justify-content: center;
    padding: 0 16px;
  }

  .login-form {
    width: min(400px, 100%);
    box-sizing: border-box;
  }
}
</style>
