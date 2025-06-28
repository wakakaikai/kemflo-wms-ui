<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="资源" prop="resrce">
          <el-input v-model="queryParams.resrce" placeholder="请输入资源" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="资源描述" prop="description">
          <el-input v-model="queryParams.description" placeholder="请输入资源描述" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="resourceList" style="width: 100%" border highlight-current-row @row-click="handleRowClick">
        <!-- 单选列（通过高亮行实现） -->
        <el-table-column width="55">
          <template #default="checkedDataScope">
            <el-radio v-model="selectedRowData.id" :label="checkedDataScope.row.id" class="ml-[10px]">
              <span class="el-radio__label" style="margin-right: 0"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="资源" align="left" prop="resrce" width="200" />
        <el-table-column label="资源描述" align="left" prop="description" width="300" />
        <el-table-column label="状态" align="center" prop="status" />
        <el-table-column label="设置状态" align="center" prop="setupState" />
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { listResrce } from '@/api/mes/resrce';
import { ResrceVO, ResrceQuery, ResrceForm } from '@/api/mes/resrce/types';
import useDialog from '@/hooks/useDialog';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const resourceList = ref<ResrceVO[]>([]);

const loading = ref(true);

const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const resourceFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ResrceForm = {
  id: undefined,
  handle: undefined,
  resrce: undefined,
  description: undefined,
  status: undefined,
  processResource: undefined,
  validFrom: undefined,
  validTo: undefined,
  setupState: undefined,
  remark: undefined,
  createUserId: undefined,
  creator: undefined,
  modifyUserId: undefined,
  updater: undefined,
  modifyTime: undefined,
  deleteFlag: undefined,
  auditDataVersion: undefined,
  secBuId: undefined,
  secUserId: undefined,
  secOuId: undefined,
  belongOrgId: undefined,
  tenantOrgId: undefined
};
const data = reactive<PageData<ResrceForm, ResrceQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    resrce: undefined,
    description: undefined,
    status: undefined,
    processResource: undefined,
    validFrom: undefined,
    validTo: undefined,
    setupState: undefined,
    createUserId: undefined,
    creator: undefined,
    modifyUserId: undefined,
    updater: undefined,
    modifyTime: undefined,
    deleteFlag: undefined,
    auditDataVersion: undefined,
    secBuId: undefined,
    secUserId: undefined,
    secOuId: undefined,
    belongOrgId: undefined,
    tenantOrgId: undefined,
    params: {}
  },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择资源'
});

/** 查询资源列表 */
const getList = async () => {
  loading.value = true;
  const res = await listResrce(queryParams.value);
  resourceList.value = res.rows;
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
  resourceFormRef.value?.resetFields();
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

/** 选中数据 */
const selectedRowData = ref({ id: '' });
const handleRowClick = (val: any) => {
  selectedRowData.value = val;
  form.value = selectedRowData.value;
};

/** 提交表单 */
const submitForm = () => {
  queryFormRef.value.validate((valid) => {
    if (valid) {
      proxy.$emit('resourceCallBack', selectedRowData.value);
      closeDialog();
    }
  });
};

onMounted(async () => {
  handleQuery();
});
defineExpose({
  openDialog,
  closeDialog
});
</script>

<style scoped></style>
