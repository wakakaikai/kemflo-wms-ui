<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="设备编码" prop="equipmentCode">
              <el-input v-model="queryParams.equipmentCode" placeholder="请输入设备编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="设备描述" prop="equipmentDesc">
              <el-input v-model="queryParams.equipmentDesc" placeholder="请输入设备描述" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['wms:workOrderProcessEquipment:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['wms:workOrderProcessEquipment:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['wms:workOrderProcessEquipment:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['wms:workOrderProcessEquipment:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="workOrderProcessEquipmentList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="设备编码" align="center" prop="equipmentCode" />
        <el-table-column label="设备描述" align="center" prop="equipmentDesc" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['wms:workOrderProcessEquipment:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['wms:workOrderProcessEquipment:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
    <!-- 添加或修改工单工序设备对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="workOrderProcessEquipmentFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工单工序ID" prop="workOrderProcessId">
          <el-input v-model="form.workOrderProcessId" placeholder="请输入工单工序ID" />
        </el-form-item>
        <el-form-item label="设备编码" prop="equipmentCode">
          <el-input v-model="form.equipmentCode" placeholder="请输入设备编码" />
        </el-form-item>
        <el-form-item label="设备描述" prop="equipmentDesc">
          <el-input v-model="form.equipmentDesc" placeholder="请输入设备描述" />
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

<script setup name="WorkOrderProcessEquipment" lang="ts">
import { listWorkOrderProcessEquipment, getWorkOrderProcessEquipment, delWorkOrderProcessEquipment, addWorkOrderProcessEquipment, updateWorkOrderProcessEquipment } from '@/api/wms/workOrderProcessEquipment';
import { WorkOrderProcessEquipmentVO, WorkOrderProcessEquipmentQuery, WorkOrderProcessEquipmentForm } from '@/api/wms/workOrderProcessEquipment/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workOrderProcessEquipmentList = ref<WorkOrderProcessEquipmentVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const workOrderProcessEquipmentFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WorkOrderProcessEquipmentForm = {
  id: undefined,
  workOrderProcessId: undefined,
  equipmentCode: undefined,
  equipmentDesc: undefined,
  remark: undefined
}
const data = reactive<PageData<WorkOrderProcessEquipmentForm, WorkOrderProcessEquipmentQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    workOrderProcessId: undefined,
    equipmentCode: undefined,
    equipmentDesc: undefined,
    params: {
    }
  },
  rules: {
    id: [
      { required: true, message: "唯一ID不能为空", trigger: "blur" }
    ],
    workOrderProcessId: [
      { required: true, message: "工单工序ID不能为空", trigger: "blur" }
    ],
    equipmentCode: [
      { required: true, message: "设备编码不能为空", trigger: "blur" }
    ],
    equipmentDesc: [
      { required: true, message: "设备描述不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询工单工序设备列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWorkOrderProcessEquipment(queryParams.value);
  workOrderProcessEquipmentList.value = res.rows;
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
  workOrderProcessEquipmentFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WorkOrderProcessEquipmentVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加工单工序设备";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: WorkOrderProcessEquipmentVO) => {
  reset();
  const _id = row?.id || ids.value[0]
  const res = await getWorkOrderProcessEquipment(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改工单工序设备";
}

/** 提交按钮 */
const submitForm = () => {
  workOrderProcessEquipmentFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateWorkOrderProcessEquipment(form.value).finally(() =>  buttonLoading.value = false);
      } else {
        await addWorkOrderProcessEquipment(form.value).finally(() =>  buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: WorkOrderProcessEquipmentVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除工单工序设备编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
  await delWorkOrderProcessEquipment(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/workOrderProcessEquipment/export', {
    ...queryParams.value
  }, `workOrderProcessEquipment_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList();
});
</script>
