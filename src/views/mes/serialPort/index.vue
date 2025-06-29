<template>
  <div class="serial-debugger">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>串口调试工具</span>
          <el-tag :type="isConnected ? 'success' : 'info'" size="small">
            {{ isConnected ? `已连接: ${form.portName}` : '未连接' }}
          </el-tag>
          <el-button type="primary" size="small" @click="handleConnect" :loading="connecting">
            {{ isConnected ? '关闭串口' : '打开串口' }}
          </el-button>
        </div>
      </template>

      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="串口端口">
              <el-select v-model="form.portName" placeholder="请选择串口" :disabled="isConnected" @click="refreshSerialPortVoList">
                <el-option v-for="port in serialPortVoList" :key="port.portName" :label="port.portName + ' ' + port.portDesc" :value="port.portName" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="波特率">
              <el-select v-model="form.baudRate" placeholder="请选择波特率" :disabled="isConnected">
                <el-option v-for="rate in baudRates" :key="rate" :label="rate.toString()" :value="rate" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
                  <el-button type="info" size="small" @click="clearReceivedData"> 清空 </el-button>
                  <el-button type="success" size="small" @click="saveReceivedData"> 保存 </el-button>
                </div>
              </div>
            </template>

            <el-input v-model="receivedText" type="textarea" :rows="5" readonly resize="none" />

            <div class="receive-info">
              <span>已接收: {{ receivedBytes }} 字节</span>
              <el-checkbox v-model="receiveOptions.autoScroll">自动滚动</el-checkbox>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { serialPortApi } from '@/api/mes/serialPort';
import { SerialPortForm, SerialPortQuery } from '@/api/mes/serialPort/types';
import { useSerialNoticeStore } from '@/store/modules/serialNotice';

const initFormData: SerialPortForm = {
  portName: '',
  portDesc: '',
  baudRate: 9600
};
const data = reactive<PageData<SerialPortForm, SerialPortQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    portName: '',
    portDesc: '',
    baudRate: 9600
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

// 可用串口列表
const serialPortVoList = ref<SerialPortForm[]>([]);
// 常用波特率列表
const baudRates = [
  110, 300, 600, 1200, 2400, 4800, 6000, 7200, 9600, 14400, 19200, 28800, 38400, 57600, 76800, 115200, 230400, 250000, 256000, 460800, 500000, 576000, 921600, 1000000, 1500000, 2000000, 3000000,
  6000000, 12000000
];

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
  autoScroll: true
});

// 连接状态
const isConnected = ref(false);
const connecting = ref(false);

// 初始化加载可用串口
onMounted(() => {
  disconnect();
  refreshSerialPortVoList();
  // 监听新消息
  watch(
    () => noticeStore.state.notices, // 直接监听store中的notices
    (newMessages) => {
      if (newMessages.length === 0) {
        receivedText.value = '';
        receivedBytes.value = 0;
        return;
      }

      // 只处理新增消息
      const newCount = newMessages.length - messages.value.length;
      if (newCount > 0) {
        const latestMessages = newMessages.slice(-newCount);
        latestMessages.forEach((msg) => {
          receivedText.value += msg.message + '\n';
          receivedBytes.value += msg.message.length;
        });

        if (receiveOptions.value.autoScroll) {
          nextTick(() => {
            const textarea = document.querySelector('.el-textarea__inner:last-child') as HTMLTextAreaElement;
            if (textarea) {
              textarea.scrollTop = textarea.scrollHeight;
            }
          });
        }
      }

      messages.value = [...newMessages]; // 更新本地消息副本
    },
    { deep: true }
  );
});

// 组件卸载前关闭连接
onBeforeUnmount(() => {
  disconnect();
});

// 刷新串口列表
const refreshSerialPortVoList = async () => {
  try {
    const response = await serialPortApi.getAvailablePorts();
    serialPortVoList.value = response.data;
  } catch (error) {
    ElMessage.error('获取串口列表失败');
  }
};

// 连接/断开串口
const handleConnect = async () => {
  if (isConnected.value) {
    await disconnect();
  } else {
    await connect();
  }
};
const noticeStore = useSerialNoticeStore();
const messages = ref<any[]>([]);
// 连接串口
const connect = async () => {
  if (!form.value.portName) {
    ElMessage.warning('请选择串口');
    return;
  }

  connecting.value = true;

  try {
    // 调用后端接口打开串口
    await serialPortApi.openPort(form.value);
    isConnected.value = true;
    messages.value = noticeStore.state.notices;
    console.log(noticeStore.state.notices);

    ElMessage.success('串口连接成功');
  } catch (error) {
    ElMessage.error('串口连接失败');
  } finally {
    connecting.value = false;
  }
};

// 断开串口连接
const disconnect = async () => {
  try {
    await serialPortApi.closePort();
    isConnected.value = false;
    ElMessage.info('串口已断开');
  } catch (error) {
    ElMessage.error('断开串口失败');
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
      await serialPortApi.sendHex({ sendContent: dataToSend });
    } else {
      await serialPortApi.sendText({ sendContent: dataToSend });
    }

    ElMessage.success('数据发送成功');

    if (sendOptions.value.autoClear) {
      sendText.value = '';
    }
  } catch (error) {
    ElMessage.error('数据发送失败');
  }
};

// 清空接收数据
const clearReceivedData = () => {
  receivedText.value = '';
  receivedBytes.value = 0;
  noticeStore.clearNotice();
  messages.value = [];
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
  a.download = `serial_data_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success('数据保存成功');
};
</script>

<style scoped>
.serial-debugger {
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

.el-textarea {
  font-family: monospace;
}
</style>
