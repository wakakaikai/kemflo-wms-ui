<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
            <el-form-item label="表单名称" prop="formName">
              <el-input v-model="queryParams.formName" placeholder="请输入表单名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="表单编码" prop="formCode">
              <el-input v-model="queryParams.formCode" placeholder="请输入表单编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:form:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['lowcode:form:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <el-table v-loading="loading" :data="formList" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="表单名称" prop="formName" min-width="140" show-overflow-tooltip />
        <el-table-column label="表单编码" prop="formCode" min-width="140" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createTime" width="170" align="center">
          <template #default="scope">{{ proxy?.parseTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="90" align="center">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="320" fixed="right">
          <template #default="scope">
            <el-button v-hasPermi="['lowcode:form:edit']" link type="primary" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['lowcode:form:design']" link type="primary" icon="Brush" @click="handleDesign(scope.row)">设计表单</el-button>
            <el-button v-hasPermi="['lowcode:record:list']" link type="primary" icon="Tickets" @click="handleData(scope.row)">表单数据</el-button>
            <el-button link type="primary" icon="Link" @click="handleAccessUrl(scope.row)">配置地址</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <FormMetaDialog ref="metaDialogRef" @success="getList" />

    <el-dialog v-model="accessVisible" title="配置地址" width="560px" append-to-body>
      <el-form label-width="88px">
        <el-form-item label="设计地址">
          <el-input :model-value="designUrl" readonly>
            <template #append>
              <el-button @click="copyText(designUrl)">复制</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="填报地址">
          <el-input :model-value="fillUrl" readonly>
            <template #append>
              <el-button @click="copyText(fillUrl)">复制</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="数据地址">
          <el-input :model-value="dataUrl" readonly>
            <template #append>
              <el-button @click="copyText(dataUrl)">复制</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="LowcodeForm">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { delForm, listForm } from '@/api/lowcode/form';
import type { FormQuery, FormVO } from '@/api/lowcode/form/types';
import FormMetaDialog from './components/FormMetaDialog.vue';

const { proxy } = getCurrentInstance() as any;
const router = useRouter();
const { sys_normal_disable } = proxy.useDict('sys_normal_disable');

const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const formList = ref<FormVO[]>([]);
const ids = ref<Array<string | number>>([]);
const multiple = ref(true);
const metaDialogRef = ref<InstanceType<typeof FormMetaDialog>>();
const accessVisible = ref(false);
const currentRow = ref<FormVO>();

const queryParams = reactive<FormQuery>({
  pageNum: 1,
  pageSize: 10,
  formName: '',
  formCode: ''
});

const designUrl = computed(() => `${location.origin}/lowcode/form/designer/index/${currentRow.value?.id || ''}`);
const fillUrl = computed(() => `${location.origin}/lowcode/form/fill/index/${currentRow.value?.formCode || ''}`);
const dataUrl = computed(() => `${location.origin}/lowcode/form/data/index/${currentRow.value?.id || ''}`);

async function getList() {
  loading.value = true;
  try {
    const res = await listForm(queryParams);
    formList.value = res.rows;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  proxy?.resetForm('queryFormRef');
  handleQuery();
}

function handleSelectionChange(selection: FormVO[]) {
  ids.value = selection.map((item) => item.id!);
  multiple.value = !selection.length;
}

function handleAdd() {
  metaDialogRef.value?.open();
}

function handleEdit(row: FormVO) {
  metaDialogRef.value?.open(row);
}

function handleDesign(row: FormVO) {
  router.push(`/lowcode/form/designer/index/${row.id}`);
}

function handleData(row: FormVO) {
  router.push(`/lowcode/form/data/index/${row.id}`);
}

function handleAccessUrl(row: FormVO) {
  currentRow.value = row;
  accessVisible.value = true;
}

async function handleDelete(row?: FormVO) {
  const deleteIds = row?.id ? [row.id] : ids.value;
  if (!deleteIds.length) return;
  await ElMessageBox.confirm('是否确认删除所选表单？', '提示', { type: 'warning' });
  await delForm(deleteIds.join(','));
  ElMessage.success('删除成功');
  getList();
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
  ElMessage.success('已复制');
}

getList();
</script>
