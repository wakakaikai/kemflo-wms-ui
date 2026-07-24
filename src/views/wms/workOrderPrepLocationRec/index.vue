<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="需求单号" prop="demandNo">
              <el-input v-model="queryParams.demandNo" placeholder="请输入需求单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>

            <el-form-item label="仓库编码" prop="warehouseCode">
              <el-input v-model="queryParams.warehouseCode" placeholder="请输入仓库编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位编码" prop="locationCode">
              <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:workOrderPrepLocationRec:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderPrepLocationRec:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderPrepLocationRec:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderPrepLocationRec:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderPrepLocationRecList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="需求单号" align="center" prop="demandNo" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="预留单号" align="center" prop="reserveNo" />
        <el-table-column label="项次" align="center" prop="reserveItemNo" />
        <el-table-column label="物料编码" align="center" prop="materialCode" />
        <el-table-column label="物料名称" align="center" prop="materialName" show-overflow-tooltip />
        <el-table-column label="批次号" align="center" prop="batchCode" />
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" />
        <el-table-column label="库位编码" align="center" prop="locationCode" />
        <el-table-column label="特殊库存标识" align="center" prop="specialInventoryFlag">
          <template #default="scope">
            <dict-tag :options="wms_inventory_special_flag" :value="scope.row.specialInventoryFlag" />
          </template>
        </el-table-column>
        <el-table-column label="业务伙伴" align="center" prop="businessCode" />
        <el-table-column label="业务伙伴名称" align="center" prop="businessName" />
        <el-table-column label="目标需求仓库编码" align="center" prop="targetDemandWarehouseCode" />
        <el-table-column label="目标需求库位编码" align="center" prop="targetDemandLocationCode" />
        <el-table-column label="发料数量" align="center" prop="issueQty" />
        <el-table-column label="已发数量" align="center" prop="issuedQty" />
        <el-table-column label="实际发货数量" align="center" prop="actualIssueQty" />
        <el-table-column label="库存单位" align="center" prop="inventoryUnit" />
        <el-table-column label="换算比例" align="center" prop="conversionRatio" />
        <el-table-column label="状态" align="center" prop="lineStatus">
          <template #default="scope">
            <dict-tag :options="wms_prepare_demand_status" :value="scope.row.lineStatus" />
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip />
        <el-table-column label="超领编码" align="center" prop="overPickCode" />
        <el-table-column label="超领原因" align="center" prop="overPickReason" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:workOrderPrepLocationRec:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:workOrderPrepLocationRec:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单备料库位明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workOrderPrepLocationRecFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="备料需求ID" prop="demandId">
          <el-input v-model="form.demandId" placeholder="请输入备料需求ID" />
        </el-form-item>
        <el-form-item label="需求单号" prop="demandNo">
          <el-input v-model="form.demandNo" placeholder="请输入需求单号" />
        </el-form-item>
        <el-form-item label="备料需求明细ID" prop="demandLineId">
          <el-input v-model="form.demandLineId" placeholder="请输入备料需求明细ID" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="预留单号" prop="reserveNo">
          <el-input v-model="form.reserveNo" placeholder="请输入预留单号" />
        </el-form-item>
        <el-form-item label="预留单项次" prop="reserveItemNo">
          <el-input v-model="form.reserveItemNo" placeholder="请输入预留单项次" />
        </el-form-item>
        <el-form-item label="物料编码" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input v-model="form.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="仓库编码" prop="warehouseCode">
          <el-input v-model="form.warehouseCode" placeholder="请输入仓库编码" />
        </el-form-item>
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" />
        </el-form-item>
        <el-form-item label="仓别路线(AUTO/LINE/FLAT/SHORTAGE)" prop="warehouseRoute">
          <el-input v-model="form.warehouseRoute" placeholder="请输入仓别路线(AUTO/LINE/FLAT/SHORTAGE)" />
        </el-form-item>
        <el-form-item label="特殊库存标识" prop="specialInventoryFlag">
          <el-input v-model="form.specialInventoryFlag" placeholder="请输入特殊库存标识" />
        </el-form-item>
        <el-form-item label="业务伙伴" prop="businessCode">
          <el-input v-model="form.businessCode" placeholder="请输入业务伙伴" />
        </el-form-item>
        <el-form-item label="业务伙伴名称" prop="businessName">
          <el-input v-model="form.businessName" placeholder="请输入业务伙伴名称" />
        </el-form-item>
        <el-form-item label="目标需求仓库编码" prop="targetDemandWarehouseCode">
          <el-input v-model="form.targetDemandWarehouseCode" placeholder="请输入目标需求仓库编码" />
        </el-form-item>
        <el-form-item label="目标需求库位编码" prop="targetDemandLocationCode">
          <el-input v-model="form.targetDemandLocationCode" placeholder="请输入目标需求库位编码" />
        </el-form-item>
        <el-form-item label="发料数量" prop="issueQty">
          <el-input v-model="form.issueQty" placeholder="请输入发料数量" />
        </el-form-item>
        <el-form-item label="已发数量" prop="issuedQty">
          <el-input v-model="form.issuedQty" placeholder="请输入已发数量" />
        </el-form-item>
        <el-form-item label="实际发货数量" prop="actualIssueQty">
          <el-input v-model="form.actualIssueQty" placeholder="请输入实际发货数量" />
        </el-form-item>
        <el-form-item label="库存单位" prop="inventoryUnit">
          <el-input v-model="form.inventoryUnit" placeholder="请输入库存单位" />
        </el-form-item>
        <el-form-item label="换算比例" prop="conversionRatio">
          <el-input v-model="form.conversionRatio" placeholder="请输入换算比例" />
        </el-form-item>
        <el-form-item label="FIFO序号(接收日期越早序号越小)" prop="fifoSequence">
          <el-input v-model="form.fifoSequence" placeholder="请输入FIFO序号(接收日期越早序号越小)" />
        </el-form-item>
        <el-form-item label="推荐来源(USER_SELECTED-用户选择,SYSTEM_RECOMMENDED-系统推荐)" prop="recommendationSource">
          <el-input v-model="form.recommendationSource" placeholder="请输入推荐来源(USER_SELECTED-用户选择,SYSTEM_RECOMMENDED-系统推荐)" />
        </el-form-item>
        <el-form-item label="推荐理由" prop="recommendationReason">
          <el-input v-model="form.recommendationReason" placeholder="请输入推荐理由" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="超领编码" prop="overPickCode">
          <el-input v-model="form.overPickCode" placeholder="请输入超领编码" />
        </el-form-item>
        <el-form-item label="超领原因" prop="overPickReason">
          <el-input v-model="form.overPickReason" placeholder="请输入超领原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="WorkOrderPrepLocationRec" lang="ts">
