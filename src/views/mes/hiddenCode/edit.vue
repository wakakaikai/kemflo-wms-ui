<template>
  <div v-loading="loading" class="hidden-code-editor">
    <div class="action-bar">
      <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
      <el-button type="primary" icon="Check" @click="handleSave">保存</el-button>
    </div>

    <el-card shadow="never" class="section-card">
      <template #header><div class="section-title">基础信息</div></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-row :gutter="28">
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="类型" prop="groupType">
              <el-select v-model="form.groupType" placeholder="请选择类型" class="w-full">
                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="隐码变量" prop="hiddenCodeGroup">
              <el-input v-model="form.hiddenCodeGroup" :disabled="isEdit" placeholder="请输入隐码变量" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" placeholder="请输入描述" maxlength="200" clearable />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" class="w-full">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="section-card detail-card">
      <template #header><div class="section-title">详细信息</div></template>
      <div class="detail-toolbar">
        <el-button icon="Plus" @click="handleAddDetail">新增</el-button>
        <el-button icon="Delete" :disabled="selectedDetails.length === 0" @click="handleDeleteDetail">删除</el-button>
      </div>
      <el-table :data="detailList" border @selection-change="handleDetailSelectionChange">
        <el-table-column type="selection" width="54" align="center" />
        <el-table-column label="顺序" min-width="180" align="center">
          <template #default="scope">
            <el-input-number v-model="scope.row.sequence" :min="1" :max="999999" :controls="false" class="cell-input" />
          </template>
        </el-table-column>
        <el-table-column label="实际值" min-width="260" align="center">
          <template #default="scope">
            <el-input v-model="scope.row.plainCode" placeholder="请输入实际值" maxlength="100" />
          </template>
        </el-table-column>
        <el-table-column label="隐码值" min-width="260" align="center">
          <template #default="scope">
            <el-input v-model="scope.row.hiddenCode" placeholder="请输入隐码值" maxlength="100" />
          </template>
        </el-table-column>
      </el-table>
      <div class="detail-footer">共{{ detailList.length }}条记录</div>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="MesHiddenCodeEdit">
import { addHiddenCode, getHiddenCode, listHiddenCode, updateHiddenCode } from '@/api/mes/hiddenCode';
import type { HiddenCodeForm } from '@/api/mes/hiddenCode/types';
import { addHiddenCodeDetail, delHiddenCodeDetail, listHiddenCodeDetail, updateHiddenCodeDetail } from '@/api/mes/hiddenCodeDetail';
import type { HiddenCodeDetailForm, HiddenCodeDetailVO } from '@/api/mes/hiddenCodeDetail/types';

type DetailRow = HiddenCodeDetailForm & { rowKey: string };

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const loading = ref(false);
const formRef = ref<ElFormInstance>();
const selectedDetails = ref<DetailRow[]>([]);
const detailList = ref<DetailRow[]>([]);
const deletedDetailIds = ref<Array<number | string>>([]);
const isEdit = computed(() => Boolean(route.params.id));

const typeOptions = [
  { label: '隐码年', value: 'YEAR' },
  { label: '隐码月', value: 'MONTH' },
  { label: '隐码日', value: 'DAY' }
];

const statusOptions = [
  { label: '已启用', value: 'ENABLED' },
  { label: '已禁用', value: 'DISABLED' }
];

const form = reactive<HiddenCodeForm>({
  id: undefined,
  handle: undefined,
  hiddenCodeGroup: '',
  description: '',
  groupType: 'YEAR',
  status: 'ENABLED'
});

