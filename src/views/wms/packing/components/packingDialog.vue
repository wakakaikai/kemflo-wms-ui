<template>
  <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
    <el-form ref="packingFormRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="栈板编号" prop="palletCode">
        <el-input v-model="form.palletCode" clearable placeholder="请输入栈板编号或点击选择">
          <template #append>
            <el-button icon="Search" type="primary" @click="showPalletDialog" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="目的仓库" prop="warehouseCode">
        <el-select v-model="form.warehouseCode" placeholder="请选择目的仓库" clearable filterable>
          <el-option v-for="warehouse in warehouseLocationList" :key="warehouse.code" :label="`${warehouse.code}-${warehouse.name}`" :value="warehouse.code" />
        </el-select>
      </el-form-item>
      <div class="material-record-container">
        <el-row :gutter="24">
          <el-col :lg="12" :md="12" :sm="24">
            <h3>栈板物料记录表</h3>
          </el-col>
          <el-col :lg="12" :md="12" :sm="24">
            <el-button type="primary" class="mt-[12px] float-right" @click="showWorkOrderDialog">新增记录</el-button>
          </el-col>
        </el-row>
        <el-table :data="filteredData" border style="width: 100%" empty-text="暂无数据">
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
          <el-table-column label="产品料号" align="center" width="150" prop="item" />
          <el-table-column label="产品描述" align="left" prop="itemDesc" :show-overflow-tooltip="true" />
          <el-table-column label="计划数量" align="center" prop="plannedQty" />
          <el-table-column label="已交货数量" align="center" prop="deliveredQty" />
          <el-table-column label="待入库数量" align="center" prop="waitStockQty" />
          <el-table-column label="打包数量" align="center" min-width="120" prop="packingQty">
            <template #default="scope">
              <div @dblclick="enableEditing(scope.row)" style="cursor: pointer">
                <div v-if="!scope.row.isEditing">
                  {{ scope.row.packingQty }}
                </div>
                <div v-else>
                  <el-input v-model.number="scope.row.packingQty" @blur="savePackingQty(scope.row)" @keyup.enter="savePackingQty(scope.row)" autofocus size="small" style="width: 100px" />
                </div>
              </div>
            </template>
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
</template>

<script setup name="PackingDialog" lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { listWarehouseLocation } from '@/api/wms/warehouseLocation';
import { WarehouseLocationVO } from '@/api/wms/warehouseLocation/types';
import PalletDialog from '@/views/wms/packing/components/palletDialog.vue';
import WorkOrderDialog from '@/views/wms/packing/components/workOrderDialog.vue';

const palletDialogRef = ref<InstanceType<typeof PalletDialog>>();
const workOrderDialogRef = ref<InstanceType<typeof WorkOrderDialog>>();

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
import { WorkOrderForm, WorkOrderQuery } from '@/api/wms/workOrder/types';
import useDialog from '@/hooks/useDialog';

import { addPacking, getPacking, updatePacking } from '@/api/wms/packing';

const { wms_work_order_check_enable } = toRefs<any>(proxy?.useDict('wms_work_order_check_enable'));
const packingFormRef = ref<ElFormInstance>();
const buttonLoading = ref(false);
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

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择栈板'
});

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
  if (id) {
    const res = await getPacking(id);
    Object.assign(form.value, res.data);
    packingDetailBoList.value = res.data?.packingDetailVoList;
  }
};

/** 提交按钮 */
const submitForm = () => {
  packingFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      form.value.packingDetailBoList = packingDetailBoList.value;
      if (form.value.id) {
        packingDetailBoList.value.map((item: any) => {
          item.palletCode = form.value.palletCode;
        });
        await updatePacking(form.value).finally(() => (buttonLoading.value = false));
      } else {
        packingDetailBoList.value.map((item: any) => {
          item.palletCode = form.value.palletCode;
          item.id = null;
        });
        await addPacking(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      visible.value = false;
      emit('packingCallBack');
    }
  });
};

// 显示栈板选择对话框
const showPalletDialog = () => {
  palletDialogRef.value.openDialog();
  palletDialogRef.value.handleQuery();
};
const palletSelectCallBack = (record) => {
  form.value.palletCode = record.palletCode;
};

// 显示工单选择对话框
const showWorkOrderDialog = () => {
  workOrderDialogRef.value.openDialog();
  workOrderDialogRef.value.initWorkOrderDialog(packingDetailBoList.value);
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
const warehouseLocationList = ref<WarehouseLocationVO[]>([]);
/** 查询仓位信息列表 */
const getWarehouseList = async () => {
  const res = await listWarehouseLocation({
    parentId: 0
  });
  warehouseLocationList.value = res.data;
};
// 启用编辑模式
const enableEditing = (row: WorkOrderForm) => {
  row.isEditing = true;
};

// 保存打包数量
const savePackingQty = (row: WorkOrderForm) => {
  row.isEditing = false;

  // 计算最大允许值
  const maxInboundQty = Math.max(row.plannedQty - row.deliveredQty, 0);

  if (row.packingQty === null || row.packingQty === undefined) {
    proxy?.$modal.msgError('打包数量不能为空');
    return;
  }

  if (row.packingQty > maxInboundQty) {
    proxy?.$modal.msgError(`工单打包数量不能超过${maxInboundQty}`);
    row.packingQty = maxInboundQty; // 自动修正为最大值
    return;
  }

  console.log('保存后的打包数量:', row.packingQty);
};

// 模拟加载工单数据
onMounted(() => {
  getWarehouseList();
});

defineExpose({
  initPackingDialog,
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
</style>
