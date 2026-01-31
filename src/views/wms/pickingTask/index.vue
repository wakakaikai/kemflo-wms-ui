<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="任务编号" prop="taskNo">
              <el-input v-model="queryParams.taskNo" placeholder="请输入任务编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="方案ID" prop="planId">
              <el-input v-model="queryParams.planId" placeholder="请输入方案ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="拣货员ID" prop="pickerId">
              <el-input v-model="queryParams.pickerId" placeholder="请输入拣货员ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="拣货员姓名" prop="pickerName">
              <el-input v-model="queryParams.pickerName" placeholder="请输入拣货员姓名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="起始位置" prop="startLocation">
              <el-input v-model="queryParams.startLocation" placeholder="请输入起始位置" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="结束位置" prop="endLocation">
              <el-input v-model="queryParams.endLocation" placeholder="请输入结束位置" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="总物料项数" prop="totalItems">
              <el-input v-model="queryParams.totalItems" placeholder="请输入总物料项数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="总数量" prop="totalQuantity">
              <el-input v-model="queryParams.totalQuantity" placeholder="请输入总数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="预计行走距离" prop="estimatedDistance">
              <el-input v-model="queryParams.estimatedDistance" placeholder="请输入预计行走距离" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="预计用时(分钟)" prop="estimatedTime">
              <el-input v-model="queryParams.estimatedTime" placeholder="请输入预计用时(分钟)" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="实际开始时间" prop="actualStartTime">
              <el-date-picker clearable
                v-model="queryParams.actualStartTime"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择实际开始时间"
              />
            </el-form-item>
            <el-form-item label="实际结束时间" prop="actualEndTime">
              <el-date-picker clearable
                v-model="queryParams.actualEndTime"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择实际结束时间"
              />
            </el-form-item>
            <el-form-item label="实际行走距离" prop="actualDistance">
              <el-input v-model="queryParams.actualDistance" placeholder="请输入实际行走距离" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="实际用时(分钟)" prop="actualTime">
              <el-input v-model="queryParams.actualTime" placeholder="请输入实际用时(分钟)" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:pickingTask:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:pickingTask:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:pickingTask:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:pickingTask:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="pickingTaskList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="任务编号" align="center" prop="taskNo" />
        <el-table-column label="方案ID" align="center" prop="planId" />
        <el-table-column label="任务类型(NORMAL-正常, EMERGENCY-紧急)" align="center" prop="taskType" />
        <el-table-column label="任务状态(PENDING-待处理, ASSIGNED-已分配, PICKING-拣货中, COMPLETED-已完成, CANCELLED-已取消)" align="center" prop="taskStatus" />
        <el-table-column label="拣货员ID" align="center" prop="pickerId" />
        <el-table-column label="拣货员姓名" align="center" prop="pickerName" />
        <el-table-column label="起始位置" align="center" prop="startLocation" />
        <el-table-column label="结束位置" align="center" prop="endLocation" />
        <el-table-column label="总物料项数" align="center" prop="totalItems" />
        <el-table-column label="总数量" align="center" prop="totalQuantity" />
        <el-table-column label="预计行走距离" align="center" prop="estimatedDistance" />
        <el-table-column label="预计用时(分钟)" align="center" prop="estimatedTime" />
        <el-table-column label="实际开始时间" align="center" prop="actualStartTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.actualStartTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实际结束时间" align="center" prop="actualEndTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.actualEndTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实际行走距离" align="center" prop="actualDistance" />
        <el-table-column label="实际用时(分钟)" align="center" prop="actualTime" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:pickingTask:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:pickingTask:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改拣货任务对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="pickingTaskFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="任务编号" prop="taskNo">
          <el-input v-model="form.taskNo" placeholder="请输入任务编号" />
        </el-form-item>
        <el-form-item label="方案ID" prop="planId">
          <el-input v-model="form.planId" placeholder="请输入方案ID" />
        </el-form-item>
        <el-form-item label="拣货员ID" prop="pickerId">
          <el-input v-model="form.pickerId" placeholder="请输入拣货员ID" />
        </el-form-item>
        <el-form-item label="拣货员姓名" prop="pickerName">
          <el-input v-model="form.pickerName" placeholder="请输入拣货员姓名" />
        </el-form-item>
        <el-form-item label="起始位置" prop="startLocation">
          <el-input v-model="form.startLocation" placeholder="请输入起始位置" />
        </el-form-item>
        <el-form-item label="结束位置" prop="endLocation">
          <el-input v-model="form.endLocation" placeholder="请输入结束位置" />
        </el-form-item>
        <el-form-item label="总物料项数" prop="totalItems">
          <el-input v-model="form.totalItems" placeholder="请输入总物料项数" />
        </el-form-item>
        <el-form-item label="总数量" prop="totalQuantity">
          <el-input v-model="form.totalQuantity" placeholder="请输入总数量" />
        </el-form-item>
        <el-form-item label="预计行走距离" prop="estimatedDistance">
          <el-input v-model="form.estimatedDistance" placeholder="请输入预计行走距离" />
        </el-form-item>
        <el-form-item label="预计用时(分钟)" prop="estimatedTime">
          <el-input v-model="form.estimatedTime" placeholder="请输入预计用时(分钟)" />
        </el-form-item>
        <el-form-item label="实际开始时间" prop="actualStartTime">
          <el-date-picker clearable
            v-model="form.actualStartTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择实际开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="实际结束时间" prop="actualEndTime">
          <el-date-picker clearable
            v-model="form.actualEndTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择实际结束时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="实际行走距离" prop="actualDistance">
          <el-input v-model="form.actualDistance" placeholder="请输入实际行走距离" />
        </el-form-item>
        <el-form-item label="实际用时(分钟)" prop="actualTime">
          <el-input v-model="form.actualTime" placeholder="请输入实际用时(分钟)" />
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

