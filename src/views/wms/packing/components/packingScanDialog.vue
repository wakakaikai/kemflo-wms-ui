<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
    <el-form ref="packingFormRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="栈板编号" prop="palletCode">
        <el-input v-model="form.palletCode" clearable placeholder="请输入栈板编号或点击选择" @keydown.tab.prevent="palletCodeKeyDownTab" @keydown.enter.prevent="palletCodeKeyDownTab">
          <template #append>
            <el-button icon="Search" type="primary" @click="showPalletDialog" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="目的仓库" prop="warehouseCode">
        <el-select v-model="form.warehouseCode" placeholder="请选择目的仓库" clearable filterable>
          <el-option v-for="warehouse in warehouseLocationList" :key="warehouse.warehouseCode" :label="`${warehouse.warehouseCode}-${warehouse.warehouseName}`" :value="warehouse.warehouseCode" />
        </el-select>
      </el-form-item>
      <div class="material-record-container">
        <el-row :gutter="24">
          <el-col :lg="12" :md="12" :sm="24">
            <h3>栈板物料记录表</h3>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-form-item label="入库单" prop="sn">
              <el-input ref="snInputRef" v-model="form.sn" clearable placeholder="请扫码入库标签二维码" @keydown.tab.prevent="keyDownTab" @keydown.enter.prevent="keyDownTab" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-table v-loading="loading" :data="filteredData" border style="width: 100%" empty-text="暂无数据">
          <el-table-column label="工单号" align="center" width="130" prop="workOrderNo">
            <template #header>
              <div class="filter-header">
                <div class="collapse__title">
                  <span>工单号</span>
                  <el-icon><Filter /></el-icon>
                </div>
                <el-input v-model="workOrderFilter" size="small" placeholder="搜索工单号" clearable @clear="workOrderFilter = ''" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="条码" align="center" width="130" prop="sn" />
          <el-table-column label="产品料号" align="center" width="150" prop="item" />
          <el-table-column label="产品描述" align="left" prop="itemDesc" :show-overflow-tooltip="true" />
          <el-table-column label="计划数量" align="center" prop="plannedQty" />
          <el-table-column label="打包数量" align="center" min-width="120" prop="packingQty">
            <!--            <template #default="scope">
              <div @dblclick="enableEditing(scope.row)" style="cursor: pointer">
                <div v-if="!scope.row.isEditing">
                  {{ scope.row.packingQty }}
                </div>
                <div v-else>
                  <el-input-number :min="1" v-model="scope.row.packingQty" @blur="savePackingQty(scope.row)" @keyup.enter="savePackingQty(scope.row)" autofocus size="small" style="width: 100px" />
                  <div class="el-form-item__tip">当前最大可入打包数量: {{ scope.row.maxInboundQty || 0 }}</div>
                </div>
              </div>
            </template>-->
          </el-table-column>
          <el-table-column label="入库检" align="center" prop="checkEnable">
            <template #default="scope">
              <dict-tag :options="wms_work_order_check_enable" :value="scope.row.checkEnable" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="{ $index }">
              <el-tooltip content="删除" placement="top">
                <el-button link type="danger" icon="Delete" @click="deleteRecord($index)"></el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 栈板选择对话框 -->
  <pallet-dialog ref="palletDialogRef" @pallet-select-call-back="palletSelectCallBack" />

  <!-- 工单选择对话框 -->
  <work-order-dialog ref="workOrderDialogRef" />

  <!-- 添加条码选择对话框 -->
  <el-dialog v-model="snSelectVisible" title="选择条码" width="60%" append-to-body>
    <el-table :data="snOptions" border @row-dblclick="handleSnSelect" @row-click="handleSnSelect">
      <!-- 单选列（通过高亮行实现） -->
      <el-table-column width="55">
        <template #default="scope">
          <el-radio :model-value="selectedSn?.id === scope.row.id ? scope.row.id : ''" :label="scope.row.id" @change="() => handleSnSelect(scope.row)" class="radio-no-label">
            <span class="el-radio__label"></span>
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column label="条码" align="center" prop="sn" />
      <el-table-column label="工单号" align="center" prop="workOrderNo" />
      <el-table-column label="产品料号" align="center" prop="item" />
      <el-table-column label="产品描述" align="center" prop="itemDesc" />
      <el-table-column label="数量" align="center" prop="qty" />
    </el-table>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="snSelectVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmSnSelect">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="PackingDialog" lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { WarehouseVO } from '@/api/wms/warehouse/types';
