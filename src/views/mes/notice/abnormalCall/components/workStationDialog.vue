<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="70%" append-to-body>
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
        <el-form-item label="资源类型编码" prop="resourceType">
          <el-input v-model="queryParams.resourceType" placeholder="请输入资源类型编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="资源类型描述" prop="description">
          <el-input v-model="queryParams.description" placeholder="请输入资源类型描述" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :loading="loading" :data="resourceTypeList" style="width: 100%" border highlight-current-row @row-click="handleRowClick">
        <!-- 单选列（通过高亮行实现） -->
        <el-table-column width="55">
          <template #default="checkedDataScope">
            <el-radio v-model="selectedRowData.id" :label="checkedDataScope.row.id" class="ml-[10px]">
              <span class="el-radio__label" style="margin-right: 0"></span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="资源类型编码" align="center" prop="resourceType" />
        <el-table-column label="资源类型描述" align="center" prop="description" />
        <el-table-column label="备注" align="center" prop="remark" />
      </el-table>
<!--      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />-->

      <template #footer>
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { queryWorkStationList } from '@/api/mes/resourceType';
import { ResourceTypeVO, ResourceTypeQuery, ResourceTypeForm } from '@/api/mes/resourceType/types';
import useDialog from '@/hooks/useDialog';
import { ref } from 'vue';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const resourceTypeList = ref<ResourceTypeVO[]>([]);
const loading = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();
const operationFormRef = ref<ElFormInstance>();

const initFormData: ResourceTypeForm = {
  id: undefined,
  handle: undefined,
  resourceType: undefined,
  description: undefined,
  remark: undefined
};
const data = reactive<PageData<ResourceTypeForm, ResourceTypeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    handle: undefined,
    resourceType: undefined,
    description: undefined,
    params: {}
  },
  rules: {}
});
const { queryParams, form, rules } = toRefs(data);

const { title, visible, openDialog, closeDialog } = useDialog({
  title: '选择工作岗位'
});

/** 查询异常呼叫工位列表 */
const getList = async () => {
  loading.value = true;
  const res = await queryWorkStationList(queryParams.value);
  resourceTypeList.value = res.data;
  total.value = res.total;
  loading.value = false;
};

/** 选中数据 */
const selectedRowData = ref({ id: '' });
const handleRowClick = (val: any) => {
  selectedRowData.value = val;
  form.value = selectedRowData.value;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  operationFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  selectedRowData.value.id = '';
  handleQuery();
};

/** 提交表单 */
const submitForm = () => {
  queryFormRef.value.validate((valid) => {
    if (valid) {
      proxy.$emit('workStationCallBack', selectedRowData.value);
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

<style scoped>
.radio-no-label :deep(.el-radio__label) {
  display: none;
}
</style>
