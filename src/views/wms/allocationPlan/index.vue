<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="方案编号" prop="planNo">
              <el-input v-model="queryParams.planNo" placeholder="请输入方案编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="方案名称" prop="planName">
              <el-input v-model="queryParams.planName" placeholder="请输入方案名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单号列表(JSON数组)" prop="workOrderNos">
              <el-input v-model="queryParams.workOrderNos" placeholder="请输入工单号列表(JSON数组)" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工单数量" prop="workOrderCount">
              <el-input v-model="queryParams.workOrderCount" placeholder="请输入工单数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="总分配数量" prop="totalQuantity">
              <el-input v-model="queryParams.totalQuantity" placeholder="请输入总分配数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="拣货库位列表(JSON数组)" prop="pickLocations">
              <el-input v-model="queryParams.pickLocations" placeholder="请输入拣货库位列表(JSON数组)" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="拣货点数量" prop="pickLocationCount">
              <el-input v-model="queryParams.pickLocationCount" placeholder="请输入拣货点数量" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="总行走距离" prop="totalDistance">
              <el-input v-model="queryParams.totalDistance" placeholder="请输入总行走距离" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="平均齐套率" prop="avgKitRate">
              <el-input v-model="queryParams.avgKitRate" placeholder="请输入平均齐套率" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="FIFO符合度得分" prop="fifoScore">
              <el-input v-model="queryParams.fifoScore" placeholder="请输入FIFO符合度得分" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="效率得分" prop="efficiencyScore">
              <el-input v-model="queryParams.efficiencyScore" placeholder="请输入效率得分" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="综合得分" prop="totalScore">
              <el-input v-model="queryParams.totalScore" placeholder="请输入综合得分" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="方案描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入方案描述" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:allocationPlan:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:allocationPlan:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:allocationPlan:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:allocationPlan:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="allocationPlanList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="方案编号" align="center" prop="planNo" />
        <el-table-column label="方案名称" align="center" prop="planName" />
        <el-table-column label="策略类型(FIFO_STRICT-严格FIFO, HIGH_KIT-高齐套率, EFFICIENCY-效率优先, BALANCED-平衡策略)" align="center" prop="strategyType" />
        <el-table-column label="工单号列表(JSON数组)" align="center" prop="workOrderNos" />
        <el-table-column label="工单数量" align="center" prop="workOrderCount" />
        <el-table-column label="总分配数量" align="center" prop="totalQuantity" />
        <el-table-column label="拣货库位列表(JSON数组)" align="center" prop="pickLocations" />
        <el-table-column label="拣货点数量" align="center" prop="pickLocationCount" />
        <el-table-column label="总行走距离" align="center" prop="totalDistance" />
        <el-table-column label="平均齐套率" align="center" prop="avgKitRate" />
        <el-table-column label="FIFO符合度得分" align="center" prop="fifoScore" />
        <el-table-column label="效率得分" align="center" prop="efficiencyScore" />
        <el-table-column label="综合得分" align="center" prop="totalScore" />
        <el-table-column label="方案状态(DRAFT-草稿, CONFIRMED-已确认, EXECUTING-执行中, COMPLETED-已完成, CANCELLED-已取消)" align="center" prop="planStatus" />
        <el-table-column label="方案描述" align="center" prop="description" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:allocationPlan:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:allocationPlan:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改分配方案对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="allocationPlanFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="方案编号" prop="planNo">
          <el-input v-model="form.planNo" placeholder="请输入方案编号" />
        </el-form-item>
        <el-form-item label="方案名称" prop="planName">
          <el-input v-model="form.planName" placeholder="请输入方案名称" />
        </el-form-item>
        <el-form-item label="工单号列表(JSON数组)" prop="workOrderNos">
            <el-input v-model="form.workOrderNos" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="工单数量" prop="workOrderCount">
          <el-input v-model="form.workOrderCount" placeholder="请输入工单数量" />
        </el-form-item>
        <el-form-item label="总分配数量" prop="totalQuantity">
          <el-input v-model="form.totalQuantity" placeholder="请输入总分配数量" />
        </el-form-item>
        <el-form-item label="拣货库位列表(JSON数组)" prop="pickLocations">
            <el-input v-model="form.pickLocations" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="拣货点数量" prop="pickLocationCount">
          <el-input v-model="form.pickLocationCount" placeholder="请输入拣货点数量" />
        </el-form-item>
        <el-form-item label="总行走距离" prop="totalDistance">
          <el-input v-model="form.totalDistance" placeholder="请输入总行走距离" />
        </el-form-item>
        <el-form-item label="平均齐套率" prop="avgKitRate">
          <el-input v-model="form.avgKitRate" placeholder="请输入平均齐套率" />
        </el-form-item>
        <el-form-item label="FIFO符合度得分" prop="fifoScore">
          <el-input v-model="form.fifoScore" placeholder="请输入FIFO符合度得分" />
        </el-form-item>
        <el-form-item label="效率得分" prop="efficiencyScore">
          <el-input v-model="form.efficiencyScore" placeholder="请输入效率得分" />
        </el-form-item>
        <el-form-item label="综合得分" prop="totalScore">
          <el-input v-model="form.totalScore" placeholder="请输入综合得分" />
        </el-form-item>
        <el-form-item label="方案描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入方案描述" />
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

