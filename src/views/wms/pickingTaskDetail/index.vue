<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="任务ID" prop="taskId">
              <el-input v-model="queryParams.taskId" placeholder="请输入任务ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="任务编号" prop="taskNo">
              <el-input v-model="queryParams.taskNo" placeholder="请输入任务编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="方案ID" prop="planId">
              <el-input v-model="queryParams.planId" placeholder="请输入方案ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="分配明细ID" prop="allocationDetailId">
              <el-input v-model="queryParams.allocationDetailId" placeholder="请输入分配明细ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="queryParams.materialCode" placeholder="请输入物料编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="批次号" prop="batchCode">
              <el-input v-model="queryParams.batchCode" placeholder="请输入批次号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="库位编码" prop="locationCode">
              <el-input v-model="queryParams.locationCode" placeholder="请输入库位编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="需求数量" prop="requiredQuantity">
              <el-input v-model="queryParams.requiredQuantity" placeholder="请输入需求数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="已拣数量" prop="pickedQuantity">
              <el-input v-model="queryParams.pickedQuantity" placeholder="请输入已拣数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="拣货顺序" prop="pickSequence">
              <el-input v-model="queryParams.pickSequence" placeholder="请输入拣货顺序" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="拣货员ID" prop="pickerId">
              <el-input v-model="queryParams.pickerId" placeholder="请输入拣货员ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="拣货时间" prop="pickTime">
              <el-date-picker clearable
                v-model="queryParams.pickTime"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择拣货时间"
              />
            </el-form-item>
            <el-form-item label="确认时间" prop="confirmTime">
              <el-date-picker clearable
                v-model="queryParams.confirmTime"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择确认时间"
              />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:pickingTaskDetail:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:pickingTaskDetail:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:pickingTaskDetail:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:pickingTaskDetail:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="pickingTaskDetailList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="任务ID" align="center" prop="taskId" />
        <el-table-column label="任务编号" align="center" prop="taskNo" />
        <el-table-column label="方案ID" align="center" prop="planId" />
        <el-table-column label="分配明细ID" align="center" prop="allocationDetailId" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="物料编码" align="center" prop="materialCode" />
        <el-table-column label="批次号" align="center" prop="batchCode" />
        <el-table-column label="库位编码" align="center" prop="locationCode" />
        <el-table-column label="需求数量" align="center" prop="requiredQuantity" />
        <el-table-column label="已拣数量" align="center" prop="pickedQuantity" />
        <el-table-column label="拣货顺序" align="center" prop="pickSequence" />
        <el-table-column label="拣货状态(PENDING-待拣货, PICKING-拣货中, PICKED-已拣货, CONFIRMED-已确认)" align="center" prop="pickStatus" />
        <el-table-column label="拣货员ID" align="center" prop="pickerId" />
        <el-table-column label="拣货时间" align="center" prop="pickTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.pickTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" align="center" prop="confirmTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.confirmTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:pickingTaskDetail:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:pickingTaskDetail:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改拣货任务明细对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="pickingTaskDetailFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="任务ID" prop="taskId">
          <el-input v-model="form.taskId" placeholder="请输入任务ID" />
        </el-form-item>
        <el-form-item label="任务编号" prop="taskNo">
          <el-input v-model="form.taskNo" placeholder="请输入任务编号" />
        </el-form-item>
        <el-form-item label="方案ID" prop="planId">
          <el-input v-model="form.planId" placeholder="请输入方案ID" />
        </el-form-item>
        <el-form-item label="分配明细ID" prop="allocationDetailId">
          <el-input v-model="form.allocationDetailId" placeholder="请输入分配明细ID" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="物料编码" prop="materialCode">
          <el-input v-model="form.materialCode" placeholder="请输入物料编码" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchCode">
          <el-input v-model="form.batchCode" placeholder="请输入批次号" />
        </el-form-item>
        <el-form-item label="库位编码" prop="locationCode">
          <el-input v-model="form.locationCode" placeholder="请输入库位编码" />
        </el-form-item>
        <el-form-item label="需求数量" prop="requiredQuantity">
          <el-input v-model="form.requiredQuantity" placeholder="请输入需求数量" />
        </el-form-item>
        <el-form-item label="已拣数量" prop="pickedQuantity">
          <el-input v-model="form.pickedQuantity" placeholder="请输入已拣数量" />
        </el-form-item>
        <el-form-item label="拣货顺序" prop="pickSequence">
          <el-input v-model="form.pickSequence" placeholder="请输入拣货顺序" />
        </el-form-item>
        <el-form-item label="拣货员ID" prop="pickerId">
          <el-input v-model="form.pickerId" placeholder="请输入拣货员ID" />
        </el-form-item>
        <el-form-item label="拣货时间" prop="pickTime">
          <el-date-picker clearable
            v-model="form.pickTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择拣货时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="确认时间" prop="confirmTime">
          <el-date-picker clearable
            v-model="form.confirmTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择确认时间">
          </el-date-picker>
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
  </div>
