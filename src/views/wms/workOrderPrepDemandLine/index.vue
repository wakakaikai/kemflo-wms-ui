<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="需求单号" prop="demandNo">
              <el-input v-model="queryParams.demandNo" placeholder="请输入备料需求单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNoStr">
              <el-input v-model="queryParams.workOrderNoStr" placeholder="请输入工单号" clearable @keyup.enter="handleQuery">
                <template #append>
                  <el-button icon="CopyDocument" title="批量录入工单号" @click="openBatchInputDialog" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:workOrderPrepDemandLine:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderPrepDemandLine:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderPrepDemandLine:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderPrepDemandLine:export']">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button color="#626aef" plain icon="Printer" :disabled="multiple" @click="handlePrint">打印</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderPrepDemandLineList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="px-4 py-2">
              <el-table v-if="row.locationRecs?.length" :data="row.locationRecs" border size="small" class="expand-location-rec-table">
                <el-table-column label="库位" align="center" prop="locationCode" min-width="110" />
                <el-table-column label="仓别路线" align="center" prop="warehouseRoute" width="90">
                  <template #default="scope">
                    <dict-tag :options="wms_warehouse_route" :value="scope.row.warehouseRoute" />
                  </template>
                </el-table-column>
                <el-table-column label="特殊库存" align="center" prop="specialInventoryFlag" width="96">
                  <template #default="scope">
                    <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
                  </template>
                </el-table-column>
                <el-table-column label="批次号" align="center" prop="batchCode" min-width="110" />
                <el-table-column label="发料数量" align="center" prop="issueQty" width="96" />
                <el-table-column label="实际发货" align="center" prop="actualIssueQty" width="96" />
                <el-table-column label="单位" align="center" prop="inventoryUnit" width="72" />
                <el-table-column label="状态" align="center" prop="lineStatus" width="100">
                  <template #default="scope">
                    <dict-tag :options="wms_prepare_demand_status" :value="scope.row.lineStatus" />
                  </template>
                </el-table-column>
                <el-table-column label="目标库位" align="center" prop="targetDemandLocationCode" min-width="110" show-overflow-tooltip />
                <el-table-column label="备注" align="center" prop="remark" min-width="140" show-overflow-tooltip />
              </el-table>
              <el-empty v-else description="暂无库位拣货明细" :image-size="48" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="需求单号" align="center" prop="demandNo" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="预留单号" align="center" prop="reserveNo" />
        <el-table-column label="项次" align="center" prop="reserveItemNo" />
        <el-table-column label="物料编码" align="center" prop="materialCode" />
        <el-table-column label="物料名称" align="center" prop="materialName" show-overflow-tooltip />
        <el-table-column label="BOM需求" width="100" align="right">
          <template #default="{ row }">{{ formatQty(row.componentQty) }}</template>
        </el-table-column>
        <el-table-column label="本次备料" align="center" prop="issueQty">
          <template #default="{ row }"> {{ formatQty(row.issueQty) }}</template>
        </el-table-column>
        <el-table-column label="缺料数量" align="center" prop="shortageQty">
          <template #default="{ row }">
            <span :class="{ 'text-danger': Number(row.shortageQty) > 0 }">{{ formatQty(row.shortageQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存单位" align="center" prop="inventoryUnit" />
        <el-table-column label="特殊库存" align="center" prop="specialInventoryFlag" width="96">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column label="销售单号" align="center" prop="salesOrderNo" />
        <el-table-column label="项次" align="center" prop="salesOrderItem" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:workOrderPrepDemandLine:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:workOrderPrepDemandLine:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单备料需求明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workOrderPrepDemandLineFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="备料需求ID" prop="demandId">
          <el-input v-model="form.demandId" placeholder="请输入备料需求ID" />
        </el-form-item>
        <el-form-item label="备料需求单号" prop="demandNo">
          <el-input v-model="form.demandNo" placeholder="请输入备料需求单号" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="预留单号(关联BOM行)" prop="reserveNo">
          <el-input v-model="form.reserveNo" placeholder="请输入预留单号(关联BOM行)" />
        </el-form-item>
        <el-form-item label="预留单项次(关联BOM行)" prop="reserveItemNo">
          <el-input v-model="form.reserveItemNo" placeholder="请输入预留单项次(关联BOM行)" />
        </el-form-item>
        <el-form-item label="物料编码" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input v-model="form.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="原始需求数量" prop="componentQty">
          <el-input v-model="form.componentQty" placeholder="请输入原始需求数量" />
        </el-form-item>
        <el-form-item label="已发料数量" prop="issuedQty">
          <el-input v-model="form.issuedQty" placeholder="请输入已发料数量" />
        </el-form-item>
        <el-form-item label="待发需求数量" prop="pendingQty">
          <el-input v-model="form.pendingQty" placeholder="请输入待发需求数量" />
        </el-form-item>
        <el-form-item label="本次备料/发料数量" prop="issueQty">
          <el-input v-model="form.issueQty" placeholder="请输入本次备料/发料数量" />
        </el-form-item>
        <el-form-item label="可用库存数量" prop="availableQty">
          <el-input v-model="form.availableQty" placeholder="请输入可用库存数量" />
        </el-form-item>
        <el-form-item label="缺料数量" prop="shortageQty">
          <el-input v-model="form.shortageQty" placeholder="请输入缺料数量" />
        </el-form-item>
        <el-form-item label="缺料特殊库存标识(N-正常,E-销售订单等)" prop="specialInventoryFlag">
          <el-input v-model="form.specialInventoryFlag" placeholder="请输入缺料特殊库存标识(N-正常,E-销售订单等)" />
        </el-form-item>
        <el-form-item label="销售订单号" prop="salesOrderNo">
          <el-input v-model="form.salesOrderNo" placeholder="请输入销售订单号" />
        </el-form-item>
        <el-form-item label="销售订单项次" prop="salesOrderItem">
          <el-input v-model="form.salesOrderItem" placeholder="请输入销售订单项次" />
        </el-form-item>
        <el-form-item label="该行齐套率(0~1)" prop="kitRate">
          <el-input v-model="form.kitRate" placeholder="请输入该行齐套率(0~1)" />
        </el-form-item>
        <el-form-item label="发料单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入发料单位" />
        </el-form-item>
        <el-form-item label="库存单位" prop="inventoryUnit">
          <el-input v-model="form.inventoryUnit" placeholder="请输入库存单位" />
        </el-form-item>
        <el-form-item label="换算比例" prop="conversionRatio">
          <el-input v-model="form.conversionRatio" placeholder="请输入换算比例" />
        </el-form-item>
        <el-form-item label="同工单同物料BOM行数(>1表示重复需求)" prop="materialLineCount">
          <el-input v-model="form.materialLineCount" placeholder="请输入同工单同物料BOM行数(>1表示重复需求)" />
        </el-form-item>
        <el-form-item label="是否纳入本次备料" prop="selectedFlag">
          <el-input v-model="form.selectedFlag" placeholder="请输入是否纳入本次备料" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <BatchInputDialog ref="batchInputDialogRef" v-model="batchInputDialogVisible" title="批量录入工单号" placeholder="请输入工单号，支持多行粘贴" @confirm="handleBatchInputConfirm" />
    <prep-location-rec-print ref="prepLocationRecPrintRef" />
  </div>
</template>

<script setup name="WorkOrderPrepDemandLine" lang="ts">
import { listWorkOrderPrepDemandLine, getWorkOrderPrepDemandLine, delWorkOrderPrepDemandLine, addWorkOrderPrepDemandLine, updateWorkOrderPrepDemandLine } from '@/api/wms/workOrderPrepDemandLine';
import { WorkOrderPrepDemandLineVO, WorkOrderPrepDemandLineQuery, WorkOrderPrepDemandLineForm } from '@/api/wms/workOrderPrepDemandLine/types';
import type { WorkOrderPrepLocationRecVO } from '@/api/wms/workOrderPrepLocationRec/types';
import BatchInputDialog from '@/components/BatchInputDialog/index.vue';
import PrepLocationRecPrint from './components/prepLocationRecPrint.vue';
import { toRefs } from 'vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_inventory_special_flag, wms_prepare_demand_status, wms_warehouse_route } = toRefs<any>(proxy?.useDict('wms_inventory_special_flag', 'wms_prepare_demand_status', 'wms_warehouse_route'));
const route = useRoute();
const workOrderPrepDemandLineList = ref<WorkOrderPrepDemandLineVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const selectedRows = ref<WorkOrderPrepDemandLineVO[]>([]);
const prepLocationRecPrintRef = ref<InstanceType<typeof PrepLocationRecPrint>>();
const batchInputDialogRef = ref<InstanceType<typeof BatchInputDialog>>();
const batchInputDialogVisible = ref(false);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderPrepDemandLineFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkOrderPrepDemandLineForm = {
  id: undefined,
  demandId: undefined,
  demandNo: undefined,
  workOrderNo: undefined,
  reserveNo: undefined,
  reserveItemNo: undefined,
  materialCode: undefined,
  materialName: undefined,
  componentQty: undefined,
  issuedQty: undefined,
  pendingQty: undefined,
  issueQty: undefined,
  availableQty: undefined,
  shortageQty: undefined,
  specialInventoryFlag: undefined,
  salesOrderNo: undefined,
  salesOrderItem: undefined,
  kitRate: undefined,
  unit: undefined,
  inventoryUnit: undefined,
  conversionRatio: undefined,
  materialLineCount: undefined,
  selectedFlag: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderPrepDemandLineForm, WorkOrderPrepDemandLineQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    demandId: undefined,
    demandNo: undefined,
    workOrderNo: undefined,
    workOrderNoList: [],
    workOrderNoStr: undefined,
    reserveNo: undefined,
    reserveItemNo: undefined,
    materialCode: undefined,
    materialName: undefined,
    componentQty: undefined,
    issuedQty: undefined,
    pendingQty: undefined,
    issueQty: undefined,
    availableQty: undefined,
    shortageQty: undefined,
    specialInventoryFlag: undefined,
    salesOrderNo: undefined,
    salesOrderItem: undefined,
    kitRate: undefined,
    unit: undefined,
    inventoryUnit: undefined,
    conversionRatio: undefined,
    materialLineCount: undefined,
    selectedFlag: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    demandId: [{ required: true, message: '备料需求ID不能为空', trigger: 'blur' }],
    demandNo: [{ required: true, message: '备料需求单号不能为空', trigger: 'blur' }],
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单备料需求明细列表 */
const getList = async () => {
  loading.value = true;
  try {
    const { workOrderNoStr, ...query } = queryParams.value;
    const res = await listWorkOrderPrepDemandLine({
      ...query,
      workOrderNo: undefined,
      workOrderNoList: queryParams.value.workOrderNoList?.length ? queryParams.value.workOrderNoList : undefined
    });
    workOrderPrepDemandLineList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  workOrderPrepDemandLineFormRef.value?.resetFields();
};

/** 补零：将单个工单号补足12位 */
const padWorkOrder = (order?: string) => {
  if (!order) return order;
  const str = String(order).trim();
  if (!str) return str;
  return str.length >= 12 ? str : str.padStart(12, '0');
};

/** 解析工单号批量录入字符串（解析时统一补零） */
const parseWorkOrderNoList = (str?: string): string[] => {
  if (!str?.trim()) {
    return [];
  }
  return str
    .split(/[,;，；\s]+/)
    .map((item) => padWorkOrder(item.trim()))
    .filter(Boolean) as string[];
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  // 搜索时从输入框统一解析并补零，回填展示与查询列表
  const list = parseWorkOrderNoList(queryParams.value.workOrderNoStr);
  queryParams.value.workOrderNoList = list;
  queryParams.value.workOrderNoStr = list.length ? list.join(',') : undefined;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.workOrderNoStr = undefined;
  queryParams.value.workOrderNoList = [];
  batchInputDialogRef.value?.resetInput();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: WorkOrderPrepDemandLineVO[]) => {
  ids.value = selection.map((item) => item.id);
  selectedRows.value = selection;
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 打开批量录入工单号弹框 */
const openBatchInputDialog = () => {
  batchInputDialogVisible.value = true;
};

/** 批量录入工单号确认（补零逻辑统一在 handleQuery 中处理） */
const handleBatchInputConfirm = (values: string[]) => {
  queryParams.value.workOrderNoStr = values.join(',');
  handleQuery();
};

/** 打印选中需求明细下的库位拣货行 */
const handlePrint = async () => {
  if (!selectedRows.value.length) {
    proxy?.$modal.msgWarning('请选择要打印的备料需求明细');
    return;
  }
  const printRows: WorkOrderPrepLocationRecVO[] = selectedRows.value.flatMap((line) => line.locationRecs ?? []);
  if (!printRows.length) {
    proxy?.$modal.msgWarning('所选明细暂无库位拣货行，无法打印');
    return;
  }
  try {
    await prepLocationRecPrintRef.value?.print(printRows);
  } catch (error) {
    if (error instanceof Error && error.message === 'PRINT_WINDOW_BLOCKED') {
      proxy?.$modal.msgWarning('浏览器拦截了打印窗口，请允许弹窗后重试');
      return;
    }
    console.error(error);
    proxy?.$modal.msgError('打印失败，请重试');
  }
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单备料需求明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderPrepDemandLineVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrderPrepDemandLine(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单备料需求明细';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderPrepDemandLineFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrderPrepDemandLine(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrderPrepDemandLine(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderPrepDemandLineVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单备料需求明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrderPrepDemandLine(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrderPrepDemandLine/export',
    {
      ...queryParams.value
    },
    `workOrderPrepDemandLine_${new Date().getTime()}.xlsx`
  );
};

/** 从路由 query 同步需求单号筛选条件 */
const syncDemandNoFromRoute = () => {
  const demandNo = String(route.query.demandNo || '').trim();
  if (demandNo) {
    queryParams.value.demandNo = demandNo;
    queryParams.value.pageNum = 1;
  }
};

watch(
  () => route.query.demandNo,
  (newVal) => {
    const demandNo = String(newVal || '').trim();
    if (!demandNo) return;
    queryParams.value.demandNo = demandNo;
    queryParams.value.pageNum = 1;
    getList();
  }
);

onMounted(() => {
  syncDemandNoFromRoute();
  getList();
});
</script>
