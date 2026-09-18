<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="隐码变量" prop="hiddenCodeGroup">
              <el-input
                v-model="queryParams.hiddenCodeGroup"
                placeholder="请输入隐码变量"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型" prop="groupType">
              <el-select v-model="queryParams.groupType" placeholder="请选择类型" clearable style="width: 160px">
                <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
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
            <el-button v-hasPermi="['mes:hiddenCode:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['mes:hiddenCode:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate"
            >编辑</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-hasPermi="['mes:hiddenCode:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete"
            >删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:hiddenCode:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="hiddenCodeList" border highlight-current-row @selection-change="handleSelectionChange" @row-dblclick="handleRowDblClick">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="序号" type="index" width="70" align="center">
          <template #default="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="隐码变量" prop="hiddenCodeGroup" min-width="180" align="center" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" min-width="180" align="center" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="110" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类型" prop="groupType" width="100" align="center">
          <template #default="scope">{{ getTypeLabel(scope.row.groupType) }}</template>
        </el-table-column>
        <el-table-column label="创建人" prop="creator" width="110" align="center" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" width="165" align="center" />
        <el-table-column label="最终修改人" prop="updater" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="最终修改时间" prop="modifyTime" width="165" align="center" />
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts" name="MesHiddenCode">
import { delHiddenCode, listHiddenCode } from '@/api/mes/hiddenCode';
import type { HiddenCodeQuery, HiddenCodeVO } from '@/api/mes/hiddenCode/types';

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const hiddenCodeList = ref<HiddenCodeVO[]>([]);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const statusOptions = [
  { label: '已启用', value: 'ENABLED' },
  { label: '已禁用', value: 'DISABLED' }
];

const typeOptions = [
  { label: '年', value: 'YEAR' },
  { label: '月', value: 'MONTH' },
  { label: '日', value: 'DAY' }
];

const queryParams = reactive<HiddenCodeQuery>({
  pageNum: 1,
  pageSize: 10,
  hiddenCodeGroup: undefined,
  description: undefined,
  status: undefined,
  groupType: undefined
});

const getStatusLabel = (value?: string) => statusOptions.find((item) => item.value === value)?.label ?? value ?? '';
const getTypeLabel = (value?: string) => typeOptions.find((item) => item.value === value)?.label ?? value ?? '';

const getList = async () => {
  loading.value = true;
  try {
    const res = await listHiddenCode(queryParams);
    hiddenCodeList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: HiddenCodeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

const handleAdd = () => router.push('/mes/hiddenCode/create');

const handleUpdate = (row?: HiddenCodeVO) => {
  const id = row?.id ?? ids.value[0];
  if (id) router.push(`/mes/hiddenCode/edit/${id}`);
};

const handleRowDblClick = (row: HiddenCodeVO) => handleUpdate(row);

const handleDelete = async (row?: HiddenCodeVO) => {
  const deleteIds = row?.id ? [row.id] : ids.value;
  await proxy?.$modal.confirm(`是否确认删除选中的隐码变量？`);
  await delHiddenCode(deleteIds.join(','));
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  proxy?.download('mes/hiddenCode/export', { ...queryParams }, `hiddenCode_${Date.now()}.xlsx`);
};

onMounted(getList);
</script>

<style scoped>
:deep(.el-table th.el-table__cell) {
  background-color: #f1f4fa;
  color: #303133;
}
</style>
