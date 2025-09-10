<template>
  <div class="multi-order-pallet">
    <el-card class="main-card">
      <!-- 基本信息区域 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form :model="formData" label-width="auto">
            <el-form-item label="栈板号" required>
              <el-input
                ref="palletInput"
                v-model="formData.palletCode"
                clearable
                placeholder="请输入栈板编号或点击选择"
                @keydown.enter.prevent="handlePalletScan"
                @keydown.tab.prevent="handlePalletScan"
              >
                <template #append>
                  <el-button icon="Search" type="primary" @click="showPalletDialog" />
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>

      <!-- SN码扫描区域 -->
      <el-card v-if="palletStatusNormal" class="scan-area">
        <template #header>
          <div class="card-header">
            <span>SN码扫描 ({{ totalSnCount }})</span>
            <el-button v-if="formData.id" v-hasPermi="['wms:packing:edit']" type="success" plain icon="Edit" :disabled="!canGenerateEntries" @click="generateStorageDialog()">修改入库单</el-button>
            <el-button v-else v-hasPermi="['wms:packing:add']" type="primary" plain icon="Plus" :disabled="!canGenerateEntries" @click="generateStorageDialog">生成入库单</el-button>
          </div>
        </template>
        <el-input ref="snInput" v-model="currentSn" placeholder="请扫描SN码" clearable @keydown.tab.prevent="handleSnScan" @keydown.enter.prevent="handleSnScan" />
      </el-card>

      <!-- 工单-SN列表 -->
      <div v-if="orderSnMap.size > 0" class="order-sn-list">
        <el-card v-for="[shopOrder, snList] in orderSnMap" :key="shopOrder" class="order-card">
          <template #header>
            <div class="order-header">
              <span>工&nbsp;&nbsp;单&nbsp;&nbsp;号: {{ shopOrder }}</span>
              <span>标签数量: {{ snList.length }}</span>
              <span>产品数量: {{ getOrderTotalQty(shopOrder) }}</span>
              <el-button type="danger" size="small" @click="removeAllSn(shopOrder)" :icon="Delete" circle />
            </div>
            <div class="order-header">
              <span>产品料号: {{ snList[0].item }}</span>
            </div>
            <div class="order-header">
              <span>产品描述: {{ snList[0].itemDesc }}</span>
            </div>
          </template>

          <el-table :data="snList" border height="300">
            <el-table-column label="序号" width="55" type="index" align="center" />
            <el-table-column prop="sfc" label="SN码" align="center" />
            <el-table-column prop="productDate" label="生产时间" align="center" />
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button size="small" type="danger" @click="removeSn(shopOrder, $index)"> 删除 </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 入库单确认对话框 -->
      <el-dialog v-model="confirmDialogVisible" title="入库单确认" width="70%">
        <el-form ref="packingFormRef" :model="formData" :rules="rules" label-width="80px">
          <el-form-item label="栈板编号" prop="palletCode">
            <el-input v-model="formData.palletCode" clearable placeholder="请输入栈板编号或点击选择">
              <template #append>
                <el-button icon="Search" type="primary" @click="showPalletDialog" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="目的仓库" prop="warehouseCode">
            <el-select v-model="formData.warehouseCode" placeholder="请选择目的仓库" clearable filterable>
              <el-option v-for="warehouse in warehouseLocationList" :key="warehouse.code" :label="`${warehouse.code}-${warehouse.name}`" :value="warehouse.code" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-table :data="confirmData" border>
          <el-table-column prop="shopOrder" label="工单号" align="center">
            <template #default="scope">
              <span>{{ scope.row.shopOrder.split('-')[0] || scope.row.shopOrder }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="item" label="产品料号" align="center" />
          <el-table-column prop="itemDesc" label="产品描述" align="center" />
          <el-table-column prop="plannedQty" label="计划数量" align="center" />
          <el-table-column prop="totalQty" label="入库数量" align="center" />
        </el-table>
        <template #footer>
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="confirmStorage">确认入库</el-button>
        </template>
      </el-dialog>

      <!-- 栈板选择对话框 -->
      <pallet-dialog ref="palletDialogRef" @pallet-select-call-back="palletSelectCallBack" />

      <audio id="warningAudio" :src="warningsMp3" hidden="hidden" />
      <audio id="successAudio" :src="successMp3" hidden="hidden" />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { Delete } from '@element-plus/icons-vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import { ref, reactive, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { getBoxOrPalletSn } from '@/api/mes/sfc';
import { SfcVO, SfcQuery, SfcForm } from '@/api/mes/sfc/types';
import PalletDialog from '@/views/wms/packing/components/palletDialog.vue';
import { WarehouseLocationVO } from '@/api/wms/warehouseLocation/types';
import { listWarehouseLocation } from '@/api/wms/warehouseLocation';
import { addPacking, updatePacking } from '@/api/wms/packing';
import { getPalletPacking } from '@/api/wms/pallet';
import warningsMp3 from '@/assets/MP3/warnings.mp3';
import successMp3 from '@/assets/MP3/success.mp3';
import { HttpStatus } from '@/enums/RespEnum';

const warehouseLocationList = ref<WarehouseLocationVO[]>([]);
const palletDialogRef = ref<InstanceType<typeof PalletDialog>>();
const buttonLoading = ref(false);
const palletStatusNormal = ref(false);
const initFormData: SfcForm = {
  id: undefined,
  sfc: undefined
};
const data = reactive<PageData<SfcForm, SfcQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    sfc: undefined,
    params: {}
  },
  rules: {
    sfc: [{ required: true, message: '产品条码不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const sfcFormRef = ref<ElFormInstance>();
// 类型定义
interface SnInfo {
  sfc: string;
  shopOrder: string;
  item: string;
  itemDesc: string;
  productDate: string;
  qty: number;
  plannedQty: number;
}

interface StorageEntry {
  shopOrder: string;
  totalQty: number;
  item: string;
  itemDesc: string;
  plannedQty: number;
}

interface formData {
  palletCode: string;
  warehouseCode: string;
  packingCode: string;
}

// 数据状态
const formData = ref<formData>({
  palletCode: '',
  warehouseCode: '',
  packingCode: ''
});

const currentSn = ref('');
const orderSnMap = ref<Map<string, SnInfo[]>>(new Map());
const storageEntries = ref<Record<string, string>>({});
const confirmDialogVisible = ref(false);
const confirmData = ref<StorageEntry[]>([]);

// 表单引用
const palletInput = ref<FormInstance>();
const snInput = ref<FormInstance>();

// 计算工单总数量方法
const getOrderTotalQty = (shopOrder: string) => {
  const snList = orderSnMap.value.get(shopOrder) || [];
  return snList.reduce((total, sn) => total + (parseFloat(sn.qty) || 1), 0);
};

// 计算属性
const totalSnCount = computed(() => {
  let count = 0;
  orderSnMap.value.forEach((snList) => {
    count += snList.length;
  });
  return count;
});

const canGenerateEntries = computed(() => {
  return orderSnMap.value.size > 0 && totalSnCount.value > 0;
});

/** 查询仓位信息列表 */
const getWarehouseList = async () => {
  const res = await listWarehouseLocation({
    level: 1
  });
  warehouseLocationList.value = res.data;
};

// 显示栈板选择对话框
const showPalletDialog = () => {
  palletDialogRef.value.openDialog();
  palletDialogRef.value.handleQuery();
};
const palletSelectCallBack = (record) => {
  formData.value.palletCode = record.palletCode;
  if (record.palletCode) {
    palletStatusNormal.value = true;
    successVoice();
  }
};
/** 栈板号扫码 */
const handlePalletScan = async () => {
  if (!formData.value.palletCode) {
    proxy.$modal.msgWarning('请输入栈板号');
    warnVoice();
    return;
  }
  currentSn.value = '';
  orderSnMap.value.clear();
  storageEntries.value = {};
  palletStatusNormal.value = false;
  try {
    // 校验栈板号是否有效
    const res = await getPalletPacking(formData.value.palletCode);
    if (res.data) {
      // res.data.status 如果是0 1 4可以正常绑定
      if (res.data.status === 0 || res.data.status === 1 || res.data.status === 4) {
        proxy.$modal.msgSuccess('栈板号校验通过，可以开始扫描SN码');
        successVoice();
        palletStatusNormal.value = true;
        nextTick(() => {
          snInput.value?.focus();
        });
      } else {
        proxy.$modal.msgError(`栈板号${formData.value.palletCode}状态为${res.data.statusDesc}，请重新选择栈板`);
        warnVoice();
      }
    } else {
      proxy.$modal.msgError(`栈板号${formData.value.palletCode}不存在`);
      warnVoice();
    }
    if (res.data && res.data.packingDetailSnVoList) {
      // 处理返回的SN数组
      const processedSnList = res.data.packingDetailSnVoList.map((snInfo) => ({
        sfc: snInfo.sn,
        shopOrder: snInfo.workOrderNo,
        plannedQty: snInfo.plannedQty,
        item: snInfo.item,
        itemDesc: snInfo.itemDesc,
        qty: snInfo.qty || 1,
        productDate: snInfo.productDate
      }));

      // 检查重复并分类到工单
      const duplicateSns: string[] = [];
      const newSnCountByOrder: Record<string, number> = {};

      processedSnList.forEach((snInfo) => {
        let isDuplicate = false;

        // 检查是否已存在该SN
        orderSnMap.value.forEach((snList) => {
          if (snList.some((item) => item.sfc === snInfo.sfc)) {
            isDuplicate = true;
          }
        });

        if (isDuplicate) {
          duplicateSns.push(snInfo.sfc);
          return;
        }

        // 初始化工单计数（确保是数字）
        if (!newSnCountByOrder[snInfo.shopOrder]) {
          newSnCountByOrder[snInfo.shopOrder] = 0;
        }

        // 初始化工单SN列表（如果不存在）
        if (!orderSnMap.value.has(snInfo.shopOrder)) {
          orderSnMap.value.set(snInfo.shopOrder, []);
          newSnCountByOrder[snInfo.shopOrder] = 0;
        }

        // 添加到对应工单
        orderSnMap.value.get(snInfo.shopOrder)?.push(snInfo);
        newSnCountByOrder[snInfo.shopOrder] += 1;
      });
    }
    if (res.data && res.data.packingVo) {
      const packingVo = res.data.packingVo;
      formData.value.id = packingVo.id;
      formData.value.warehouseCode = packingVo.warehouseCode;
      formData.value.packingCode = packingVo.packingCode;
    }
  } catch (error) {
    proxy.$modal.msgError('栈板号校验失败');
    warnVoice();
  }
};

/** SN码扫码 */
const handleSnScan = async () => {
  if (!currentSn.value) {
    proxy.$modal.msgWarning('请输入SN码');
    warnVoice();
    return;
  }

  try {
    queryParams.value.sfc = currentSn.value;
    const { success, data, msg } = await getBoxOrPalletSn(queryParams.value);
    if (!success || !data?.sfcVoList?.length) {
      proxy.$modal.msgError(msg || `条码${currentSn.value}在MES中不存在`);
      warnVoice();
      currentSn.value = '';
      return;
    } else if (data.sfcVoList.length > 0) {
      const errorMsg = data.sfcVoList
        .filter((sfcVo) => sfcVo.status !== 'DONE')
        .map((sfcVo) => `条码${sfcVo.sfc}在MES中状态不为完工`)
        .join('\n');
      if (errorMsg) {
        proxy.$modal.msgError(errorMsg);
        warnVoice();
        return;
      }
    }

    // 处理返回的SN数组
    const processedSnList = data.sfcVoList.map((snInfo) => ({
      sfc: snInfo.sfc,
      shopOrder: snInfo.shopOrder,
      plannedQty: snInfo.plannedQty,
      item: snInfo.item,
      itemDesc: snInfo.itemDesc,
      qty: snInfo.qty || 1,
      productDate: snInfo.modifyTime
    }));

    // 检查重复并分类到工单
    const duplicateSns: string[] = [];
    const newSnCountByOrder: Record<string, number> = {};

    processedSnList.forEach((snInfo) => {
      let isDuplicate = false;

      // 检查是否已存在该SN
      orderSnMap.value.forEach((snList) => {
        if (snList.some((item) => item.sfc === snInfo.sfc)) {
          isDuplicate = true;
        }
      });

      if (isDuplicate) {
        duplicateSns.push(snInfo.sfc);
        return;
      }

      // 初始化工单计数（确保是数字）
      if (!newSnCountByOrder[snInfo.shopOrder]) {
        newSnCountByOrder[snInfo.shopOrder] = 0;
      }

      // 初始化工单SN列表（如果不存在）
      if (!orderSnMap.value.has(snInfo.shopOrder)) {
        orderSnMap.value.set(snInfo.shopOrder, []);
        newSnCountByOrder[snInfo.shopOrder] = 0;
      }

      // 添加到对应工单
      orderSnMap.value.get(snInfo.shopOrder)?.push(snInfo);
      newSnCountByOrder[snInfo.shopOrder] += 1;
    });
    // 显示处理结果反馈
    if (duplicateSns.length > 0) {
      proxy.$modal.msgWarning(`以下SN码已存在: ${duplicateSns.join(', ')}`);
      warnVoice();
      return;
    }

    const addedOrders = Object.keys(newSnCountByOrder);
    if (addedOrders.length > 0) {
      const successMsg = addedOrders.map((order) => `工单 ${order} 新增 ${newSnCountByOrder[order]} 个SN`).join('; ');
      proxy.$modal.msgSuccess(`扫描成功: ${successMsg}`);
      successVoice();
    }

    currentSn.value = '';
    nextTick(() => snInput.value?.focus());
  } catch (error) {
    proxy.$modal.msgError('SN码查询失败，请稍后重试');
    warnVoice();
    currentSn.value = '';
  }
};
const removeAllSn = (shopOrder: string) => {
  ElMessageBox.confirm(`确定要删除工单 ${shopOrder} 的所有SN码吗？此操作不可恢复。`, '确认删除', {
    type: 'warning'
  })
    .then(() => {
      // 删除该工单的所有SN码
      orderSnMap.value.delete(shopOrder);
      delete storageEntries.value[shopOrder];
      proxy.$modal.msgSuccess(`已删除工单 ${shopOrder} 的所有SN码`);
    })
    .catch(() => {
      // 用户取消删除
    });
};

/** 移除SN码 */
const removeSn = (shopOrder: string, index: number) => {
  const snList = orderSnMap.value.get(shopOrder);
  if (snList) {
    const removedSn = snList[index].sfc;
    snList.splice(index, 1);
    proxy.$modal.msgSuccess(`已移除SN码 ${removedSn}`);

    // 如果工单没有SN了，移除工单条目
    if (snList.length === 0) {
      orderSnMap.value.delete(shopOrder);
      delete storageEntries.value[shopOrder];
    }
  }
};

/** 生成入库单弹框 */
const generateStorageDialog = () => {
  confirmData.value = [];

  orderSnMap.value.forEach((snList, shopOrder) => {
    // 计算总数量
    const totalQty = snList.reduce((sum, sn) => sum + (parseFloat(sn.qty) || 1), 0);
    confirmData.value.push({
      shopOrder,
      totalQty,
      item: snList[0]?.item || '',
      itemDesc: snList[0]?.itemDesc || '',
      plannedQty: parseFloat(snList[0]?.plannedQty) || 0
    });
  });

  confirmDialogVisible.value = true;
  getWarehouseList();
};

/** 确认入库 */
const confirmStorage = async () => {
  try {
    // 调用API确认入库
    buttonLoading.value = true;
    confirmDialogVisible.value = false;
    // 数组进行赋值
    const packingDetailBoList = [];
    confirmData.value.forEach((item: any) => {
      const snList = orderSnMap.value.get(item.shopOrder) || [];
      const packingDetailSnBoList = snList.map((sn) => ({
        workOrderNo: item.shopOrder,
        sn: sn.sfc,
        qty: parseFloat(sn.qty) || 1,
        productDate: sn.productDate
      }));

      const newItem = {
        ...item,
        warehouseCode: formData.value.warehouseCode,
        palletCode: formData.value.palletCode,
        workOrderNo: item.shopOrder.split('-')[0] || item.shopOrder,
        packingQty: item.totalQty,
        packingDetailSnBoList: packingDetailSnBoList
      };
      packingDetailBoList.push(newItem);
    });

    const submitData = {
      id: formData.value.id,
      palletCode: formData.value.palletCode,
      warehouseCode: formData.value.warehouseCode,
      packingCode: formData.value.packingCode,
      packingType: 2,
      packingDetailBoList: packingDetailBoList
    };
    if (formData.value.id) {
      confirmData.value.map((item: any) => {
        item.palletCode = form.value.palletCode;
      });
      const res = await updatePacking(submitData).finally(() => (buttonLoading.value = false));
      if (res.code == HttpStatus.SUCCESS) {
        proxy?.$modal.msgSuccess('操作成功');
        successVoice();
      }
    } else {
      confirmData.value.map((item: any) => {
        item.palletCode = form.value.palletCode;
        item.id = null;
      });
      const res = await addPacking(submitData).finally(() => (buttonLoading.value = false));
      if (res.code == HttpStatus.SUCCESS) {
        proxy?.$modal.msgSuccess('操作成功');
        successVoice();
      }
    }

    // 重置表单
    resetFormData();

    nextTick(() => {
      palletInput.value?.focus();
    });
    buttonLoading.value = false;
  } catch (error) {
    buttonLoading.value = false;
    warnVoice();
  }
};

/**重置表单*/
const resetFormData = () => {
  // 重置表单
  formData.value = {
    id: null,
    packingCode: '',
    packingType: 2,
    warehouseCode: '',
    palletCode: ''
  };
  currentSn.value = '';
  orderSnMap.value.clear();
  storageEntries.value = {};
};

/**预警声音播放*/
const warnVoice = () => {
  // 预警声音播放
  document.getElementById('warningAudio').play();
};

/**成功声音播放*/
const successVoice = () => {
  // 成功声音播放
  document.getElementById('successAudio').play();
};
</script>

<style lang="scss" scoped>
.multi-order-pallet {
  padding: 20px;

  .main-card {
    margin: 0 auto;
  }

  .scan-area {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .order-sn-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(48%, 1fr));
    gap: 20px;
    margin-top: 20px;

    .order-card {
      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }
}

@media (max-width: 768px) {
  .multi-order-pallet {
    padding: 10px;

    .order-sn-list {
      grid-template-columns: 1fr;
    }
  }
}
</style>
