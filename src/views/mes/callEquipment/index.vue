<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="设备编码" prop="equipmentId">
              <el-input v-model="queryParams.equipmentId" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作岗位" prop="workStation">
              <el-input v-model="queryParams.workStation" placeholder="请输入工作岗位" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="工作中心" prop="workCenter">
              <el-input v-model="queryParams.workCenter" placeholder="请输入工作中心" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['mes:callEquipment:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['mes:callEquipment:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['mes:callEquipment:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['mes:callEquipment:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="callEquipmentList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="唯一ID" align="center" prop="id" v-if="true" />
        <el-table-column label="设备编码" align="center" prop="equipmentId" />
        <el-table-column label="用户名称" align="center" prop="userName" />
        <el-table-column label="工作岗位" align="center" prop="workStation" />
        <el-table-column label="工作中心" align="center" prop="workCenter" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['mes:callEquipment:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['mes:callEquipment:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改异常呼叫设备对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="callEquipmentFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="设备编码" prop="equipmentId">
          <el-input v-model="form.equipmentId" placeholder="请输入设备编码" />
        </el-form-item>
        <el-form-item label="用户名称" prop="userName">
          <el-input v-model="form.userName" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="工作岗位" prop="workStation">
          <el-input v-model="form.workStation" placeholder="请输入工作岗位" />
        </el-form-item>
        <el-form-item label="工作中心" prop="workCenter">
          <el-input v-model="form.workCenter" placeholder="请输入工作中心" />
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

<script setup name="CallEquipment" lang="ts">
import { listCallEquipment, getCallEquipment, delCallEquipment, addCallEquipment, updateCallEquipment } from '@/api/mes/callEquipment';
import { CallEquipmentVO, CallEquipmentQuery, CallEquipmentForm } from '@/api/mes/callEquipment/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const callEquipmentList = ref<CallEquipmentVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const callEquipmentFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CallEquipmentForm = {
  id: undefined,
  equipmentId: undefined,
  userName: undefined,
  workStation: undefined,
  workCenter: undefined,
  remark: undefined,
}
const data = reactive<PageData<CallEquipmentForm, CallEquipmentQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    equipmentId: undefined,
    userName: undefined,
    workStation: undefined,
    workCenter: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    equipmentId: [
      { required: true, message: "设备编码不能为空", trigger: "blur" }
    ],
    userName: [
      { required: true, message: "用户名称不能为空", trigger: "blur" }
    ],
    workStation: [
      { required: true, message: "工作岗位不能为空", trigger: "blur" }
    ],
    workCenter: [
      { required: true, message: "工作中心不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询异常呼叫设备列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCallEquipment(queryParams.value);
  callEquipmentList.value = res.rows;
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
  callEquipmentFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: CallEquipmentVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加异常呼叫设备";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: CallEquipmentVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getCallEquipment(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改异常呼叫设备";
}

/** 提交按钮 */
const submitForm = () => {
  callEquipmentFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateCallEquipment(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addCallEquipment(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: CallEquipmentVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除异常呼叫设备编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delCallEquipment(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('mes/callEquipment/export', {
    ...queryParams.value
  }, `callEquipment_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
