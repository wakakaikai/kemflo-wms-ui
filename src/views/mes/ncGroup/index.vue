<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="不合格组" prop="ncGroup"><el-input v-model="queryParams.ncGroup" placeholder="请输入不合格组" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="描述" prop="description"><el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item label="对所有工序有效" prop="validAtAllOperations">
              <el-select v-model="queryParams.validAtAllOperations" placeholder="请选择" clearable style="width: 150px"> <el-option label="是" value="true" /><el-option label="否" value="false" /> </el-select>
            </el-form-item>
            <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>
    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5"><el-button v-hasPermi="['mes:group:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['mes:group:edit']" type="success" plain icon="Edit" :disabled="ids.length !== 1" @click="handleUpdate()">编辑</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['mes:group:remove']" type="danger" plain icon="Delete" :disabled="!ids.length || deleting" :loading="deleting" @click="handleDelete()">删除</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['mes:group:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button></el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>
      <el-table v-loading="loading" :data="groups" border highlight-current-row @selection-change="handleSelectionChange" @row-dblclick="handleUpdate">
        <el-table-column type="selection" width="54" align="center" />
        <el-table-column label="序号" width="70" align="center"
          ><template #default="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template></el-table-column
        >
        <el-table-column label="不合格组" prop="ncGroup" min-width="160" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="对所有工序有效" width="150" align="center"
          ><template #default="{ row }"
            ><el-tag :type="row.validAtAllOperations === 'true' ? 'success' : 'info'">{{ row.validAtAllOperations === 'true' ? '是' : '否' }}</el-tag></template
          ></el-table-column
        >
        <el-table-column label="筛选优先级" prop="priority" width="120" align="center" />
        <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="创建人" prop="creator" width="110" align="center" />
        <el-table-column label="创建时间" prop="createTime" width="165" align="center" />
        <el-table-column label="修改人" prop="updater" width="110" align="center" />
        <el-table-column label="修改时间" prop="modifyTime" width="165" align="center" />
        <el-table-column label="操作" fixed="right" width="110" align="center">
          <template #default="{ row }"><el-button v-hasPermi="['mes:group:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" /><el-button v-hasPermi="['mes:group:remove']" link type="danger" icon="Delete" :disabled="deleting" @click="handleDelete(row)" /></template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="NcGroup" lang="ts">
import { delNcGroup, listNcGroup } from '@/api/mes/ncGroup';
import type { NcGroupQuery, NcGroupVO } from '@/api/mes/ncGroup/types';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const groups = ref<NcGroupVO[]>([]);
const ids = ref<Array<string | number>>([]);
const total = ref(0);
const loading = ref(false);
const deleting = ref(false);
const showSearch = ref(true);
const queryFormRef = ref<ElFormInstance>();
const queryParams = reactive<NcGroupQuery>({ pageNum: 1, pageSize: 10, ncGroup: undefined, description: undefined, validAtAllOperations: undefined });

const getList = async () => {
  loading.value = true;
  try {
    const response = await listNcGroup(queryParams);
    groups.value = response.rows || [];
    total.value = response.total || 0;
    ids.value = [];
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
const handleSelectionChange = (selection: NcGroupVO[]) => {
  ids.value = selection.map((item) => item.id);
};
const handleAdd = () => router.push('/mes/ncGroup/create');
const handleUpdate = (row?: NcGroupVO) => {
  if (!proxy?.$auth.hasPermi('mes:group:edit')) return;
  const id = row?.id ?? ids.value[0];
  if (id != null) router.push(`/mes/ncGroup/edit/${id}`);
};
const handleDelete = async (row?: NcGroupVO) => {
  if (deleting.value) return;
  const selected = row ? [row.id] : [...ids.value];
  if (!selected.length) return;
  deleting.value = true;
  try {
    await proxy?.$modal.confirm('确认删除选中的不合格组及其成员关联？不合格代码本身不会删除。');
    await delNcGroup(selected);
    proxy?.$modal.msgSuccess('删除成功');
    if (selected.length === groups.value.length && queryParams.pageNum > 1) queryParams.pageNum--;
    await getList();
  } catch {
    // 取消或请求失败时保留当前列表，错误由请求拦截器提示。
  } finally {
    deleting.value = false;
  }
};
const handleExport = () => proxy?.download('mes/group/export', { ...queryParams }, `ncGroup_${Date.now()}.xlsx`);
onMounted(getList);
onActivated(() => {
  if (!loading.value) getList();
});
</script>

<style scoped>
:deep(.el-table th.el-table__cell) {
  background: #f1f4fa;
  color: #303133;
}
</style>