const rules: ElFormRules = {
  groupType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  hiddenCodeGroup: [{ required: true, message: '请输入隐码变量', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const createDetailRow = (sequence?: number): DetailRow => ({
  rowKey: `${Date.now()}_${Math.random()}`,
  sequence: sequence ?? detailList.value.length + 1,
  plainCode: '',
  hiddenCode: ''
});

const loadDetails = async (hiddenCodeGroupBo: string) => {
  const res = await listHiddenCodeDetail({
    pageNum: 1,
    pageSize: 1000,
    hiddenCodeGroupBo
  });
  detailList.value = res.rows.map((item: HiddenCodeDetailVO) => ({ ...item, rowKey: String(item.id) }));
};

const loadData = async () => {
  if (!isEdit.value) {
    detailList.value = [createDetailRow(10)];
    return;
  }
  loading.value = true;
  try {
    const res = await getHiddenCode(route.params.id as string);
    Object.assign(form, res.data);
    if (form.handle) await loadDetails(form.handle);
  } finally {
    loading.value = false;
  }
};

const handleAddDetail = () => detailList.value.push(createDetailRow());

const handleDetailSelectionChange = (selection: DetailRow[]) => {
  selectedDetails.value = selection;
};

const handleDeleteDetail = () => {
  const selectedKeys = new Set(selectedDetails.value.map((item) => item.rowKey));
  selectedDetails.value.forEach((item) => {
    if (item.id) deletedDetailIds.value.push(item.id);
  });
  detailList.value = detailList.value.filter((item) => !selectedKeys.has(item.rowKey));
  selectedDetails.value = [];
};

const validateDetails = () => {
  if (detailList.value.length === 0) {
    proxy?.$modal.msgWarning('请至少新增一条详细信息');
    return false;
  }
  const invalidIndex = detailList.value.findIndex((item) => !item.sequence || item.plainCode === undefined || item.plainCode === '' || item.hiddenCode === undefined || item.hiddenCode === '');
  if (invalidIndex >= 0) {
    proxy?.$modal.msgWarning(`第${invalidIndex + 1}条详细信息未填写完整`);
    return false;
  }
  return true;
};

const resolveCreatedMaster = async () => {
  const res = await listHiddenCode({ pageNum: 1, pageSize: 10, hiddenCodeGroup: form.hiddenCodeGroup });
  const master = res.rows.find((item) => item.hiddenCodeGroup === form.hiddenCodeGroup);
  if (!master) throw new Error('未获取到新建的隐码变量');
  form.id = master.id;
  form.handle = master.handle;
};

const saveDetails = async () => {
  if (deletedDetailIds.value.length > 0) {
    await delHiddenCodeDetail(deletedDetailIds.value.join(','));
  }
  await Promise.all(
    detailList.value.map((item) => {
      const detail: HiddenCodeDetailForm = {
        id: item.id,
        hiddenCodeGroupBo: form.handle,
        sequence: item.sequence,
        plainCode: item.plainCode,
        hiddenCode: item.hiddenCode
      };
      return item.id ? updateHiddenCodeDetail(detail) : addHiddenCodeDetail(detail);
    })
  );
};

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid || !validateDetails()) return;

  loading.value = true;
  try {
    if (isEdit.value) {
      await updateHiddenCode(form);
    } else {
      await addHiddenCode(form);
      await resolveCreatedMaster();
    }
    await saveDetails();
    proxy?.$modal.msgSuccess('保存成功');
    goBack();
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  if (proxy?.$tab?.closePage) {
    proxy.$tab.closePage();
  } else {
    router.back();
  }
};

onMounted(loadData);
</script>

<style scoped lang="scss">
.hidden-code-editor {
  min-height: calc(100vh - 84px);
  padding: 12px;
  background: #f3f4f7;
}

.action-bar {
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #fff;
}

.section-card {
  margin-bottom: 10px;
  border: 0;
}

.section-title {
  padding-left: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #244a90;
  border-left: 4px solid #315eb5;
}

.detail-toolbar {
  margin-bottom: 8px;
}

.detail-footer {
  padding: 10px 8px 0;
  color: #303133;
}

.cell-input {
  width: 100%;
}

:deep(.el-card__header) {
  padding: 10px 14px;
}

:deep(.detail-card .el-card__body) {
  padding: 10px 14px 14px;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f1f4fa;
  color: #303133;
}

:deep(.el-table .el-input__wrapper),
:deep(.el-table .el-input-number .el-input__wrapper) {
  box-shadow: none;
}
</style>