import { listWarehouse } from '@/api/wms/warehouse';
import PalletDialog from '@/views/wms/packing/components/palletDialog.vue';
import WorkOrderDialog from '@/views/wms/packing/components/workOrderDialog.vue';
import { WorkOrderForm, WorkOrderQuery } from '@/api/wms/workOrder/types';
import useDialog from '@/hooks/useDialog';

import { addPacking, getPacking, updatePacking } from '@/api/wms/packing';
import { getSnInfo } from '@/api/wms/workOrderSn';
import { WorkOrderSnForm } from '@/api/wms/workOrderSn/types';

const palletDialogRef = ref<InstanceType<typeof PalletDialog>>();
const workOrderDialogRef = ref<InstanceType<typeof WorkOrderDialog>>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const { wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_work_order_check_enable'));
const packingFormRef = ref<ElFormInstance>();
const buttonLoading = ref(false);
const loading = ref(false);
const emit = defineEmits(['packingCallBack']);
// 表单数据
const initFormData: WorkOrderForm = {
  id: undefined,
  workOrderNo: undefined,
  item: undefined,
  itemDesc: undefined,
  checkEnable: undefined,
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  plannedQty: undefined,
  deliveredQty: undefined,
  waitStockQty: undefined,
  packingQty: undefined,
  otherPackingQty: undefined,
  remark: undefined,
  isEditing: false
};
const data = reactive<PageData<WorkOrderForm, WorkOrderQuery>>({
  form: { ...initFormData },

  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    item: undefined,
    itemDesc: undefined,
    checkEnable: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    plannedQty: undefined,
    deliveredQty: undefined,
    waitStockQty: null,
    packingQty: null,
    otherPackingQty: null,
    params: {}
  },
  rules: {
    palletCode: [{ required: true, message: '栈板编号不能为空', trigger: 'change' }],
    packingQty: [
      { required: true, message: '请输入工单打包数量', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          const maxInboundQty = Math.max(form.value.plannedQty - form.value.deliveredQty, 0);
          if (value > maxInboundQty) {
            callback(new Error(`工单打包数量不能超过${maxInboundQty}`));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ]
  }
});
const initWorkOrderSnFormData: WorkOrderSnForm = {
  id: undefined,
  companyName: undefined,
  workOrderNo: undefined,
  sn: undefined,
  qty: undefined,
  sequence: undefined,
  productLine: undefined,
  productDate: undefined,
  status: undefined,
  remark: undefined
};
const snSelectVisible = ref(false);
const snOptions = ref<WorkOrderSnForm[]>([]);
const selectedSn = ref<WorkOrderSnForm>({ ...initWorkOrderSnFormData });

const snInputRef = ref<HTMLInputElement | null>(null);
const { title, visible, openDialog, closeDialog } = useDialog({});
// 创建一个工单号到otherPackingQty的映射
const workOrderToOtherPackingQtyMap = new Map<string, number>();
const { queryParams, form, rules } = toRefs(data);
// 打包记录列表
const packingDetailBoList = ref<WorkOrderForm[]>([]);
// 需要过滤的工单号
const workOrderFilter = ref('');
// 计算筛选后的数据
const filteredData = computed(() => {
  if (!workOrderFilter.value) return packingDetailBoList.value;
  return packingDetailBoList.value.filter((item) => item.workOrderNo.includes(workOrderFilter.value));
});

// 初始化数据
const initPackingDialog = async (id: any) => {
  resetForm();
  workOrderToOtherPackingQtyMap.clear(); // 清空原有数据
  if (id) {
    loading.value = true;
    const res = await getPacking(id);
    Object.assign(form.value, res.data);
    // 初始化列表数据并创建映射
    packingDetailBoList.value =
      res.data?.packingDetailVoList?.map((item) => {
        // 更新工单到otherPackingQty的映射
        if (item.workOrderNo && item.otherPackingQty !== undefined) {
          workOrderToOtherPackingQtyMap.set(item.workOrderNo, Number(item.otherPackingQty));
        }

        return {
          ...item,
          originPackingQty: item.packingQty // 保存原始打包数量
        };
      }) || [];
    loading.value = false;
  }
};

/** 提交按钮 */
const submitForm = () => {
  packingFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      // 校验 packingQty 是否存在
      const invalidItem = packingDetailBoList.value.find((item) => item.packingQty === null || item.packingQty === undefined || isNaN(Number(item.packingQty)) || Number(item.packingQty) <= 0);

      if (invalidItem) {
        proxy?.$modal.msgError('请填写有效的打包数量');
        buttonLoading.value = false;
        return;
      }
      // 提交前删除 packingDetailVoList 属性
      const submitData = { ...form.value };
      delete submitData.packingDetailVoList;

      // 设置 packingDetailBoList 到 packingDetailBoList 属性中
      submitData.packingDetailBoList = packingDetailBoList.value;
      submitData.packingType = 1;
      if (form.value.id) {
        packingDetailBoList.value.map((item: any) => {
          item.palletCode = form.value.palletCode;
        });
        await updatePacking(submitData).finally(() => (buttonLoading.value = false));
      } else {
        packingDetailBoList.value.map((item: any) => {
          item.palletCode = form.value.palletCode;
          item.id = null;
        });
        await addPacking(submitData).finally(() => (buttonLoading.value = false));
      }

      proxy?.$modal.msgSuccess('操作成功');
      visible.value = false;
      emit('packingCallBack');
    }
  });
};