</template>

<script setup name="PickingTaskDetail" lang="ts">
import { listPickingTaskDetail, getPickingTaskDetail, delPickingTaskDetail, addPickingTaskDetail, updatePickingTaskDetail } from '@/api/wms/pickingTaskDetail';
import { PickingTaskDetailVO, PickingTaskDetailQuery, PickingTaskDetailForm } from '@/api/wms/pickingTaskDetail/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const pickingTaskDetailList = ref<PickingTaskDetailVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const pickingTaskDetailFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PickingTaskDetailForm = {
  id: undefined,
  taskId: undefined,
  taskNo: undefined,
  planId: undefined,
  allocationDetailId: undefined,
  workOrderNo: undefined,
  materialCode: undefined,
  batchCode: undefined,
  locationCode: undefined,
  requiredQuantity: undefined,
  pickedQuantity: undefined,
  pickSequence: undefined,
  pickStatus: undefined,
  pickerId: undefined,
  pickTime: undefined,
  confirmTime: undefined,
  remark: undefined,
}
const data = reactive<PageData<PickingTaskDetailForm, PickingTaskDetailQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    taskId: undefined,
    taskNo: undefined,
    planId: undefined,
    allocationDetailId: undefined,
    workOrderNo: undefined,
    materialCode: undefined,
    batchCode: undefined,
    locationCode: undefined,
    requiredQuantity: undefined,
    pickedQuantity: undefined,
    pickSequence: undefined,
    pickStatus: undefined,
    pickerId: undefined,
    pickTime: undefined,
    confirmTime: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    taskId: [
      { required: true, message: "任务ID不能为空", trigger: "blur" }
    ],
    taskNo: [
      { required: true, message: "任务编号不能为空", trigger: "blur" }
    ],
    planId: [
      { required: true, message: "方案ID不能为空", trigger: "blur" }
    ],
    allocationDetailId: [
      { required: true, message: "分配明细ID不能为空", trigger: "blur" }
    ],
    workOrderNo: [
      { required: true, message: "工单号不能为空", trigger: "blur" }
    ],
    materialCode: [
      { required: true, message: "物料编码不能为空", trigger: "blur" }
    ],
    batchCode: [
      { required: true, message: "批次号不能为空", trigger: "blur" }
    ],
    locationCode: [
      { required: true, message: "库位编码不能为空", trigger: "blur" }
    ],
    requiredQuantity: [
      { required: true, message: "需求数量不能为空", trigger: "blur" }
    ],
    pickedQuantity: [
      { required: true, message: "已拣数量不能为空", trigger: "blur" }
    ],
    pickSequence: [
      { required: true, message: "拣货顺序不能为空", trigger: "blur" }
    ],
    pickStatus: [
      { required: true, message: "拣货状态(PENDING-待拣货, PICKING-拣货中, PICKED-已拣货, CONFIRMED-已确认)不能为空", trigger: "change" }
    ],
    pickerId: [
      { required: true, message: "拣货员ID不能为空", trigger: "blur" }
    ],
    pickTime: [
      { required: true, message: "拣货时间不能为空", trigger: "blur" }
    ],
    confirmTime: [
      { required: true, message: "确认时间不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询拣货任务明细列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPickingTaskDetail(queryParams.value);
  pickingTaskDetailList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  pickingTaskDetailFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: PickingTaskDetailVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加拣货任务明细";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: PickingTaskDetailVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getPickingTaskDetail(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改拣货任务明细";
}

/** 提交按钮 */
const submitForm = () => {
  pickingTaskDetailFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePickingTaskDetail(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addPickingTaskDetail(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: PickingTaskDetailVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除拣货任务明细编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delPickingTaskDetail(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/pickingTaskDetail/export', {
    ...queryParams.value
  }, `pickingTaskDetail_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
