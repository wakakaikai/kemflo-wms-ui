<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="发料单号" prop="issueNo">
              <el-input v-model="queryParams.issueNo" placeholder="请输入发料单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号" prop="workOrderNo">
              <el-input v-model="queryParams.workOrderNo" placeholder="请输入工单号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="方案ID" prop="planId">
              <el-input v-model="queryParams.planId" placeholder="请输入方案ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="任务ID" prop="taskId">
              <el-input v-model="queryParams.taskId" placeholder="请输入任务ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="总物料项数" prop="totalItems">
              <el-input v-model="queryParams.totalItems" placeholder="请输入总物料项数" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="总数量" prop="totalQuantity">
              <el-input v-model="queryParams.totalQuantity" placeholder="请输入总数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发料日期" prop="issueDate">
              <el-date-picker clearable
                v-model="queryParams.issueDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择发料日期"
              />
            </el-form-item>
            <el-form-item label="领料人ID" prop="receiverId">
              <el-input v-model="queryParams.receiverId" placeholder="请输入领料人ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="领料人姓名" prop="receiverName">
              <el-input v-model="queryParams.receiverName" placeholder="请输入领料人姓名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="领料部门" prop="receiverDept">
              <el-input v-model="queryParams.receiverDept" placeholder="请输入领料部门" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="发料时间" prop="issueTime">
              <el-date-picker clearable
                v-model="queryParams.issueTime"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择发料时间"
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:materialIssue:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:materialIssue:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:materialIssue:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:materialIssue:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="materialIssueList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="发料单号" align="center" prop="issueNo" />
        <el-table-column label="工单号" align="center" prop="workOrderNo" />
        <el-table-column label="方案ID" align="center" prop="planId" />
        <el-table-column label="任务ID" align="center" prop="taskId" />
        <el-table-column label="发料类型(NORMAL-正常发料, EMERGENCY-紧急发料)" align="center" prop="issueType" />
        <el-table-column label="发料状态(PENDING-待发料, ISSUING-发料中, COMPLETED-已完成, CANCELLED-已取消)" align="center" prop="issueStatus" />
        <el-table-column label="总物料项数" align="center" prop="totalItems" />
        <el-table-column label="总数量" align="center" prop="totalQuantity" />
        <el-table-column label="发料日期" align="center" prop="issueDate" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.issueDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="领料人ID" align="center" prop="receiverId" />
        <el-table-column label="领料人姓名" align="center" prop="receiverName" />
        <el-table-column label="领料部门" align="center" prop="receiverDept" />
        <el-table-column label="发料时间" align="center" prop="issueTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.issueTime, '{y}-{m}-{d}') }}</span>
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
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:materialIssue:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:materialIssue:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改发料记录对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="materialIssueFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="发料单号" prop="issueNo">
          <el-input v-model="form.issueNo" placeholder="请输入发料单号" />
        </el-form-item>
        <el-form-item label="工单号" prop="workOrderNo">
          <el-input v-model="form.workOrderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="方案ID" prop="planId">
          <el-input v-model="form.planId" placeholder="请输入方案ID" />
        </el-form-item>
        <el-form-item label="任务ID" prop="taskId">
          <el-input v-model="form.taskId" placeholder="请输入任务ID" />
        </el-form-item>
        <el-form-item label="总物料项数" prop="totalItems">
          <el-input v-model="form.totalItems" placeholder="请输入总物料项数" />
        </el-form-item>
        <el-form-item label="总数量" prop="totalQuantity">
          <el-input v-model="form.totalQuantity" placeholder="请输入总数量" />
        </el-form-item>
        <el-form-item label="发料日期" prop="issueDate">
          <el-date-picker clearable
            v-model="form.issueDate"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择发料日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="领料人ID" prop="receiverId">
          <el-input v-model="form.receiverId" placeholder="请输入领料人ID" />
        </el-form-item>
        <el-form-item label="领料人姓名" prop="receiverName">
          <el-input v-model="form.receiverName" placeholder="请输入领料人姓名" />
        </el-form-item>
        <el-form-item label="领料部门" prop="receiverDept">
          <el-input v-model="form.receiverDept" placeholder="请输入领料部门" />
        </el-form-item>
        <el-form-item label="发料时间" prop="issueTime">
          <el-date-picker clearable
            v-model="form.issueTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择发料时间">
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

<script setup name="MaterialIssue" lang="ts">
import { listMaterialIssue, getMaterialIssue, delMaterialIssue, addMaterialIssue, updateMaterialIssue } from '@/api/wms/materialIssue';
import { MaterialIssueVO, MaterialIssueQuery, MaterialIssueForm } from '@/api/wms/materialIssue/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const materialIssueList = ref<MaterialIssueVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const materialIssueFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: MaterialIssueForm = {
  id: undefined,
  issueNo: undefined,
  workOrderNo: undefined,
  planId: undefined,
  taskId: undefined,
  issueType: undefined,
  issueStatus: undefined,
  totalItems: undefined,
  totalQuantity: undefined,
  issueDate: undefined,
  receiverId: undefined,
  receiverName: undefined,
  receiverDept: undefined,
  issueTime: undefined,
  confirmTime: undefined,
  remark: undefined,
}
const data = reactive<PageData<MaterialIssueForm, MaterialIssueQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    issueNo: undefined,
    workOrderNo: undefined,
    planId: undefined,
    taskId: undefined,
    issueType: undefined,
    issueStatus: undefined,
    totalItems: undefined,
    totalQuantity: undefined,
    issueDate: undefined,
    receiverId: undefined,
    receiverName: undefined,
    receiverDept: undefined,
    issueTime: undefined,
    confirmTime: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    issueNo: [
      { required: true, message: "发料单号不能为空", trigger: "blur" }
    ],
    workOrderNo: [
      { required: true, message: "工单号不能为空", trigger: "blur" }
    ],
    planId: [
      { required: true, message: "方案ID不能为空", trigger: "blur" }
    ],
    taskId: [
      { required: true, message: "任务ID不能为空", trigger: "blur" }
    ],
    issueType: [
      { required: true, message: "发料类型(NORMAL-正常发料, EMERGENCY-紧急发料)不能为空", trigger: "change" }
    ],
    issueStatus: [
      { required: true, message: "发料状态(PENDING-待发料, ISSUING-发料中, COMPLETED-已完成, CANCELLED-已取消)不能为空", trigger: "change" }
    ],
    totalItems: [
      { required: true, message: "总物料项数不能为空", trigger: "blur" }
    ],
    totalQuantity: [
      { required: true, message: "总数量不能为空", trigger: "blur" }
    ],
    issueDate: [
      { required: true, message: "发料日期不能为空", trigger: "blur" }
    ],
    receiverId: [
      { required: true, message: "领料人ID不能为空", trigger: "blur" }
    ],
    receiverName: [
      { required: true, message: "领料人姓名不能为空", trigger: "blur" }
    ],
    receiverDept: [
      { required: true, message: "领料部门不能为空", trigger: "blur" }
    ],
    issueTime: [
      { required: true, message: "发料时间不能为空", trigger: "blur" }
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

/** 查询发料记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listMaterialIssue(queryParams.value);
  materialIssueList.value = res.rows;
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
  materialIssueFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: MaterialIssueVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加发料记录";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: MaterialIssueVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getMaterialIssue(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改发料记录";
}

/** 提交按钮 */
const submitForm = () => {
  materialIssueFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateMaterialIssue(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addMaterialIssue(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: MaterialIssueVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除发料记录编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delMaterialIssue(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/materialIssue/export', {
    ...queryParams.value
  }, `materialIssue_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
