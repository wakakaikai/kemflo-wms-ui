<template>
  <div class="p-2">
    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:workOrderProcess:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderProcess:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderProcess:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderProcess:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderProcessList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="columns[0].visible" label="工单号" align="center" prop="workOrderNo" fixed="left" min-width="130" />
        <el-table-column v-if="columns[1].visible" label="工序" align="center" prop="process" fixed="left" />
        <el-table-column v-if="columns[2].visible" label="工序描述" align="center" prop="processShortDesc" show-overflow-tooltip fixed="left" min-width="120" />
        <el-table-column v-if="columns[3].visible" label="控制码" align="center" prop="controlCode" />
        <el-table-column v-if="columns[4].visible" label="工艺路线" align="center" prop="router" />
        <el-table-column v-if="columns[5].visible" label="工作中心" align="center" prop="workCenter" />
        <el-table-column v-if="columns[6].visible" label="计划开工日期" align="center" prop="plannedStartDate" width="180" />
        <el-table-column v-if="columns[7].visible" label="计划完工日期" align="center" prop="plannedEndDate" width="180" />
        <el-table-column v-if="columns[8].visible" label="实际开工日期" align="center" prop="actualStartDate" width="180" />
        <el-table-column v-if="columns[9].visible" label="实际完工日期" align="center" prop="actualEndDate" width="180" />
        <el-table-column v-if="columns[10].visible" label="工序状态" align="center" prop="processStatus" show-overflow-tooltip />
        <el-table-column v-if="columns[11].visible" label="基本数量" align="center" prop="baseQty" min-width="100" />
        <el-table-column v-if="columns[12].visible" label="员工人数" align="center" prop="personNumber" />
        <el-table-column v-if="columns[13].visible" label="机器时间" align="center" prop="machineTime" />
        <el-table-column v-if="columns[14].visible" label="单位" align="center" prop="machineTimeUnit" />
        <el-table-column v-if="columns[15].visible" label="人工时间" align="center" prop="personTime" />
        <el-table-column v-if="columns[16].visible" label="单位" align="center" prop="personTimeUnit" />
        <el-table-column v-if="columns[17].visible" label="仅排程" align="center" prop="schedulingTime" />
        <el-table-column v-if="columns[18].visible" label="单位" align="center" prop="schedulingTimeUnit" />
        <el-table-column v-if="columns[19].visible" label="模取数" align="center" prop="moduleQty" />
        <el-table-column v-if="columns[20].visible" label="单位" align="center" prop="moduleUnit" />
        <el-table-column v-if="columns[21].visible" label="标准产能" align="center" prop="standardCapacity" />
        <el-table-column v-if="columns[22].visible" label="标准人数" align="center" prop="personNumber" />
        <el-table-column v-if="columns[23].visible" label="创建时间" align="center" prop="createTime" />
        <el-table-column v-if="columns[24].visible" label="创建者" align="center" prop="createByName" />
        <el-table-column v-if="columns[25].visible" label="更新时间" align="center" prop="updateTime" />
        <el-table-column v-if="columns[26].visible" label="更新者" align="center" prop="updateByName" />
        <el-table-column v-if="columns[27].visible" label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:workOrderProcess:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:workOrderProcess:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单工序对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workOrderProcessFormRef" :model="form" :rules="rules" label-width="auto">
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="工艺路线" prop="router">
          <el-input v-model="form.router" placeholder="请输入工艺路线" />
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
        <el-form-item label="基本数量" prop="baseQty">
          <el-input v-model="form.baseQty" placeholder="请输入基本数量" />
        </el-form-item>
        <el-form-item label="员工人数" prop="personNumber">
          <el-input v-model="form.personNumber" placeholder="请输入员工人数" />
        </el-form-item>
        <el-form-item label="机器时间" prop="machineTime">
          <el-input v-model="form.machineTime" placeholder="请输入机器时间" />
        </el-form-item>
        <el-form-item label="机器时间单位" prop="machineTimeUnit">
          <el-input v-model="form.machineTimeUnit" placeholder="请输入机器时间单位" />
        </el-form-item>
        <el-form-item label="人工时间" prop="personTime">
          <el-input v-model="form.personTime" placeholder="请输入人工时间" />
        </el-form-item>
        <el-form-item label="人工时间单位" prop="personTimeUnit">
          <el-input v-model="form.personTimeUnit" placeholder="请输入人工时间单位" />
        </el-form-item>
        <el-form-item label="仅排程" prop="schedulingTime">
          <el-input v-model="form.schedulingTime" placeholder="请输入仅排程" />
        </el-form-item>
        <el-form-item label="仅排程单位" prop="schedulingTimeUnit">
          <el-input v-model="form.schedulingTimeUnit" placeholder="请输入仅排程单位" />
        </el-form-item>
        <el-form-item label="模取数" prop="moduleQty">
          <el-input v-model="form.moduleQty" placeholder="请输入模取数" />
        </el-form-item>
        <el-form-item label="模取数单位" prop="moduleUnit">
          <el-input v-model="form.moduleUnit" placeholder="请输入模取数单位" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="WorkOrderProcess" lang="ts">
