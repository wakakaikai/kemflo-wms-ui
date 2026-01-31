<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工序" prop="process">
              <el-input v-model="queryParams.process" placeholder="请输入工序" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:workOrderScadaPrintHistory:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderScadaPrintHistory:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderScadaPrintHistory:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderScadaPrintHistory:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderScadaPrintHistoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="工单号" align="center" prop="workOrderNo" />
        <el-table-column v-if="columns[1].visible" label="产品料号" align="center" prop="item" />
        <el-table-column v-if="columns[2].visible" label="产品描述" align="center" prop="itemDesc" show-overflow-tooltip />
        <el-table-column v-if="columns[3].visible" label="计划数量" align="center" prop="plannedQty" />
        <el-table-column v-if="columns[4].visible" label="看板卡数量" align="center" prop="scadaQty" />
        <el-table-column v-if="columns[5].visible" label="单位" align="center" prop="unit" />
        <el-table-column v-if="columns[6].visible" label="销售订单号" align="center" prop="salesOrderNo" />
        <el-table-column v-if="columns[7].visible" label="交货日" align="center" prop="soDeliveryDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.soDeliveryDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[8].visible" label="工序" align="center" prop="process" />
        <el-table-column v-if="columns[9].visible" label="工序描述" align="center" prop="processShortDesc" />
        <el-table-column v-if="columns[10].visible" label="工作中心" align="center" prop="workCenter" />
        <el-table-column v-if="columns[11].visible" label="前一制程工单号" align="center" prop="previousStepOrderNo" />
        <el-table-column v-if="columns[12].visible" label="前一制程工作中心" align="center" prop="previousStepWorkCenter" />
        <el-table-column v-if="columns[13].visible" label="前一制程完工时间" align="center" prop="previousStepCompleteTime" width="180" />
        <el-table-column v-if="columns[14].visible" label="下一制程工单号" align="center" prop="nextStepOrderNo" />
        <el-table-column v-if="columns[15].visible" label="下一制程工作中心" align="center" prop="nextStepWorkCenter" />
        <el-table-column v-if="columns[16].visible" label="下一制程开工时间" align="center" prop="nextStepStartTime" width="180" />
        <el-table-column v-if="columns[17].visible" label="标准人数" align="center" prop="standardPerson" />
        <el-table-column v-if="columns[18].visible" label="标准产能" align="center" prop="standardCapacity" />
        <el-table-column v-if="columns[19].visible" label="计划开工日期" align="center" prop="plannedStartDate" width="180" />
        <el-table-column v-if="columns[20].visible" label="计划完工日期" align="center" prop="plannedEndDate" width="180" />
        <el-table-column v-if="columns[21].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[22].visible" label="创建者" align="center" prop="createByName" />
        <el-table-column v-if="columns[23].visible" label="更新时间" align="center" prop="updateTime" />
        <el-table-column v-if="columns[24].visible" label="更新者" align="center" prop="updateByName" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:workOrderScadaPrintHistory:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:workOrderScadaPrintHistory:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单看板卡打印历史对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workOrderScadaPrintHistoryFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="产品料号" prop="item">
          <el-input v-model="form.item" placeholder="请输入产品料号" />
        </el-form-item>
        <el-form-item label="产品描述" prop="itemDesc">
          <el-input v-model="form.itemDesc" placeholder="请输入产品描述" />
        </el-form-item>
        <el-form-item label="计划数量" prop="plannedQty">
          <el-input v-model="form.plannedQty" placeholder="请输入计划数量" />
        </el-form-item>
        <el-form-item label="看板卡数量" prop="scadaQty">
          <el-input v-model="form.scadaQty" placeholder="请输入看板卡数量" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="销售订单号" prop="salesOrderNo">
          <el-input v-model="form.salesOrderNo" placeholder="请输入销售订单号" />
        </el-form-item>
        <el-form-item label="交货日" prop="soDeliveryDate">
          <el-date-picker clearable v-model="form.soDeliveryDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择交货日"> </el-date-picker>
        </el-form-item>
        <el-form-item label="工序" prop="process">
          <el-input v-model="form.process" placeholder="请输入工序" />
        </el-form-item>
        <el-form-item label="工序描述" prop="processShortDesc">
          <el-input v-model="form.processShortDesc" placeholder="请输入工序描述" />
        </el-form-item>
        <el-form-item label="工作中心" prop="workCenter">
          <el-input v-model="form.workCenter" placeholder="请输入工作中心" />
        </el-form-item>
        <el-form-item label="前一制程工单号" prop="previousStepOrderNo">
          <el-input v-model="form.previousStepOrderNo" placeholder="请输入前一制程工单号" />
        </el-form-item>
        <el-form-item label="前一制程工作中心" prop="previousStepWorkCenter">
          <el-input v-model="form.previousStepWorkCenter" placeholder="请输入前一制程工作中心" />
        </el-form-item>
        <el-form-item label="前一制程完工时间" prop="previousStepCompleteTime">
          <el-date-picker clearable v-model="form.previousStepCompleteTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择前一制程完工时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="下一制程工单号" prop="nextStepOrderNo">
          <el-input v-model="form.nextStepOrderNo" placeholder="请输入下一制程工单号" />
        </el-form-item>
        <el-form-item label="下一制程工作中心" prop="nextStepWorkCenter">
          <el-input v-model="form.nextStepWorkCenter" placeholder="请输入下一制程工作中心" />
        </el-form-item>
        <el-form-item label="下一制程开工时间" prop="nextStepStartTime">
          <el-date-picker clearable v-model="form.nextStepStartTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择下一制程开工时间"> </el-date-picker>
        </el-form-item>
        <el-form-item label="标准人数" prop="standardPerson">
          <el-input v-model="form.standardPerson" placeholder="请输入标准人数" />
        </el-form-item>
        <el-form-item label="标准产能" prop="standardCapacity">
          <el-input v-model="form.standardCapacity" placeholder="请输入标准产能" />
        </el-form-item>
        <el-form-item label="计划开工日期" prop="plannedStartDate">
          <el-date-picker clearable v-model="form.plannedStartDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划开工日期"> </el-date-picker>
        </el-form-item>
        <el-form-item label="计划完工日期" prop="plannedEndDate">
          <el-date-picker clearable v-model="form.plannedEndDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择计划完工日期"> </el-date-picker>
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