const palletCodeKeyDownTab = async () => {
  if (form.value.palletCode) {
    form.value.palletCode = form.value.palletCode.trim();
    await nextTick(() => {
      if (snInputRef.value) {
        snInputRef.value.focus();
        snInputRef.value.select();
      }
    });
  }
};

const keyDownTab = async () => {
  form.value.sn = form.value.sn.trim();
  await nextTick(() => {
    if (snInputRef.value) {
      snInputRef.value.focus();
      snInputRef.value.select();
    }
  });
  // 校验列表中是否有重复的SN码
  if (packingDetailBoList.value.some((item) => item.sn === form.value.sn)) {
    proxy?.$modal.msgError(`此${form.value.sn}码已存在`);
    return;
  }
  const res = await getSnInfo(form.value.sn);
  if (!res.data) {
    proxy?.$modal.msgError('请输入正确的SN码');
    return;
  }
  // 如果返回的条码数组长度大于1，则显示一个弹框，让用户选择，否则直接添加
  if ((res.data || []).length > 1) {
    snOptions.value = res.data;
    snSelectVisible.value = true;
    // 重置选中项
    selectedSn.value = { ...initWorkOrderSnFormData };
  } else {
    const workOrderSn = res.data[0] || { ...initWorkOrderSnFormData };
    packingDetailBoList.value.push({
      packingDetailBoList: undefined,
      ...workOrderSn,
      snId: workOrderSn.id,
      sn: workOrderSn.sn,
      packingQty: workOrderSn.qty
    });
  }
};

// 添加处理条码选择的方法
const handleSnSelect = (row) => {
  selectedSn.value = row;
};

const confirmSnSelect = () => {
  if (!selectedSn.value) {
    proxy?.$modal.msgError('请选择一个条码');
    return;
  }

  packingDetailBoList.value.push({
    packingDetailBoList: undefined,
    ...selectedSn.value,
    snId: selectedSn.value.id,
    sn: selectedSn.value.sn,
    packingQty: selectedSn.value.qty
  });

  snSelectVisible.value = false;
  selectedSn.value = null;
};

// 显示栈板选择对话框
const showPalletDialog = () => {
  palletDialogRef.value.openDialog();
  palletDialogRef.value.handleQuery();
};
const palletSelectCallBack = (record) => {
  form.value.palletCode = record.palletCode;
};

// 重置表单
const resetForm = () => {
  if (packingFormRef.value) {
    packingFormRef.value.resetFields();
  }
  packingDetailBoList.value = [];
};

// 删除记录
const deleteRecord = (index: any) => {
  ElMessageBox.confirm('确定要删除此记录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      packingDetailBoList.value.splice(index, 1);
      proxy?.$modal.msgSuccess('删除成功');
    })
    .catch(() => {
      // 取消操作
    });
};
const warehouseLocationList = ref<WarehouseVO[]>([]);
/** 查询仓位信息列表 */
const getWarehouseList = async () => {
  const res = await listWarehouse();
  warehouseLocationList.value = res.data;
};

// 模拟加载工单数据
onMounted(() => {
  getWarehouseList();
});

defineExpose({
  initPackingDialog,
  title,
  openDialog,
  closeDialog
});
</script>

<style scoped>
.material-record-container {
  padding: 3px 20px 20px 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

.el-form-item__tip {
  font-size: 12px;
  color: #999;
  line-height: 1;
  padding-top: 4px;
}
.filter-header {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.el-form-item__error {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  margin-top: 2px;
}

.is-error {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset;
  }
}

.radio-no-label {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -12px;
  .el-radio__label {
    display: none;
  }
}
</style>