import { listWorkOrderProcess, getWorkOrderProcess, delWorkOrderProcess, addWorkOrderProcess, updateWorkOrderProcess } from '@/api/wms/workOrderProcess';
import { WorkOrderProcessVO, WorkOrderProcessQuery, WorkOrderProcessForm } from '@/api/wms/workOrderProcess/types';
import { parseTime } from '@/utils/ruoyi';
import { ref } from 'vue';
import { TableColumns } from '@/api/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workOrderProcessList = ref<WorkOrderProcessVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderProcessFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const props = defineProps({
  workOrderNo: {
    type: String,
    required: true
  }
});

const initFormData: WorkOrderProcessForm = {
  id: undefined,
  workOrderNo: undefined,
  router: undefined,
  process: undefined,
  processShortDesc: undefined,
  workCenter: undefined,
  processStatus: undefined,
  baseQty: undefined,
  personNumber: undefined,
  machineTime: undefined,
  machineTimeUnit: undefined,
  personTime: undefined,
  personTimeUnit: undefined,
  schedulingTime: undefined,
  schedulingTimeUnit: undefined,
  moduleQty: undefined,
  moduleUnit: undefined,
  remark: undefined
};
const data = reactive<PageData<WorkOrderProcessForm, WorkOrderProcessQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderNo: undefined,
    router: undefined,
    process: undefined,
    processShortDesc: undefined,
    workCenter: undefined,
    processStatus: undefined,
    baseQty: undefined,
    personNumber: undefined,
    machineTime: undefined,
    machineTimeUnit: undefined,
    personTime: undefined,
    personTimeUnit: undefined,
    schedulingTime: undefined,
    schedulingTimeUnit: undefined,
    moduleQty: undefined,
    moduleUnit: undefined,
    params: {}
  },
  rules: {
    id: [{ required: true, message: '唯一ID不能为空', trigger: 'blur' }],
    workOrderNo: [{ required: true, message: '工单号不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const columns = ref<TableColumns[]>([
  { key: 1, label: '工单号', visible: true },
  { key: 2, label: '工序', visible: true },
  { key: 3, label: '工序描述', visible: true },
  { key: 4, label: '控制码', visible: true },
  { key: 5, label: '工艺路线', visible: true },
  { key: 6, label: '工作中心', visible: true },
  { key: 7, label: '计划开工日期', visible: true },
  { key: 8, label: '计划完工日期', visible: true },
  { key: 9, label: '实际开工日期', visible: true },
  { key: 10, label: '实际完工日期', visible: true },
  { key: 11, label: '工序状态', visible: false },
  { key: 12, label: '基本数量', visible: true },
  { key: 13, label: '员工人数', visible: true },
  { key: 14, label: '机器时间', visible: true },
  { key: 15, label: '机器时间单位', visible: false },
  { key: 16, label: '人工时间', visible: true },
  { key: 17, label: '人工时间单位', visible: false },
  { key: 18, label: '仅排程', visible: true },
  { key: 19, label: '仅排程单位', visible: false },
  { key: 20, label: '模取数', visible: true },
  { key: 21, label: '模取数单位', visible: false },
  { key: 22, label: '标准产能', visible: true },
  { key: 23, label: '标准人数', visible: true },
  { key: 24, label: '创建时间', visible: false },
  { key: 25, label: '创建者', visible: false },
  { key: 26, label: '更新时间', visible: false },
  { key: 27, label: '更新者', visible: false },
  { key: 28, label: '备注', visible: false }
]);

/** 查询工单工序列表 */
const getList = async () => {
  loading.value = true;
  queryParams.value.workOrderNo = props.workOrderNo;
  const res = await listWorkOrderProcess(queryParams.value);
  workOrderProcessList.value = res.rows;
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
  workOrderProcessFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WorkOrderProcessVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加工单工序';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderProcessVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getWorkOrderProcess(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改工单工序';
};

/** 提交按钮 */
const submitForm = () => {
  workOrderProcessFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrderProcess(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addWorkOrderProcess(form.value).finally(() => (buttonLoading.value = false));
      }
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderProcessVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单工序编号为"' + _ids + '"的数据项？').finally(() => (loading.value = false));
  await delWorkOrderProcess(_ids);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download(
    'wms/workOrderProcess/export',
    {
      ...queryParams.value
    },
    `workOrderProcess_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