<script setup name="PickingTask" lang="ts">
import { listPickingTask, getPickingTask, delPickingTask, addPickingTask, updatePickingTask } from '@/api/wms/pickingTask';
import { PickingTaskVO, PickingTaskQuery, PickingTaskForm } from '@/api/wms/pickingTask/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const pickingTaskList = ref<PickingTaskVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const pickingTaskFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: PickingTaskForm = {
  id: undefined,
  taskNo: undefined,
  planId: undefined,
  taskType: undefined,
  taskStatus: undefined,
  pickerId: undefined,
  pickerName: undefined,
  startLocation: undefined,
  endLocation: undefined,
  totalItems: undefined,
  totalQuantity: undefined,
  estimatedDistance: undefined,
  estimatedTime: undefined,
  actualStartTime: undefined,
  actualEndTime: undefined,
  actualDistance: undefined,
  actualTime: undefined,
  remark: undefined,
}
const data = reactive<PageData<PickingTaskForm, PickingTaskQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    taskNo: undefined,
    planId: undefined,
    taskType: undefined,
    taskStatus: undefined,
    pickerId: undefined,
    pickerName: undefined,
    startLocation: undefined,
    endLocation: undefined,
    totalItems: undefined,
    totalQuantity: undefined,
    estimatedDistance: undefined,
    estimatedTime: undefined,
    actualStartTime: undefined,
    actualEndTime: undefined,
    actualDistance: undefined,
    actualTime: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    taskNo: [
      { required: true, message: "任务编号不能为空", trigger: "blur" }
    ],
    planId: [
      { required: true, message: "方案ID不能为空", trigger: "blur" }
    ],
    taskType: [
      { required: true, message: "任务类型(NORMAL-正常, EMERGENCY-紧急)不能为空", trigger: "change" }
    ],
    taskStatus: [
      { required: true, message: "任务状态(PENDING-待处理, ASSIGNED-已分配, PICKING-拣货中, COMPLETED-已完成, CANCELLED-已取消)不能为空", trigger: "change" }
    ],
    pickerId: [
      { required: true, message: "拣货员ID不能为空", trigger: "blur" }
    ],
    pickerName: [
      { required: true, message: "拣货员姓名不能为空", trigger: "blur" }
    ],
    startLocation: [
      { required: true, message: "起始位置不能为空", trigger: "blur" }
    ],
    endLocation: [
      { required: true, message: "结束位置不能为空", trigger: "blur" }
    ],
    totalItems: [
      { required: true, message: "总物料项数不能为空", trigger: "blur" }
    ],
    totalQuantity: [
      { required: true, message: "总数量不能为空", trigger: "blur" }
    ],
    estimatedDistance: [
      { required: true, message: "预计行走距离不能为空", trigger: "blur" }
    ],
    estimatedTime: [
      { required: true, message: "预计用时(分钟)不能为空", trigger: "blur" }
    ],
    actualStartTime: [
      { required: true, message: "实际开始时间不能为空", trigger: "blur" }
    ],
    actualEndTime: [
      { required: true, message: "实际结束时间不能为空", trigger: "blur" }
    ],
    actualDistance: [
      { required: true, message: "实际行走距离不能为空", trigger: "blur" }
    ],
    actualTime: [
      { required: true, message: "实际用时(分钟)不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询拣货任务列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPickingTask(queryParams.value);
  pickingTaskList.value = res.rows;
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
  pickingTaskFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: PickingTaskVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加拣货任务";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: PickingTaskVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getPickingTask(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改拣货任务";
}

/** 提交按钮 */
const submitForm = () => {
  pickingTaskFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updatePickingTask(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addPickingTask(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: PickingTaskVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除拣货任务编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delPickingTask(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/pickingTask/export', {
    ...queryParams.value
  }, `pickingTask_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