<script setup name="WorkOrderScadaPrintHistory" lang="ts">
import {
  listWorkOrderScadaPrintHistory,
  getWorkOrderScadaPrintHistory,
  delWorkOrderScadaPrintHistory,
  addWorkOrderScadaPrintHistory,
  updateWorkOrderScadaPrintHistory
} from '@/api/wms/workOrderScadaPrintHistory';
import { WorkOrderScadaPrintHistoryVO, WorkOrderScadaPrintHistoryQuery, WorkOrderScadaPrintHistoryForm } from '@/api/wms/workOrderScadaPrintHistory/types';
import { TableColumns } from '@/api/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workOrderScadaPrintHistoryList = ref<WorkOrderScadaPrintHistoryVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderScadaPrintHistoryFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkOrderScadaPrintHistoryForm = {
  id: undefined,
  workOrderNo: undefined,
  item: undefined,
  itemDesc: undefined,
  plannedQty: undefined,
  scadaQty: undefined,
  unit: undefined,
  salesOrderNo: undefined,
  soDeliveryDate: undefined,
  process: undefined,
  processShortDesc: undefined,
  workCenter: undefined,
  previousStepOrderNo: undefined,
  previousStepWorkCenter: undefined,
  previousStepCompleteTime: undefined,
  nextStepOrderNo: undefined,
  nextStepWorkCenter: undefined,
  nextStepStartTime: undefined,
  standardPerson: undefined,
  standardCapacity: undefined,
  plannedStartDate: undefined,
  plannedEndDate: undefined
};
const data = reactive<PageData<WorkOrderScadaPrintHistoryForm, WorkOrderScadaPrintHistoryQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    item: undefined,
    itemDesc: undefined,
    plannedQty: undefined,
    scadaQty: undefined,
    unit: undefined,
    salesOrderNo: undefined,
    soDeliveryDate: undefined,
    process: undefined,
    processShortDesc: undefined,
    workCenter: undefined,
    previousStepOrderNo: undefined,
    previousStepWorkCenter: undefined,
    previousStepCompleteTime: undefined,
    nextStepOrderNo: undefined,
    nextStepWorkCenter: undefined,
    nextStepStartTime: undefined,
    standardPerson: undefined,
    standardCapacity: undefined,
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 创建响应式数组对象
const columns = ref<FieldOption[]>([
  { key: 0, label: `工单号`, visible: true, children: [] },
  { key: 1, label: `产品料号`, visible: true, children: [] },
  { key: 2, label: `产品描述`, visible: true, children: [] },
  { key: 3, label: `计划数量`, visible: true, children: [] },
  { key: 4, label: `看板卡数量`, visible: false, children: [] },
  { key: 5, label: `单位`, visible: false, children: [] },
  { key: 6, label: `销售订单号`, visible: true, children: [] },
  { key: 7, label: `交货日`, visible: true, children: [] },
  { key: 8, label: `工序`, visible: true, children: [] },
  { key: 9, label: `工序描述`, visible: true, children: [] },
  { key: 10, label: `工作中心`, visible: true, children: [] },
  { key: 11, label: `前一制程工单号`, visible: true, children: [] },
  { key: 12, label: `前一制程工作中心`, visible: true, children: [] },
  { key: 13, label: `前一制程完工时间`, visible: true, children: [] },
  { key: 14, label: `下一制程工单号`, visible: true, children: [] },
  { key: 15, label: `下一制程工作中心`, visible: true, children: [] },
  { key: 16, label: `下一制程开工时间`, visible: true, children: [] },
  { key: 17, label: `标准人数`, visible: true, children: [] },
  { key: 18, label: `标准产能`, visible: true, children: [] },
  { key: 19, label: `计划开工日期`, visible: true, children: [] },
  { key: 20, label: `计划完工日期`, visible: true, children: [] },
  { key: 21, label: `创建时间`, visible: false, children: [] },
  { key: 22, label: `创建者`, visible: false, children: [] },
  { key: 23, label: `更新时间`, visible: false, children: [] },
  { key: 24, label: `更新者`, visible: false, children: [] }
]);

/** 查询工单看板卡打印历史列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrderScadaPrintHistory(queryParams.value);
  workOrderScadaPrintHistoryList.value = res.rows;
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
  workOrderScadaPrintHistoryFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WorkOrderScadaPrintHistoryVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单看板卡打印历史';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderScadaPrintHistoryVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrderScadaPrintHistory(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单看板卡打印历史';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderScadaPrintHistoryFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrderScadaPrintHistory(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrderScadaPrintHistory(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderScadaPrintHistoryVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单看板卡打印历史编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrderScadaPrintHistory(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrderScadaPrintHistory/export',
    {
      ...queryParams.value
    },
    `workOrderScadaPrintHistory_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
