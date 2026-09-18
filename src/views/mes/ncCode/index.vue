<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="不合格代码" prop="ncCode">
              <el-input v-model="queryParams.ncCode" placeholder="请输入不合格代码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                <el-option v-for="dict in mes_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="分类" prop="ncCategory">
              <el-select v-model="queryParams.ncCategory" placeholder="请选择分类" clearable>
                <el-option v-for="dict in mes_nc_category" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="类别" prop="ncType">
              <el-select v-model="queryParams.ncType" placeholder="请选择类别" clearable>
                <el-option v-for="dict in mes_nc_type" :key="dict.value" :label="dict.label" :value="dict.value" />
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
          <el-col :span="1.5"><el-button v-hasPermi="['mes:ncCode:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button></el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:ncCode:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">编辑</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:ncCode:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['mes:ncCode:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button></el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="ncCodeList" border highlight-current-row @selection-change="handleSelectionChange" @row-dblclick="handleUpdate">
        <el-table-column type="selection" width="54" align="center" />
        <el-table-column label="序号" type="index" width="70" align="center">
          <template #default="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="不合格代码" prop="ncCode" min-width="130" align="center" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" min-width="180" align="center" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope"><dict-tag :options="mes_status" :value="scope.row.status" /></template>
        </el-table-column>
        <el-table-column label="分类" prop="ncCategory" width="110" align="center">
          <template #default="scope"><dict-tag :options="mes_nc_category" :value="scope.row.ncCategory" /></template>
        </el-table-column>
        <el-table-column label="类别" prop="ncType" width="110" align="center">
          <template #default="scope"><dict-tag :options="mes_nc_type" :value="scope.row.ncType" /></template>
        </el-table-column>
        <el-table-column label="严重程度" prop="ncSeverityThreshold" width="110" align="center">
          <template #default="scope"><dict-tag :options="mes_nc_severity_threshold" :value="scope.row.ncSeverityThreshold" /></template>
        </el-table-column>
        <el-table-column label="创建人" prop="creator" width="110" align="center" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" width="165" align="center" />
        <el-table-column label="修改人" prop="updater" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="修改时间" prop="modifyTime" width="165" align="center" />
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="NcCode" lang="ts">
import { delNcCode, listNcCode } from '@/api/mes/ncCode';
import type { NcCodeQuery, NcCodeVO } from '@/api/mes/ncCode/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const { mes_status, mes_nc_type, mes_nc_category, mes_nc_severity_threshold } = toRefs<any>(proxy?.useDict('mes_status', 'mes_nc_type', 'mes_nc_category', 'mes_nc_severity_threshold'));

const ncCodeList = ref<NcCodeVO[]>([]);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();

const queryParams = reactive<NcCodeQuery>({
  pageNum: 1,
  pageSize: 10,
  ncCode: undefined,
  description: undefined,
  status: undefined,
  ncCategory: undefined,
  ncType: undefined,
  params: {}
});

const getList = async () => {
  loading.value = true;
  try {
    const res = await listNcCode(queryParams);
    ncCodeList.value = res.rows;
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

const handleSelectionChange = (selection: NcCodeVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

const handleAdd = () => router.push('/mes/ncCode/create');

const handleUpdate = (row?: NcCodeVO) => {
  const currentId = row?.id ?? ids.value[0];
  if (currentId) router.push(`/mes/ncCode/edit/${currentId}`);
};

const handleDelete = async (row?: NcCodeVO) => {
  const deleteIds = row?.id ?? ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的不合格代码？');
  await delNcCode(deleteIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => proxy?.download('mes/ncCode/export', { ...queryParams }, `ncCode_${Date.now()}.xlsx`);

onMounted(getList);
</script>

<style scoped>
:deep(.el-table th.el-table__cell) {
  background-color: #f1f4fa;
  color: #303133;
}
</style>
