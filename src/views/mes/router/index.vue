<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="工艺路线" prop="router">
              <el-input v-model="queryParams.router" placeholder="请输入工艺路线" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="版本" prop="revision">
              <el-input v-model="queryParams.revision" placeholder="请输入版本" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input v-model="queryParams.description" placeholder="请输入描述" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="类型" prop="routerType">
              <el-select v-model="queryParams.routerType" placeholder="请选择类型" clearable style="width: 160px">
                <el-option v-for="item in routerTypeOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 160px">
                <el-option v-for="item in statusOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
              </el-select>
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
            <el-button v-hasPermi="['mes:router:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:router:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">编辑</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['mes:router:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="routerList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="工艺路线" align="center" prop="router" min-width="160" />
        <el-table-column label="版本" align="center" prop="revision" width="100" />
        <el-table-column label="当前版本" align="center" prop="currentRevision" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.currentRevision === 'true' ? 'success' : 'info'">{{ scope.row.currentRevision === 'true' ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="描述" align="center" prop="description" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" align="center" prop="routerType" width="120">
          <template #default="scope">
            <dict-tag :options="routerTypeOptions" :value="scope.row.routerType" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="120">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建人" align="center" prop="creator" width="120" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
        <el-table-column label="更新人" align="center" prop="updater" width="120" />
        <el-table-column label="更新时间" align="center" prop="modifyTime" width="170" />
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="scope">
            <el-tooltip content="编辑" placement="top">
              <el-button v-hasPermi="['mes:router:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['mes:router:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="Router" lang="ts">
import { getDicts } from '@/api/system/dict/data';
import { delRouter, listRouter } from '@/api/mes/router';
import { RouterQuery, RouterVO } from '@/api/mes/router/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const vueRouter = useRouter();

const routerList = ref<RouterVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const routerTypeOptions = ref<any[]>([]);
const statusOptions = ref<any[]>([]);
const queryFormRef = ref<ElFormInstance>();

const queryParams = reactive<RouterQuery>({
  pageNum: 1,
  pageSize: 10,
  router: undefined,
  revision: undefined,
  description: undefined,
  routerType: undefined,
  status: undefined
});

const getList = async () => {
  loading.value = true;
  const res = await listRouter(queryParams);
  routerList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: RouterVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  vueRouter.push('/mes/router/create');
};

const handleUpdate = (row?: RouterVO) => {
  const id = row?.id || ids.value[0];
  vueRouter.push(`/mes/router/edit/${id}`);
};

const handleDelete = async (row?: RouterVO) => {
  const deleteIds = row?.id || ids.value;
  await proxy?.$modal.confirm(`是否确认删除工艺路线编号为 "${deleteIds}" 的数据项？`).finally(() => (loading.value = false));
  await delRouter(deleteIds);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

onMounted(async () => {
  const [routerTypeRes, statusRes] = await Promise.all([getDicts('ROUTER_TYPE'), getDicts('ROUTER_STATUS')]);
  routerTypeOptions.value = routerTypeRes.data || [];
  statusOptions.value = statusRes.data || [];
  await getList();
});
</script>
