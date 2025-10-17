<template>
  <div class="serial-debugger">
    <el-card shadow="never" class="mt-2">
      <template #header>
        <div class="card-header">
          <span>呼叫器数据</span>
          <el-tag :type="isConnected ? 'success' : 'info'" size="small">
            {{ isConnected ? `已连接` : '未连接' }}
          </el-tag>
          <div>
            <el-button :type="isConnected ? 'success' : 'info'" size="small" @click="handleConnect" :loading="connecting">
              {{ isConnected ? '关闭串口' : '打开串口' }}
            </el-button>
            <el-button type="info" size="small" @click="clearHistoryData"> 清空历史 </el-button>
          </div>
        </div>
      </template>

      <el-table :data="paginatedHistoryData" style="width: 100%" size="small">
        <el-table-column prop="timestamp" label="时间" />
        <el-table-column label="类型">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'send' ? 'primary' : 'success'">
              {{ scope.row.type === 'send' ? '发送' : '接收' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="data" label="数据内容" />
        <el-table-column label="上传状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 10px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ShopOrderForm, ShopOrderQuery, ShopOrderVO } from '@/api/mes/shopOrder/types';
import type { OperationObj, ResourceObj } from '@/components/common-type';
import ShopOrderDialog from '@/views/mes/workpanel/components/shopOrderDialog.vue';
import ResourceDialog from '@/views/mes/workpanel/components/resourceDialog.vue';
import OperationDialog from '@/views/mes/workpanel/components/operationDialog.vue';
import { Close, Cpu, Operation } from '@element-plus/icons-vue';
import { queryDataCollectionByShopOrder, saveShopOrderWeightNoSn, getShopOrderWeightNoSnInfo } from '@/api/mes/workpanel';
import { parseTime } from '@/utils/ruoyi';
import { v4 as uuidv4 } from 'uuid';
import { saveEquipmentAbnormalCall } from '@/api/mes/message';
// 获取路由参数
const { currentRoute } = useRouter();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

// 历史数据表格
const historyData = ref<
  Array<{
    timestamp: string;
    uuid: string;
    type: 'send' | 'receive';
    data: string;
    status: 'pending' | 'success' | 'failed';
  }>
>([]);

// 表格分页
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 定义类型
interface SerialPortForm {
  portName: string;
  portDesc: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;
  flowControl: string;
}

interface SerialPortQuery {
  pageNum: number;
  pageSize: number;
  portName?: string;
  portDesc?: string;
  baudRate?: number;
}

interface PageData<T, Q> {
  form: T;
  queryParams: Q;
  rules: any;
}

// 初始化表单数据
const initFormData: SerialPortForm = {
  portName: '',
  portDesc: '',
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none'
};

const data = reactive<PageData<SerialPortForm, SerialPortQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    portName: '',
    portDesc: '',
    baudRate: 115200
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

// Web Serial API相关引用
const serialPort = ref<any | null>(null);
let reader: ReadableStreamBYOBReader | null = null;
let writer: WritableStreamDefaultWriter | null = null;
let keepReading = false;

// 数据缓冲区
let dataBuffer: number[] = [];

// 初始化加载
onMounted(() => {
  const routerPath = currentRoute.value.fullPath;
  const lastSegment = routerPath.split('/').pop();

  // 解绑所有的串口连接
  disconnect();

  // 检查浏览器是否支持Web Serial API
  if (!('serial' in navigator)) {
    ElMessage.error('当前浏览器不支持Web Serial API，请使用Chrome 89+或Edge 89+浏览器');
  }

  // 监听连接状态变化
  navigator.serial?.addEventListener('connect', handleSerialConnect);
  navigator.serial?.addEventListener('disconnect', handleSerialDisconnect);
});

// 组件卸载前关闭连接并撤销权限
onBeforeUnmount(async () => {
  navigator.serial?.removeEventListener('connect', handleSerialConnect);
  navigator.serial?.removeEventListener('disconnect', handleSerialDisconnect);
  // 断开串口连接
  await disconnect();

  // 撤销对串行端口的访问权限
  if (serialPort.value && 'forget' in serialPort.value) {
    try {
      await serialPort.value.forget();
      console.log('串行端口访问权限已撤销');
    } catch (error) {
      console.error('撤销串行端口权限时出错:', error);
    }
  }
});

// 处理串口连接事件
const handleSerialConnect = (event: Event) => {
  ElMessage.success('检测到串口设备连接');
  refreshSerialPortVoList();
};

// 处理串口断开事件
const handleSerialDisconnect = (event: Event) => {
  if (isConnected.value) {
    disconnect();
    ElMessage.warning('串口设备已断开');
  }
};

// 刷新串口列表
const refreshSerialPortVoList = async () => {
  try {
    // Web Serial API不提供列出所有可用端口的功能
    // 用户需要通过requestPort手动选择
    ElMessage.info('请点击"打开串口"按钮选择串口设备');
    serialPortVoList.value = []; // 清空列表
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

// 获取端口显示名称
const getPortDisplayName = (port: any) => {
  // 尝试获取串口的真实名称
  let name = port.path || '未知端口';

  // 尝试获取更多信息
  const info = port.getInfo();

  // 对于虚拟串口和蓝牙设备，尝试获取更多描述信息
  if (port.productName) {
    name = `${port.productName} (${port.path})`;
  } else if (info.usbVendorId && info.usbProductId) {
    name = `USB设备 (0x${info.usbVendorId.toString(16)}:0x${info.usbProductId.toString(16)})`;
  }

  return name;
};

// 连接串口
const connect = async () => {
  connecting.value = true;

  try {
    // 请求串口权限
    serialPort.value = await navigator.serial.requestPort();

    // 获取端口信息并设置端口名称
    form.value.portName = getPortDisplayName(serialPort.value);

    // 打开串口连接，设置缓冲区大小
    const bufferSize = 2048; // 2kB
    await serialPort.value.open({
      baudRate: form.value.baudRate,
      dataBits: form.value.dataBits as 8 | 7 | 6 | 5,
      stopBits: form.value.stopBits as 1 | 2,
      parity: form.value.parity as 'none' | 'even' | 'odd',
      flowControl: form.value.flowControl as 'none' | 'hardware',
      bufferSize: bufferSize
    });

    isConnected.value = true;
    keepReading = true;
    dataBuffer = []; // 清空数据缓冲区

    // 启动数据读取
    readSerialData();
    ElMessage.success('串口连接成功');
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      ElMessage.warning('未选择串口设备');
    } else {
      ElMessage.error('串口连接失败: ' + (error.message || error));
    }
  } finally {
    connecting.value = false;
  }
};

// 发送数据到后台
const submitForm = async (data: any, curUUId: string) => {
  // 更新historyData.value中uuid为curUUId的status为success
  historyData.value = historyData.value.map((item: any) => {
    if (item.uuid === curUUId) {
      item.status = 'success';
    }
    return item;
  });
  // 预处理数据，将Python风格的JSON转换为标准JSON
  let processedData = data;
  if (typeof data === 'string') {
    // 替换单引号为双引号
    processedData = data
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false');
  }

  const parsedData = JSON.parse(processedData);
  await saveEquipmentAbnormalCall(parsedData);
};

// 处理数据包
const processDataPacket = (packet: string) => {
  // 将完整数据包添加到显示区域（历史数据）
  receivedText.value = packet;
  receivedBytes.value = packet.length;

  // 添加到历史数据表格
  const uuid = uuidv4();
  historyData.value.push({
    timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
    uuid: uuid,
    type: 'receive',
    data: packet.trim(),
    status: 'pending'
  });
  // 更新分页总数
  pagination.value.total = historyData.value.length;
  submitForm(packet, uuid);
  // 自动滚动
  if (receiveOptions.value.autoScroll) {
    nextTick(() => {
      const textareas = document.querySelectorAll('.el-textarea__inner');
      if (textareas.length > 0) {
        const textarea = textareas[textareas.length - 1] as HTMLTextAreaElement;
        textarea.scrollTop = textarea.scrollHeight;
      }
    });
  }
};

// 读取串口数据 - 使用BYOB模式读取
const readSerialData = async () => {
  if (!serialPort.value || !serialPort.value.readable) {
    return;
  }

  try {
    // 获取BYOB读取器
    reader = serialPort.value.readable.getReader({ mode: 'byob' });

    // 设置缓冲区大小
    const bufferSize = 2048; // 2kB
    let buffer = new ArrayBuffer(bufferSize);

    while (keepReading) {
      try {
        const { value, done } = await reader.read(new Uint8Array(buffer));
        if (done) {
          break;
        }

        // 更新缓冲区
        buffer = value.buffer;
        // 将新数据追加到数据缓冲区
        dataBuffer.push(...value);

        // 检查缓冲区是否以}结束的
        if (dataBuffer.length >= 1 && dataBuffer[dataBuffer.length - 1] === 0x7d) {
          // 将缓冲区数据转换为字符串
          const textDecoder = new TextDecoder();
          const packet = textDecoder.decode(new Uint8Array(dataBuffer));
          processDataPacket(packet);
          dataBuffer = [];
        }
      } catch (error) {
        // 处理报错
        if (keepReading) {
          console.error('读取串口数据时发生错误:', error);
        }
        break;
      }
    }
  } catch (error: any) {
    if (keepReading) {
      ElMessage.error('读取串口数据出错: ' + (error.message || error));
    }
  } finally {
    // 释放读取器锁
    if (reader) {
      try {
        reader.releaseLock();
      } catch (e) {
        // 忽略释放锁时的错误
      }
      reader = null;
    }
  }
};

// 断开串口连接
const disconnect = async () => {
  keepReading = false;

  try {
    // 停止读取
    if (reader) {
      try {
        await reader.cancel();
      } catch (e) {
        // 忽略取消错误
      }
      try {
        // 再次检查reader是否仍然存在，因为在await reader.cancel()期间可能已经变为null
        if (reader) {
          reader.releaseLock();
        }
      } catch (e) {
        // 忽略释放锁时的错误
      }
      reader = null;
    }

    // 释放写入器
    if (writer) {
      try {
        await writer.close();
      } catch (e) {
        // 忽略关闭错误
      }
      try {
        // 同样添加保护性检查
        if (writer) {
          writer.releaseLock();
        }
      } catch (e) {
        // 忽略释放锁时的错误
      }
      writer = null;
    }

    // 关闭串口
    if (serialPort.value && serialPort.value.readable) {
      await serialPort.value.close();
    }

    isConnected.value = false;
    serialPort.value = null;
    dataBuffer = []; // 清空数据缓冲区

    ElMessage.info('串口已断开');
  } catch (error: any) {
    ElMessage.error('断开串口失败: ' + (error.message || error));
  }
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
  a.download = `serial_data_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success('数据保存成功');
};

// 计算分页后的数据
const paginatedHistoryData = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return historyData.value.slice().reverse().slice(start, end);
});

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待上传';
    case 'success':
      return '成功';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'success':
      return 'success';
    case 'failed':
      return 'danger';
    default:
      return 'info';
  }
};

// 分页大小改变
const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val;
  pagination.value.currentPage = 1;
};

// 当前页改变
const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val;
};

// 清空历史数据
const clearHistoryData = () => {
  historyData.value = [];
  pagination.value.total = 0;
  pagination.value.currentPage = 1;
};
</script>

<style scoped>
.dashed-blue-btn.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dashed-blue-btn {
  border: 1px dashed #3b82f6 !important;
  color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
  justify-content: flex-start;
}

.dashed-blue-btn:hover {
  border-color: #2563eb !important;
  color: #2563eb !important;
  background-color: rgba(59, 130, 246, 0.1) !important;
}
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
.dc-btn-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.text-white {
  color: white !important;
}
</style>