<script setup name="AllocationPlan" lang="ts">
import { listAllocationPlan, getAllocationPlan, delAllocationPlan, addAllocationPlan, updateAllocationPlan } from '@/api/wms/allocationPlan';
import { AllocationPlanVO, AllocationPlanQuery, AllocationPlanForm } from '@/api/wms/allocationPlan/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const allocationPlanList = ref<AllocationPlanVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const allocationPlanFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: AllocationPlanForm = {
  id: undefined,
  planNo: undefined,
  planName: undefined,
  strategyType: undefined,
  workOrderNos: undefined,
  workOrderCount: undefined,
  totalQuantity: undefined,
  pickLocations: undefined,
  pickLocationCount: undefined,
  totalDistance: undefined,
  avgKitRate: undefined,
  fifoScore: undefined,
  efficiencyScore: undefined,
  totalScore: undefined,
  planStatus: undefined,
  description: undefined,
  remark: undefined,
}
const data = reactive<PageData<AllocationPlanForm, AllocationPlanQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    planNo: undefined,
    planName: undefined,
    strategyType: undefined,
    workOrderNos: undefined,
    workOrderCount: undefined,
    totalQuantity: undefined,
    pickLocations: undefined,
    pickLocationCount: undefined,
    totalDistance: undefined,
    avgKitRate: undefined,
    fifoScore: undefined,
    efficiencyScore: undefined,
    totalScore: undefined,
    planStatus: undefined,
    description: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    planNo: [
      { required: true, message: "方案编号不能为空", trigger: "blur" }
    ],
    planName: [
      { required: true, message: "方案名称不能为空", trigger: "blur" }
    ],
    strategyType: [
      { required: true, message: "策略类型(FIFO_STRICT-严格FIFO, HIGH_KIT-高齐套率, EFFICIENCY-效率优先, BALANCED-平衡策略)不能为空", trigger: "change" }
    ],
    workOrderNos: [
      { required: true, message: "工单号列表(JSON数组)不能为空", trigger: "blur" }
    ],
    workOrderCount: [
      { required: true, message: "工单数量不能为空", trigger: "blur" }
    ],
    totalQuantity: [
      { required: true, message: "总分配数量不能为空", trigger: "blur" }
    ],
    pickLocations: [
      { required: true, message: "拣货库位列表(JSON数组)不能为空", trigger: "blur" }
    ],
    pickLocationCount: [
      { required: true, message: "拣货点数量不能为空", trigger: "blur" }
    ],
    totalDistance: [
      { required: true, message: "总行走距离不能为空", trigger: "blur" }
    ],
    avgKitRate: [
      { required: true, message: "平均齐套率不能为空", trigger: "blur" }
    ],
    fifoScore: [
      { required: true, message: "FIFO符合度得分不能为空", trigger: "blur" }
    ],
    efficiencyScore: [
      { required: true, message: "效率得分不能为空", trigger: "blur" }
    ],
    totalScore: [
      { required: true, message: "综合得分不能为空", trigger: "blur" }
    ],
    planStatus: [
      { required: true, message: "方案状态(DRAFT-草稿, CONFIRMED-已确认, EXECUTING-执行中, COMPLETED-已完成, CANCELLED-已取消)不能为空", trigger: "change" }
    ],
    description: [
      { required: true, message: "方案描述不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询分配方案列表 */
const getList = async () => {
  loading.value = true;
  const res = await listAllocationPlan(queryParams.value);
  allocationPlanList.value = res.rows;
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
  allocationPlanFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: AllocationPlanVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加分配方案";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: AllocationPlanVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getAllocationPlan(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改分配方案";
}

/** 提交按钮 */
const submitForm = () => {
  allocationPlanFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateAllocationPlan(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addAllocationPlan(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: AllocationPlanVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除分配方案编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delAllocationPlan(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/allocationPlan/export', {
    ...queryParams.value
  }, `allocationPlan_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