import { listWorkOrderPrepLocationRec, getWorkOrderPrepLocationRec, delWorkOrderPrepLocationRec, addWorkOrderPrepLocationRec, updateWorkOrderPrepLocationRec } from '@/api/wms/workOrderPrepLocationRec';
import { WorkOrderPrepLocationRecVO, WorkOrderPrepLocationRecQuery, WorkOrderPrepLocationRecForm } from '@/api/wms/workOrderPrepLocationRec/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wms_prepare_demand_status, wms_inventory_special_flag } = toRefs<any>(proxy?.useDict('wms_prepare_demand_status', 'wms_inventory_special_flag'));
const route = useRoute();

const workOrderPrepLocationRecList = ref<WorkOrderPrepLocationRecVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderPrepLocationRecFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkOrderPrepLocationRecForm = {
  id: undefined,
  demandId: undefined,
  demandNo: undefined,
  demandLineId: undefined,
  workOrderNo: undefined,
  reserveNo: undefined,
  reserveItemNo: undefined,
  materialCode: undefined,
  materialName: undefined,
  batchCode: undefined,
  warehouseCode: undefined,
  locationCode: undefined,
  warehouseRoute: undefined,
  specialInventoryFlag: undefined,
  businessCode: undefined,
  businessName: undefined,
  targetDemandWarehouseCode: undefined,
  targetDemandLocationCode: undefined,
  issueQty: undefined,
  issuedQty: undefined,
  actualIssueQty: undefined,
  inventoryUnit: undefined,
  conversionRatio: undefined,
  fifoSequence: undefined,
  lineStatus: undefined,
  recommendationSource: undefined,
  recommendationReason: undefined,
  remark: undefined,
  overPickCode: undefined,
  overPickReason: undefined
};
const data = reactive<PageData<WorkOrderPrepLocationRecForm, WorkOrderPrepLocationRecQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    demandId: undefined,
    demandNo: undefined,
    demandLineId: undefined,
    workOrderNo: undefined,
    reserveNo: undefined,
    reserveItemNo: undefined,
    materialCode: undefined,
    materialName: undefined,
    batchCode: undefined,
    warehouseCode: undefined,
    locationCode: undefined,
    warehouseRoute: undefined,
    specialInventoryFlag: undefined,
    businessCode: undefined,
    businessName: undefined,
    targetDemandWarehouseCode: undefined,
    targetDemandLocationCode: undefined,
    issueQty: undefined,
    issuedQty: undefined,
    actualIssueQty: undefined,
    inventoryUnit: undefined,
    conversionRatio: undefined,
    fifoSequence: undefined,
    lineStatus: undefined,
    recommendationSource: undefined,
    recommendationReason: undefined,
    overPickCode: undefined,
    overPickReason: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    demandId: [{ required: true, message: '备料需求ID不能为空', trigger: 'blur' }],
    demandNo: [{ required: true, message: '需求单号不能为空', trigger: 'blur' }],
    demandLineId: [{ required: true, message: '备料需求明细ID不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单备料库位明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrderPrepLocationRec(queryParams.value);
  workOrderPrepLocationRecList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  workOrderPrepLocationRecFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: WorkOrderPrepLocationRecVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单备料库位明细';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderPrepLocationRecVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrderPrepLocationRec(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单备料库位明细';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderPrepLocationRecFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrderPrepLocationRec(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrderPrepLocationRec(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderPrepLocationRecVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单备料库位明细编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrderPrepLocationRec(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrderPrepLocationRec/export',
    {
      ...queryParams.value
    },
    `workOrderPrepLocationRec_${new Date().getTime()}.xlsx`
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
