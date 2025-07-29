<template>
  <div class="tcp-debugger">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>TCP 客户端调试工具</span>
          <el-tag :type="isConnected ? 'success' : 'info'" size="small">
            {{ isConnected ? `已连接: ${form.host}:${form.port}` : '未连接' }}
          </el-tag>
          <el-button type="primary" size="small" @click="handleConnect" :loading="connecting">
            {{ isConnected ? '断开连接' : '连接服务器' }}
          </el-button>
        </div>
      </template>

      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务器地址">
              <el-input v-model="form.host" placeholder="例如：127.0.0.1" :disabled="isConnected" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="端口号">
              <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" :disabled="isConnected" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="自动重连">
          <el-switch v-model="form.autoReconnect" :disabled="isConnected" />
        </el-form-item>
      </el-form>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>发送数据</span>
                <el-button type="primary" size="small" @click="sendData" :disabled="!isConnected"> 发送 </el-button>
              </div>
            </template>

            <el-input v-model="sendText" type="textarea" :rows="5" placeholder="请输入要发送的数据" resize="none" />

            <div class="send-options">
              <el-checkbox v-model="sendOptions.autoClear">发送后自动清空</el-checkbox>
              <el-checkbox v-model="sendOptions.hexMode">十六进制发送</el-checkbox>
              <el-checkbox v-model="sendOptions.addNewline">自动添加换行</el-checkbox>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>接收数据</span>
                <div>
                  <el-button type="info" size="small" @click="clearReceivedData">清空</el-button>
                  <el-button type="success" size="small" @click="saveReceivedData">保存</el-button>
                </div>
              </div>
            </template>

            <el-input v-model="receivedText" type="textarea" :rows="5" readonly resize="none" class="received-data" />

            <div class="receive-info">
              <span>已接收: {{ receivedBytes }} 字节</span>
              <el-checkbox v-model="receiveOptions.autoScroll">自动滚动</el-checkbox>
              <el-checkbox v-model="receiveOptions.showTimestamp">显示时间戳</el-checkbox>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { TcpClient } from '@/utils/tcpClient';

// 连接表单
const form = ref({
  host: '127.0.0.1',
  port: 8080,
  autoReconnect: true
});

// 发送数据相关
const sendText = ref('');
const sendOptions = ref({
  autoClear: true,
  hexMode: false,
  addNewline: true
});

// 接收数据相关
const receivedText = ref('');
const receivedBytes = ref(0);
const receiveOptions = ref({
  autoScroll: true,
  showTimestamp: true
});

// 连接状态
const isConnected = ref(false);
const connecting = ref(false);
const tcpClient = ref<TcpClient | null>(null);

// 初始化TCP客户端
const initTcpClient = () => {
  tcpClient.value = new TcpClient({
    host: form.value.host,
    port: form.value.port,
    onConnect: () => {
      isConnected.value = true;
      connecting.value = false;
      addSystemMessage('TCP连接已建立');
      ElMessage.success('连接成功');
    },
    onMessage: (data) => {
      addReceivedMessage(data);
    },
    onClose: () => {
      isConnected.value = false;
      addSystemMessage('TCP连接已关闭');
      if (form.value.autoReconnect) {
        ElMessage.warning('连接断开，正在尝试重连...');
      }
    },
    onError: (error) => {
      connecting.value = false;
      ElMessage.error(`连接错误: ${error.message}`);
    }
  });
};

// 连接/断开连接
const handleConnect = async () => {
  if (isConnected.value) {
    await disconnect();
    return;
  }

  if (!form.value.host || !form.value.port) {
    ElMessage.warning('请输入服务器地址和端口号');
    return;
  }

  connecting.value = true;
  initTcpClient();

  try {
    await tcpClient.value?.connect();
  } catch (error) {
    connecting.value = false;
    ElMessage.error(`连接失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 断开连接
const disconnect = async () => {
  try {
    await tcpClient.value?.disconnect();
    tcpClient.value = null;
    isConnected.value = false;
    ElMessage.info('已断开连接');
  } catch (error) {
    ElMessage.error('断开连接失败');
  } finally {
    connecting.value = false;
  }
};

// 发送数据
const sendData = async () => {
  if (!sendText.value.trim()) {
    ElMessage.warning('请输入要发送的数据');
    return;
  }

  try {
    let dataToSend = sendText.value;

    if (sendOptions.value.addNewline && !dataToSend.endsWith('\n')) {
      dataToSend += '\n';
    }

    if (sendOptions.value.hexMode) {
      // 十六进制发送逻辑（需后端支持）
      await tcpClient.value?.send(hexEncode(dataToSend));
    } else {
      await tcpClient.value?.send(dataToSend);
    }

    // 显示发送的消息
    addSentMessage(dataToSend);

    if (sendOptions.value.autoClear) {
      sendText.value = '';
    }
  } catch (error) {
    ElMessage.error(`发送失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 添加接收消息
const addReceivedMessage = (message: string) => {
  const timestamp = receiveOptions.value.showTimestamp ? `[${new Date().toLocaleTimeString()}] ` : '';

  receivedText.value += `${timestamp}${message}\n`;
  receivedBytes.value += message.length;

  if (receiveOptions.value.autoScroll) {
    nextTick(() => {
      const textarea = document.querySelector('.received-data textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    });
  }
};

// 添加发送消息
const addSentMessage = (message: string) => {
  const timestamp = receiveOptions.value.showTimestamp ? `[${new Date().toLocaleTimeString()}] ` : '';

  receivedText.value += `${timestamp}[发送] ${message}\n`;
  receivedBytes.value += message.length;
};

// 添加系统消息
const addSystemMessage = (message: string) => {
  const timestamp = receiveOptions.value.showTimestamp ? `[${new Date().toLocaleTimeString()}] ` : '';

  receivedText.value += `${timestamp}[系统] ${message}\n`;
};

// 清空接收数据
const clearReceivedData = () => {
  receivedText.value = '';
  receivedBytes.value = 0;
};

// 保存接收数据到文件
const saveReceivedData = () => {
  if (!receivedText.value) {
    ElMessage.warning('没有可保存的数据');
    return;
  }

  const blob = new Blob([receivedText.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tcp_data_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success('数据保存成功');
};

// 十六进制编码（示例）
const hexEncode = (str: string) => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
};

// 组件卸载前断开连接
onBeforeUnmount(() => {
  disconnect();
});
</script>

<style scoped>
.tcp-debugger {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.send-options {
  margin-top: 10px;
  display: flex;
  gap: 15px;
}

.receive-info {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.received-data {
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
